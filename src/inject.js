var compact = require('./compact')
var createSST = require('./sst')
var mem = require('./mem')
var mkdirp = require('mkdirp')
var path = require('path')
var merge = require('pull-merge')
var u = require('./util')
var zeros = '00000000'
var Promise = require('bluebird');

var pull = require('pull-stream')
var para = require('pull-paramap')

function pad(n) {
    n = n.toString()
    return zeros.substring(n.length) + n
}

function isEmpty(o) {
    if (null == o) return true
    for (var k in o)
        return false
    return true
}

module.exports = function (createSST, createMemtable, createManifest) {

    return function (location, opts) {
        var memtable = mem(), counter = 0, db, compacting = false, _snapshot
        var tables = tables || [memtable]
        var manifest, tables, seq

        function nextTableName(type) {
            return type + '-' + pad(++seq) + '.json'
        }

        return db = {
            //should i separate all this stuff out so that
            //you can simulate the database all in memory?
            open: function (opts, cb) {
                if (!cb) cb = opts, opts = {}
                mkdirp(location, function (err) {
                    if (err) return cb(err)
                    manifest = createManifest(path.join(location, 'manifest.json'))
                    manifest.open(function (err) {
                        if (err) return cb(err)
                        //if the manifest is empty create an empty memory table.
                        if (isEmpty(manifest.data)) {
                            seq = 1
                            var filename = path.join(location, 'log-' + pad(seq) + '.json')
                            var _memtable = createMemtable(filename)
                            manifest.update({tables: ['log-' + pad(seq) + '.json'], seq: seq}, function (err) {
                                if (err) return cb(err)
                                _memtable.open(function (err) {
                                    if (err) cb(err)
                                    memtable = _memtable
                                    _snapshot = [memtable]
                                    cb(null, db)
                                })
                            })
                        } else {
                            //open all the tables.
                            var _tables = manifest.data.tables || []
                            var n = tables.length
                            var _seq = 0

                            _tables.forEach(function (name, i) {
                                var m = /^(log|sst)-(\d+)\.json$/.exec(name)
                                var type = m[1], table
                                _seq = Math.max(m[2], _seq)

                                var create = type == 'log' ? createMemtable : createSST
                                var table = tables[i] = create(path.join(location, name))

                                table.open(next)
                            })
                            function next(err) {
                                if (err) return n = -1, cb(err)
                                if (--n) return
                                seq = _seq + 1
                                db.nextSnapshot(tables)
                                memtable = tables[0]
                                cb(null, db)
                            }
                        }
                    })
                })
                return db
            },
            //get the current snapshot.
            nextSnapshot: function (ary) {
                _snapshot = ary
                return db
            },
            snapshot: function () {
                if (_snapshot) {
                    tables = _snapshot;
                    _snapshot = null
                }
                return tables
            },
            //step through all the databases, and look for next
            get: function (key, cb) {
                var tables = db.snapshot()
                    ;
                (function next(i) {
                    //if we ran out of tables, err
                    //gets need to use snapshots too...
                    //but since they will return from the memtable
                    //synchronously they will only need to track the SSTs
                    //which probably means they can all share a snapshot
                    //unless there is a compaction happening.

                    //just have an SST snapshot,
                    //keep a count of current gets
                    //and don't delete any ssts until it's freed.

                    if (!tables[i]) return cb(new Error('not found'))
                    tables[i].get(key, function (err, value) {
                        if (err) return next(i + 1)
                        return cb(null, value)
                    })
                })(0)
                return db
            },
            //only write to the FIRST table.
            put: function (key, value) {
                return new Promise(function(resolve, reject){
                    memtable.put(key, value, function (err) {
                        if (!(++counter % 1000))
                            db.compact();

                        !!err ? reject(err) : resolve();
                    });
                });
            },
            del: function (del, cb) {
                return memtable.del(key, function (err) {
                    if (!(++counter % 1000)) db.compact()
                    cb(err)
                })
            },
            batch: function (ops, cb) {
                return memtable.batch(ops, function (err) {
                    if (!(++counter % 1000)) db.compact()
                    cb(err)
                })
            },
            createReadStream: function (opts) {
                //merge streams from all the tables
                //it's probably okay to not have a snapshot on the memtable.
                //hmm, on the other hand, it will be fairly cheap...
                //otherwise I'd need to implement a skiplist, so you can have
                //streams that handle inserts.

                //TRACK HOW MANY ITERATORS ARE USING THIS SNAPSHOT.

                //read snapshots on the memtable are very simple, because it just
                //figures out the range sync and copies it to an array
                //so that doesn't need to be tracked specially.

                var tables = db.snapshot()

                console.log('readStream',
                    tables.map(function (e) {
                        return e.location
                    })
                )

                var stream = tables[0].createReadStream(opts)
                console.log('start', tables[0].location)
                for (var i = 1; i < tables.length; i++) {
                    console.log('merge', tables[i].location)
                    stream = merge(tables[i].createReadStream(opts), stream, u.compare)
                }
                return stream
            },
            close: function (cb) {
                pull(
                    pull.values(db.snapshot()),
                    para(function (db) {
                        db.close(cb)
                    }),
                    pull.drain(cb)
                )
            },

            compact: function (cb) {
                cb = cb || function () {
                    }
                //make a temp snapshot for use while compacting.
                //only one compaction at a time.
                if (compacting) return cb()
                compacting = true
                // create a new memtable, to save any writes while we are compacting.
                // save it in the manifest FIRST. That way we can be sure that we don't
                // loose that data if we crash while compacting.

                //add a new memtable to the manifest
                var name = nextTableName('log')
                var tables = db.snapshot()

                function getNames(tables) {
                    return tables.map(function (e) {
                        if (!e.location) throw new Error(e.type + 'table is missing location')
                        return path.basename(e.location)
                    })
                }

                var names = getNames(tables)
                names.unshift(name)
                var _memtable = createMemtable(path.join(location, name))
                _memtable.open(function (err) {
                    //uphdate the mainfest to include the new memtable AND the old one.
                    //this is so we don't forget any writes.
                    manifest.update({tables: names, seq: seq}, function (err) {
                        if (err) return cb(err)
                        if (err) return cb(err)
                        //switch to the new memtable.
                        var __memtable = memtable
                        tables = db.snapshot()
                        memtable = _memtable
                        //wait for the old memtable to drain.
                        tables[0].freeze(function () {
                            db.nextSnapshot([memtable].concat(tables))

                            //maybe the api for sst should have a write stream,
                            //except it errors unles it's all in order,
                            //and you can only use it once?
                            var newSST = path.join(location, nextTableName('sst'))
                            var _tables = tables.slice()
                            _tables = compact(_tables, createSST.createStream(newSST, function (err, sst) {
                                if (err) return cb(err)
                                //now that we have generated the sst,
                                //save the new table set in the manifest,
                                //so that if the process crashes we will reload the right data.
                                //hmm, maybe we could just start using it... sst table are immutable, anyway.
                                //the most important thing to have right is the memtables.
                                //when an sst is no longer used (been compacted + no more iterators)
                                //then it's safe to delete.
                                _tables = [memtable, sst].concat(_tables)
                                manifest.update({tables: getNames(_tables), seq: seq}, function (err) {
                                    if (err) return cb(err)
                                    compacting = false
                                    db.nextSnapshot(_tables)
                                    if (cb) cb()
                                })
                            }))
                        })
                    })
                })
            }
        }
    }
}

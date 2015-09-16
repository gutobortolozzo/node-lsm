var compact = require('./compact');
var mkdirp = require('mkdirp');
var path = require('path');
var merge = require('pull-merge');
var u = require('./util');
var zeros = '0000000000';
var Promise = require('bluebird');
var pull = require('pull-stream');
var para = require('pull-paramap');

module.exports = function (createSST, createMemtable, createManifest) {

    return function (location, opts) {

        var opts = opts || {};

        var counter = 0,
            db,
            compacting = false,
            _snapshot;

        var manifest, tables, seq;

        var opertationsThreshold = opts.threshold || 1000;

        function nextTableName(type) {
            return type + '-' + pad(++seq) + '.json'
        }

        function pad(n) {
            return zeros.substring(n.toString().length) + n;
        }

        function isEmpty(o) {
            if (null == o) return true;
            for (var k in o)
                return false
            return true
        }

        return db = {
            open: function (opts) {
                return new Promise(function(resolve, reject){
                    mkdirp(location, function (err) {
                        if (err)
                            return reject(err);

                        manifest = createManifest(path.join(location, 'manifest.json'));
                        manifest.open(function (err) {
                            if (err) return cb(err);
                            if (isEmpty(manifest.data)) {
                                var seq = 1;
                                var filename = path.join(location, 'log-' + pad(seq) + '.json');
                                var _memtable = createMemtable(filename);
                                manifest.update({tables: ['log-' + pad(seq) + '.json'], seq: seq}, function (err) {
                                    if (err) return reject(err);
                                    _memtable.open(function (err) {
                                        if (err) return reject(err);
                                        memtable = _memtable;
                                        _snapshot = [memtable];
                                        return resolve();
                                    })
                                })
                            } else {
                                var _tables = manifest.data.tables || [];
                                var n = tables.length;
                                var _seq = 0;

                                _tables.forEach(function (name, i) {
                                    var m = /^(log|sst)-(\d+)\.json$/.exec(name);
                                    var type = m[1];
                                    _seq = Math.max(m[2], _seq);

                                    var create = type == 'log' ? createMemtable : createSST;
                                    var table = tables[i] = create(path.join(location, name));

                                    table.open(next);
                                });

                                function next(err) {
                                    if (err){
                                        n = -1;
                                        return reject(err);
                                    }
                                    if (--n) return;
                                    seq = _seq + 1;
                                    db.nextSnapshot(tables);
                                    memtable = tables[0];
                                }

                                Promise.delay(3000).then(function(){
                                    resolve();
                                });
                            }
                        })
                    })
                });
            },
            nextSnapshot: function (ary) {
                _snapshot = ary;
                return db;
            },
            snapshot: function () {
                if (_snapshot) {
                    tables = _snapshot;
                    _snapshot = null;
                }
                return tables;
            },
            get: function (key) {
                return new Promise(function(resolve, reject){
                    var tables = db.snapshot();
                    (function next(i) {
                        if (!tables[i])
                            return reject(new Error('Not Found'));

                        tables[i].get(key, function (err, value) {
                            if (err) return next(i + 1);
                            return resolve(value);
                        })
                    })(0)
                });
            },
            put: function (key, value) {
                return new Promise(function(resolve, reject){
                    memtable.put(key, value, function (err) {
                        if (!(++counter % opertationsThreshold))
                            db.compact();

                        !!err ? reject(err) : resolve(value);
                    });
                });
            },
            del: function (key) {
                return new Promise(function(resolve, reject){
                    memtable.del(key, '', function (err) {
                        if (!(++counter % opertationsThreshold))
                            db.compact();

                        !!err ? reject(err) : resolve();
                    });
                });
            },
            batch: function (ops, cb) {
                return memtable.batch(ops, function (err) {
                    if (!(++counter % opertationsThreshold)) db.compact();
                    cb(err)
                })
            },
            createReadStream: function (opts) {
                var tables = db.snapshot();

                console.log('readStream',
                    tables.map(function (e) {
                        return e.location
                    })
                );

                var stream = tables[0].createReadStream(opts);
                for (var i = 1; i < tables.length; i++) {
                    console.log('merge', tables[i].location);
                    stream = merge(tables[i].createReadStream(opts), stream, u.compare);
                }
                return stream
            },
            close: function () {
                return new Promise(function(resolve, reject){
                    var cb = function(){};
                    try{
                        pull(pull.values(db.snapshot()),
                            para(function() {
                                resolve();
                            }),
                            pull.drain(cb)
                        );
                    } catch(err){
                        reject(err);
                    }
                });
            },
            compact: function (cb) {
                cb = cb || function () {};

                if (compacting) return cb();

                compacting = true;

                var name = nextTableName('log');
                var tables = db.snapshot();

                function getNames(tables) {
                    return tables.map(function (e) {
                        if (!e.location) throw new Error(e.type + 'table is missing location');
                        return path.basename(e.location);
                    })
                }

                var names = getNames(tables);
                names.unshift(name);
                var _memtable = createMemtable(path.join(location, name));
                _memtable.open(function (err) {
                    manifest.update({tables: names, seq: seq}, function (err) {
                        if (err) return cb(err);

                        var __memtable = memtable;
                        tables = db.snapshot();
                        memtable = _memtable;

                        tables[0].freeze(function () {
                            db.nextSnapshot([memtable].concat(tables));
                            var newSST = path.join(location, nextTableName('sst'));
                            var _tables = tables.slice();
                            _tables = compact(_tables, createSST.createStream(newSST, function (err, sst) {
                                if (err) return cb(err);
                                _tables = [memtable, sst].concat(_tables);
                                manifest.update({tables: getNames(_tables), seq: seq}, function (err) {
                                    if (err) return cb(err);
                                    compacting = false;
                                    db.nextSnapshot(_tables);
                                    if (cb) cb()
                                });
                            }));
                        });
                    });
                });
            }
        }
    }
};

var fs = require('fs')
var split = require('pull-split')
var pull = require('pull-stream')
var toPull = require('stream-to-pull-stream')
var ltgt = require('ltgt')

function delay (fun) {
    return function () {
        var args = [].splice.call(arguments)
        var self = this
        process.nextTick(function () {
            fun.apply(self, args)
        })
        return this
    }
}

module.exports = function (file, cb) {
    var store = {}, _cbs = [], _queue = [], wl = 0, freezeCb, frozen = false
    var fd, queued = false, position = 0

    function processQueue() {
        if(!_queue.length) return queued = false
        queued = true

        var queue = _queue
        var cbs   = _cbs
        _queue = []; _cbs = []

        wl = queue.length

        var json = new Buffer(queue.map(function (e) {
                return JSON.stringify(e)
            }).join('\n') + '\n')

        //we use write directly, because we want this to occur as a batch!
        //also, writing to a stream isn't good enough, because we need to
        //know exactly which writes succeded, and which failed!
        fs.write(fd, json, 0, json.length, position, function (err) {
            queued = false
            wl = 0
            if(err) {
                if(_queue.length == 0 && freezeCb) freezeCb()
                return cbs.forEach(function (cb) { cb(err) })
            }
            //if this write succedded, move the cursor forward!
            position += json.length

            //the write succeded! update the store!
            queue.forEach(function (ch) {
                if(ch.type == 'del')
                    delete store[ch.key]
                else {
                    store[ch.key] = ch.value
                }
            })
            //callback to everyone!
            if(_queue.length == 0 && freezeCb) freezeCb()
            cbs.filter(function(cb){
                return !!cb;
            }).forEach(function(cb){
                cb();
            });

            //notify when the database is completely drained.
            //wait for ALL pending writes to finish.
            //need to wait for all writes to be finalized before compaction.
        })

    }

    function queueWrite(ch, cb) {
        if(Array.isArray(ch))
            ch.forEach(function (ch) {
                _queue.push(ch)
            })
        else _queue.push(ch)

        _cbs.push(cb)

        if(!queued) {//or use longer delays?
            process.nextTick(processQueue)
            queued = true
        }
    }

    function checkErr(cb) {
        if(!ll.opened) {
            cb(new Error('not open: ' + ll.location))
            return true
        }
        if(frozen) {
            cb(new Error('database:' + ll.location + ' is now read-only'))
            return true
        }
    }

    var ll
    return ll = {
        opened: false,
        location: file,
        checkQueue: function () {
            return _queue.length + wl
        },
        freeze: function (cb) {
            frozen = true
            if(_queue.length + wl === 0) cb()
            else freezeCb = cb
        },
        open: function (opts, cb) {
            if('function' === typeof opts)
                cb = opts, opts = {}

            var once = false
            function done (err) {
                if(once) return
                once = true
                fs.open(file, 'a', function (err, _fd) {
                    if(err) cb(err)
                    ll.opened = true
                    fd = _fd
                    cb(null, ll)
                })
            }
            if(ll.opened) delay(done)()
            fs.stat(file, function (err, stat) {
                if(err)
                    return done(err.code == 'ENOENT' ? null : err)

                //if there is already a file, start writing to end
                position = stat.size

                pull(
                    toPull.source(fs.createReadStream(file)),
                    split(/\r?\n/, function (e) { if (e) return JSON.parse(e) }),
                    pull.through(function (data) {
                        if(data) store[data.key] = data.value
                    }),
                    pull.drain(null, done)
                )
            })
        },
        get: function (key, cb) {
            if(!ll.opened) return cb(new Error('not open: ' + ll.location))
            if(store[key]) cb(null, store[key])
            else           cb(new Error('not found'))
            return this
        },
        put: function (key, value, cb) {
            if(checkErr(cb)) return
            return queueWrite({key: key, value: value, type: 'put'}, cb)
        },
        del: function (key, value, cb) {
            if(checkErr(cb)) return
            return queueWrite({key: key, value: value, type: 'del'}, cb)
        },
        batch: function (array, cb) {
            if(checkErr(cb)) return
            return queueWrite(array, cb)
        },
        approximateSize: function (cb) {
            if(!ll.opened) return cb(new Error('not open'))
            delay(cb)(null, position)
        },
        iterator: function (opts) {
            if(!ll.opened) throw new Error('not open')
            opts = opts || {}
            var snapshot =
                Object.keys(store).sort().filter(function (k) {
                    return ltgt.contains(opts, k)
                }).map(function (k) {
                    return {key: k, value: store[k]}
                })

            if(opts.reverse)
                snapshot.reverse()

            var i = 0
            return {
                next: function (cb) {
                    var data = snapshot[i++]
                    if (i > snapshot.length) return cb()
                    cb(null, data.key, data.value)
                },
                end: function (cb) { cb() }
            }

        },
        createReadStream: function (opts) {
            var it = ll.iterator(opts)
            return function (abort, cb) {
                if(abort) it.end(cb)
                else it.next(function (err, key, value) {
                    if(key === undefined && value === undefined) cb(err || true)
                    else cb(null, {key: key, value: value})
                })
            }
        }
    }
}
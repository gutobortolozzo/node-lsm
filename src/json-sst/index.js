var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var util = require('./util');
var pullRange = require('pull-stream-range');
var BlockIterator = require('./block-iterator');
var toPull = require('stream-to-pull-stream');
var pull = require('pull-stream');
var Promise = require('bluebird');

//TODO: use bloom filters to remember what keys are present
//to optimize gets.

var stats = function(file){
    return new Promise(function(resolve, reject){
        fs.stat(file, function (err, stat) {
            !!err ? reject(err) : resolve(stat);
        });
    });
};

var openFile = function(file, stat){
    return new Promise(function(resolve, reject){
        fs.open(file, 'r', function (err, fd) {
            if (err) return reject(err);
            stat.length = Math.ceil(stat.size / stat.blksize);
            stat.fd = fd;
            resolve(stat);
        });
    });
};

var open = function(file){
    return stats(file)
        .then(function(stats){
            return openFile(file, stats);
        })
        .catch(function(err){
            reject(err);
        });
};

var exports = module.exports = function(file){

    var fd;
    var emitter = new EventEmitter();
    emitter.location = file;

    emitter.open = function(){
        return open(file)
            .then(function(stat){
                emitter._stat = stat;
                emitter.opened = true;
                return emitter;
            });
    };

    emitter.all = function (opts) {
        return BlockIterator(emitter._stat, opts).pipe(util.json(opts.reverse))
    };

    emitter.iterator = function (opts) {
        opts = opts || {}
        if (!emitter.opened)
            throw new Error('SST is not yet opened!')

        var reverse = opts.reverse
        var range = [opts.start, opts.end]
        if (opts.start && opts.end) range.sort()
        if (opts.reverse) range.reverse()

        opts.start = range[0] || null
        opts.end = range[1] || null

        function createStream(i) {
            var _opts = util.merge({offset: i}, opts)
            if (isNaN(_opts.offset))
                throw new Error('i must be a number')

            return BlockIterator(emitter._stat, _opts).pipe(util.json(reverse))

        }

        function compare(a, b) {
            return ( a.key < b.key ? -1
                    : a.key > b.key ? 1
                    : 0 ) * (reverse ? -1 : 1)
        }

        var start, end

        if (opts.start) start = {key: opts.start}
        if (opts.end)   end = {key: opts.end}

        return pullRange(createStream, compare, emitter._stat.length, start, end)
    }

    emitter.createReadStream = emitter.iterator

    emitter.get = function (key, cb) {
        var read = emitter.iterator({start: key, end: key})
        read(null, function (err, data) {
            //close stream if it's not already closing.
            if (!err) read(true, function () {
            })
            cb(err, data && data.value)
        })
    }

    emitter.close = function (cb) {
        if (!fd) return cb(new Error('not open'))
        fs.close(fd, cb)
    }

    return emitter
}

exports.createStream = function (file, cb) {
    var meta = {items: 0, length: 0, meta: true}
    return pull(
        function (read) {
            var max
            return function (abort, _cb) {
                read(abort, function (end, data) {
                    if (!end && !data) return;
                    if (end) return _cb(end, data)
                    if (max === undefined) max = data.key
                    //TODO - FIX toPull to handle errors, and then fix this.
                    else if (max >= data.key) return cb(new Error('out of order'))
                    max = data.key;
                    _cb(end, data)
                })
            }
        },
        pull.map(function (e) {
            var json = JSON.stringify(e) + '\n'
            meta.items++
            meta.length += json.length
            return json
        }),
        toPull.sink(
            fs.createWriteStream(file)
                .on('close', function () {
                    var sst = exports(file)

                    sst.open()
                        .then(function(){
                            cb(null, sst);
                        })
                        .catch(function(err){
                            cb(err);
                        });
                })
        )
    )
}


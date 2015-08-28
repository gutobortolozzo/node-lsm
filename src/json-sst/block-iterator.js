var fs = require('fs');
var pull = require('pull-stream');

var Iterator =
    pull.Source(function (next, close) {
        var i = 0
        close = close || function (cb) {
                cb()
            }
        return function (end, cb) {
            if (end)
                close ? close(function (err) {
                    cb(err || true)
                }) : cb && cb(end)
            else
                next(i++, function (err, data) {
                    if (err || data == null) {
                        close(function (err) {
                            cb(err || true)
                        })
                    } else
                        cb(null, data) //means end in an iterator.
                })
        }
    })

function calcBlock(stat, opts, i) {
    opts = opts || {}
    if (opts.offset)
        i = i + opts.offset

    var blocks = Math.floor(stat.size / stat.blksize)
    var j = opts.reverse ? blocks - i : i
    var start = j * stat.blksize
    var limit = opts.limit ? opts.limit - 1 : blocks
    if (i > Math.min(blocks, limit)) return false
    return {
        length: (
            (j + 1) * stat.blksize > stat.size
                ? stat.size - j * stat.blksize
                : stat.blksize
        ),
        position: start,
        size: stat.size,
        i: j,
        end: i > blocks
    }
}

module.exports = function (stat, opts) {
    opts = opts || {}
    var blocks = Math.floor(stat.size / stat.blksize)

    return Iterator(function (i, cb) {
        var range = calcBlock(stat, opts, i)

        if (!range) return cb(null, null)
        var block = new Buffer(range.length)
        fs.read(stat.fd, block, 0, range.length, range.position, function (err) {
            cb(err, block.toString())
        })
    })
}

module.exports.calcBlock = calcBlock;


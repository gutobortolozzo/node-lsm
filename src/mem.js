var pull = require('pull-stream');

var next = setImmediate || process.nextTick;

module.exports = function () {
    var store = {};
    var keys = [];
    var db;
    return db = {
        size: 0,
        level: 1,
        type: 'mem',
        store: store,
        get: function (key, cb) {
            if (!store[key])
                return cb(new Error('not found'));
            next(function () {
                cb(null, store[key]);
            });
        },
        put: function (key, value, cb) {
            store[key] = value;
            keys.push(key);
            keys.sort();
            db.size++;
            next(function () {
                cb()
            })
        },
        del: function (key, cb) {
          if(!store[key])
              return cb(new Error('not found'));
          var i = keys.indexOf(key);
          keys.splice(i, 1);
          delete store[key];
          cb();
        },
        createReadStream: function (opts) {
            var gt = opts && opts.gt;
            return pull.values(keys.filter(function (e) {
                return gt ? e.key > gt : true
            }).map(function (key) {
                return (
                    opts && opts.values === false ? key
                        : opts && opts.keys === false ? store[key]
                        : {key: key, value: store[key]}
                )
            }))
        }
    }
};

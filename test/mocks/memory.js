

var inject = require('../../src/inject')
var createSST = require('./sst')
var createMemtable = require('./mem')

var createManifest = function (location) {
  var db
  return db = {
    open: function (opts, cb) {
      if(!cb) cb = opts, opts = {}
      db.data = {}
      cb(null, this)
    },
    update: function (data, cb) {
      db.data = data; cb()
    },
    data: {},
    close: function (cb) {
      db.data = null
      cb()
    }
  }
}

module.exports = inject({createStream: createSST}, createMemtable, createManifest)


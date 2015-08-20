
var inject         = require('./src/inject')
var createLog      = require('./src/json-logdb/index')
var createSST      = require('json-sst')
var createManifest = require('kiddb')

module.exports = inject(createSST, createLog, createManifest)

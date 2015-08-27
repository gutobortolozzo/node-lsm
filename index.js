
var inject         = require('./src/inject');
var createLog      = require('./src/json-logdb/index');
var createSST      = require('./src/json-sst/index');
var createManifest = require('kiddb');

module.exports = inject(createSST, createLog, createManifest);

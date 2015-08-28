var rmrf = require('rimraf');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports.clear = function(callback){
    rmrf(this.testDirectory, {}, callback);
};

module.exports.testDirectory = '/tmp/tbd';

module.exports.options = {
    threshold : 100
};

module.exports.listFilesInsideTestDirectory = function(){
    return fs.readdirSync(this.testDirectory);
};

module.exports.createFile = function(filePath, callback){
    mkdirp(filePath, callback);
};
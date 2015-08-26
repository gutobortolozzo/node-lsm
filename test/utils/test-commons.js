var rmrf = require('rimraf');

module.exports.clear = function(callback){
    rmrf(this.testDirectory, {}, callback);
};

module.exports.testDirectory = '/tmp/tbd';

module.exports.options = {
    threshold : 100
};
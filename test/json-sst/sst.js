require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var sst = require(process.cwd()+'/src/json-sst/index');

describe('SST', function() {

    var sstFile = utils.testDirectory+"/test.json";
    var sortedTable = sst(sstFile);

    before(function(done){
        utils.createFile(sstFile, done);
    });

    after(function(done){
        utils.clear(done);
    });

    describe('sst file', function() {

        it('check open file location', function(){
            return sortedTable.open()
                .then(function(result){
                    result.location.should.be.eql(sstFile);
                });
        });

        it('check opened file length', function(){
            return sortedTable.open()
                .then(function(result){
                    result._stat.length.should.be.eql(1);
                });
        });
    });
});

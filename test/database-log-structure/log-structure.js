require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var GoatDB = require('../../index.js');

var db = GoatDB(utils.testDirectory, utils.options);

describe('LOG', function() {

    before(function(){
        return db.open();
    });

    after(function(done){
        utils.clear(done);
    });

    describe('check log structure inside database before threshold', function() {

        beforeEach(function(){
            return db.put('1234', 'hello');
        });

        it('contains log file', function(){
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('log-0000000001.json');
        });

        it('contains manifest file', function(){
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('manifest.json');
        });
    });
});
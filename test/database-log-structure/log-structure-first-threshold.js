require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var Promise = require('bluebird');
var Subject = require('../../index.js');

var db = Subject(utils.testDirectory, utils.options);

describe('LOG', function() {

    before(function(){
        return db.open();
    });

    after(function(done){
        utils.clear(done);
    });

    describe('check log structure inside database after first threshold', function () {

        beforeEach(function () {
            var puts = [];
            for (var index = 0; index <= utils.options.threshold; index++) {
                puts.push(db.put('#' + index, 'hello ' + index));
            }
            return Promise.all(puts);
        });

        it('contains log file 000*1', function () {
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('log-0000000001.json');
        });

        it('contains manifest file', function () {
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('manifest.json');
        });

        it('contains log file 000*2', function () {
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('log-0000000002.json');
        });

        it('contains only 2 files', function () {
            utils.listFilesInsideTestDirectory().length.should.be.eql(4);
        });
    });
});
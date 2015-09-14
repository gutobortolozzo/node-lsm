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
            for (var index = 0; index <= utils.options.threshold * 2; index++) {
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

        it('contains log file 000*3', function () {
            var files = utils.listFilesInsideTestDirectory();
            files.should.containEql('sst-0000000003.json');
        });

        it('search for value to test integrite', function () {
            return db.get('#'+utils.options.threshold)
                .then(function(value){
                    value.should.be.eql('hello '+utils.options.threshold);
                })
        });
    });
});
require('should');
var Subject = require('../../index.js');
var utils = require(process.cwd()+'/test/utils/test-commons');

var db = Subject(utils.testDirectory, utils.options);

describe('GET', function() {

    before(function(){
        return db.open().then(function(){
            return db.put('#12345', 'hello');
        });
    });

    after(function(done){
        utils.clear(done);
    });

    describe('must get one value', function() {

        it('should get value #12345', function(){
            return db.get("#12345").then(function(value){
                value.should.be.eql('hello');
            });
        });
    });
});

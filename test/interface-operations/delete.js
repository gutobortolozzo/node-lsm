require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var Subject = require('../../index.js');

var db = Subject(utils.testDirectory, utils.options);

describe('DELETE', function() {

    before(function(){
        return db.open();
    });

    after(function(done){
        utils.clear(done);
    });

    describe('delete one value', function() {

        beforeEach(function(){
            return db.put('1234', 'hello');
        });

        it('should delete one value without error', function(){
            return db.del("123");
        });

        it('should delete one value and try to search for it', function(){
            return db.del("123")
                .then(function(){
                    return db.get('123');
                })
                .catch(function(err){
                    err.message.should.be.eql('Not Found');
                });
        });
    });
});


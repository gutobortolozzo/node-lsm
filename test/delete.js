require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var GoatDB = require('../index.js');

var db = GoatDB(utils.testDirectory, utils.options);

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
            return db.del("123", "Name")
        });
    });
});


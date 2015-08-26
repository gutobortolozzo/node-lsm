require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var GoatDB = require('../../index.js');

var db = GoatDB(utils.testDirectory, utils.options);

describe('PUT', function() {

    before(function(){
        return db.open();
    });

    after(function(done){
        utils.clear(done);
    });

    describe('save one value', function() {

        it('should save one value without error', function(){
            return db.put("123", "hello");
        });

        it('should save two values without error', function(){
            return db.put("123", "name")
                .then(function(){
                    return db.put('1234', 'value');
                });
        });
    });
});

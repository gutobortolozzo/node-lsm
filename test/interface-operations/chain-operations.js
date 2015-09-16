require('should');
var utils = require(process.cwd()+'/test/utils/test-commons');
var Subject = require('../../index.js');

var db = Subject(utils.testDirectory, utils.options);

describe('OPEN/CLOSE', function() {

    before(function(){
        return db.open();
    });

    after(function(done){
        utils.clear(done);
    });

    it('insert values reopening and closing database', function(){
        this.timeout(10000);
        return db.put('123', 'value')
            .then(function(){
                return db.close();
            })
            .then(function(){
                return db.open();
            })
            .then(function(){
                return db.put('1234', 'new value');
            })
            .then(function(){
                return db.get('1234');
            })
            .then(function(value){
                value.should.be.eql('new value');
            })
            .then(function(){
                return db.get('123');
            })
            .then(function(value){
                value.should.be.eql('value');
            })
    });
});
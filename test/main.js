var GoatDB = require('../index.js');

var db = GoatDB('/tmp/tbd', {
    threshold : 100
});

describe('PUT', function() {

    before(function(){
        return db.open();
    });

    describe('save one value', function() {

        it('should save one value without error', function(){
            return db.put("123", "Oi");
        });

        it('should save two values without error', function(){
            return db.put("123", "Name")
                .then(function(){
                    return db.put('1234', 'Value');
                });
        });
    });
});

//db.open()
//    .then(function(){
//        return db.put("123", "Oi");
//    })
//    .then(function(){
//        return db.get("123");
//    })
//    .then(function(result){
//        console.log(result);
//    })
//    .then(function(){
//        return db.put('1234', 'Tchauuu');
//    })
//    .then(function(){
//        return db.put('12345', 'hehehehe');
//    })
//    .then(function(){
//        return db.put('123456', ':D');
//    })
//    .then(function(){
//        return db.get('12345');
//    })
//    .then(function(result){
//        console.log(result);
//    })
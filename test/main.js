var GoatDB = require('../index.js');

var db = GoatDB('/tmp/tbd', {
    threshold : 1
});

db.open()
    .then(function(){
        return db.put("123", "Oi");
    })
    .then(function(){
        return db.get("123");
    })
    .then(function(result){
        console.log(result);
    })
    .then(function(){
        return db.put('1234', 'Tchauuu');
    })
    .then(function(){
        return db.put('12345', 'hehehehe');
    })
    .then(function(){
        return db.put('123456', ':D');
    })
    .then(function(){
        return db.get('12345');
    })
    .then(function(result){
        console.log(result);
    })
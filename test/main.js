var GoatDB = require('../index.js');

var db = GoatDB('/tmp/tbd');

db.open()
    .then(function(){
        return db.put("123", "Oi");
    })
    .then(function(){
        return db.get("123");
    })
    .then(function(result){
        console.log(result);
    });
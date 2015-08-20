var GoatDB = require('../index.js');

GoatDB('/tmp/goatdb-example').open(function (err, db) {

    db.put('hello', 'Holla que tal chico?')
        .then(function(){
            console.log("INSERTED");
        })
        .then(function(){
            return db.get('hello');
        })
        .then(function(value){
            console.log(value);
        })
        .then(function(){
            return db.del('hello');
        })
        //.then(function(){
        //   return db.get('hello');
        //})
        //.catch(function(err){
        //   console.log(err);
        //});


    //db.put('hello', 'I am a goat', function (err) {
    //    db.put('whatevs', 'GOAT GOAT GOAT', function (err) {
    //        db.get('hello', function (err, value) {
    //            console.log(value)
    //        })
    //    })
    //})
});
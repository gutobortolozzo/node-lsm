var GoatDB = require('../index.js');
var Promise = require('bluebird');

GoatDB('/tmp/goatdb-example').open(function (err, db) {

    //console.time('start');
    //
    //db.get('563')
    //    .then(function(result){
    //        console.timeEnd('start');
    //        console.log('result 0', result);
    //    })
    //    .then(function(){
    //        console.time('query');
    //        return db.get('861');
    //    })
    //    .then(function(result){
    //        console.timeEnd('query');
    //        console.log('result 1', result);
    //    });


    var promises = [];

    console.time('start');

    for(var index = 0; index < 1000; index++){
        var promise = db.put(index.toString(), 'Holla '+index);
        promises.push(promise);
    }

    Promise.all(promises)
        .then(function(){
           console.timeEnd('start');
        })
        .then(function(){
            return db.del('100');
        })
        .then(function(){
            return db.get('10');
        })
        .then(function(result){
            return console.log('result', result);
        })
        .then(function(){
            return db.put('100', 'Holla 100');
        })
        .then(function(){
            return db.get('100');
        })
        .then(function(result){
            return console.log('result previously removed', result);
        })



    //db.put('hello', 'Holla que tal chico?')
    //    .then(function(){
    //        console.log("INSERTED");
    //    })
    //    .then(function(){
    //        return db.get('hello');
    //    })
    //    .then(function(value){
    //        console.log(value);
    //    })
    //    .then(function(){
    //        return db.put('123', 'HAHAHAHA');
    //    })
    //    .then(function(){
    //        return db.get('123');
    //    })
    //    .then(function(result){
    //        console.log('result', result);
    //    })
    //    .then(function(){
    //        return db.put('12345', 'TESTE');
    //    })
    //    .then(function(){
    //        return db.get('12345');
    //    })
    //    .then(function(result){
    //        console.log('new result', result);
    //    })
    //    .then(function(){
    //        return db.del('hello');
    //    });
});
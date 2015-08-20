var GoatDB = require('./../index')

GoatDB('/tmp/goatdb-example').open(function (err, db) {
  db.put('hello', 'I am a goat', function (err) {
    db.put('whatevs', 'GOAT GOAT GOAT', function (err) {
      db.get('hello', function (err, value) {
        console.log(value)
      })
    })
  })
})


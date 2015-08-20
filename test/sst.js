var sst = require('./mocks/sst').sst

var pull = require('pull-stream')
var tape = require('tape')

var db = sst({
  bar: 5,
  baz: 9,
  foo: 1
})

tape('get', function (t) {

  db.get('bar', function (err, v) {
    if(err) throw err
    t.equal(v, 5)
    t.end()
  })

})

tape('get - not found', function (t) {

  db.get('blerg', function (err, v) {
    t.ok(err)
    t.end()
  })

})


tape('stream', function (t) {

  pull(
    db.createReadStream(),
    pull.collect(function (err, values) {
      t.deepEqual(values, [
        {key: 'bar', value: 5},
        {key: 'baz', value: 9},
        {key: 'foo', value: 1}
      ])
      t.end()

    })
  )

})

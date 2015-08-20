var search = require('./mocks/sst').search
var tape = require('tape')

var ary = [
0, 3, 6, 9, 10, 32
]

tape('binary search', function (t) {
  t.equal(search(ary, 0), 0)
  t.equal(search(ary, 9), 3)
  t.equal(search(ary, 3), 1)
  t.equal(search(ary, 10), 4)
  t.end()
})

tape('binary search - NEXT', function (t) {
  t.equal(search(ary, 9.5), 3)
  t.equal(search(ary, 4), 1)
  t.equal(search(ary, 1), 0)
  //these return an index that is past the end
  t.equal(search(ary, 33), 5)
  t.equal(search(ary, 100), 5)
  t.end()
})



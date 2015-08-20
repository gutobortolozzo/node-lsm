var merge = require('pull-merge')
var pull = require('pull-stream')
var u = require('./util')

module.exports = function (tables, sstStream) {
  var total = tables.reduce(function (a, e) { return a + e.size }, 0)

  var memtable = tables.shift()
  var stream = memtable.createReadStream(), level = 1, levels = [1]

  //TODO: tune threasholds
  var target = 1000, level = 0

  //estimates for the final size of the compaction.
  //if there are lots of collisions, then it's the size of the largest table
  //if there are no collisions, then it's all the sizes added together.

  var max = 0, min = memtable.size

  while(tables.length) {
    var table = tables[0]
    if(table.size > target * 2)
      break //do not compact this table
    else if(table.size <= target * 2) {
      target *= 2
    }

    max += table.size
    min = Math.max(min, table.size)
    tables.shift()

    stream = merge(table.createReadStream(), stream, u.compare)
  }

  var _tables = tables

  pull(stream, sstStream)

  return _tables
}


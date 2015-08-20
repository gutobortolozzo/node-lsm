var pull = require('pull-stream')

function compare (a, b) {
  return a < b ? -1 : a > b ? 1 : 0
}

function compareKeys (a, b) {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0
}

function search (ary, target, _compare) {
  var comp = _compare || compare, lo = 0, hi = ary.length
  var m = 0
  while(hi > lo + 1) {
    m = ~~((hi + lo) / 2)
    switch(comp(target, ary[m])) {
      case  0: return m;
      case  1: lo = m; break;
      case -1: hi = m; break;
    }
  }
  return lo
}

function sst (ary, location) {
  if(!Array.isArray(ary)) {
    var obj = ary
    ary = []
    for(var k in obj)
      ary.push({key: k, value: obj[k]})

    ary.sort(compareKeys)
  }

  return {
    level: 1,
    size: ary.length,
    type: 'sst',
    store: ary,
    location: location,
    get: function (key, cb) {
      var i = search(ary, {key: key}, compareKeys)
      console.log('GET', i, key, ary[i])
      if(i > ary.length || ary[i].key !== key)
        cb(new Error('not found'))
      else
        cb(null, ary[i].value)
    },
    createReadStream: function (opts) {
      if(!opts)
        return pull.values(ary)
      var i = search(ary, {key: opts.gt || opts.gte}, compareKeys)
      //just doing one way streams for now...
      //handle full lt, lte, gt, gte LATER!
      return pull.values(ary, i)
    },
    approximateSize: function (cb) {
      cb(ary.length)
    }
  }
}

exports = module.exports = function (location, cb) {
  return pull.collect(function (err, ary) {
    if(err) cb(err)
    else cb(null, sst(ary, location))
  })
}

exports.compare = compare
exports.search = search
exports.sst = sst

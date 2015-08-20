var pull = require('pull-stream')
var split = require('pull-split')

exports.iteratorReader = function (read, cb) {
  var array = []
  ;(function next () {
    read(null, function  (err, range) {
      if(range)
        return array.push(range), next()

      else cb(null, array)
    })
  })();
}


exports.json = function (reverse) {
  return pull(
    split(null, null, reverse),
    pull.map(function (data) {
      if(!data) return
      try { return JSON.parse(data) }
      catch (err) {
        if(err && err.name == 'SyntaxError')
          return
        throw err
      }
    }),
    pull.filter()
  )
}

exports.once = function (fun) {
  var called = false
  return function () {
    if(called) return
    called = true
    return fun.apply(this, arguments)
  }
}

exports.merge = function (to, from) {
  for(var k in from) {
    to[k] = to[k] || from[k]
  }
  return to
}

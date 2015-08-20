# GoatDb

a log-structured-merge-tree, implemented in pure node.js. GOATSCALE!!!

> dedicated to [@luk](https://twitter.com/luk)

![img](http://i.imgur.com/7Na4XmH.gif)

[BUT DOES IT SCALE?](http://a-big-goat.herokuapp.com/)

Another goatscale db [locket](https://github.com/bigeasy/locket)

``` js
var GoatDB = require('goatdb')

GoatDB('/tmp/goatdb-example').open(function (err, db) {
  db.put('hello', 'I am a goat', function (err) {
    db.put('whatevs', 'GOAT GOAT GOAT', function (err) {
      db.get('hello', function (err, value) {
        console.log(value)
      })
    })
  })
})
```

everything is just line separated json!

``` js
cat /tmp/goatdb-example/log-00000001.json
```
contains this.
``` js
{"key":"hello","value":"I am a goat","type":"put"}
{"key":"whatevs","value":"GOAT GOAT GOAT","type":"put"}
```

put more data in there and you'll get `sst` files too.

# features

- GOATS
- crude pass at the leveldown api.
- probably lots of bugs.

# TODO

- add more goats
- be leveldown compatible
- contrive benchmarks that goatdb will do really well at.


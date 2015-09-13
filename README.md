# WIP

# LSM, a log-structured-merge-tree, implemented in node.js.

``` js
var lsm = Subject('/tmp/example', {
    threshold : 1000 //optional
});

lsm.open().then(function(){
    return lsm.put('#12345', 'hello');
}).then(function(){
    return lsm.get('#12345');
}).then(function(result){
    console.log('result', result); // hello
});
```

everything is just line separated json!

``` js
cat /tmp/example/log-00000001.json
```

contains this.

``` js
{"key":"hello","value":"HI","type":"put"}
{"key":"what","value":"WHO","type":"put"}
```

put more data in there and you'll get ```SST``` files.

# Features

- ```PUT``` string key/value
- ```GET``` string key/value
- ```DEL``` string key/value

# TODO

- Support multiple lsm's opened pointing to the same data folder.
- All operations promisify


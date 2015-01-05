mhbPromises
-----------

Usage
=====

### Node

`var q = require('./promises.js')`

### Browser

`<script src="./promises.js"></script>`

API
===

mhbPromises exposes a `defer` method, which creates deferreds, and an `all` method, for convenience working with multiple promises.

```JavaScript


function asyncThing () {
  
  var deferred = mhbPromises.defer();

  setTimeout(function () {
    // randomly work or fail
    var fakeCallSucceeded = !Math.round(Math.random());
    fakeCallSucceeded ? deferred.resolve('yay') : deferred.reject('sorry');
  }, 1000);

  return deferred.promise;
}

asyncThing()
  .then(function (excitedReply) {
    console.log(excitedReply);
  })
  .catch(function (errorExplanation) {
    console.log(errorExplanation);
  });

mhbPromises.all([
  asyncThing(),
  asyncThing(),
  asyncThing(),
  asyncThing()
]).then(function (repliesArr) {
  repliesArr.forEach(function (reply) {
    console.log(reply);
  });
});

```


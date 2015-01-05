function Promise (addDeferredCallback, addDeferredErrorHandler) {
  var promise = this;

  this.then = then;
  this.catch = _catch;

  function then (callbackFunc) {
    addDeferredCallback(callbackFunc);
    return promise;
  }

  // `catch` is reserved
  function _catch (errorHandlerFunc) {
    addDeferredErrorHandler(errorHandlerFunc);
    return promise;
  }
}

Promise.isPromise = function (thing) {
  return thing instanceof Promise;
};


function Deferred () {
  var deferred = this;
  var callbackQueue = [];

  // noop error handler func to be overwritten by .catch
  var errorHandler = function () {};

  this.promise = getPrivilegedPromise()
  this.reject = reject;
  this.resolve = resolve;

  function reject (errorReason) {
    var error = new Error(errorReason);
    // clear the rest of our callbacks, none of them are going to be called
    callbackQueue = [];
    errorHandler(error);
  }

  function resolve (value) {
    // the next callback from the queue
    var callbackFunc;

    // for chained .then calls, we need to hold intermediate results
    // initialize these results with the initially resolved value
    var nextVal = value;

    // iterate over the queue callback array in FIFO order
    while ((callbackFunc = callbackQueue.shift())) {
      // promises handle errors in their resolution
      try {
        nextVal = callbackFunc(nextVal);

        // promises are chainable:
        //  if a promise is provided as the callback to a promise they should operate
        //  sequentially - the final resolved value of the first promise
        //  is provided as the initial resolved value of the next promise
        if (Promise.isPromise(nextVal)) {
          // move all remaining callbacks to the next promise
          while ((callbackQueue.length)) {
            nextVal.then(callbackQueue.shift());
          }

          // move error handler to the next promise
          nextVal.catch(errorHandler);
        }
      }
      // catch and handle any errors thrown by a .then callback
      catch (e) {
        errorHandler(e);
      }
    }
  }

  // privileged functions that have access to the Deferred constructor's closure
  // cleaner and safer than exposing these as Deferred methods or letting the promise
  // modify these data structures directly, and better than redefining the Promise
  // constructor in the Deferred constructor since it's more memory efficient and
  // makes identifying promises simpler.
  function addCallback (callbackFunc) {
    callbackQueue.push(callbackFunc);
  }

  function addErrorHandler (errorHandlerFunc) {
    errorHandler = errorHandlerFunc;
  }

  function getPrivilegedPromise () {
    return new Promise(addCallback, addErrorHandler);
  }

}

function asyncCall (value) {
  var deferred = q.defer();

  randTimeout(function () {
    deferred.resolve(value);
  });

  return deferred.promise;
}


function all (promiseArr) {
  var allFinishedDeferred = q.defer();
  var allFinished = false;

  var finishedValuesArr = [];
  var finishedArr = promiseArr.map(function (promise) {
    return {
      promise: promise,
      isFinished: false
    };
  });

  finishedArr.forEach(function (promiseObj, index) {
    promiseObj.promise.then(function (value) {
      finishedValuesArr[index] = value;
      promiseObj.isFinished = true;

      allFinished = finishedArr.every(function (promiseObj) {
        return promiseObj.isFinished;
      });

      if (allFinished) {
        allFinishedDeferred.resolve(finishedValuesArr);
      }
    });
  });

  return allFinishedDeferred.promise;
}

function defer () {
  return new Deferred();
}

var q = {
  defer: defer,
  all: all
};

function randomMilliSeconds () {
  return Math.round(Math.random() * 1000);
}

function randTimeout (callback) {
  setTimeout(callback, randomMilliSeconds);
}


asyncCall('moshe')
  .then(function (name) {
    var greeting = 'hello to: ' + name;

    return greeting;
  })
  .then(asyncCall)
  .then(function (asyncMadeGreetingStr) {
    console.log(asyncMadeGreetingStr);
    return 12312;
  })
  .then(function (name) {
    console.log(name);
  })
  .then(function () {
    var deferred = q.defer();

    setTimeout(function () {
      deferred.reject('lololol this is an error too!');
    }, 100);

    return deferred.promise;
  })
  .then(function (resolutionError) {
    console.log('getting: ', resolutionError);
  })
  .catch(function (err) {
    console.log('oops there was an error: ', err);
  });

var promisesArr = [1,2,3,4,5,6,7,8,9,10].map(function (num) {
  return asyncCall(num);
});

q.all(promisesArr).then(function (numbersArr) {
  console.log(numbersArr);
});


q.all([
  q.all([
    asyncCall('m'),
    asyncCall('o'),
    asyncCall('s'),
    asyncCall('h'),
    asyncCall('e')
  ]),
  q.all([
    asyncCall('g'),
    asyncCall('e'),
    asyncCall('r'),
    asyncCall('y')
  ]),
  q.all([
    asyncCall('l'),
    asyncCall('u'),
    asyncCall('k'),
    asyncCall('e')
  ])
]).then(function (arrArr) {
  console.log('all the all the things finished');
  console.log(arrArr);
});






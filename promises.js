function randomMilliSeconds () {
  return Math.round(Math.random() * 1000);
}

function randTimeout (callback) {
  setTimeout(callback, randomMilliSeconds);
}

function Promise (addCallback, addErrorHandler) {
  var promise = this;

  this.then = function (callbackFunc) {
    addCallback(callbackFunc);
    return promise;
  };

  this.catch = function (errorHandlerFunc) {
    addErrorHandler(errorHandlerFunc);
    return promise;
  };

}

function Deferred () {
  var deferred = this;
  var callbackQueue = [];
  var errorHandler;


  this.reject = function (error) {

  };

  this.resolve = function (value) {
    var callbackFunc;
    var intermediateVal = value;
    var nextVal;

    var nextIsPromise;

    while ((callbackFunc = callbackQueue.shift())) {
      try {
        nextVal = callbackFunc(intermediateVal);
        nextIsPromise = Promise.isPromise(nextVal);

        if (nextIsPromise) {
          // move all remaining callbacks to the next promise
          while ((callbackQueue.length)) {
            nextVal.then(callbackQueue.shift());
          }
          nextVal.catch(errorHandler);
        }

        intermediateVal = nextVal;
      } catch (e) {
        errorHandler(e);
      }
    }
  };

  function addCallback (callbackFunc) {
    callbackQueue.push(callbackFunc);
  }

  function addErrorHandler (errorHandlerFunc) {
    errorHandler = errorHandlerFunc;
  }

  this.promise = new Promise(addCallback, addErrorHandler);

}

Deferred.isDeferred = function (thing) {
  return thing instanceof Deferred;
};

Promise.isPromise = function (thing) {
  return thing instanceof Promise;
};


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


var q = {
  defer: function () {
    return new Deferred();
  },
  all: all
};


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
    throw new Error('trolololol');
  })
  .then(function () {
    var deferred = q.defer();

    setTimeout(function () {
      deferred.reject(new Error('fuck yourself'));
    }, 100);

    return deferred.promise;
  })
  .catch(function (err) {
    console.log('oops there was an error: ', err);
  });

// var promisesArr = [1,2,3,4,5,6,7,8,9,10].map(function (num) {
//   return asyncCall(num);
// });

// q.all(promisesArr).then(function (numbersArr) {
//   console.log(numbersArr);
// });


// q.all([
//   q.all([
//     asyncCall('m'),
//     asyncCall('o'),
//     asyncCall('s'),
//     asyncCall('h'),
//     asyncCall('e')
//   ]),
//   q.all([
//     asyncCall('g'),
//     asyncCall('e'),
//     asyncCall('r'),
//     asyncCall('y')
//   ]),
//   q.all([
//     asyncCall('l'),
//     asyncCall('u'),
//     asyncCall('k'),
//     asyncCall('e')
//   ])
// ]).then(function (arrArr) {
//   console.log('all the all the things finished');
//   console.log(arrArr);
// });






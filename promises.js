;(function () {
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

  // static method
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

  // return a single promise for an array of promises
  // resolved with an array of values corresponding
  // to the individual resolution values of each promise
  function all (promiseArr) {
    // deferred to handle all the promiseArr members being finished
    var allFinishedDeferred = q.defer();

    // holder for the resolved values of each promiseArr member
    var finishedValuesArr = [];

    // flag to indicate whether all promiseArr members are resolved
    var allFinished = false;

    // promiseArr members paired with a flag indicating whether it is finished
    //  a flag is used (instead of checking for a resolved value) so that promises
    //  can resolve with value undefined values.
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

  // wrap Deferred creation for consistent API style
  function defer () {
    return new Deferred();
  }

  /*
    PUBLIC API
   */
  var q = {
    defer: defer,
    all: all
  };

  /*
    Exports
   */
  if (typeof module !== 'undefined') {
    module.exports = q;
  }
  else {
    this.q = q;
  }

})();

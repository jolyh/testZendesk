const rp = require('request-promise');
var ticket = require('../ticket');
var credentialsAPI = require('../credentialsAPI');

// setup of the call
var defaultCall = {
  uri: '',
  headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " 
        + Buffer.from(credentialsAPI.userEmail + "/token:" + credentialsAPI.zendeskAPIToken).toString('base64') // to be added to all header to allow auth
  },
  json: true // Automatically parses the JSON string in the response
};

// Return the timestamp unix of 1 month ago
var oneMonthAgo = function () {
  console.log("Use of one month ago")
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.valueOf()/1000;
}

module.exports = {

  lastExec: new Date(),
  lastEndTime : 0,
  lastNextPage : "",

  oneMonthAgo : () => {
    console.log("Use of one month ago")
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.valueOf()/1000;
  },

  // if start time <= 0, check last value of exec, if < 0 again, start from last month
  // to get all ticket ever, start at 1
  allTicketsSince: (startTime = 0, withMetric = false, call = defaultCall) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/incremental/tickets.json?start_time=" 
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Call to execute : " + call.uri);

    module.exports.callExecution(call, module.exports.allTicketSince);
  },

  // Exists to allow call using only a call as param
  allDataFromIncrementalCall(call) {

    console.log("External call : " +call.uri)

    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCallSince);
  },

  // Exists to allow call using only a call as param
  allDataFromIncrementalCallSinceLastExecution(call) {

    console.log("External call Since : " + call.uri);

    call.uri.replace(/(=\d+)/,"="+this.lastExec);
    console.log("External call after replacement: " + call.uri);
  
    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCallSince);
  },

  // Exists to allow call using only a call as param
  allDataFromIncrementalCallSinceLastEndTime(call) {

    console.log("External call Since : " + call.uri);

    call.uri.replace(/(=\d+)/,"="+this.lastEndTime);
    console.log("External call after replacement: " + call.uri);
  
    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCallSince);
  },

  // Exists to allow call using only a call as param
  allDataFromIncrementalCallSince(startTime, call) {

    console.log("External call Since : " + call.uri);

    call.uri.replace(/(=\d+)/,"="+startTime);
    console.log("External call after replacement: " + call.uri);
    
    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCall);
  },

  // should execute the full inner execution 
  // (including recursive execution when next page)
  callExecution(call, innerFunction) {
    rp(call)
      // call success
      .then((callResult) => {

        console.log('success query for ' + call.uri);
        //console.log(callResult);
        
        // Time+1 to avoid duplicate last ticket on next call execution.
        // To avoid the end_time = null of the last entry to be saved, check on non_null
        if (callResult.end_time) {
          module.exports.updateLastExecutionNotEmpty(callResult.end_time+1, callResult.next_page);
        }

        // if there is a next page, execute from returned end_time
        if (callResult.end_of_stream == false) {
          console.log("Another iteration required starting from : " + callResult.end_time)
          return innerFunction(callResult.end_time, call);
        } else {
          console.log("Iteration end, " + callResult.count + " record recovered.");
          //console.log(callResult)
          return callResult;
        }
      })
  },

  // Update last execution of the query
  updateLastExecutionNotEmpty(endTime, nextPage) {
    module.exports.lastEndTime = endTime;
    module.exports.lastNextPage = nextPage;
    module.exports.lastExec = Date.now();

    console.log("Last end time : " + module.exports.lastEndTime)
    console.log("Last next page : " + module.exports.lastNextPage)
  },

  // Update last execution of the query
  resetExecutionHistory() {
    module.exports.lastEndTime = 0;
    module.exports.lastNextPage = null;
    module.exports.lastExec = Date.now();

    console.log("Last end time : " + module.exports.lastEndTime)
    console.log("Last next page : " + module.exports.lastNextPage)
  },

  scheduledIncrementalCall : class {

    lastExec;
    lastEndTime;
    lastNextPage;
    call;

    constructor(call, startTime=-1) {
      console.log("schedule IC created")
      this.call = call;
      this.lastEndTime = startTime;
      this.lastExec = -1;
      this.lastNextPage = null;
    }
  
    // Exists to allow call using only a call as param
    allDataFromIncrementalCall() {
  
      console.log("External call : " + this.call.uri)
      if (this.lastExec > 1) {
        return this.callExecution(this.allDataFromIncrementalCallSinceLastExecution);
      }
      this.call.uri.replace(/(=\d+)/,"="+this.lastEndTime);
      return this.callExecution(this.allDataFromIncrementalCallSinceLastEndTime);
    }
  
    // Exists to allow call using only a call as param
    allDataFromIncrementalCallSinceLastExecution() {
  
      console.log("allDataFromIncrementalCallSinceLastExecution : " + this.call.uri);
  
      this.call.uri.replace(/(=\d+)/,"="+this.lastExec);
      console.log("External call after replacement: " + this.call.uri);
    
      return this.callExecution(this.allDataFromIncrementalCallSinceLastExecution);
    }
  
    // Exists to allow call using only a call as param
    allDataFromIncrementalCallSinceLastEndTime() {
  
      console.log("allDataFromIncrementalCallSinceLastEndTime : " + this.call.uri);
  
      this.call.uri.replace(/(=\d+)/,"="+this.lastEndTime);
      console.log("External call after replacement: " + this.call.uri);
    
      return this.callExecution(this.allDataFromIncrementalCallSince);
    }
  
    // should execute the full inner execution 
    // (including recursive execution when next page)
    callExecution(innerFunction) {
      rp(this.call)
        // call success
        .then((callResult) => {
  
          console.log('success query for ' + this.call.uri);
          //console.log(callResult);
          
          // Time+1 to avoid duplicate last ticket on next call execution.
          // To avoid the end_time = null of the last entry to be saved, check on non_null
          if (callResult.end_time) {
            this.updateLastExecutionNotEmpty(callResult.end_time+1, callResult.next_page);
          }
  
          // if there is a next page, execute from returned end_time
          if (callResult.end_of_stream == false) {
            console.log("Another iteration required starting from : " + callResult.end_time)
            return innerFunction();
          } else {
            console.log("Iteration end, " + callResult.count + " record recovered.");
            //console.log(callResult)
            return callResult;
          }
        })
    }
  
    // Update last execution of the query
    updateLastExecutionNotEmpty(endTime, nextPage) {
      this.lastEndTime = endTime;
      this.lastNextPage = nextPage;
      this.lastExec = Date.now();
  
      console.log("Last end time : " + this.lastEndTime)
      console.log("Last next page : " + this.lastNextPage)
    }
  }

};
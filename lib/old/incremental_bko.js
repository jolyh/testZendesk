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

// Retun the timestamp unix of 1 month ago
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

  allTicket: () => {  

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/tickets.json";
    console.log("auto get of all tk");
    
    var callResult = ticket.getTicketList(call);
    this.updateLastExecution(callResult.end_time, callResult.next_page);
    return callResult;
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

  // all ticket Event event since date
  // if no time define, start from last month
  allTicketEventsSince: (startTime = 0, withMetric = false, call = defaultCall) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/incremental/ticket_events.json?start_time="
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Call to execute : " + call.uri);
    
    module.exports.callExecution(call, module.exports.allTicketEventSince);
  },

  // all organization since date
  // if no time define, start from last month
  allOrganizationsSince: (startTime = 0, withMetric = false, call = defaultCall) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/incremental/organizations.json?start_time="
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Call to execute : " + call.uri);
    
    module.exports.callExecution(call, module.exports.allTicketEventSince);
  },

  // all organization since date
  // if no time define, start from last month
  allUsersSince: (startTime = 0, withMetric = false, call = defaultCall) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/incremental/users.json?start_time="
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Call to execute : " + call.uri);
    
    module.exports.callExecution(call, module.exports.allTicketEventSince);
  },

  // all organization since date
  // if no time define, start from last month
  allTicketMetricEventsSince: (startTime = 0, withMetric = false, call = defaultCall) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl 
      + "/api/v2/incremental/ticket_metric_events.json?start_time="
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Call to execute : " + call.uri);
    
    module.exports.callExecution(call, module.exports.allTicketEventSince);
  },
  
  // need to test those ones

  // Exists to allow call using only a call as param
  allDataFromIncrementalCall(call) {

    console.log("External call : ");
    console.log(call)
    
    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCall);
  },

  // Exists to allow call using only a call as param
  allDataFromIncrementalCallSince(call, startTime) {

    call.uri.replace(/(=\d+)/,"="+module.exports.lastEndTime);
    console.log("External call after replacement: ");
    console.log(call)
    
    return module.exports.callExecution(call, module.exports.allDataFromIncrementalCall);
  },
  
  // need to test those ones

  // all organization since date
  // if no time define, start from last month
  // dataType = ticket || ticket_event || users || organizations
  allDataOfTypeSince: (startTime = 0, withMetric = false, dataType, isSample = false) => {

    if (isSample == true) {
      return (module.exports.allDataSampleOfTypeSince(dataType, startTime, withMetric));
    }
    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl  
      + '/api/v2/incremental/' + dataType + '.json?start_time='
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');

    console.log("Get all " + dataType + " since " + startTime)
    
    module.exports.callExecution(call, module.exports.allDataOfTypeSince);
  },

  // all organization since date
  // if no time define, start from last month
  // dataType = tickets || users || organizations
  allDataSampleOfTypeSince(startTime = 0, withMetric = false, dataType) {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = credentialsAPI.baseUrl 
      + '/api/v2/incremental/' 
      + dataType + '/sample.json?start_time=' 
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (withMetric ? '&include=metric_sets' : '');
    
    module.exports.callExecution(call, module.exports.allDataSampleOfTypeSince);
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
          console.log("Another iteration required starting at : " + callResult.end_time)
          return innerFunction(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end, " + callResult.count + " record recovered.");
          console.log(callResult)
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
  }

};
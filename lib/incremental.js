const rp = require('request-promise');
var ticket = require('./ticket');
var credentialsAPI = require('./credentialsAPI');

// setup of the call
var call = {
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

  lastExec: 0,
  lastEndTime : 0,
  lastNextPage : "",

  lastCallParam : {startTime : 0, dataType : "", includes : [], isSample : false},

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

  // all organization since date
  // if no time define, start from last month
  // dataType = ticket || ticket_event || users || organizations
  allDataOfTypeSince: (startTime = 0, dataType, includes = [], isSample = false) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl  
      + '/api/v2/incremental/' + dataType 
      + (isSample ? '/sample' : '') + '.json?start_time='
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (includes.length > 0 ? '&include='+includes : '');

    console.log("allDataOfTypeSince " + call.uri)
    
    module.exports.callExecution(call, module.exports.allDataOfTypeSince);
  },

  // all organization since date
  // if no time define, start from last month
  // dataType = tickets || users || organizations
  inner_allDataOfTypeSince: (startTime = 0, call) => {

    if (startTime <= 0) {
      startTime = module.exports.lastEndTime;
    }
    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri.replace(/(=\d+)/,"="+startTime);
    
    module.exports.callExecution(call, module.exports.inner_allDataOfTypeSince);
  },

  // all data since last execution. First will pull everything for demo
  // if no time define, start from last month
  // dataType = ticket || ticket_event || users || organizations
  allDataOfTypeSinceLastExecution: (startTime = 0, dataType, includes = [], isSample = false) => {

    startTime = module.exports.lastExec;

    console.log("module export lastendtime : " + module.exports.lastEndTime)

    call.uri = credentialsAPI.baseUrl  
      + '/api/v2/incremental/' + dataType 
      + (isSample ? '/sample' : '') + '.json?start_time='
      + (startTime <= 0 ? oneMonthAgo() : startTime)
      + (includes.length > 0 ? '&include='+includes : '');

    console.log("allDataOfTypeSince " + call.uri)
    
    module.exports.callExecution(call, module.exports.allDataOfTypeSinceLastExecution);
  },


  // do not deal with sample yet
  // dataType = ticket || ticket_event || users || organizations
  allDataOfTypeSinceLastExecutionCron: () => {

    console.log("allDataOfTypeSinceLastExecutionCron : " + module.exports.lastExec)
    console.log(module.exports.lastCallParam)

    call.uri = credentialsAPI.baseUrl  
      + '/api/v2/incremental/' + module.exports.lastCallParam.dataType 
      + '.json?start_time='
      + (module.exports.lastExec <= 0 ? oneMonthAgo() : module.exports.lastExec)
      + (module.exports.lastCallParam.includes.length > 0 ? '&include='+includes : '');

    console.log("allDataOfTypeSince " + call.uri)
    
    module.exports.callExecution(call,module.exports.lastCallParam.dataType, module.exports.lastCallParam.includes, module.exports.allDataOfTypeSinceLastExecution);
  },

  // should execute the full inner execution 
  // (including recursive execution when next page)
  callExecution(call, datatype, includes, innerFunction) {
    rp(call)
      // call success
      .then((callResult) => {

        console.log('success query for ' + call.uri);
        //console.log(callResult);
        
        
        // if there is a next page, execute from returned end_time
        if (callResult.end_of_stream == false) {
          
          // Time+1 to avoid duplicate last ticket on next call execution.
          // To avoid the end_time = null of the last entry to be saved, check on non_null
        
          module.exports.updateLastExecutionNotEmpty(callResult.end_time+1, callResult.next_page);
          console.log("Another iteration required starting at : " + callResult.end_time)
          return innerFunction(callResult.end_time, datatype, includes);
        
        } else {
          module.exports.updateLastExecutionNotEmpty(module.exports.lastEndTime, callResult.next_page);
          module.exports.updateLastEndedCall(Date.now()/1000, datatype, includes, false); // need to pass sample
          
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
    module.exports.lastExec = Date.now()/1000;

    console.log("Last end time : " + module.exports.lastEndTime)
    console.log("Last next page : " + module.exports.lastNextPage)
  },

  // Update last execution of the query
  updateLastEndedCall(startTime, dataType, includes, isSample) {
    module.exports.lastCallParam.startTime = startTime;
    module.exports.lastCallParam.dataType = dataType;
    module.exports.lastCallParam.includes = includes;
    module.exports.lastCallParam.isSample = isSample;

    console.log("Last call param : ")
    console.log(module.exports.lastCallParam)
  },

};
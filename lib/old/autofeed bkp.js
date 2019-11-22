var ticket = require('../ticket');
const rp = require('request-promise');

var zendeskAPIToken = "sUIIXyDJ1dfJJRbRpE9nKNLLrBrU9aXMZVyJk6lF";
var baseUrl = "https://arnaudjoly.zendesk.com";
var userEmail = "arnaud.joly24@outlook.com";

// setup of the call
var call = {
  uri: '',
  headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " + Buffer.from(userEmail + "/token:" + zendeskAPIToken).toString('base64') // to be added to all header to allow auth
  },
  json: true // Automatically parses the JSON string in the response
};

 // Retun the timestamp unix of 1 month ago
var oneMonthAgo = function () {
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.valueOf();
}


module.exports = {

  lastExec: new Date(),
  lastEndTime : 0,
  lastNextPage : "",

  // should execute the full inner execution (including recursive execution of function)
  callExecution(call, innerFunction) {

    rp(call)
      // call success
      .then((callResult) => {

        console.log('success query for ' + call.uri);
        console.log(callResult);
        // time +1 to avoid duplicate last ticket
        module.exports.updateLastExecution(callResult.end_time+1, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.end_of_stream == false) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          return innerFunction(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
  },

  allTicketFeed: () => {  

    call.uri = baseUrl + "/api/v2/tickets.json";
    console.log("auto get of all tk");
    
    var callResult = ticket.getTicketList(call);
    this.updateLastExecution(callResult.end_time, callResult.next_page);
    return callResult;
  },

  // if no time define, start from last month
  allTicketSince: (startTime = -1, withMetric = false) => {

    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + "/api/v2/incremental/tickets.json?start_time=" + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all tk since " + startTime);

    module.exports.callExecution(call, module.exports.allTicketSince);
/*
    rp(call)
      // call success
      .then((callResult) => {

        console.log('success query for ' + call.uri);
        console.log(callResult);
        // time +1 to avoid duplicate 
        module.exports.updateLastExecution(callResult.end_time+1, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.end_of_stream == false) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allTicketSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })

      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })*/


  },

  // all ticket Event event since date
  // if no time define, start from last month
  allTicketEventSince: (startTime = -1, withMetric = false) => {

    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + "/api/v2/incremental/tickets.json?start_time=" + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all tk since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allTicketEventSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  // all organization since date
  // if no time define, start from last month
  allOrganizationSince: (startTime = -1, withMetric = false) => {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + "/api/v2/incremental/organizations.json?start_time=" + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all tk since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allOrganizationSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  // all organization since date
  // if no time define, start from last month
  allUserSince: (startTime = -1, withMetric = false) => {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + "/api/v2/incremental/users.json?start_time=" + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all tk since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allOrganizationSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  // all organization since date
  // if no time define, start from last month
  allApiDataSince: (apiRoute, startTime = -1, withMetric = false) => {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + apiRoute + "?start_time=" + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all tk since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allOrganizationSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },
  
  // all organization since date
  // if no time define, start from last month
  // dataType = ticket || ticket_event || users || organizations
  allDataOfTypeSince: (dataType, isSample = false, startTime = -1, withMetric = false) => {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    if (isSample == true) {
      return (module.exports.allDataSampleOfTypeSince(dataType, startTime, withMetric));
    }
    console.log("Get all " + dataType + " since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allOrganizationSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  // all organization since date
  // if no time define, start from last month
  // dataType = tickets || users || organizations
  allDataSampleOfTypeSince: (dataType, startTime = -1, withMetric = false) => {

    console.log(startTime)
    if (startTime < 0) {
      startTime = oneMonthAgo()
    }

    call.uri = baseUrl + '/api/v2/incremental/' + dataType + '/sample.json?start_time=' + startTime + (withMetric ? '&include=metric_sets' : '');
    console.log("Get all " + dataType + " since " + startTime)
    
    rp(call)
      // call success
      .then((callResult) => {
        console.log('success query for ' + call.uri);
        console.log(callResult);
        module.exports.updateLastExecution(callResult.end_time, callResult.next_page);
        
        // if there is a next page, execute from returned end_time
        if (callResult.next_page) {
          console.log("Another iteration required starting at : " + callResult.end_time)
          module.exports.allOrganizationSince(callResult.end_time, withMetric);
        } else {
          console.log("Iteration end");
          return callResult;
        }
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  // Update last execution of the query
  updateLastExecution: (endTime, nextPage) => {
    this.lastEndTime = endTime;
    this.lastNextPage = nextPage;
    this.lastExec = Date.now();

    console.log("Last end time : " + this.lastEndTime)
    console.log("Last next page : " + this.lastNextPage)
  }
};
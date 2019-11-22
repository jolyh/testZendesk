var incremental = require('./incremental');
var credentialsAPI = require('./credentialsAPI');
const schedule = require('node-schedule');

module.exports = { 

  call : {
    uri: '',
    headers: {
        'User-Agent': 'Request-Promise',
        'Authorization': "Basic " + Buffer.from(credentialsAPI.userEmail 
          + "/token:" + credentialsAPI.zendeskAPIToken).toString('base64') // to be added to all header to allow auth
    },
    json: true // Automatically parses the JSON string in the response
  },

  scheduledEvent : undefined,
  lastExecution : 0,
  
  defaultFeed : () => {

    var reccurrence = "* * 12 1 * *"
    
    return module.exports.setupNewAutofeed(reccurrence, "tickets", []);
  },

  // setup the recurring call
  // if a parameter is not to be setup, default value = null
  setupNewAutofeed : (recurrence = "", datatype, includes) => {

    console.log("New feed creation")
    if (module.exports.scheduledEvent != undefined) {
      module.exports.scheduledEvent.cancel();
    }

    var startTime = Date.now()/1000 // now is the starting date

    /* setup for cron job */
    incremental.updateLastExecutionNotEmpty(startTime, null);
    incremental.updateLastEndedCall(startTime, datatype, includes)
    module.exports.scheduledEvent = schedule.scheduleJob(recurrence, incremental.allDataOfTypeSinceLastExecutionCron)

    //setInterval(incremental.allDataOfTypeSinceLastExecution, 7000, startTime, datatype, includes)
 
  },

  // setup the recurring call 
  stopAutofeed : () => {

    if (module.exports.scheduledEvent != undefined) {
      console.log("Stop feed")
      module.exports.scheduledEvent.cancel();
    }
  },

}
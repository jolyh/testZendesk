const rp = require('request-promise');

module.exports = {

  getTicketList : (call, res) => {
    console.log(call.uri)
    let queryResult = [];
    
    rp(call)
        // call success
        .then((content) => {
            console.log('success query for ' + call.uri);
            console.log(content)
  
            for (var ticket of content.tickets) {
              queryResult.push(ticket);
              console.log(queryResult)
            }
  
            res.render(
              'queryContent', { 
                queryContent: call.uri, 
                queryResult: queryResult
              }
            );
        })
  
        // api call faill
        .catch((err) => {
          console.log("Query failed for " + call.uri);
          console.log(err);
          res.render(
            'queryContent', { 
              queryContent: call.uri, 
              queryResult: queryResult.push("call failed " + err)
            }
          );
        });
  },

  getTickets: (call) => {
    console.log(call.uri)
    
    rp(call)
      // call success
      .then((content) => {
        console.log('success query for ' + call.uri);
        var result = {}
        result = content;        
        return result;
      })
      // api call faill
      .catch((err) => {
        console.log("Query failed for " + call.uri);
        console.log(err);
        return (err);
      })
  },

  /* 
  ** TICKET CREATION 
  */

  createTickets: (call, res) => {
   
    rp(call)
      .then ((callResult) => {
          // POST succeeded...
          console.log('Ticket created');
          console.log(callResult)
          res.render('query', {title: "Creation of ticket " + callResult.ticket.id + " successfull"});
      })
      .catch((err) => {
          // POST failed...
          console.log(err)
          res.render('query', {title: "Creation Failed"});
      });
  },

};
var express = require('express');
var router = express.Router();

const rp = require('request-promise');
const credentialsAPI = require('../lib/credentialsAPI');
const ticket = require('../lib/ticket');
const incremental = require('../lib/incremental');


// test var
var queryResult = [];

// setup of the call
var call = {
  uri: '',
  headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " 
        + Buffer.from(credentialsAPI.userEmail 
        + "/token:" 
        + credentialsAPI.zendeskAPIToken).toString('base64') // to be added to all header to allow auth
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

/* GET defaul query page */
router.get('/', function(req, res, next) {
  res.render('query', { title: 'Welcome to Query Page' });
});

/* GET Query. */
// will be used to get all tks
router.get('/all', function(req, res, next) {

  call.uri = credentialsAPI.baseUrl 
    + "/api/v2/tickets.json"

  ticket.getTicketList(call, res);
});

/* GET all assigned ticket on ?userid= -- mine is 368349606957*/
router.get('/assigned', function(req, res, next) {

  call.uri = credentialsAPI.baseUrl 
    + "/api/v2/users/" 
    + req.query.userid 
    + "/tickets/assigned.json"

  // call execution
  ticket.getTicketList(call, res);
});

/* GET all assigned ticket on ?orgid= -- mine is 360196266737*/
router.get('/organization', function(req, res, next) {

  call.uri = credentialsAPI.baseUrl 
    + "/api/v2/organizations/" 
    + req.query.orgid + "/tickets.json"

  // call execution
  ticket.getTicketList(call, res);
});


/*
** TICKET CREATION
*/

router.get('/add', function(req, res, next) {
  res.render('ticketCreate', {title: "Ticket Creation"});
});

router.post('/add', function(req, res, next) {

  console.log(req);
  console.log(req.body);

  req.body = JSON.parse(JSON.stringify(req.body));

  let call = {
    method: 'POST',
    uri: credentialsAPI.baseUrl + '/api/v2/tickets.json',
    headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " 
        + Buffer.from(credentialsAPI.userEmail + "/token:" + credentialsAPI.zendeskAPIToken).toString('base64'), // to be added to all header to allow auth
    },
    body: {
      ticket: {
        description: req.body.description,
        subject: req.body.subject,
        comment: { 
          body: req.body.comment
        },
        status: 'open',
        requester_id: 368349606957,
      }
    },
    json: true // Automatically stringifies the body to JSON
  };
 
  ticket.createTickets(call, res);
});


/* test GET query from zendesk doc on API */
router.get('/helpArticles', (req, res, next) => {

  call.uri='https://obscura.zendesk.com/api/v2/help_center/en-us/articles.json'
  queryContent = call.uri;
 
  // call execution
  rp(call)
      // call success
      .then((content) => {
          console.log('success query');

          for (var article of content.articles) {
            queryResult.push(article.html_url);
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
        res.render(
          'queryContent', { 
            queryContent: call.uri, 
            queryResult: queryResult.push("call failed " + err)
          }
        );
      });
      queryResult = []
});



router.get('*', (req, res) => {
  res.render('index', {title: "the landing page, you lost soul"});
});

module.exports = router;

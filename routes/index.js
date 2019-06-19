var express = require('express');
var router = express.Router();

const nforce = require('nforce');
const faye = require('faye');


//nforce's authentication to Salesforce org
const org = nforce.createConnection({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  redirectUri: 'http://localhost:3000/oauth/_callback',
  environment: process.env.ENVIRONMENT,
  mode: 'single',
});

var fClient;

org.authenticate({username: process.env.SFDCUSERNAME, password: process.env.SFDCPASSWORD}, (err, resp) => {
  if(err) console.error(err);
  else if (!err){
    console.log('sf auth connected');
    fClient = new faye.Client(`${org.oauth.instance_url}/cometd/45.0/`);
    //console.log(fClient);
    const subscription = fClient.subscribe('/data/ChangeEvent', (message) => {
      console.log('Event detected on ChangeEvent');
      console.log(message);
      io.emit('MESSAGE', message);
    });
    subscription.then(()=> {
      console.log('successfully subbed to /data/ChangeEvent');
    });
  } 
  
});




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('connection made');
  });
  return router;
}
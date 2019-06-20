'use strict'
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






/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {});
});

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('connection made');
  });
  org.authenticate({username: process.env.SFDCUSERNAME, password: process.env.SFDCPASSWORD}, (err, resp) => {
    if(err) console.error(err);
    else if (!err){
      console.log('sf auth connected');
      console.log(`${org.oauth.instance_url}/cometd/46.0`);
      fClient = new faye.Client(`${org.oauth.instance_url}/cometd/46.0`);
      fClient.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
      console.log('fClient connected?');
      const subscription = fClient.subscribe('/data/ChangeEvents', (message) => {
        console.log('Event detected');
        console.log(message);
        io.emit('MESSAGE', message);
      });
      subscription.then(() => {
        console.log('connected!');
      })
      .catch( (err) => {
        console.error(err);
      });
    } 
    
  });
  
  return router;


}
'use strict'
var express = require('express');
var router = express.Router();

const nforce = require('nforce');
const faye = require('faye');
var subscription;

//nforce's authentication to Salesforce org
const org = nforce.createConnection({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  redirectUri: 'http://localhost:3000/auth/sfdc/callback',
  environment: process.env.ENVIRONMENT,
  mode: 'single',
});

var fClient = undefined;

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', {});
  if(fClient != undefined){
    res.render('index', {});
  }else{
    //need to auth
    res.redirect('/auth/sfdc');
  }
});

router.get('/auth/sfdc', (req, res) => {
  res.redirect(org.getAuthUri());
});

router.get('/auth/sfdc/callback', (req, res) => {
  org.authenticate({code: req.query.code}, (err, resp) => {
    if(!err) {
      console.log(`Access Token: ${req.access_token} : ${org.oauth.access_token}`);
      fClient = new faye.Client(`${org.oauth.instance_url}/cometd/46.0`);
      fClient.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
      console.log('fClient connected?');
      subscription = fClient.subscribe('/data/ChangeEvents', (message) => {
        console.log('Event detected');
        console.log(message);
        req.app.io.emit('MESSAGE', message);
      });
      subscription.then(() => {
        console.log('connected!');
      })
      .catch( (err) => {
        console.error(err);
      });
    }
    else console.log(`Error: ${err.message}`);
  });
  res.render('index', {});
});

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('connection made');
  });
  
  
  return router;


}
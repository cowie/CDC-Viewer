'use strict'
var express = require('express');
var router = express.Router();

const nforce = require('nforce');
const faye = require('faye');


//nforce's authentication to Salesforce org
const org = nforce.createConnection({
  clientId: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  redirectUri: 'http://localhost:3000/auth/sfdc/callback',
  environment: process.env.ENVIRONMENT,
  mode: 'single',
});

var fClient = undefined;
const cdcTopic= '/data/ChangeEvents';


const PESubscriptionList = new Map();
var allCDCSubscription;

/* GET home page. */
router.get('/', function(req, res, next) {
  if(fClient != undefined){
    console.log('current PESubscriptionList');
    console.log(PESubscriptionList);
    res.render('index', {eventSubList: Array.from(PESubscriptionList.keys())});
  }else{
    console.log('fClient');
    console.log(fClient);
    //need to auth
    res.redirect('/auth/sfdc');
  }
});

router.get('/auth/sfdc', (req, res) => {
  res.redirect(org.getAuthUri());
});

router.get('/auth/sfdc/callback', (req, res) => {
  if(fClient == undefined){
    org.authenticate({code: req.query.code}, (err, resp) => {
      if(!err) {
        console.log(`Access Token: ${req.access_token} : ${org.oauth.access_token}`);
        fClient = new faye.Client(`${org.oauth.instance_url}/cometd/46.0`);
        fClient.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
        allCDCSubscription = fClient.subscribe(cdcTopic, (message) => {
          console.log(`Event detected on ${cdcTopic}`);
          console.log(message);
          req.app.io.emit(cdcTopic, message);
        });
        fClient.on('transport:up', () => {
          console.log('transport is active');
        });
        fClient.on('transport:down', () => {
          console.log('transport is down');
        });
        allCDCSubscription.then(() => {
          console.log('connected!');
        })
        .catch( (err) => {
          console.error(err);
        });
        res.redirect('/');
      }
      else {console.log(`Error: ${err.message}`);}
    });
  }
  else{
    res.redirect('/');
  }
  
});

module.exports = function(io){
  io.on('connection', function(socket){
    console.log('connection made');
    socket.on('ADD PE SUB', (peName) => {
      console.log(`ask to add ${socket.id} to sub to ${peName}`);
      if(!PESubscriptionList.get(peName)){
        let newPESub = fClient.subscribe(`/event/${peName}`, (message) => {
          console.log(`Event detected on ${peName}`);
          console.log(message);
          io.emit('PEMessage', {eventType: `${peName}`, message:message});
        });
        newPESub.then(() => {
          console.log('New PE Connected!');
          PESubscriptionList.set(peName, 1);
          io.emit('NewSubSuccess', {topicName:`${peName}`});
        })
        .catch((err) => {
          console.log('FAILURE Connecting to new PE Topic');
          console.error(err);
          io.emit('NewSubFailure', {topicName:`${peName}`, error:err});
        });
      }else{
        console.log('ALREADY ON IT BOSS');
      }
    });
  });

  return router;
}
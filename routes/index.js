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
  autoRefresh: true,
});

var fClient = undefined;
const cdcTopic= '/data/ChangeEvents';

var userInfo = undefined;

const PESubscriptionList = new Map();
var allCDCSubscription;

/* GET home page. */
router.get('/', function(req, res, next) {
  if(fClient != undefined){
    /*console.log('fClient defined, so auth is likely good')
    console.log('Information on username being used:');
    console.log(userInfo);*/
    if(userInfo == undefined){
      org.getIdentity({}, (err, qres) => {
        userInfo = qres;
        res.render('index', {eventSubList: Array.from(PESubscriptionList.keys()), userInfo});
      });
    }else{
      res.render('index', {eventSubList: Array.from(PESubscriptionList.keys()), userInfo});
    }
  }else{
    console.log('fClient not defined, need to auth into SFDC');
    res.redirect('/auth/sfdc');
  }
});

router.get('/auth/sfdc', (req, res) => {
  //console.log('redirecting to SFDC Oauth page');
  res.redirect(org.getAuthUri({prompt:'login'}));
});

router.get('/auth/sfdc/callback', (req, res) => {
  if(fClient == undefined){
    //console.log('validating authentication to SFDC');
    org.authenticate({code: req.query.code}, (err, resp) => {
      if(!err) {
        //console.log(`Access Token: ${req.access_token} : ${org.oauth.access_token}`);
        fClient = new faye.Client(`${org.oauth.instance_url}/cometd/46.0`);
        fClient.setHeader('Authorization', 'OAuth ' + org.oauth.access_token);
        org.getIdentity({}, (err, res) => userInfo = res);
        allCDCSubscription = fClient.subscribe(cdcTopic, (message) => {
          /*console.log(`Event detected on ${cdcTopic}`);
          console.log(message);*/
          req.app.io.emit(cdcTopic, message);
        });
        fClient.on('transport:up', () => {
          //console.log('transport is active');
        });
        fClient.on('transport:down', () => {
          //console.log('transport is down');
          req.app.io.emit('FayeDisconnect', 'transport:down detected');
        });
        allCDCSubscription.then(() => {
          //console.log('connected!');
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
    //console.log('Authentication valid, redirecting to main app');
    res.redirect('/');
  }
  
});

router.get('/revoke', (req, res) => {
  //console.log(org.oauth);
  org.revokeToken({token:org.oauth.access_token}, (oerr, ores) => {
    if(oerr) console.log(oerr);
    else{
      console.log(org);
    }
    fClient = undefined;
    res.redirect('/');
  });
});

module.exports = function(io){
  io.on('connection', function(socket){
    //console.log('connection made');
    socket.on('ADD PE SUB', (peName) => {
      console.log(`ask to add ${socket.id} to sub to ${peName}`);
      if(!PESubscriptionList.get(peName)){
        let newPESub = fClient.subscribe(`/event/${peName}`, (message) => {
          console.log(`Event detected on ${peName}`);
          console.log(message);
          io.emit('PEMessage', {eventType: `${peName}`, message:message});
        });
        newPESub.then(() => {
          //console.log('New PE Connected!');
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
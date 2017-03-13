var queryString = queryString = require('querystring');
import { Router, Request, Response, NextFunction } from 'express';
const apn = require("apn");
var sql = require('mssql');
const path = require('path');
const db = require('../db');

export class NotifyRouter {
    
    router: Router;

    constructor() {
        this.router = Router();
        this.init();
    }

    private init() {
      //发给全部用户
      this.router.get('/sendiosnotifications', (req, res) => { 
            res.end("sendiosnotifications")
      });

      //发给特定的用户
      //this.router.get('/sendiosnotificationtodevices', (req, res) => ) {

      //}
    }
}

function sendNotifications(devices, message) {
  let service = new apn.Provider({
    cert: "./production.pem",
    key: "./production.pem",
    passphrase: "jjhlzn",
    production: true
  });

  let note = new apn.Notification();
  note.alert = message;

  // The topic is usually the bundle identifier of your application.
  note.topic = "com.jufang.jfzs";
  //console.log(`Sending: ${note.compile()} to ${devices}`);

  service.send(note, devices).then( result => {
      console.log("sent:", result.sent.length);
      console.log("failed:", result.failed.length);
      console.log(result.failed);
  });

  // For one-shot notification tasks you may wish to shutdown the connection
  // after everything is sent, but only call shutdown if you need your
  // application to terminate.
  //console.log("shutdown service");
  service.shutdown();
}


var config = {
    user: 'jf',
    password: '#Jufang2016!@#',
    server: '114.55.111.52', // You can use 'localhost\\instance' to connect to named instance
    port: '9433',
    database: 'Jufang',
}
var sqlStr = "select distinct DeviceToken from BasCust where DevicePlatform = 'iphone' and DeviceToken is Not null and DeviceToken != '' and CustName = '巨方助手官方客服'";
function getAllDeviceTokens(callback) {
  sql.connect(config).then(() => {
    new sql.Request().query(sqlStr).then((recordset) => {
      var devices = recordset.map((item) => item.DeviceToken);
      //console.log(devices);
      callback(devices);
    }).catch((err) => {
      console.log(err);
    });
  }).catch((err) => {
    console.log(err);
  });

  sql.on('error', function(err) {
    console.log(err);
  });
}

function send(message) {
  getAllDeviceTokens((devices) => sendNotifications(devices, message));
}



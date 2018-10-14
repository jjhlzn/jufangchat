
import * as debug from 'debug';
const express = require('express');
const app = express();
var http = require('http').Server(app);
const io = require('socket.io')(http);
//console.log(io)
import { App } from './app';
const path = require('path');
const port = normalizePort(process.env.PORT || 3000);
const application = new App(io, app);

console.log(__dirname);

app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static(path.join(path.join(__dirname, '../'), 'client/')));
app.use(express.static(path.join(path.join(__dirname, '../'), 'client/public')));
app.use(express.static(path.join(path.join(__dirname, '../'), 'node_modules')));
app.use(express.static(path.join(path.join(__dirname, '../'), 'node_modules/font-awesome')));

http.listen(port);
http.on('error', onError);
http.on('listening', onListening);

function normalizePort(val: number|string): number|string|boolean {
  let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  let bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch(error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  let addr = http.address();
  let bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}


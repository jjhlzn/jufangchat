import { Injectable } from '@angular/core';

@Injectable()
export class ChatSocketFactory {
  socket: any;
  constructor() {
    this.socket = require('socket.io-client/socket.io.js')();
  }

  getSocket() {
    return this.socket;
  }
}
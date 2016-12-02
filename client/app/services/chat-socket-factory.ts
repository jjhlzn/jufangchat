import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class ChatSocketFactory {
  socket: any;
  constructor() {
    this.socket = io();
  }

  getSocket() {
    return this.socket;
  }
}
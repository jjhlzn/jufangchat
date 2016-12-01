import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Message } from '../models/message.model';
import { ChatSocketFactory } from '../services/chat-socket-factory';
import 'rxjs/add/operator/toPromise';
const emojify = require('emojify.js/dist/js/emojify.js');

@Injectable()
export class MessageService {

  errorHandler = error => console.error('MessageService error', error);
  private socket;

  constructor(private http: Http, chatSocketFactory: ChatSocketFactory) {
    this.socket = chatSocketFactory.getSocket();
  }

  emit(message: string){
    this.socket.emit("chat message", message);
  }

  on(event: string, callback) {
    this.socket.on(event, callback);
  }

  //获取当前最新的20条聊天记录
  getMessages(songid = 10) {
    return this.http.get(`get_latest_chats?songid=`+songid)
      .toPromise()
      .then(response => this.convert(response.json()))
      .catch(this.errorHandler);
  }

  //刷屏
  addRandomMessages(){
    
  }

  private convert(parsedResponse) {
    if (parsedResponse.status != 0) {
      return [];
    }
    return parsedResponse.comments
      .map(comment => JSON.parse(comment))
      .map(comment => { return {time:   comment.time,
                                speaker: comment.name,
                                content: comment.content}});
  }
}
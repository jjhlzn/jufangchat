import { merge } from 'rxjs/observable/merge';
import { Component, ViewEncapsulation } from "@angular/core";
import { Message } from "../models/message.model";
import { MessageService } from "../services/message.service";
import { User } from "../models/user.model";
const moment = require('moment/moment.js');

@Component({ 
  selector: "message-list",
  templateUrl: "../views/messages.html",
  styleUrls: [ '../css/messages.css'], 
  encapsulation: ViewEncapsulation.None,
})
export class MessagesComponent {
  messages: Message[];
  me: User;
  songId: string;
  inputMessage: string = "";

  constructor(private messageService: MessageService) {
    this.me = new User();
    this.me.mobile = '13706794299';
    this.songId = '7';
   
    messageService.getMessages()
      .then(messages => {
        this.messages = messages;
        this.scrollChatHistoryToBottom();
      });

    messageService.on("chat message", (msg) => {
      const json = JSON.parse(msg);

      const message = new Message();
      message.content = json.content;
      message.speaker = json.userId;
      message.time = json.time;

      this.messages.push(message);
      this.scrollChatHistoryToBottom(); 
    });
  }

  onSubmit() {
    this.messageService.emit(JSON.stringify(this.makeMessage()));
    
    const newMessage = new Message();
    newMessage.time = moment().format("HH:mm:ss");
    newMessage.content = this.inputMessage;
    newMessage.speaker = this.me.mobile;
    this.messages.push(newMessage);

    //清空输入框
    this.inputMessage = "";

    //将聊天记录拖到最底部
    this.scrollChatHistoryToBottom();
    return false;
  }

  private scrollChatHistoryToBottom() {
    window.setTimeout(() => {
      const chatHistoryDiv = document.getElementById("chat-history");
      chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }, 100);
  }

  private makeMessage() {
    const messageJson = {
      request: {
        comment: this.inputMessage,
        song: {id: this.songId}
      },
      userInfo: {
        userid: this.me.mobile,
        token: ''
      }
    }
    return messageJson;
  }

} 


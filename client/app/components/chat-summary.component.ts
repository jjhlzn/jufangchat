import { Component } from '@angular/core';
import { MessageService } from '../services/message.service';

@Component({
  selector: 'chat-summary',
  templateUrl: '../views/chat-summary.html',
  styleUrls: ['../css/chat-summary.css'] 
})
export class ChatSummaryComponent {
  
  constructor(private messageService: MessageService) {}

  addRandomMessages(){ 
    //this.messageService.addRandomMessage();
  }

}




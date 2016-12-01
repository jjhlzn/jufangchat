import { FormsModule } from '@angular/forms';
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from '@angular/http';
import { AppComponent } from "./components/app.component";
import { MessagesComponent } from "./components/messages.component";
import { PeopleListComponent } from './components/peoplelist.component';
import { ChatSummaryComponent } from './components/chat-summary.component';
import { MessageService } from './services/message.service';
import { UserService } from './services/user.service';
import { ChatSocketFactory } from './services/chat-socket-factory';
import { EmojiPipe } from './emoji.pipe';

@NgModule({
  imports: [BrowserModule, HttpModule, FormsModule],
  declarations: [AppComponent, MessagesComponent, PeopleListComponent, ChatSummaryComponent, EmojiPipe],
  bootstrap: [AppComponent],
  providers: [MessageService, UserService, ChatSocketFactory]
})
export class AppModule {}
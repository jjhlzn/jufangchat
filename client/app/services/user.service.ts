import * as https from 'https';
import { Injectable } from '@angular/core';
import { Device } from '../models/device.model';
import { Http } from '@angular/http';
import { User } from "../models/user.model";
import { ChatSocketFactory } from "../services/chat-socket-factory";
import 'rxjs/add/operator/toPromise';

@Injectable()
export class UserService {

  errorHandler = error => console.error('UserService error', error);
  socket: any;

  constructor(private http: Http, chatSocketFactory: ChatSocketFactory) {
    this.http = http;
    this.socket = chatSocketFactory.getSocket();
  }

  //获取在线聊天用户
  getUsers() {
    const promise = this.getMockUsers();
    console.log('getUsers: ', promise);
    return promise;
    /*
    return this.http.get(`get_live_users`)
      .toPromise()
      .then(response => this.convert(response.json()))
      .catch(this.errorHandler);*/
  }

  setUserChat(mobile: string, flag: boolean) {
    return this.http.get(`/setchat?userid=`+mobile+`&canchat=` + (flag ? '1' : '0'))
      .toPromise()
      .then(response => {
        const json = response.json();
        return true;
        /*
        if (json.status != 0) {
          return false;
        }
        return true;  */
      })
      .catch(this.errorHandler);
  }

  on(event: string, callback) {
    this.socket.on(event, callback);
  }

  handleNewUserResponse(response): User {
    if (response.status != 0) {
      return;
    }
    const newUser = this.parse(response);
    return newUser;
  }

  

  private parse(userAndClient): User {
    const user = userAndClient.user;
    const device = userAndClient.client;
    return {
      nickname: user.NickName,
      realname: 'realname',
      mobile: user.Mobile,
      isChatForbidden: user.CanChat,
      device: {
        mobilePlatform: '',
        osVersion: '',
        appVersion: ''
      }
    };
  }

  private convert(parsedResponse) {
    if (parsedResponse.status != 0) {
      return [];
    }
    return parsedResponse.users.map( userAndClient => this.parse(userAndClient));
  }

  private getMockUsers() {
    const users = new Array<User>();
    for (var i = 0; i < 20; i++) {
      users.push({
        nickname: '张三'+i,
        realname: '张三'+i,
        mobile: '123456789'+i,
        isChatForbidden: i % 2 == 0 ? false : true,
        device: {
          mobilePlatform: i % 2 == 0 ? 'ios' : 'android',
          osVersion: '',
          appVersion: ''
        }
      })
    }
    return Promise.resolve(users);
  }


}
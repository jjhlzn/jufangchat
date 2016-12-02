import { window } from 'rxjs/operator/window';
import { Component } from '@angular/core';
import { User } from '../models/user.model';
import { UserService } from "../services/user.service";

@Component({
  selector: 'people-list',
  templateUrl: '../views/peoplelist.html',
  styleUrls: ['../css/peoplelist.css']
})
export class PeopleListComponent {
  people: User[] = new Array<User>();
  searchedPeople: User[] = new Array<User>();
  searchInput;
  peopleList;
  
  constructor(private userService: UserService) {
    userService.getUsers()
      .then(people => {
        this.people = people;
        this.searchedPeople = this.people.slice();
      });
    userService.on('newuser', (msg) => this.handleNewUser(JSON.parse(msg)));
    userService.on('user disconnect', (msg) => this.handleDisconnectUser(JSON.parse(msg)));
  }

  search(searchInput){
    this.searchInput = searchInput;
    this.searchedPeople = this.people.filter(user => user.nickname.indexOf(searchInput) != -1);
  }

  forbideChat(mobile) {
    console.log("mobile: ", mobile);
    this.setUserChat(mobile, false);
  }

  allowChat(mobile) {
    console.log("mobile: ", mobile);
    this.setUserChat(mobile, true);
  }

  private setUserChat(mobile: string, flag: boolean) {
    this.userService.setUserChat(mobile, flag)
      .then(isSuccess => {
        if (isSuccess) {
          const user = this.people.find(user => user.mobile === mobile);
          if (user) {
            user.isChatForbidden = !flag;
          }
        }
      });
  }

  private handleNewUser(response) {
    const newUser = this.userService.handleNewUserResponse(response);
    if (newUser) {
      this.people.push(newUser);
      this.searchedPeople.push(newUser);
    }
  }

  private handleDisconnectUser(response) {
    console.log("disconnect user response: ", response);
    if(response.status != 0) {
      return;
    }

    const userId = response.user.id;
    var userIndex = this.people.findIndex(x => x.mobile === userId);
    if (userIndex > -1) {
      this.people.splice(userIndex, 1);
    }
    userIndex = this.searchedPeople.findIndex(x => x.mobile === userId);
    if (userIndex > -1) {
      this.searchedPeople.splice(userIndex, 1);
    }

  }
}




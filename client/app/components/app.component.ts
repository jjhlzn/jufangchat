import { appendFile } from 'fs';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: "jufang-app",
  templateUrl: "../views/app.html",
  styleUrls: ['../css/app.css', '../css/reset.min.css', '../../../node_modules/font-awesome/css/font-awesome.min.css',
              '../../../node_modules/emojify.js/dist/css/basic/emojify.css'] ,
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {}    
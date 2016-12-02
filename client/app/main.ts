import 'core-js';
import 'reflect-metadata';
import 'zone.js';
require('font-awesome/css/font-awesome.css');

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app.module";

 console.log("app.environment: ", app.environment);
if (app.environment === 'production') {
  enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule);
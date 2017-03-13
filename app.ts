import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { ChatRouter } from './routes/chat-router';
import { NotifyRouter } from './routes/notify-router';


// Creates and configures an ExpressJS web server.
export class App {

  // ref to Express instance
  public express: express.Application;
  io: any;

  //Run configuration methods on the Express instance.
  constructor(io : any, app: express.Application) {
    this.io = io;
    this.express = app;
    this.middleware();
    this.routes();
  }

  // Configure Express middleware.
  private middleware(): void {
    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  // Configure API endpoints.
  private routes(): void {
    /* This is just to get up and running, and to make sure what we've got is
     * working so far. This function will change when we start to add more
     * API endpoints */
    let router = express.Router();
    // placeholder route handler
    
    let chatRouter = new ChatRouter(this.io);
    //chatRouter.init();
    this.express.use('/', chatRouter.router);

    let notifyRouter = new NotifyRouter();
    this.express.use('/notify/', notifyRouter.router);
    
  }

}

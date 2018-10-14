"use strict";
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var chat_router_1 = require('./routes/chat-router');
var notify_router_1 = require('./routes/notify-router');
// Creates and configures an ExpressJS web server.
var App = (function () {
    //Run configuration methods on the Express instance.
    function App(io, app) {
        this.io = io;
        this.express = app;
        this.middleware();
        this.routes();
    }
    // Configure Express middleware.
    App.prototype.middleware = function () {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    };
    // Configure API endpoints.
    App.prototype.routes = function () {
        /* This is just to get up and running, and to make sure what we've got is
         * working so far. This function will change when we start to add more
         * API endpoints */
        var router = express.Router();
        // placeholder route handler
        var chatRouter = new chat_router_1.ChatRouter(this.io);
        //chatRouter.init();
        this.express.use('/', chatRouter.router);
        var notifyRouter = new notify_router_1.NotifyRouter();
        this.express.use('/notify/', notifyRouter.router);
    };
    return App;
}());
exports.App = App;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL2FwcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsSUFBWSxPQUFPLFdBQU0sU0FBUyxDQUFDLENBQUE7QUFDbkMsSUFBWSxNQUFNLFdBQU0sUUFBUSxDQUFDLENBQUE7QUFDakMsSUFBWSxVQUFVLFdBQU0sYUFBYSxDQUFDLENBQUE7QUFDMUMsNEJBQTJCLHNCQUFzQixDQUFDLENBQUE7QUFDbEQsOEJBQTZCLHdCQUF3QixDQUFDLENBQUE7QUFHdEQsa0RBQWtEO0FBQ2xEO0lBTUUsb0RBQW9EO0lBQ3BELGFBQVksRUFBUSxFQUFFLEdBQXdCO1FBQzVDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRUQsZ0NBQWdDO0lBQ3hCLHdCQUFVLEdBQWxCO1FBQ0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELDJCQUEyQjtJQUNuQixvQkFBTSxHQUFkO1FBQ0U7OzJCQUVtQjtRQUNuQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDOUIsNEJBQTRCO1FBRTVCLElBQUksVUFBVSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDekMsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekMsSUFBSSxZQUFZLEdBQUcsSUFBSSw0QkFBWSxFQUFFLENBQUM7UUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVwRCxDQUFDO0lBRUgsVUFBQztBQUFELENBdENBLEFBc0NDLElBQUE7QUF0Q1ksV0FBRyxNQXNDZixDQUFBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgKiBhcyBsb2dnZXIgZnJvbSAnbW9yZ2FuJztcbmltcG9ydCAqIGFzIGJvZHlQYXJzZXIgZnJvbSAnYm9keS1wYXJzZXInO1xuaW1wb3J0IHsgQ2hhdFJvdXRlciB9IGZyb20gJy4vcm91dGVzL2NoYXQtcm91dGVyJztcbmltcG9ydCB7IE5vdGlmeVJvdXRlciB9IGZyb20gJy4vcm91dGVzL25vdGlmeS1yb3V0ZXInO1xuXG5cbi8vIENyZWF0ZXMgYW5kIGNvbmZpZ3VyZXMgYW4gRXhwcmVzc0pTIHdlYiBzZXJ2ZXIuXG5leHBvcnQgY2xhc3MgQXBwIHtcblxuICAvLyByZWYgdG8gRXhwcmVzcyBpbnN0YW5jZVxuICBwdWJsaWMgZXhwcmVzczogZXhwcmVzcy5BcHBsaWNhdGlvbjtcbiAgaW86IGFueTtcblxuICAvL1J1biBjb25maWd1cmF0aW9uIG1ldGhvZHMgb24gdGhlIEV4cHJlc3MgaW5zdGFuY2UuXG4gIGNvbnN0cnVjdG9yKGlvIDogYW55LCBhcHA6IGV4cHJlc3MuQXBwbGljYXRpb24pIHtcbiAgICB0aGlzLmlvID0gaW87XG4gICAgdGhpcy5leHByZXNzID0gYXBwO1xuICAgIHRoaXMubWlkZGxld2FyZSgpO1xuICAgIHRoaXMucm91dGVzKCk7XG4gIH1cblxuICAvLyBDb25maWd1cmUgRXhwcmVzcyBtaWRkbGV3YXJlLlxuICBwcml2YXRlIG1pZGRsZXdhcmUoKTogdm9pZCB7XG4gICAgdGhpcy5leHByZXNzLnVzZShsb2dnZXIoJ2RldicpKTtcbiAgICB0aGlzLmV4cHJlc3MudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbiAgICB0aGlzLmV4cHJlc3MudXNlKGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7IGV4dGVuZGVkOiBmYWxzZSB9KSk7XG4gIH1cblxuICAvLyBDb25maWd1cmUgQVBJIGVuZHBvaW50cy5cbiAgcHJpdmF0ZSByb3V0ZXMoKTogdm9pZCB7XG4gICAgLyogVGhpcyBpcyBqdXN0IHRvIGdldCB1cCBhbmQgcnVubmluZywgYW5kIHRvIG1ha2Ugc3VyZSB3aGF0IHdlJ3ZlIGdvdCBpc1xuICAgICAqIHdvcmtpbmcgc28gZmFyLiBUaGlzIGZ1bmN0aW9uIHdpbGwgY2hhbmdlIHdoZW4gd2Ugc3RhcnQgdG8gYWRkIG1vcmVcbiAgICAgKiBBUEkgZW5kcG9pbnRzICovXG4gICAgbGV0IHJvdXRlciA9IGV4cHJlc3MuUm91dGVyKCk7XG4gICAgLy8gcGxhY2Vob2xkZXIgcm91dGUgaGFuZGxlclxuICAgIFxuICAgIGxldCBjaGF0Um91dGVyID0gbmV3IENoYXRSb3V0ZXIodGhpcy5pbyk7XG4gICAgLy9jaGF0Um91dGVyLmluaXQoKTtcbiAgICB0aGlzLmV4cHJlc3MudXNlKCcvJywgY2hhdFJvdXRlci5yb3V0ZXIpO1xuXG4gICAgbGV0IG5vdGlmeVJvdXRlciA9IG5ldyBOb3RpZnlSb3V0ZXIoKTtcbiAgICB0aGlzLmV4cHJlc3MudXNlKCcvbm90aWZ5LycsIG5vdGlmeVJvdXRlci5yb3V0ZXIpO1xuICAgIFxuICB9XG5cbn1cbiJdfQ==

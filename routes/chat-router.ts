var queryString = queryString = require('querystring');
import { Router, Request, Response, NextFunction } from 'express';
const path = require('path');
import { Chat } from './chat';
const db = require('../db');

export class ChatRouter {
    
    router: Router;
    io: any;
    chat: Chat;

    constructor(io) {
        this.io = io;
        this.chat = new Chat(io);
        this.router = Router();
        this.init();
    }

    init() {
        console.log("-------------chat router.int--------------");

        var self = this;

        this.router.get('/', (req, res) => { 
            console.log(__dirname);
            var pathurl = path.join(path.join(__dirname, '../'), 'client/index.html');
            console.log("path:", pathurl);
            res.sendFile(pathurl);
        });

        this.router.get('/refresh_chat', (req, res) => this.chat.refresh_chat(req, res));

        this.router.get('/get_stat', (req, res) => {
            var stream = queryString.parse(req.url.replace(/^.*\?/, ''))['stream'] || '';
            self.chat.get_stat(stream, req, res);
        });
 
        this.router.get('/get_latest_chats', function(req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_latest_chats(songId, req, res);
        });

        //获取全部在线人员信息
        this.router.get('/get_live_users', function(req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_live_users(songId, req, res);
        });

        //获取全部在线人员的手机号
        this.router.get('/get_all_live_user_mobiles', function(req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_all_live_user_mobiles(songId, req, res);
        });

        this.router.get('/setchat', function(req, res) {
            var userid = queryString.parse(req.url.replace(/^.*\?/, ''))['userid'];
            var canChat = queryString.parse(req.url.replace(/^.*\?/, ''))['canchat'];
            console.log('userid = ' + userid + ', canChat = ' + canChat);
            self.chat.setChat(userid, canChat, req, res);
        });

        this.router.get('/getliveusers', function(req, res) {
            var userid = queryString.parse(req.url.replace(/^.*\?/, ''))['userid'];
            var children = self.chat.getChildUsers(userid);
            res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
            res.end(JSON.stringify({status: 0, errorMessage: '', children: children}));
        });

        this.io.on('connection', function(socket){
            console.log("--------------socket connection success----------------");

            var sub = db.get_redis_client(), pub = db.get_redis_client();
            sub.on('error', function(err){
                console.log(err);
            });
            pub.on('error', function(err){
                console.log(err);
            });

            //TODO：使用redis保存用户数，并且将房间人数统计分开
            self.chat.increase_client();
            console.log("new user connected, current user count: "  + self.chat.get_client_count());
            
            socket.on('join room', function(msg, Ack){
                const json = JSON.parse(msg);
                const songId = json.songId;
                console.log("subscribe room: " + songId);
                sub.subscribe('main_chat_room_'+songId);
                //join room的msg带有是哪个房间的id
                console.log("join room message: ", msg);
                console.log("---------------------------");
                //JSON.parse(msg);
                self.chat.join(socket, msg, Ack);
            }); 

            socket.on('chat message', function(msg, Ack){
                console.log('got message: ', msg);
                self.chat.handle_message(socket, pub, this.io, msg, Ack);
            });

            socket.on('disconnect', function(){
                self.chat.handle_disconnect(socket);
                sub.unsubscribe();
                sub.quit();
                pub.quit();
                console.log("user left, current user count: " 
                            + self.chat.get_client_count());
            });

            sub.on("message", function (channel, message) {
                var json = JSON.parse(message);
                //console.log("message: " + message);
                //console.log("socket.userId = " + socket.userId );
                if (socket.userId != json.userId ) {
                    socket.emit('chat message', message);
                }
            });
            
            socket.emit('connect success', JSON.stringify({status: 0, message: ''}));
        });

    }
}

//module.exports = ChatRouter;

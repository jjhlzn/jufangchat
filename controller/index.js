var sql = require('mssql')
var redis = require("redis");
var queryString = queryString = require('querystring');

var Chat = require('./chat');
var chat;

var client = redis.createClient({detect_buffers: true, host: 'jf.yhkamani.com', port: 7777});

module.exports.set = function(app, io) {
    chat = new Chat(io);

    app.get('/', function(req, res){
        res.sendfile('index.html');
    });

    app.get('/refresh_chat', function(req, res) {
        chat.refresh_chat(req, res);
    });

    app.get('/get_stat', function(req, res) {
        var stream = queryString.parse(req.url.replace(/^.*\?/, ''))['stream'] || '';
        chat.get_stat(stream, req, res);
    });

    app.get('/get_latest_chats', function(req, res) {
        var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
        chat.get_latest_chats(songId, req, res);
    });

    app.get('/get_live_users', function(req, res) {
        var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
        chat.get_live_users(songId, req, res);
    });

    app.get('/setchat', function(req, res) {
        var userid = queryString.parse(req.url.replace(/^.*\?/, ''))['userid'];
        var canChat = queryString.parse(req.url.replace(/^.*\?/, ''))['canchat'];
        console.log('userid = ' + userid + ', canChat = ' + canChat);
        chat.setChat(userid, canChat, req, res);
    });

    io.on('connection', function(socket){
      
        //console.log('user connected, client count = ' + chat.get_client_count());
        //console.log('socket.id = ' + socket.id);
        chat.increase_client();
        console.log("new user connected, current user count: " + chat.get_client_count());
        
        
        socket.on('join room', function(msg, Ack){
            console.log('get join room request');
            chat.join(socket, msg, Ack);
        }); 

        socket.on('chat message', function(msg, Ack){
           chat.handle_message(io, msg, Ack);
        });

        socket.on('disconnect', function(){
            //console.log('user disconnected');
            //chat.decrease_client();
            chat.handle_disconnect(socket);
            console.log("user left, current user count: " + chat.get_client_count());
        });
        
        socket.emit('connect success', JSON.stringify({status: 0, message: ''}));
    });


}
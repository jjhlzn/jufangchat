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

    io.on('connection', function(socket){
        chat.increase_client();
        console.log('user connected, client count = ' + chat.get_client_count());

        socket.on('chat message', function(msg, Ack){
           chat.handle_message(io, msg, Ack);
        });

        socket.on('disconnect', function(){
            console.log('user disconnected');
            chat.decrease_client();
        });
    });


}
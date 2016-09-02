
var redis = require("redis");
var db = require('../db');
var dateFormat = require('dateformat');
var wowza = require('./wowza_client');

var Chat = function(io) {
    this.io = io;
    this.clientCount = 0;
}

var client = redis.createClient({
    detect_buffers: true, 
    host: 'jf.yhkamani.com', 
    port: 7777,
    retry_strategy: function (options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
});

Chat.prototype.next_id = function() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    var millisecond = now.getMilliseconds();
    return hour * 10000000 + minute * 100000 + second * 1000 + millisecond;
};

var comment_list = ['a', 'b', 'c', 'd', 'e', 'f'];
var user_info_list = ['jjh', 'lzn', 'zhang'];

Chat.prototype.get_random_response = function() {
    var comment = comment_list[Math.ceil(Math.random() * 100 % (comment_list.length - 1))];
    var userInfo = user_info_list[Math.ceil(Math.random() * 100 % (user_info_list.length - 1))];
    return  {
          'content': comment,
          'id': this.next_id(),
          'time': dateFormat(Date.now(), 'HH:MM:ss'),
          'userId': '13706794299',
          'name': userInfo,
          'isManager': false
      };
};

Chat.prototype.increase_client = function () {
    this.clientCount++;
}

Chat.prototype.decrease_client = function() {
    this.clientCount--;
}

Chat.prototype.get_client_count = function() {
    return this.clientCount;
}

//参数：用户信息、请求的json, Ack
//根据这些信息，把消息发给所有连接到的socket
var sendResponse = function(io, userInfo, json, Ack) {
    console.log(userInfo);
    var comment = json['request']['comment'];
    var songId = json['request']['song']['id'];
    var userid = json['userInfo']['userid'];
    //检查该用户是否被禁言
    if (!userInfo['CanChat']) {
        console.log('user ' + userid + " can't chat");
        return;
    }

    var resp = {
        'content': comment,
        'id': new Chat().next_id(),
        'time': dateFormat(Date.now(), 'HH:MM:ss'),
        'userId': userid,
        'name': userInfo['NickName'],
        'isManager': false
    };

    var jsonString = JSON.stringify(resp);
    //将请求保存到redis中
    client.rpush(['livecomments', jsonString], function(err, reply) {
    });
    //把聊天发送到所有的sockets
    io.emit('chat message', jsonString);
    if (Ack) {
        Ack(true)
    }
};


var chatFunction = function(io, json, Ack) {
    console.log("json = " + JSON.stringify(json));
    //从redis检查是否有用户信息，如果没有，需要从数据库中获取用户信息（获取用户信息，是为了获取nickname，以及看看是否被禁言）
    var userid = json['userInfo']['userid'];
    client.get("nodejs_userinfo_"+userid, function(err, reply){
        console.log("find userid = + " + userid + ' contents is ' + reply);
        if (reply != null) {
            console.log('find user in redis');
            sendResponse(io, JSON.parse(reply), json, Ack);
            return;
        }

        db.get_connection().then(function() {
            var request = db.get_request();
            request.stream = true;
            request.query("select * from BasCust where mobile = '" + userid + "'");
            request.on('row', function(row){
                //将昵称和是否能发言放到redis中
                var nickName = row['NickName'];
                var canChat = row['CanChat'];
                if (nickName == null || nickName == undefined){
                    nickName = '匿名';
                }
                row['NickName'] = nickName;
                if (canChat == null || canChat == undefined) {
                    canChat = true;
                }
                row['CanChat'] = canChat;
                client.set("nodejs_userinfo_"+userid, JSON.stringify({NickName: nickName, CanChat: canChat}));
                sendResponse(io, row, json, Ack);
            });
        }).catch(function(err) {
            console.log(err);
        }); 
    });
}

//该函数检查课程是否被禁言，如果没有被禁言，调用func进行处理
var checkSong = function(songId, func) {
    //验证改课是否已经关闭评论
    client.get("nodejs_song_" + songId, function(err, reply){
        console.log("songinfo  in redis = " + reply);
        if (reply != null) {
            console.log('find song in redis');
            //根据找到的纪录进行检查
            var songInfo = JSON.parse(reply);
            if (songInfo['CanComment']) {
                func();
            } else {
                console.log("song[id = " + songId + "] can't chat");
            }
            return;
        }

        //从数据库中进行查询
        db.get_connnection().then(function() {
            var request = db.get_request();
            request.stream = true;
            request.query("select * from BasSong where SongId = " + songId);
            request.on('row', function(row){
                var songInfo = {SongId: row['SongId'], CanComment: row['CanComment'] == 1}
                //将数据设置到redis内存中
                client.set("nodejs_song_" + songId, JSON.stringify(songInfo));

                console.log("songInfo.CanComment = " + songInfo.CanComment);
                if (songInfo.CanComment) {
                    func();
                }
            });
        });
    });
}

Chat.prototype.handle_message = function(io, msg, Ack) {
    console.log(msg);
    var json = JSON.parse(msg);
    var songId = json['request']['song']['id'];
    checkSong(songId, function() {
        console.log('invoke chatFunction()');
        console.log("json = " + JSON.stringify(json));
        chatFunction(io, json, Ack);
    });
};

Chat.prototype.refresh_chat = function(req, res) {
    for (var i = 0; i < 5; i ++) {
        var resp = this.get_random_response();
        var jsonString = JSON.stringify(resp);
        client.rpush(['livecomments', jsonString], function(err, reply) {
        });
        this.io.emit('chat message', jsonString);
    }
    res.end('refresh success');
};

Chat.prototype.get_stat = function(streamName, req, res) {
    var that = this;
    wowza.get_client_count(streamName, function(count){
        var result = { "status": 0, message: '', result: {chatCount: that.get_client_count() + '人', wowzaClientCount: count + '人'}};
        res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
        res.end(JSON.stringify(result));
    });
};

//获取最新的20条聊天记录
Chat.prototype.get_latest_chats = function(songId, req, res) {
    client.lrange('livecomments', -20, -1, function(err, replies) { 
        var result = {};
        res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
        if (err) {
            result = {status: -1, message: 'sever error'};
            res.end(JSON.stringify(result));
            return;
        }

        result = {status: 0, message: '', comments: replies};
        res.end(JSON.stringify(result));
    });
};

exports = module.exports = Chat;
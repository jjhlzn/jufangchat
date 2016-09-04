
var redis = require("redis");
var db = require('../db');
var dateFormat = require('dateformat');
var wowza = require('./wowza_client');
var sprintf = require("sprintf-js").sprintf;
var vsprintf = require("sprintf-js").vsprintf;

var Chat = function(io) {
    this.io = io;
    this.clientCount = 0;
    this.users = {};
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
          'name1': vsprintf("%10s", [userInfo]),
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


var find_user_by_mobile = function(mobile, callback) {
    var userid = mobile;
    client.get("nodejs_userinfo_"+userid, function(err, reply){
        
        if (reply != null) {
            console.log("user in redis: " + reply);
            callback(JSON.parse(reply));
            return;
        }

        var makeUserJson = function(row) {
            return {
                NickName: row['NickName'], 
                CanChat: row['CanChat'],
                Mobile: row['Mobile'],
                CustName: row['CustName']
            };
        };
        
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
                } else if (canChat == 0) {
                    canChat = true;
                } else if (canChat == 1) {
                    canChat = false;
                }
                row['CanChat'] = canChat;
                //console.log(row);
                var userJson = makeUserJson(row);
                client.set("nodejs_userinfo_"+userid, JSON.stringify(userJson));
                callback(userJson);
            });
        }).catch(function(err) {
            console.log(err);
        }); 
    });
};


Chat.prototype.join = function(socket, msg, Ack) {
    this.increase_client();
    var json = JSON.parse(msg);
    this.users[socket.id] = json['userInfo'];
    socket.emit('joinResult', JSON.stringify({status: 0, message: ''}));
    //告诉其他用户有新用户加入
    var that = this;
    find_user_by_mobile(json['userInfo']['userid'], function(userInfo){
        var result = {user: userInfo, client: json['client']}
        that.users[socket.id] = result;
        that.io.emit('newuser', JSON.stringify({status: 0, message: '', user: userInfo, client: json['client']}));
    });
}

Chat.prototype.handle_disconnect = function(socket) {
    this.decrease_client();
    var user = this.users[socket.id];
    console.log("handle_disconnect: user is " + JSON.stringify(user));
    if (user && user['user']) {
        var result = {status: 0, message: '', user: {id: user['user']['Mobile']}};
        this.io.emit('user disconnect', JSON.stringify(result));
        delete this.users[socket.id];
    }
}

Chat.prototype.handle_message = function(io, msg, Ack) {
    //参数：用户信息、请求的json, Ack
    //该函数检查课程是否被禁言，如果没有被禁言，调用func进行处理
    var checkSong = function(songId, callback) {
        //验证改课是否已经关闭评论
        client.get("nodejs_song_" + songId, function(err, reply){
            //console.log("songinfo  in redis = " + reply);
            if (reply != null) {
                //console.log('find song in redis');
                //根据找到的纪录进行检查
                var songInfo = JSON.parse(reply);
                if (songInfo['CanComment']) {
                    callback();
                } else {
                    console.log("song[id = " + songId + "] can't chat");
                }
                return;
            }

            //从数据库中进行查询
            db.get_connection().then(function() {
                var request = db.get_request();
                request.stream = true;
                request.query("select * from BasSong where SongId = " + songId);
                request.on('row', function(row){
                    var songInfo = {SongId: row['SongId'], CanComment: row['CanComment'] == 1}
                    //将数据设置到redis内存中
                    client.set("nodejs_song_" + songId, JSON.stringify(songInfo));

                    //console.log("songInfo.CanComment = " + songInfo.CanComment);
                    if (songInfo.CanComment) {
                        callback();
                    }
                });
            });
        });
    }

    //根据这些信息，把消息发给所有连接到的socket
    var sendResponse = function(io, userInfo, json, Ack) {
        //console.log(userInfo);
        var comment = json['request']['comment'];
        var songId = json['request']['song']['id'];
        var userid = json['userInfo']['userid'];
        //检查该用户是否被禁言
        if (!userInfo['CanChat']) {
            console.log('INFO: user ' + userid + " can't chat");
            return;
        }

        var resp = {
            'content': comment,
            'id': new Chat().next_id(),
            'time': dateFormat(Date.now(), 'HH:MM:ss'),
            'userId': userid,
            'name': userInfo['NickName'],
            'name1': userInfo['NickName1'],
            'isManager': false
        };

        var jsonString = JSON.stringify(resp);
        //将请求保存到redis中
        client.rpush(['livecomments', jsonString], function(err, reply) {
        });
        //把聊天发送到所有的sockets
        io.emit('chat message', jsonString);
        console.log(userid + "--" + userInfo['NickName'] + " said: " + comment);
        if (Ack) {
            Ack(true)
        }
    };

    //console.log(msg);
    var json = JSON.parse(msg);
    var songId = json['request']['song']['id'];
    checkSong(songId, function() {
        var userid = json['userInfo']['userid'];
        find_user_by_mobile(userid, function(userInfo){
            sendResponse(io, userInfo, json, Ack);
        });
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
    client.lrange('livecomments', -50, -1, function(err, replies) { 
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

//获取在线聊天的用户
Chat.prototype.get_live_users = function(songId, req, res) {
    res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
    var result = [];
    for (var id in this.users) {
        result.push(this.users[id]);
    }
    res.end(JSON.stringify({status: 0, message: '', users: result}));
}
exports = module.exports = Chat;
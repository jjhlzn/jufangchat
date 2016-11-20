
const redis = require("redis");
const db = require('../db');
const dateFormat = require('dateformat');
const wowza = require('./wowza_client');
const request = require('request');
const TreeModel = require('tree-model');
const tree = new TreeModel();


class Test {
    
}

var Chat = function(io) {
    this.io = io;
    this.clientCount = 0;
    this.users = {};
    this.userTreeRoot = tree.parse({Mobile: 'root', PCustCd: 'root'});
}

var client =  db.get_redis_client();

Chat.prototype.addUser = function(user, callback) {
    //已经在树中
    var myNode = this.userTreeRoot.first(function (node) {
        return node.model.Mobile === user['Mobile']; 
    });
    if (myNode) {
        if (user['isOnline']) {
            myNode.model['isOnline'] = true;
        }
        console.log(user['Mobile'] + " is Online = " + myNode.model['isOnline']);

        if (callback) {
            callback();
        }
        return;
    }
    
    //是顶级节点
    if (user.PCustCd === 'T00000') {
        console.log("add user " + user['Mobile'] + ' to tree');
        this.userTreeRoot.addChild(tree.parse(user));
        if (callback) {
            callback();
        }
        return;
    }


    var parentNode = this.userTreeRoot.first(function (node) {
        return node.model.Mobile === user['ParentMobile']; 
    });
    var that = this;

    if (!parentNode) { //没有父亲节点
        find_user_by_mobile(user['ParentMobile'], function(parentUser) {
            that.addUser(parentUser, function() {
                that.addUser(user);
                if (callback) {
                    callback();
                }
            });
        })
    } else {  //油父亲节点
        //console.log(parentNode);
        console.log("add user " + user['Mobile'] + ' to tree');
        parentNode.addChild(tree.parse(user));
        if (callback) {
            callback();
        }
    }
};

Chat.prototype.removeUser = function(user) {
    var result = this.userTreeRoot.first(function (node) {
        return node.model.Mobile === user["Mobile"]; 
    });
    console.log('removeuser ' + user['Mobile']);
    console.log(result);
    if (result) {
        //result.drop();
        console.log("set " + result.model['Mobile'] + " Online to false");
        result.model['isOnline'] = false;
    }
 };

 Chat.prototype.getChildUsers = function(mobile) {
    /*
     this.userTreeRoot.walk(function (node) {
        // Halt the traversal by returning false
        console.log(node.model['Mobile']);
    });*/
    
     var result = this.userTreeRoot.first(function (node) {
        return node.model.Mobile === mobile; 
    });
    console.log(result);
    if (!result) {
        return [];
    }
    var resultUsers = [];
    for (var i = 0; i < result.children.length; i++) {
        var son = result.children[i];
        console.log(son.model['Mobile'] + " is Online = " + son.model['isOnline']);
        if (son.model['isOnline']) {
            resultUsers.push(son.model);
        }
        for (var j = 0; j < son.children.length; j++) {
            var sunzi = son.children[j];
            console.log(sunzi.model['Mobile'] + " is Online = " + sunzi.model['isOnline']);
            if (sunzi.model['isOnline']) {
                resultUsers.push(sunzi.model);
            }
        }
    }
    console.log(resultUsers);
    return resultUsers;
 }

Chat.prototype.next_id = function() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    var millisecond = now.getMilliseconds();
    return hour * 10000000 + minute * 100000 + second * 1000 + millisecond;
};

var comment_list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '1', '1', '2', 'x'];
var user_info_list = ['jjh', 'lzn', 'zhang', '匿名', 'lool'];

Chat.prototype.get_random_response = function() {
    var comment = comment_list[Math.ceil(Math.random() * 100 % (comment_list.length - 1))];
    var userInfo = user_info_list[Math.ceil(Math.random() * 100 % (user_info_list.length - 1))];
    return  {
          'content': comment,
          'id': this.next_id(),
          'time': dateFormat(Date.now(), 'HH:MM:ss'),
          'userId': '15167910871',
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


var find_user_by_mobile = function(mobile, callback) {
    var userid = mobile;
    client.get("nodejs_userinfo_"+userid, function(err, reply){
        
        if (reply != null) {
            //console.log("user in redis: " + reply);
            callback(JSON.parse(reply));
            return;
        }

        var makeUserJson = function(row) {
            return {
                NickName: row['NickName'], 
                CanChat: row['CanChat'],
                Mobile: row['Mobile'],
                CustName: row['CustName'],
                ManagerFlg: row['ManagerFlg'],
                PCustCd: row['PCustCd'],
                ParentMobile: row['ParentMobile']
            };
        };
        
        db.get_connection().then(function() {
            var request = db.get_request();
            request.stream = true;
            request.query("select *, (select Mobile from BasCust b where a.PCustCd = b.CustCd) as ParentMobile  from BasCust a where mobile = '"
                          + userid + "'");
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
                
                var isManager = row['ManagerFlg'];
                if (isManager == null || isManager == undefined) {
                    isManager = false;
                }
                if (isManager == 1 || isManager == true) {
                    isManager = true;
                } else {
                    isManager = false;
                }
                row['ManagerFlg'] = isManager;
                console.log('ManagerFlg = ' + row['ManagerFlg']);
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
    var json = JSON.parse(msg);
    socket.emit('joinResult', JSON.stringify({status: 0, message: ''}));
    //告诉其他用户有新用户加入
    var that = this;
    find_user_by_mobile(json['userInfo']['userid'], function(userInfo){
        var result = {user: userInfo, client: json['client']}
        that.users[socket.id] = result;
        //add user to tree model
        userInfo['isOnline'] = true;
        that.addUser(userInfo);

        socket.userId = json['userInfo']['userid'];
        console.log(userInfo['Mobile'] + '-' + userInfo['NickName'] + ' join in room');
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
        //delete user from tree model
        this.removeUser(this.users[socket.id]['user']);
        delete this.users[socket.id];
    }
}

Chat.prototype.handle_message = function(socket, publisher, io, msg, Ack) {
    //参数：用户信息、请求的json, Ack
    //该函数检查课程是否被禁言，如果没有被禁言，调用func进行处理
    var start = new Date();
     
    var checkSong = function(songId, callback) {
        //验证改课是否已经关闭评论
        client.get("nodejs_song_" + songId, function(err, reply){
            if (reply != null) {
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
        var appversion = json['client'] && json['client']['appversion'];
        var platform =   json['client'] && json['client']['platform'];
        //检查该用户是否被禁言
        if (!userInfo['CanChat']) {
            console.log('INFO: user ' + userid + " can't chat");
            return;
        }
        //console.log(userInfo);
        //console.log('ManagerFlg = ' + userInfo['ManagerFlg']);
        var resp = {
            'content': comment,
            'id': new Chat().next_id(),
            'time': dateFormat(Date.now(), 'HH:MM:ss'),
            'userId': userid,
            'name': userInfo['NickName'],
            'isManager': userInfo['ManagerFlg'] || false
        };

        var jsonString = JSON.stringify(resp);
        

        publisher.publish('main_chat_room', jsonString);
        console.log(userid + "--" + userInfo['NickName'] + " said: " + comment);
        if (Ack) {
            Ack({status: 0, errorMessage: ''})
        }
        var end = new Date();
        console.log("chat message handle time: " + (end - start) / 1000 + 'ms');

        //将请求保存到redis中
        client.rpush(['livecomments', jsonString], function(err, reply) {});
        
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
        client.rpush(['livecomments', jsonString], function(err, reply) {});
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

Chat.prototype.get_live_users = function(songId, req, res) {
    res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
    var result = [];
    for (var id in this.users) {
        result.push(this.users[id]);
    }
    res.end(JSON.stringify({status: 0, message: '', users: result}));
}


//设置用户是否禁言
Chat.prototype.setChat = function(userid, canChat, req, res) {
    var that = this;
    request.post( {
         uri: 'http://jf.yhkamani.com/app/SetCanChat',
         method: 'POST',
         json: { 
            userInfo: {token: '', userid: userid},
            request: {CanChat: canChat}
         }},
        function (error, response, body) {
            res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
            if (!error && response.statusCode == 200) {
                for(var key in that.users) {
                    var userInfo = that.users[key]['user'];
                    console.log(userInfo);
                    if (userInfo && (userInfo['Mobile'] === userid)) {
                        
                        that.users[key]['user']['CanChat'] = canChat == 0 ? true : false;
                        console.log(userid+" can chat is " + that.users[key]['user']['CanChat'] );
                        break;
                    }
                }
                res.end(JSON.stringify(body));
            } else {
                res.end(JSON.stringify({status: -1, errorMessage: ""}));
            }
        }
    );
};
exports = module.exports = Chat;
import * as redis from 'redis';
import * as db from '../db/index';
import { find_user_by_mobile, LiveUserManager } from './user-dao';
const dateFormat = require('dateformat');
const wowza = require('./wowza_client');
const request = require('request');
const TreeModel = require('tree-model');
const tree = new TreeModel();

const comment_list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '1', '1', '2', 'x'];
const user_info_list = ['jjh', 'lzn', 'zhang', '匿名', 'lool'];

const client =  db.get_redis_client();

export class Chat {
    io: any;

    liveUserManager : LiveUserManager

    //clientCount: number;
    //users 应该存储到数据库redis中。
    //users: any;

    userTreeRoot: any;

    constructor(io) {
        this.io = io;
        //this.clientCount = 0;
        //this.users = {};    
        this.userTreeRoot = tree.parse({Mobile: 'root', PCustCd: 'root'});
        this.liveUserManager = new LiveUserManager()
    }

    addUser(user, callback) {
        //已经在树中
        var myNode = this.userTreeRoot.first(function (node) {
            return node.model.Mobile === user['Mobile']; 
        });
        if (myNode) {
            if (user['isOnline']) {
                myNode.model['isOnline'] = true;
            }
            console.log(user['Mobile'] + " is Online = " + myNode.model['isOnline']);
            myNode.model['songId'] = user.songId;
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
                    that.addUser(user, null);
                    if (callback) {
                        callback();
                    }
                });
            })
        } else {  //有父亲节点
            //console.log(parentNode);
            console.log("add user " + user['Mobile'] + ' to tree');
            parentNode.addChild(tree.parse(user));
            if (callback) {
                callback();
            }
        }
    }

    removeUser(user) {
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
     }


     getChildUsers = function(mobile) {
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

    next_id() {
        var now = new Date();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        var millisecond = now.getMilliseconds();
        return hour * 10000000 + minute * 100000 + second * 1000 + millisecond;
    }

    get_random_response() {
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
    }

    /*
    increase_client() {
        this.clientCount++;
    }

    decrease_client() {
        this.clientCount--;
    }

    get_client_count() {
        return this.clientCount;
    }*/

    
    //用户加入聊天房间
    join(socket, msg, Ack) {
        var json = JSON.parse(msg);
        const songId = json.songId;
        //var json = msg;
        socket.emit('joinResult', JSON.stringify({status: 0, message: ''}));
        //告诉其他用户有新用户加入
        var that = this;
        find_user_by_mobile(json['userInfo']['userid'], function(userInfo){
            var result = {user: userInfo, client: json['client']}
             //用户信息中放入songId，是用于判断该用户进入的是哪个房间。
            userInfo.songId = songId;  

            //TODO: 将在线用户放入到redis中
            //that.users[socket.id] = result;
            that.liveUserManager.userJoinRoom(socket, songId);

            //add user to  tree model
            userInfo['isOnline'] = true;

            that.addUser(userInfo, null);
    
            socket.userId = json['userInfo']['userid'];
            socket.songId = json.SongId;
            console.log(userInfo['Mobile'] + '-' + userInfo['NickName'] + ' join in room');
            that.io.emit('newuser', JSON.stringify({status: 0, message: '', user: userInfo, client: json['client']}));
        });
    }

    //处理连接断开
    handle_disconnect(socket) {
        var user = this.liveUserManager.getUserInfo(socket);
        console.log("handle_disconnect: user is " + JSON.stringify(user));
        if (user && user['user']) {
            var result = {status: 0, message: '', user: {    id: user['user']['Mobile']}};
            this.io.emit('user disconnect', JSON.stringify(result));
            //delete user from tree model
            this.removeUser(user['user']);

            //TODO: 将用户从redis中删除
            //delete this.users[socket.id];
            this.liveUserManager.userLeaveRoom(socket, socket.songId);
        }
    }

    //处理发送消息
    handle_message(socket, publisher, io, msg, Ack) {
        //参数：用户信息、请求的json, Ack
        //该函数检查课程是否被禁言，如果没有被禁言，调用func进行处理
        console.log("msg: ", msg);
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
                    const sql = "select * from BasSong where SongId = " + songId;
                    console.log("sql: ", sql);
                    request.query(sql);
                    request.on('row', function(row){
                        var songInfo = {SongId: row['SongId'], CanComment: row['CanComment'] == 1}
                        //将数据设置到redis内存中
                        client.set("nodejs_song_" + songId, JSON.stringify(songInfo));
                        if (songInfo.CanComment) {
                            callback();
                        }
                    });
                    console.log("after on row");
                });
            });
        }
    
        //根据这些信息，把消息发给所有连接到的socket （修改：发送给这个用户所在的房间）
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
                'id': new Chat(null).next_id(),
                'time': dateFormat(Date.now(), 'HH:MM:ss'),
                'userId': userid,
                'name': userInfo['NickName'],
                'isManager': userInfo['ManagerFlg'] || false
            };
    
            var jsonString = JSON.stringify(resp);
            
    
            publisher.publish('main_chat_room_'+songId, jsonString);

            if (Ack) {
                Ack({status: 0, errorMessage: ''})
            }
            var end = new Date();
            console.log("chat message handle time: " + (end.getMilliseconds() - start.getMilliseconds()) + 'ms');
    
            //将请求保存到redis中 （修改：将消息保存到用户所在房间的聊天列表中）
            client.rpush(['livecomments_'+songId, jsonString], function(err, reply) {});
            
        };
    
        //console.log(msg);
        var json = JSON.parse(msg);
        var songId = json['request']['song']['id'];
        var self = this;
        checkSong(songId, function() {
            var userid = json['userInfo']['userid'];
            find_user_by_mobile(userid, function(userInfo){
                sendResponse(io, userInfo, json, Ack);
            });
        });
    }
    
    //刷入随机聊天记录
    //TODO: 需要提供songId
    refresh_chat(req, res) {
        for (var i = 0; i < 5; i ++) {
            var resp = this.get_random_response();
            var jsonString = JSON.stringify(resp);
            //TODO：需要知道刷入哪个房间
            client.rpush(['livecomments', jsonString], function(err, reply) {});
            this.io.emit('chat message', jsonString);
        }
        res.end('refresh success');
    }

    get_stat(streamName, req, res) {
        var that = this;
        wowza.get_client_count(streamName, function(count){
            //TODO: 
            var result = { "status": 0, message: '', result: {chatCount: 0 + '人', wowzaClientCount: count + '人'}};
            res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
            res.end(JSON.stringify(result));
        });
    };

    //获取最新的40条聊天记录
    get_latest_chats(songId, req, res) {
        console.log("get_latest_chats: songid = " + songId)
        client.lrange('livecomments_'+songId, -50, -1, function(err, replies) { 
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
    }

    get_live_users(songId, req, res) {
        res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
        var result = this.liveUserManager.getUsers(songId);
        res.end(JSON.stringify({status: 0, message: '', users: result}));
    }

    get_all_live_user_mobiles(songId, req, res) {
        res.writeHead(200, {"Content-Type": "application/json, charset=utf-8"});
        var result = this.liveUserManager.getAllUserMobile();
        res.end(JSON.stringify({status: 0, message: '', users: Array.from(result)}));
    }

    //设置用户是否禁言
   //TODO：设置禁言
   setChat(userid, canChat, req, res) {
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
                    /*
                    for(var key in that.users) {
                        var userInfo = that.users[key]['user'];
                        console.log(userInfo);
                        if (userInfo && (userInfo['Mobile'] === userid)) {
                            
                            that.users[key]['user']['CanChat'] = canChat == 0 ? true : false;
                            console.log(userid+" can chat is " + that.users[key]['user']['CanChat'] );
                            break;
                        }
                    }*/
                    that.liveUserManager.setChat(null, userid, canChat);
                    res.end(JSON.stringify(body));
                } else {
                    res.end(JSON.stringify({status: -1, errorMessage: ""}));
                }
            }
        );
    };
}

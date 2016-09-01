var sql = require('mssql')
var redis = require("redis");
var dateFormat = require('dateformat');

var clientCount = 0;

//数据库配置信息
var config = {
    user: 'jf',
    password: '#Jufang2016!@#',
    server: 'jf.yhkamani.com', // You can use 'localhost\\instance' to connect to named instance
    port: 9433,
    database: 'Jufang',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 5000
    }
};

var client = redis.createClient({detect_buffers: true, host: 'jf.yhkamani.com', port: 7777});

var idGenerate = function() {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    var millisecond = now.getMilliseconds();
    return hour * 10000000 + minute * 100000 + second * 1000 + millisecond;
};

var comment_list = ['a', 'b', 'c', 'd', 'e', 'f'];
var user_info_list = ['jjh', 'lzn', 'zhang'];

var get_random_response = function() {
    var comment = comment_list[Math.ceil(Math.random() * 100 % (comment_list.length - 1))];
    var userInfo = user_info_list[Math.ceil(Math.random() * 100 % (user_info_list.length - 1))];
    return  {
          'content': comment,
          'id': idGenerate(),
          'time': dateFormat(Date.now(), 'HH:MM:ss'),
          'userId': '13706794299',
          'name': userInfo,
          'isManager': false
      };
};

module.exports.set = function(app, io) {
    // copy your routes listed in your app.js directly into here
    app.get('/', function(req, res){
        res.sendfile('index.html');
    });

    app.get('/refresh_chat', function(req, res) {
        for (var i = 0; i < 5; i ++) {
            var resp = get_random_response();
            var jsonString = JSON.stringify(resp);
            client.rpush(['livecomments', jsonString], function(err, reply) {
            });
            io.emit('chat message', jsonString);
        }
        res.end('refresh success');
    });


    io.on('connection', function(socket){
        clientCount++;
        console.log('user connected, client count = ' + clientCount);
        socket.on('chat message', function(msg, Ack){
            console.log(msg);
            //console.log('Ack = ' + Ack);
            var json = JSON.parse(msg);

            var comment = json['request']['comment'];
            var songId = json['request']['song']['id'];
            var userid = json['userInfo']['userid'];

            var sendResponse = function(row) {

            console.log(row);
            if (!row['CanChat']) {
                console.log('user ' + userid + " can't chat");
                return;
            }

            var resp = {
                'content': comment,
                'id': idGenerate(),
                'time': dateFormat(Date.now(), 'HH:mm:ss'),
                'userId': userid,
                'name': row['NickName'],
                'isManager': false
            };
            var jsonString = JSON.stringify(resp);
            client.rpush(['livecomments', jsonString], function(err, reply) {
                //console.log(reply); 
            });
            io.emit('chat message', jsonString);
            if (Ack) {
                Ack(true)
            }
            };

            var chatFunction = function() {
            client.get("nodejs_userinfo_"+userid, function(err, reply){
                console.log(reply);
                if (reply != null) {
                console.log('find user in redis');
                sendResponse(JSON.parse(reply));
                return;
                }

                sql.connect(config).then(function() {
                var request = new sql.Request();
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
                    sendResponse(row);
                });
                }).catch(function(err) {
                console.log(err);
                }); 
            });
            }


            //验证改课是否已经关闭评论
            client.get("nodejs_song_" + songId, function(err, reply){
            console.log("songinfo  in redis = " + reply);
            if (reply != null) {
                console.log('find song in redis');
                //根据找到的纪录进行检查
                var songInfo = JSON.parse(reply);
                if (songInfo['CanComment']) {
                chatFunction();
                } else {
                console.log("song[id = " + songId + "] can't chat");
                }
                return;
            }

            //从数据库中进行查询
            sql.connect(config).then(function() {
                var request = new sql.Request();
                request.stream = true;
                request.query("select * from BasSong where SongId = " + songId);
                request.on('row', function(row){
                var songInfo = {SongId: row['SongId'], CanComment: row['CanComment'] == 1}
                client.set("nodejs_song_" + songId, JSON.stringify(songInfo));
                console.log("songInfo.CanComment = " + songInfo.CanComment);
                if (songInfo.CanComment) {
                    chatFunction();
                }
                });
            });
            });
            //ack(true);
        });

        socket.on('disconnect', function(){
            console.log('user disconnected');
            clientCount--;
        });
    });


}
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sql = require('mssql')
var redis = require("redis");
var dateFormat = require('dateformat');

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

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('user connected')
  socket.on('chat message', function(msg){
    console.log(msg);
    var json = JSON.parse(msg);

    var comment = json['request']['comment'];
    var userid = json['userInfo']['userid'];

    var idGenerate = function() {
        var now = new Date();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        var millisecond = now.getMilliseconds();
        return hour * 10000000 + minute * 100000 + second * 1000 + millisecond;
    };

    var sendResponse = function(row) {
      console.log(row);
      var resp = {
          'content': comment,
          'id': idGenerate(),
          'time': dateFormat(Date.now(), 'HH:mm:ss'),
          'userId': userid,
          'name': row['Nickname'],
          'isManager': false
      };
      var jsonString = JSON.stringify(resp);
      client.rpush(['livecomments', jsonString], function(err, reply) {
          console.log(reply); //prints 1
      });
      io.emit('chat message', jsonString);
    };

    var userInfo = client.get("nodejs_userinfo_"+userid, function(err, reply){
        console.log(reply);
        if (reply != null) {
          console.log('find user in redis');
          sendResponse(JSON.parse(reply));
          return;
        }

        sql.connect(config).then(function() {
        console.log("select * from BasCust where mobile = '" + userid + "'");
        var request = new sql.Request();
        request.stream = true;
        request.query("select * from BasCust where mobile = '" + userid + "'");
        request.on('row', function(row){
          var nickName = row['Nickname'];
          if (nickName == null || nickName == undefined){
            nickName = '匿名';
          }
          row['Nickname'] = nickName;
          client.set("nodejs_userinfo_"+userid, JSON.stringify({Nickname: nickName}));
          sendResponse(row);
        });
      }).catch(function(err) {
        console.log(err);
      }); 
    });
    

    
    //ack(true);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


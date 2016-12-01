function testOne() {
  //var socket = require('socket.io-client')('http://chat.yhkamani.com', {forceNew: true});
  var socket = require('socket.io-client')('http://localhost:3000', {forceNew: true});
  socket.on('connect', function(){
    console.log("connect success");
    socket.emit("join room", JSON.stringify({
      userInfo: {
        Mobile: '13706794299',
        userid: '13706794299',
        NickName: 'jjhlzn'
      },
      client: {
        CanChat: true
      }
    }));

    socket.on('chat message', function(data){
      console.log(data);
    });

    var i = 0;
    setInterval(function() {
        //console.log('send message');
        socket.emit('chat message', JSON.stringify({
                'request': {
                    'comment': 'test' + i++,
                    'song': {'id': 7}
                },
                'userInfo': {
                    'userid': '15167910872',
                    'token': 'xyz'
                }
            }));
    }, 5000);
  });
}

for (var i = 0; i < 1; i++) {
  testOne();
}
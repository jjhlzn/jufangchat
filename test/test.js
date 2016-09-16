function testOne() {
  var socket = require('socket.io-client')('http://chat.yhkamani.com', {forceNew: true});
  socket.on('connect', function(){
    socket.on('chat message', function(data){
      console.log(data);
    });

    var i = 0;
    setInterval(function() {
        //console.log('send message');
        socket.emit('chat message', JSON.stringify({
                'request': {
                    'comment': 'test' + i++,
                    'song': {'id': 14}
                },
                'userInfo': {
                    'userid': '13706794299',
                    'token': 'xyz'
                }
            }));
    }, 5000);
  });
}

for (var i = 0; i < 40; i++) {
  testOne();
}
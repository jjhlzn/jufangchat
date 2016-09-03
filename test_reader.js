function testOne() {
  //var socket = require('socket.io-client')('http://chat.yhkamani.com', {forceNew: true});
  var socket = require('socket.io-client')('http://chat.yhkamani.com', {});
  socket.on('connect', function(){
    socket.on('chat message', function(data){
      console.log(data);
    });
  });
}

for (var i = 0; i < 150; i++) {
  testOne();
}
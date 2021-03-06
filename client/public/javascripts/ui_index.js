var getQueryString = function(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    console.log("r = ", r);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}
var mobile = getQueryString("mobile") || '15158913567';
var streamName = getQueryString("stream") || "feiyang";
var songId = getQueryString("songid") || 10; 
$("#selectCourse").val(songId);

var clientJson = {
            appversion: "1.0",
            model: "PC",
            osversion: "",
            platform: "browser",
            screensize: "" };
            
var userJson = {
    'userid': mobile,
    'token': 'xyz'          
};

var sendSetChatRequest = function(userid, canChat) {
    $.get(
        '/setchat?userid='+userid+'&canchat='+canChat,
        function(data) {
            console.log(data);
            var json = data;
            if (json['status'] == 0) {
                if (canChat === 0) {
                   $('#'+userid).css('color', 'black');
                } else {
                    $('#'+userid).css('color', 'red');
                }
                alert('操作成功');
            }
        }
    )
};

$("#selectCourse").change(function(){
    const host = "localhost";
    const port = 3000;
    window.location.href = `http://${host}:${port}?mobile=`+mobile+"&streamName="+streamName+"&songId="+$('#selectCourse').val();
});

$('#users').jstree({
        'core': {
            'data': [
                {
                    "id": "root_node",
                    "text": "在线人员",
                    "state": {
                        "opened": true
                    },
                    "children": []
                }],
            'check_callback': true
        },
        "plugins" : ["contextmenu", "search"],
        "contextmenu": {
            "items": function (node) {
                return {
                    "forbideChat": {
                        "label": "禁言",
                        "action": function (obj) {
                            console.log(node);
                            var mobile = node.id;
                            sendSetChatRequest(mobile, 1);
                        }
                    },
                    "canChat": {
                        "label": "不禁言",
                        "action": function (obj) {
                            sendSetChatRequest(node.id, 0);
                        }
                    },
                };
            }
        }
    });

$('#refresh_chat_button').click(function(){
    $.get('/refresh_chat', function(){
    });
});

$.get('/get_latest_chats?songid='+songId, function(data){
    if (data['status'] != 0) {
        return;
    }

    var comments = data['comments'];
    for(var i = 0; i < comments.length; i++) {
        addCommentToUI(JSON.parse(comments[i]));
    }
});

var sequence = 0;
function addCommentToUI(comment) {
    var content =  "<span style='width: 80px; display: block; float: left;'>" + comment['time']  + '</span>'
                 + "<span style='width: 250px; display: block; float: left'>" + comment['userId'] +'('  +comment['name'] + ')'  + '</span>'
                 + "<span style='width: 50px; display: block; float: left'>" + '--> &nbsp;&nbsp;&nbsp;'  + '</span>'
                 + "<span style='display: block; float: left'>" + emojify.replace(comment['content']) + '</span>';
    var child = $('<div/>',{style: 'clear: both; height: 20px;'})[0];

    child.innerHTML = content;
    $('#messages').prepend($('<li>').append($(child)));
}

var socket = io();
$('form').submit(function(){
    var comment = $('#m').val();
    var json = {
        'request': {
            'comment': comment,
            'song': {'id': songId}
        },
        'userInfo': userJson
    };
    if (comment == '') {
        alert('消息不能为空');
        return false;;
    }
    socket.emit('chat message', JSON.stringify(json));
    $('#m').val('');
    addCommentToUI({
            'content': comment,
            'id': 1,
            'time': '刚刚',
            'userId': mobile,
            'name': '我',
            'isManager': false});
    return false;
});

socket.on('chat message', function(msg){
    var json = JSON.parse(msg);
    addCommentToUI(json);
});

socket.on('connect success', function(msg) {
    var json = JSON.parse(msg);
    if (json.status == 0) {
        var request = {request: {id: songId}, userInfo: userJson, client:  clientJson};
        socket.emit('join room', JSON.stringify(request));
    } 
});

var addUserToUI = function(userInfo) {
    var newUser = userInfo['user'];
    var client = userInfo['client'];
    console.log('addUserToUI');
    console.log(newUser);
    var userid = newUser['Mobile'];
    var nickName = newUser['NickName'];
    var platform = client['platform'];
    if ($('#'+userid).length == 0) {
        var label = userid+'('+nickName+', ' + platform+')';
        $("#users").jstree(true).create_node($('#root_node'), {text: label, id: userid} , "last", false, true );
        if (!newUser['CanChat']) {
            console.log(userid + " can't chat" );
            $('#'+userid).css('color', 'red');
        }
    }
}

var changeUserColor = function(userInfo) {
    var newUser = userInfo['user'];
    var userid = newUser['Mobile'];
    console.log('changeUserColor');
    console.log(newUser);

    if (!newUser['CanChat']) {
        console.log(userid + " can't chat" );
        $('#'+userid).css('color', 'red');
    }
    
}

socket.on('newuser', function(msg) {
    var json = JSON.parse(msg);
    if (json.status == 0) {
        addUserToUI(json);
    } 
});

socket.on('user disconnect', function(msg){
    var json =  JSON.parse(msg);
    console.log('user disconnect: ' + JSON.stringify(json));
    if (json.status == 0) {
        $('#users').jstree().delete_node($('#' + json['user']['id']));
    } 
});
$('#users').on('ready.jstree', function (e, data) {
    $.get('/get_live_users?songid='+songId, function(data) {
        console.log(data);
        if (data['status'] != 0) {
            return;
        }
        console.log('get_live_uers');
        var users = data['users'];
        console.log(users)
        if (users) {
            for(var i = 0; i < users.length; i++) {
                addUserToUI(users[i]);
            }
            for(var i = 0; i < users.length; i++) {
                changeUserColor(users[i]);
            }
        }

        
    });




  var to = false;
  $('#searchInput').keyup(function () {
    if(to) { clearTimeout(to); }
    to = setTimeout(function () {
      var v = $('#searchInput').val();
      $('#users').jstree(true).search(v);
    }, 250);
  });

    
});

function  refresh_online_people() {
    $.get( "/get_stat?stream="+streamName, function( data ) {
        if (data['status'] == 0) {
            var message = "音频在线人数："+ data["result"]["wowzaClientCount"] +"， 聊天在线人数：" + data["result"]["chatCount"];
            $('#onlinePeople').html(message);
        }
    });
}


refresh_online_people();
setInterval(refresh_online_people, 10000); //每隔10s刷新一次

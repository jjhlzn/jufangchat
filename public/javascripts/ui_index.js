var songId = 14;

var getQueryString = function(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}
// 这样调用：
var mobile = getQueryString("mobile") || '13706794299';
//alert("mobile = " + mobile);

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
        }
    });

$('#refresh_chat_button').click(function(){
    $.get('/refresh_chat', function(){
        //alert('刷屏成功！');
    });
});

$.get('/get_latest_chats', function(data){
    //console.log(data);
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

    var content = comment['time'] + '  &nbsp;&nbsp; ' + comment['name']
                    + " &nbsp;&nbsp; --> &nbsp;&nbsp; " + emojify.replace(comment['content']);
    var child = $('<div/>')[0];

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
    return false;
});

socket.on('chat message', function(msg){
    var json = JSON.parse(msg);
    addCommentToUI(json);
});

socket.on('connect success', function(msg) {
    var json = JSON.parse(msg);
    if (json.status == 0) {
        var request = {songId: songId, userInfo: userJson, client:  clientJson};
        socket.emit('join room', JSON.stringify(request));
    } 
});

var addUserToUI = function(userInfo) {
    var newUser = userInfo['user'];
    //console.log('addUserToUI');
    console.log(newUser);
    var userid = newUser['Mobile'];
    var nickName = newUser['NickName'];
    if ($('#'+userid).length == 0) {
        $("#users").jstree().create_node(null, {text: userid+'('+nickName+')', id: userid} , "last", false, false );
    }
}


socket.on('newuser', function(msg) {
    var json = JSON.parse(msg);
    if (json.status == 0) {
        var newUser = json['user'];
        var userid = newUser['Mobile'];
        var nickName = newUser['NickName'];
        console.log('newuser = ' + msg);
        //<span class="label label-primary">Primary</span>
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

$.get('/get_live_users', function(data) {
    if (data['status'] != 0) {
        return;
    }
    console.log('get_live_users');
    console.log(data);
    var users = data['users'];
    for(var i = 0; i < users.length; i++) {
        addUserToUI(users[i]);
    }
});

function  refresh_online_people() {
    $.get( "/get_stat?stream=feiyang", function( data ) {
        //console.log(data);
        //var json = JSON.parse(data);
        if (data['status'] == 0) {
            //console.log("chatCount = " + data["result"]["chatCount"]);
            var message = "音频在线人数："+ data["result"]["wowzaClientCount"] +"， 聊天在线人数：" + data["result"]["chatCount"];
            $('#onlinePeople').html(message);
        }
        
        //$( ".onlinePeople" ).html( data );
    });
}



//$('#users').jstree('create_node', $('#base_directory'), 
//{ "text":'tst', "id":'test' }, 'last', false, false);	

refresh_online_people();
setInterval(refresh_online_people, 10000); //每隔10s刷新一次
"use strict";
var queryString = queryString = require('querystring');
var express_1 = require('express');
var path = require('path');
var chat_1 = require('./chat');
var db = require('../db');
var ChatRouter = (function () {
    function ChatRouter(io) {
        this.io = io;
        this.chat = new chat_1.Chat(io);
        this.router = express_1.Router();
        this.init();
    }
    ChatRouter.prototype.init = function () {
        var _this = this;
        console.log("-------------chat router.int--------------");
        var self = this;
        this.router.get('/', function (req, res) {
            console.log(__dirname);
            var pathurl = path.join(path.join(__dirname, '../'), 'client/index.html');
            console.log("path:", pathurl);
            res.sendFile(pathurl);
        });
        this.router.get('/refresh_chat', function (req, res) { return _this.chat.refresh_chat(req, res); });
        this.router.get('/get_stat', function (req, res) {
            var stream = queryString.parse(req.url.replace(/^.*\?/, ''))['stream'] || '';
            self.chat.get_stat(stream, req, res);
        });
        this.router.get('/get_latest_chats', function (req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_latest_chats(songId, req, res);
        });
        //获取全部在线人员信息
        this.router.get('/get_live_users', function (req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_live_users(songId, req, res);
        });
        //获取全部在线人员的手机号
        this.router.get('/get_all_live_user_mobiles', function (req, res) {
            var songId = queryString.parse(req.url.replace(/^.*\?/, ''))['songid'];
            self.chat.get_all_live_user_mobiles(songId, req, res);
        });
        this.router.get('/setchat', function (req, res) {
            var userid = queryString.parse(req.url.replace(/^.*\?/, ''))['userid'];
            var canChat = queryString.parse(req.url.replace(/^.*\?/, ''))['canchat'];
            console.log('userid = ' + userid + ', canChat = ' + canChat);
            self.chat.setChat(userid, canChat, req, res);
        });
        this.router.get('/getliveusers', function (req, res) {
            var userid = queryString.parse(req.url.replace(/^.*\?/, ''))['userid'];
            var children = self.chat.getChildUsers(userid);
            res.writeHead(200, { "Content-Type": "application/json, charset=utf-8" });
            res.end(JSON.stringify({ status: 0, errorMessage: '', children: children }));
        });
        this.io.on('connection', function (socket) {
            console.log("--------------socket connection success----------------");
            var sub = db.get_redis_client(), pub = db.get_redis_client();
            sub.on('error', function (err) {
                console.log(err);
            });
            pub.on('error', function (err) {
                console.log(err);
            });
            //TODO：使用redis保存用户数，并且将房间人数统计分开
            //console.log("new user connected, current user count: "  + self.chat.get_client_count());
            socket.on('join room', function (msg, Ack) {
                var json = JSON.parse(msg);
                console.log("json: ", json);
                var songId = json.request.id;
                console.log("subscribe room: " + songId);
                sub.subscribe('main_chat_room_' + songId);
                //join room的msg带有是哪个房间的id
                console.log("join room message: ", msg);
                console.log("---------------------------");
                //JSON.parse(msg);
                self.chat.join(socket, msg, Ack);
            });
            socket.on('chat message', function (msg, Ack) {
                console.log('got message: ', msg);
                self.chat.handle_message(socket, pub, this.io, msg, Ack);
            });
            socket.on('disconnect', function () {
                self.chat.handle_disconnect(socket);
                sub.unsubscribe();
                sub.quit();
                pub.quit();
                //console.log("user left, current user count: " + self.chat.get_client_count());
            });
            sub.on("message", function (channel, message) {
                var json = JSON.parse(message);
                console.log("message: " + message);
                console.log("socket.userId = " + socket.userId);
                console.log("json.userId = " + json.userId);
                if (socket.userId != json.userId) {
                    socket.emit('chat message', message);
                }
            });
            socket.emit('connect success', JSON.stringify({ status: 0, message: '' }));
        });
    };
    return ChatRouter;
}());
exports.ChatRouter = ChatRouter;
//module.exports = ChatRouter;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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Z0JBQ1gsZ0ZBQWdGO1lBQ3BGLENBQUMsQ0FBQyxDQUFDO1lBRUgsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsVUFBVSxPQUFPLEVBQUUsT0FBTztnQkFDeEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLENBQUM7Z0JBQ25DLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxDQUFDO2dCQUNqRCxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUUsQ0FBQztnQkFDN0MsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ3pDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUM3RSxDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFDTCxpQkFBQztBQUFELENBckhBLEFBcUhDLElBQUE7QUFySFksa0JBQVUsYUFxSHRCLENBQUE7QUFFRCw4QkFBOEIiLCJmaWxlIjoicm91dGVzL2NoYXQtcm91dGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIHF1ZXJ5U3RyaW5nID0gcXVlcnlTdHJpbmcgPSByZXF1aXJlKCdxdWVyeXN0cmluZycpO1xuaW1wb3J0IHsgUm91dGVyLCBSZXF1ZXN0LCBSZXNwb25zZSwgTmV4dEZ1bmN0aW9uIH0gZnJvbSAnZXhwcmVzcyc7XG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IHsgQ2hhdCB9IGZyb20gJy4vY2hhdCc7XG5jb25zdCBkYiA9IHJlcXVpcmUoJy4uL2RiJyk7XG5cbmV4cG9ydCBjbGFzcyBDaGF0Um91dGVyIHtcbiAgICBcbiAgICByb3V0ZXI6IFJvdXRlcjtcbiAgICBpbzogYW55O1xuICAgIGNoYXQ6IENoYXQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihpbykge1xuICAgICAgICB0aGlzLmlvID0gaW87XG4gICAgICAgIHRoaXMuY2hhdCA9IG5ldyBDaGF0KGlvKTtcbiAgICAgICAgdGhpcy5yb3V0ZXIgPSBSb3V0ZXIoKTtcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgaW5pdCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tY2hhdCByb3V0ZXIuaW50LS0tLS0tLS0tLS0tLS1cIik7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMucm91dGVyLmdldCgnLycsIChyZXEsIHJlcykgPT4geyBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKF9fZGlybmFtZSk7XG4gICAgICAgICAgICB2YXIgcGF0aHVybCA9IHBhdGguam9pbihwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vJyksICdjbGllbnQvaW5kZXguaHRtbCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwYXRoOlwiLCBwYXRodXJsKTtcbiAgICAgICAgICAgIHJlcy5zZW5kRmlsZShwYXRodXJsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZXIuZ2V0KCcvcmVmcmVzaF9jaGF0JywgKHJlcSwgcmVzKSA9PiB0aGlzLmNoYXQucmVmcmVzaF9jaGF0KHJlcSwgcmVzKSk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZXIuZ2V0KCcvZ2V0X3N0YXQnLCAocmVxLCByZXMpID0+IHtcbiAgICAgICAgICAgIHZhciBzdHJlYW0gPSBxdWVyeVN0cmluZy5wYXJzZShyZXEudXJsLnJlcGxhY2UoL14uKlxcPy8sICcnKSlbJ3N0cmVhbSddIHx8ICcnO1xuICAgICAgICAgICAgc2VsZi5jaGF0LmdldF9zdGF0KHN0cmVhbSwgcmVxLCByZXMpO1xuICAgICAgICB9KTtcbiBcbiAgICAgICAgdGhpcy5yb3V0ZXIuZ2V0KCcvZ2V0X2xhdGVzdF9jaGF0cycsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gICAgICAgICAgICB2YXIgc29uZ0lkID0gcXVlcnlTdHJpbmcucGFyc2UocmVxLnVybC5yZXBsYWNlKC9eLipcXD8vLCAnJykpWydzb25naWQnXTtcbiAgICAgICAgICAgIHNlbGYuY2hhdC5nZXRfbGF0ZXN0X2NoYXRzKHNvbmdJZCwgcmVxLCByZXMpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvL+iOt+WPluWFqOmDqOWcqOe6v+S6uuWRmOS/oeaBr1xuICAgICAgICB0aGlzLnJvdXRlci5nZXQoJy9nZXRfbGl2ZV91c2VycycsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gICAgICAgICAgICB2YXIgc29uZ0lkID0gcXVlcnlTdHJpbmcucGFyc2UocmVxLnVybC5yZXBsYWNlKC9eLipcXD8vLCAnJykpWydzb25naWQnXTtcbiAgICAgICAgICAgIHNlbGYuY2hhdC5nZXRfbGl2ZV91c2Vycyhzb25nSWQsIHJlcSwgcmVzKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy/ojrflj5blhajpg6jlnKjnur/kurrlkZjnmoTmiYvmnLrlj7dcbiAgICAgICAgdGhpcy5yb3V0ZXIuZ2V0KCcvZ2V0X2FsbF9saXZlX3VzZXJfbW9iaWxlcycsIGZ1bmN0aW9uKHJlcSwgcmVzKSB7XG4gICAgICAgICAgICB2YXIgc29uZ0lkID0gcXVlcnlTdHJpbmcucGFyc2UocmVxLnVybC5yZXBsYWNlKC9eLipcXD8vLCAnJykpWydzb25naWQnXTtcbiAgICAgICAgICAgIHNlbGYuY2hhdC5nZXRfYWxsX2xpdmVfdXNlcl9tb2JpbGVzKHNvbmdJZCwgcmVxLCByZXMpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJvdXRlci5nZXQoJy9zZXRjaGF0JywgZnVuY3Rpb24ocmVxLCByZXMpIHtcbiAgICAgICAgICAgIHZhciB1c2VyaWQgPSBxdWVyeVN0cmluZy5wYXJzZShyZXEudXJsLnJlcGxhY2UoL14uKlxcPy8sICcnKSlbJ3VzZXJpZCddO1xuICAgICAgICAgICAgdmFyIGNhbkNoYXQgPSBxdWVyeVN0cmluZy5wYXJzZShyZXEudXJsLnJlcGxhY2UoL14uKlxcPy8sICcnKSlbJ2NhbmNoYXQnXTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd1c2VyaWQgPSAnICsgdXNlcmlkICsgJywgY2FuQ2hhdCA9ICcgKyBjYW5DaGF0KTtcbiAgICAgICAgICAgIHNlbGYuY2hhdC5zZXRDaGF0KHVzZXJpZCwgY2FuQ2hhdCwgcmVxLCByZXMpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJvdXRlci5nZXQoJy9nZXRsaXZldXNlcnMnLCBmdW5jdGlvbihyZXEsIHJlcykge1xuICAgICAgICAgICAgdmFyIHVzZXJpZCA9IHF1ZXJ5U3RyaW5nLnBhcnNlKHJlcS51cmwucmVwbGFjZSgvXi4qXFw/LywgJycpKVsndXNlcmlkJ107XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBzZWxmLmNoYXQuZ2V0Q2hpbGRVc2Vycyh1c2VyaWQpO1xuICAgICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb24sIGNoYXJzZXQ9dXRmLThcIn0pO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7c3RhdHVzOiAwLCBlcnJvck1lc3NhZ2U6ICcnLCBjaGlsZHJlbjogY2hpbGRyZW59KSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaW8ub24oJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbihzb2NrZXQpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLXNvY2tldCBjb25uZWN0aW9uIHN1Y2Nlc3MtLS0tLS0tLS0tLS0tLS0tXCIpO1xuXG4gICAgICAgICAgICB2YXIgc3ViID0gZGIuZ2V0X3JlZGlzX2NsaWVudCgpLCBwdWIgPSBkYi5nZXRfcmVkaXNfY2xpZW50KCk7XG4gICAgICAgICAgICBzdWIub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBwdWIub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vVE9ET++8muS9v+eUqHJlZGlz5L+d5a2Y55So5oi35pWw77yM5bm25LiU5bCG5oi/6Ze05Lq65pWw57uf6K6h5YiG5byAXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKFwibmV3IHVzZXIgY29ubmVjdGVkLCBjdXJyZW50IHVzZXIgY291bnQ6IFwiICArIHNlbGYuY2hhdC5nZXRfY2xpZW50X2NvdW50KCkpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzb2NrZXQub24oJ2pvaW4gcm9vbScsIGZ1bmN0aW9uKG1zZywgQWNrKXtcbiAgICAgICAgICAgICAgICBjb25zdCBqc29uID0gSlNPTi5wYXJzZShtc2cpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwianNvbjogXCIsIGpzb24pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNvbmdJZCA9IGpzb24ucmVxdWVzdC5pZDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInN1YnNjcmliZSByb29tOiBcIiArIHNvbmdJZCk7XG4gICAgICAgICAgICAgICAgc3ViLnN1YnNjcmliZSgnbWFpbl9jaGF0X3Jvb21fJytzb25nSWQpO1xuICAgICAgICAgICAgICAgIC8vam9pbiByb29t55qEbXNn5bim5pyJ5piv5ZOq5Liq5oi/6Ze055qEaWRcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImpvaW4gcm9vbSBtZXNzYWdlOiBcIiwgbXNnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVwiKTtcbiAgICAgICAgICAgICAgICAvL0pTT04ucGFyc2UobXNnKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYXQuam9pbihzb2NrZXQsIG1zZywgQWNrKTtcbiAgICAgICAgICAgIH0pOyBcblxuICAgICAgICAgICAgc29ja2V0Lm9uKCdjaGF0IG1lc3NhZ2UnLCBmdW5jdGlvbihtc2csIEFjayl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2dvdCBtZXNzYWdlOiAnLCBtc2cpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhdC5oYW5kbGVfbWVzc2FnZShzb2NrZXQsIHB1YiwgdGhpcy5pbywgbXNnLCBBY2spO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHNvY2tldC5vbignZGlzY29ubmVjdCcsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGF0LmhhbmRsZV9kaXNjb25uZWN0KHNvY2tldCk7XG4gICAgICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgc3ViLnF1aXQoKTtcbiAgICAgICAgICAgICAgICBwdWIucXVpdCgpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coXCJ1c2VyIGxlZnQsIGN1cnJlbnQgdXNlciBjb3VudDogXCIgKyBzZWxmLmNoYXQuZ2V0X2NsaWVudF9jb3VudCgpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBzdWIub24oXCJtZXNzYWdlXCIsIGZ1bmN0aW9uIChjaGFubmVsLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwibWVzc2FnZTogXCIgKyBtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInNvY2tldC51c2VySWQgPSBcIiArIHNvY2tldC51c2VySWQgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImpzb24udXNlcklkID0gXCIgKyBqc29uLnVzZXJJZCApO1xuICAgICAgICAgICAgICAgIGlmIChzb2NrZXQudXNlcklkICE9IGpzb24udXNlcklkICkge1xuICAgICAgICAgICAgICAgICAgICBzb2NrZXQuZW1pdCgnY2hhdCBtZXNzYWdlJywgbWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNvY2tldC5lbWl0KCdjb25uZWN0IHN1Y2Nlc3MnLCBKU09OLnN0cmluZ2lmeSh7c3RhdHVzOiAwLCBtZXNzYWdlOiAnJ30pKTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG59XG5cbi8vbW9kdWxlLmV4cG9ydHMgPSBDaGF0Um91dGVyO1xuIl19
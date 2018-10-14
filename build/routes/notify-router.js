"use strict";
var queryString = queryString = require('querystring');
var express_1 = require('express');
var apn = require("apn");
var sql = require('mssql');
var path = require('path');
var db = require('../db');
var NotifyRouter = (function () {
    function NotifyRouter() {
        this.router = express_1.Router();
        this.init();
    }
    NotifyRouter.prototype.init = function () {
        //发给全部用户
        this.router.get('/sendiosnotifications', function (req, res) {
            res.end("sendiosnotifications");
        });
        //发给特定的用户
        //this.router.get('/sendiosnotificationtodevices', (req, res) => ) {
        //}
    };
    return NotifyRouter;
}());
exports.NotifyRouter = NotifyRouter;
function sendNotifications(devices, message) {
    var service = new apn.Provider({
        cert: "./production.pem",
        key: "./production.pem",
        passphrase: "jjhlzn",
        production: true
    });
    var note = new apn.Notification();
    note.alert = message;
    // The topic is usually the bundle identifier of your application.
    note.topic = "com.jufang.jfzs";
    //console.log(`Sending: ${note.compile()} to ${devices}`);
    service.send(note, devices).then(function (result) {
        console.log("sent:", result.sent.length);
        console.log("failed:", result.failed.length);
        console.log(result.failed);
    });
    // For one-shot notification tasks you may wish to shutdown the connection
    // after everything is sent, but only call shutdown if you need your
    // application to terminate.
    //console.log("shutdown service");
    service.shutdown();
}
var config = {
    user: 'jf',
    password: '#Jufang2016!@#',
    server: '114.55.111.52',
    port: '9433',
    database: 'Jufang',
};
var sqlStr = "select distinct DeviceToken from BasCust where DevicePlatform = 'iphone' and DeviceToken is Not null and DeviceToken != '' and CustName = '巨方助手官方客服'";
function getAllDeviceTokens(callback) {
    sql.connect(config).then(function () {
        new sql.Request().query(sqlStr).then(function (recordset) {
            var devices = recordset.map(function (item) { return item.DeviceToken; });
            //console.log(devices);
            callback(devices);
        }).catch(function (err) {
            console.log(err);
        });
    }).catch(function (err) {
        console.log(err);
    });
    sql.on('error', function (err) {
        console.log(err);
    });
}
function send(message) {
    getAllDeviceTokens(function (devices) { return sendNotifications(devices, message); });
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3JvdXRlcy9ub3RpZnktcm91dGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFJLFdBQVcsR0FBRyxXQUFXLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3ZELHdCQUF3RCxTQUFTLENBQUMsQ0FBQTtBQUNsRSxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0IsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzNCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixJQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFNUI7SUFJSTtRQUNJLElBQUksQ0FBQyxNQUFNLEdBQUcsZ0JBQU0sRUFBRSxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRU8sMkJBQUksR0FBWjtRQUNFLFFBQVE7UUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsRUFBRSxVQUFDLEdBQUcsRUFBRSxHQUFHO1lBQzVDLEdBQUcsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtRQUNyQyxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVM7UUFDVCxvRUFBb0U7UUFFcEUsR0FBRztJQUNMLENBQUM7SUFDTCxtQkFBQztBQUFELENBcEJBLEFBb0JDLElBQUE7QUFwQlksb0JBQVksZUFvQnhCLENBQUE7QUFFRCwyQkFBMkIsT0FBTyxFQUFFLE9BQU87SUFDekMsSUFBSSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzdCLElBQUksRUFBRSxrQkFBa0I7UUFDeEIsR0FBRyxFQUFFLGtCQUFrQjtRQUN2QixVQUFVLEVBQUUsUUFBUTtRQUNwQixVQUFVLEVBQUUsSUFBSTtLQUNqQixDQUFDLENBQUM7SUFFSCxJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNsQyxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztJQUVyQixrRUFBa0U7SUFDbEUsSUFBSSxDQUFDLEtBQUssR0FBRyxpQkFBaUIsQ0FBQztJQUMvQiwwREFBMEQ7SUFFMUQsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFFLFVBQUEsTUFBTTtRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQyxDQUFDLENBQUM7SUFFSCwwRUFBMEU7SUFDMUUsb0VBQW9FO0lBQ3BFLDRCQUE0QjtJQUM1QixrQ0FBa0M7SUFDbEMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3JCLENBQUM7QUFHRCxJQUFJLE1BQU0sR0FBRztJQUNULElBQUksRUFBRSxJQUFJO0lBQ1YsUUFBUSxFQUFFLGdCQUFnQjtJQUMxQixNQUFNLEVBQUUsZUFBZTtJQUN2QixJQUFJLEVBQUUsTUFBTTtJQUNaLFFBQVEsRUFBRSxRQUFRO0NBQ3JCLENBQUE7QUFDRCxJQUFJLE1BQU0sR0FBRyxzSkFBc0osQ0FBQztBQUNwSyw0QkFBNEIsUUFBUTtJQUNsQyxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQztRQUN2QixJQUFJLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsU0FBUztZQUM3QyxJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUMsSUFBSSxJQUFLLE9BQUEsSUFBSSxDQUFDLFdBQVcsRUFBaEIsQ0FBZ0IsQ0FBQyxDQUFDO1lBQ3hELHVCQUF1QjtZQUN2QixRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRztZQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFHO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FBQztJQUVILEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVMsR0FBRztRQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELGNBQWMsT0FBTztJQUNuQixrQkFBa0IsQ0FBQyxVQUFDLE9BQU8sSUFBSyxPQUFBLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBbkMsQ0FBbUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUMiLCJmaWxlIjoicm91dGVzL25vdGlmeS1yb3V0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgcXVlcnlTdHJpbmcgPSBxdWVyeVN0cmluZyA9IHJlcXVpcmUoJ3F1ZXJ5c3RyaW5nJyk7XG5pbXBvcnQgeyBSb3V0ZXIsIFJlcXVlc3QsIFJlc3BvbnNlLCBOZXh0RnVuY3Rpb24gfSBmcm9tICdleHByZXNzJztcbmNvbnN0IGFwbiA9IHJlcXVpcmUoXCJhcG5cIik7XG52YXIgc3FsID0gcmVxdWlyZSgnbXNzcWwnKTtcbmNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCBkYiA9IHJlcXVpcmUoJy4uL2RiJyk7XG5cbmV4cG9ydCBjbGFzcyBOb3RpZnlSb3V0ZXIge1xuICAgIFxuICAgIHJvdXRlcjogUm91dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucm91dGVyID0gUm91dGVyKCk7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdCgpIHtcbiAgICAgIC8v5Y+R57uZ5YWo6YOo55So5oi3XG4gICAgICB0aGlzLnJvdXRlci5nZXQoJy9zZW5kaW9zbm90aWZpY2F0aW9ucycsIChyZXEsIHJlcykgPT4geyBcbiAgICAgICAgICAgIHJlcy5lbmQoXCJzZW5kaW9zbm90aWZpY2F0aW9uc1wiKVxuICAgICAgfSk7XG5cbiAgICAgIC8v5Y+R57uZ54m55a6a55qE55So5oi3XG4gICAgICAvL3RoaXMucm91dGVyLmdldCgnL3NlbmRpb3Nub3RpZmljYXRpb250b2RldmljZXMnLCAocmVxLCByZXMpID0+ICkge1xuXG4gICAgICAvL31cbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNlbmROb3RpZmljYXRpb25zKGRldmljZXMsIG1lc3NhZ2UpIHtcbiAgbGV0IHNlcnZpY2UgPSBuZXcgYXBuLlByb3ZpZGVyKHtcbiAgICBjZXJ0OiBcIi4vcHJvZHVjdGlvbi5wZW1cIixcbiAgICBrZXk6IFwiLi9wcm9kdWN0aW9uLnBlbVwiLFxuICAgIHBhc3NwaHJhc2U6IFwiampobHpuXCIsXG4gICAgcHJvZHVjdGlvbjogdHJ1ZVxuICB9KTtcblxuICBsZXQgbm90ZSA9IG5ldyBhcG4uTm90aWZpY2F0aW9uKCk7XG4gIG5vdGUuYWxlcnQgPSBtZXNzYWdlO1xuXG4gIC8vIFRoZSB0b3BpYyBpcyB1c3VhbGx5IHRoZSBidW5kbGUgaWRlbnRpZmllciBvZiB5b3VyIGFwcGxpY2F0aW9uLlxuICBub3RlLnRvcGljID0gXCJjb20uanVmYW5nLmpmenNcIjtcbiAgLy9jb25zb2xlLmxvZyhgU2VuZGluZzogJHtub3RlLmNvbXBpbGUoKX0gdG8gJHtkZXZpY2VzfWApO1xuXG4gIHNlcnZpY2Uuc2VuZChub3RlLCBkZXZpY2VzKS50aGVuKCByZXN1bHQgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJzZW50OlwiLCByZXN1bHQuc2VudC5sZW5ndGgpO1xuICAgICAgY29uc29sZS5sb2coXCJmYWlsZWQ6XCIsIHJlc3VsdC5mYWlsZWQubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUubG9nKHJlc3VsdC5mYWlsZWQpO1xuICB9KTtcblxuICAvLyBGb3Igb25lLXNob3Qgbm90aWZpY2F0aW9uIHRhc2tzIHlvdSBtYXkgd2lzaCB0byBzaHV0ZG93biB0aGUgY29ubmVjdGlvblxuICAvLyBhZnRlciBldmVyeXRoaW5nIGlzIHNlbnQsIGJ1dCBvbmx5IGNhbGwgc2h1dGRvd24gaWYgeW91IG5lZWQgeW91clxuICAvLyBhcHBsaWNhdGlvbiB0byB0ZXJtaW5hdGUuXG4gIC8vY29uc29sZS5sb2coXCJzaHV0ZG93biBzZXJ2aWNlXCIpO1xuICBzZXJ2aWNlLnNodXRkb3duKCk7XG59XG5cblxudmFyIGNvbmZpZyA9IHtcbiAgICB1c2VyOiAnamYnLFxuICAgIHBhc3N3b3JkOiAnI0p1ZmFuZzIwMTYhQCMnLFxuICAgIHNlcnZlcjogJzExNC41NS4xMTEuNTInLCAvLyBZb3UgY2FuIHVzZSAnbG9jYWxob3N0XFxcXGluc3RhbmNlJyB0byBjb25uZWN0IHRvIG5hbWVkIGluc3RhbmNlXG4gICAgcG9ydDogJzk0MzMnLFxuICAgIGRhdGFiYXNlOiAnSnVmYW5nJyxcbn1cbnZhciBzcWxTdHIgPSBcInNlbGVjdCBkaXN0aW5jdCBEZXZpY2VUb2tlbiBmcm9tIEJhc0N1c3Qgd2hlcmUgRGV2aWNlUGxhdGZvcm0gPSAnaXBob25lJyBhbmQgRGV2aWNlVG9rZW4gaXMgTm90IG51bGwgYW5kIERldmljZVRva2VuICE9ICcnIGFuZCBDdXN0TmFtZSA9ICflt6jmlrnliqnmiYvlrpjmlrnlrqLmnI0nXCI7XG5mdW5jdGlvbiBnZXRBbGxEZXZpY2VUb2tlbnMoY2FsbGJhY2spIHtcbiAgc3FsLmNvbm5lY3QoY29uZmlnKS50aGVuKCgpID0+IHtcbiAgICBuZXcgc3FsLlJlcXVlc3QoKS5xdWVyeShzcWxTdHIpLnRoZW4oKHJlY29yZHNldCkgPT4ge1xuICAgICAgdmFyIGRldmljZXMgPSByZWNvcmRzZXQubWFwKChpdGVtKSA9PiBpdGVtLkRldmljZVRva2VuKTtcbiAgICAgIC8vY29uc29sZS5sb2coZGV2aWNlcyk7XG4gICAgICBjYWxsYmFjayhkZXZpY2VzKTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIH0pO1xuICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfSk7XG5cbiAgc3FsLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kKG1lc3NhZ2UpIHtcbiAgZ2V0QWxsRGV2aWNlVG9rZW5zKChkZXZpY2VzKSA9PiBzZW5kTm90aWZpY2F0aW9ucyhkZXZpY2VzLCBtZXNzYWdlKSk7XG59XG5cblxuIl19

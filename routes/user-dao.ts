import * as db from '../db/index';
const client =  db.get_redis_client();

export function find_user_by_mobile(mobile, callback) {
    var userid = mobile;
    client.get("nodejs_userinfo_"+userid, function(err, reply){
        
        if (reply != null) {
            //console.log("user in redis: " + reply);
            callback(JSON.parse(reply));
            return;
        }

        var makeUserJson = function(row) {
            return {
                NickName: row['NickName'], 
                CanChat: row['CanChat'],
                Mobile: row['Mobile'],
                CustName: row['CustName'],
                ManagerFlg: row['ManagerFlg'],
                PCustCd: row['PCustCd'],
                ParentMobile: row['ParentMobile']
            };
        };
        
        db.get_connection().then(function() {
            var request = db.get_request();
            request.stream = true;
            request.query("select *, (select Mobile from BasCust b where a.PCustCd = b.CustCd) as ParentMobile  from BasCust a where mobile = '"
                          + userid + "'");
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
                } else if (canChat == 0) {
                    canChat = true;
                } else if (canChat == 1) {
                    canChat = false;
                }
                row['CanChat'] = canChat;
                
                var isManager = row['ManagerFlg'];
                if (isManager == null || isManager == undefined) {
                    isManager = false;
                }
                if (isManager == 1 || isManager == true) {
                    isManager = true;
                } else {
                    isManager = false;
                }
                row['ManagerFlg'] = isManager;
                console.log('ManagerFlg = ' + row['ManagerFlg']);
                //console.log(row);
                var userJson = makeUserJson(row);
                client.set("nodejs_userinfo_"+userid, JSON.stringify(userJson));
                callback(userJson);
            });
        }).catch(function(err) {
            console.log(err);
        }); 
    });
}

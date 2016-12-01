

var request = require('request');

function sendRequest() {

    var requestData = {
    "userInfo": {
                    token: "fsdfdsfsdfdsfsdfsdfdsf",
                    userid: "13706794299"},

    "client": {
                    appversion: "1.0.3",
                    model: "iPhone6s",
                    osversion: "9.3",
                    platform: "iPhone",
                    screensize: "375*667" },

    "request": {  song: {id: "10"} }
    };
    console.log("send get song request");
    request.post({
            url: 'http://jf.yhkamani.com/song/livelistener',
            method: 'POST',
            json: true,
            port: 80,
            headers: {
                "content-type": "application/json",
            },
            body: requestData
        }, function (error, response, body) {

            if (error) {
                //throw error;
                console.log(error);
                return;
            }
            console.log("get response success");
            console.log(body);
        });

}

for (var i = 0; i < 150; i++) {
  setInterval(sendRequest, 2000);
}
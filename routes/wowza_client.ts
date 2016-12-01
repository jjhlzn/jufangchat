

var digestRequest = require('request-digest')('jufang', 'jufang2016');
var parseString = require('xml2js').parseString;

module.exports.get_client_count = function(streamName, func) {
    digestRequest.request({
        host: 'http://114.55.147.70',
        path: '/connectioncounts?flat',
        port: 8086,
        method: 'GET',
    }, function (error, response, body) {
        if (error) {
            func('0');
            //throw error;
            return;
        }

        //console.log(body);
        parseString(body, function (err, result) {
            //console.dir(result);
            var streams = result['WowzaStreamingEngine']['Stream'];
            //console.log('streams = ' + streams);
            for (var i = 0; i < streams.length; i++) {
                //console.log(streams[i]);
                var stream = streams[i]['$'];
                var name = stream['streamName'];
                var sessionsTotal = stream['sessionsTotal'];

                if (name == streamName) {
                    if (func) {
                        func(sessionsTotal);
                        return;
                    }
                }
            }

            func('0');
        });
    });
}
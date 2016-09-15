var sql = require('mssql');
var redis = require("redis");

var dbUrl = '';
var redisUrl = '';
if (process.env.NODE_ENV == 'production') {
    dbUrl = '10.45.52.93';
    redisUrl = '10.45.52.93';
} else {
    dbUrl = 'jf.yhkamani.com';
    redisUrl = 'jf.yhkamani.com';
}

//数据库配置信息
var config = {
    user: 'jf',
    password: '#Jufang2016!@#',
    server: dbUrl, // You can use 'localhost\\instance' to connect to named instance
    port: 9433,
    database: 'Jufang',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

var redisConfig = {
    detect_buffers: true, 
    host: redisUrl, 
    port: 7777,
    retry_strategy: function (options) {
        if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.times_connected > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.max(options.attempt * 100, 3000);
    }
}

module.exports.get_connection = function() {
    //conn.on('error', function(err){console.log(err);});
    //console.log('connect = ' + sql.connect(config));
    return  sql.connect(config);
};

module.exports.get_request = function() {
    return new sql.Request();
};

module.exports.get_redis_client = function() {
    return redis.createClient(redisConfig);
}
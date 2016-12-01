import { request } from 'http';
import * as console from 'console';
const sql = require('mssql');
const redis = require("redis");

var dbUrl = '';
var redisUrl = '';
if (process.env.NODE_ENV == 'production') {
    //production 使用内网地址
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
    retry_strategy: function (options): any {
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
};

export function get_connection() {
    //conn.on('error', function(err){console.log(err);});
    //console.log('connect = ' + sql.connect(config));
    const conn =  sql.connect(config);
   
    return conn;
}

export function get_request() {
    const request = new sql.Request();
    request.on('error', function(err){
        console.error("error: ", err);
    })
    return request;
};

export function get_redis_client() {
    return redis.createClient(redisConfig);
}
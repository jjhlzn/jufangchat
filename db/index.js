var sql = require('mssql');

var dbUrl = '';

if (process.env.NODE_ENV == 'production') {
    
    dbUrl = '10.45.52.93';
} else {
    dbUrl = 'jf.yhkamani.com';
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

module.exports.get_connection = function() {
    //conn.on('error', function(err){console.log(err);});
    //console.log('connect = ' + sql.connect(config));
    return  sql.connect(config);
}

module.exports.get_request = function() {
    return new sql.Request();
}
var sql = require('mssql');

//数据库配置信息
var config = {
    user: 'jf',
    password: '#Jufang2016!@#',
    server: 'jf.yhkamani.com', // You can use 'localhost\\instance' to connect to named instance
    port: 9433,
    database: 'Jufang',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 5000
    }
};

module.exports.get_connection = function() {
    var conn = sql.connect(config);
    //conn.on('error', function(err){console.log(err);});
    return conn;
}

module.exports.get_request = function() {
    return new sql.Request();
}
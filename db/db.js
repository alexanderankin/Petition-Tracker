var mysql = require('mysql');

var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : process.env['mysqlu'] || 'petition-trak',
  password        : process.env['mysqlp'] || 'petition-trak',
  database        : process.env['mysqldb'] || 'petition-trak'
});

module.exports = pool;

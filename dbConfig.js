require('dotenv').config(); // Ensure environment variables are loaded

module.exports = {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306, // Defaults to 3306 if DB_PORT is not set
};
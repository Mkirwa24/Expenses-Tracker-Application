const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the config
const dbConfig = require('./dbConfig');

// Create the connection pool
const db = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    port: dbConfig.port,
    waitForConnections: true,
    connectionLimit: 10, // Adjust based on your needs
    queueLimit: 0,
    connectTimeout: 40000
});

// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MYSQL:', connection.threadId);
    connection.release(); // Release the connection back to the pool
});

module.exports = db;
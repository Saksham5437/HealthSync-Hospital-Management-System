const mysql = require('mysql2');

const poolOptions = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
};

if (process.env.DB_SSL === 'true') {
    poolOptions.ssl = { rejectUnauthorized: false };
}

let db;

if (process.env.DATABASE_URL) {
    db = mysql.createPool(process.env.DATABASE_URL, poolOptions);
} else {
    db = mysql.createPool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ...poolOptions,
    });
}

module.exports = db;

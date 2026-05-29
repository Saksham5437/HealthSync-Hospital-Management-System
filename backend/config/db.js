const mysql = require('mysql2');

const trim = (value) => (typeof value === 'string' ? value.trim() : value);

const isCloudHost = (host = '') => {
    const h = host.toLowerCase();
    return (
        h.includes('aiven') ||
        h.includes('railway') ||
        h.includes('rlwy.net') ||
        h.includes('planetscale') ||
        h.includes('tidb') ||
        h.includes('aws.com')
    );
};

const buildSslConfig = () => {
    const caCert = trim(process.env.DB_CA_CERT);

    if (caCert) {
        return {
            ca: caCert.replace(/\\n/g, '\n'),
            rejectUnauthorized: true,
        };
    }

    const sslFlag = trim(process.env.DB_SSL);
    const host = trim(process.env.DB_HOST) || '';

    if (sslFlag === 'true' || isCloudHost(host)) {
        return { rejectUnauthorized: false };
    }

    return undefined;
};

const poolOptions = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0,
    connectTimeout: 60000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

const ssl = buildSslConfig();
if (ssl) {
    poolOptions.ssl = ssl;
}

const host = trim(process.env.DB_HOST);
const user = trim(process.env.DB_USER);
const password = trim(process.env.DB_PASSWORD);
const database = trim(process.env.DB_NAME);
const port = Number(trim(process.env.DB_PORT)) || 3306;
const databaseUrl = trim(process.env.DATABASE_URL);

const hasSeparateConfig = Boolean(host && user && database);

let db;

// Prefer separate DB_* vars (easier on Render/Aiven than encoding passwords in a URL)
if (hasSeparateConfig) {
    db = mysql.createPool({
        host,
        port,
        user,
        password: password || '',
        database,
        ...poolOptions,
    });
} else if (databaseUrl) {
    db = mysql.createPool(databaseUrl, poolOptions);
} else {
    db = mysql.createPool({
        host: host || 'localhost',
        port,
        user: user || 'root',
        password: password || '',
        database: database || 'healthsync',
        ...poolOptions,
    });
};

const getConfigSummary = () => ({
    mode: hasSeparateConfig ? 'DB_* variables' : databaseUrl ? 'DATABASE_URL' : 'defaults',
    host: host || '(from DATABASE_URL)',
    port,
    user: user || '(from DATABASE_URL)',
    database: database || '(from DATABASE_URL)',
    ssl: Boolean(ssl),
});

module.exports = db;
module.exports.getConfigSummary = getConfigSummary;

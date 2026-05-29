const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const db = require('../config/db');
const { getConfigSummary } = require('../config/db');

console.log('Testing database connection...');
console.log('Config:', getConfigSummary());

db.query('SELECT 1 AS ok', (err, rows) => {
    if (err) {
        console.error('\nConnection FAILED:', err.message);
        console.error('\nIf you use Aiven:');
        console.error('  1. Aiven → your service → Overview → copy PUBLIC host + port');
        console.error('  2. User is usually avnadmin, database is usually defaultdb');
        console.error('  3. Reset password in Aiven if unsure, paste into Render DB_PASSWORD');
        console.error('  4. Set DB_SSL=true on Render');
        console.error('  5. Remove DATABASE_URL from Render if you use DB_HOST/DB_USER/...');
        process.exit(1);
    }
    console.log('\nConnection OK:', rows[0]);
    db.end();
});

/**
 * One-time production setup: admin tables + sample doctors/patients + rooms.
 * Run locally while .env points at your CLOUD MySQL (not localhost).
 *
 *   npm run bootstrap-production
 *   npm run create-admin -- Saksham5437 yourpassword "Your Name"
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const db = require('../config/db');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const runSchema = async () => {
  const schemaPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--') && s !== 'SET FOREIGN_KEY_CHECKS = 0' && s !== 'SET FOREIGN_KEY_CHECKS = 1');

  for (const statement of statements) {
    if (statement.startsWith('SET NAMES')) continue;
    await query(statement);
  }
};

const bootstrap = async () => {
  const hasDb =
    process.env.DATABASE_URL ||
    (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);

  if (!hasDb) {
    console.error('Missing database config. Set DATABASE_URL or DB_HOST, DB_USER, DB_NAME in .env');
    process.exit(1);
  }

  try {
    await query('SELECT 1');
    console.log('Database connection OK');

    console.log('Applying schema...');
    await runSchema();
    console.log('Schema applied');

    console.log('Running seed + admin setup...');
    const { execSync } = require('child_process');
    const backendDir = path.resolve(__dirname, '..');
    execSync('node scripts/seed.js', { cwd: backendDir, stdio: 'inherit' });
    execSync('node scripts/setup-admin-schema.js', { cwd: backendDir, stdio: 'inherit' });

    console.log('\nProduction bootstrap complete.');
    console.log('Next: npm run create-admin -- <username> <password> "Admin Name"');
  } catch (err) {
    console.error('Bootstrap failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
};

bootstrap();

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const getColumns = async (tableName) => {
  const columns = await query(`SHOW COLUMNS FROM ${tableName}`);
  return columns.reduce((map, column) => {
    map[column.Field] = column;
    return map;
  }, {});
};

const createAdmin = async () => {
  const username = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Hospital Admin';

  if (!username || !password) {
    console.log('Usage: npm run create-admin -- <username> <password> [full name]');
    console.log('Example: npm run create-admin -- admin 123456 "Main Admin"');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  try {
    const userColumns = await getColumns('system_users');
    const usernameCondition = userColumns.username
      ? '(username = ? OR email = ?)'
      : 'email = ?';
    const params = userColumns.username ? [username, username] : [username];
    const existing = await query(
      `SELECT user_id FROM system_users WHERE ${usernameCondition} LIMIT 1`,
      params
    );

    if (existing.length > 0) {
      console.error('Username already exists. Choose a different username.');
      process.exit(1);
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const payload = {
      full_name: fullName,
      role: 'admin',
      password_hash: passwordHash,
    };
    if (userColumns.username) payload.username = username;
    if (userColumns.email) payload.email = username;

    const fields = Object.keys(payload);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map((field) => payload[field]);

    await query(
      `INSERT INTO system_users (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );

    console.log('Admin account created successfully.');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log('Sign in on the login page using the Admin account type.');
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
};

createAdmin();

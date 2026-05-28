const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('Usage: npm run reset-password -- <username> <new-password>');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

db.query(
  'UPDATE system_users SET password_hash = ? WHERE username = ? OR email = ?',
  [hash, username, username],
  (err, result) => {
    if (err) {
      console.error('Failed:', err.message);
      process.exit(1);
    }
    if (result.affectedRows === 0) {
      console.error('No user found with that username.');
      process.exit(1);
    }
    console.log(`Password updated for "${username}".`);
    db.end();
  }
);

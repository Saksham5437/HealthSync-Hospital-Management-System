const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const sampleData = require('../data/sample-users.json');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const getConnection = () =>
  new Promise((resolve, reject) => {
    db.getConnection((err, connection) => {
      if (err) reject(err);
      else resolve(connection);
    });
  });

const run = (connection, sql, params = []) =>
  new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
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

const findUserByUsername = async (username) => {
  const userColumns = await getColumns('system_users');
  const usernameCondition = userColumns.username
    ? '(username = ? OR email = ?)'
    : 'email = ?';
  const params = userColumns.username ? [username, username] : [username];
  const results = await query(
    `SELECT user_id, role FROM system_users WHERE ${usernameCondition} LIMIT 1`,
    params
  );
  return results[0];
};

const ensureDepartments = async (connection, names) => {
  const columns = await getColumns('departments');
  const map = {};

  for (const name of names) {
    const existing = await run(
      connection,
      'SELECT department_id FROM departments WHERE department_name = ? LIMIT 1',
      [name]
    );

    if (existing.length > 0) {
      map[name] = existing[0].department_id;
      continue;
    }

    if (columns.department_name) {
      const result = await run(
        connection,
        'INSERT INTO departments (department_name) VALUES (?)',
        [name]
      );
      map[name] = result.insertId;
    }
  }

  return map;
};

const createUser = async (connection, { username, full_name, role, password }) => {
  const existing = await findUserByUsername(username);
  if (existing) {
    return { userId: existing.user_id, skipped: true };
  }

  const userColumns = await getColumns('system_users');
  const passwordHash = bcrypt.hashSync(password, 10);
  const payload = {
    full_name,
    role,
    password_hash: passwordHash,
  };

  if (userColumns.username) payload.username = username;
  if (userColumns.email) payload.email = username;

  const fields = Object.keys(payload);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map((field) => payload[field]);
  const result = await run(
    connection,
    `INSERT INTO system_users (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return { userId: result.insertId, skipped: false };
};

const createDoctorProfile = async (connection, userId, doctor, departmentMap) => {
  const columns = await getColumns('doctor_profiles');
  const existing = await run(
    connection,
    'SELECT doctor_id FROM doctor_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (existing.length > 0) {
    return { profileId: existing[0].doctor_id, skipped: true };
  }

  const payload = { user_id: userId };

  if (columns.department_id) {
    payload.department_id = departmentMap[doctor.department_name] || Object.values(departmentMap)[0];
  }
  if (columns.specialization) payload.specialization = doctor.specialization;
  if (columns.experience_years) payload.experience_years = doctor.experience_years;
  if (columns.qualification) payload.qualification = doctor.qualification;
  if (columns.consultation_fee) payload.consultation_fee = doctor.consultation_fee;
  if (columns.availability_status) payload.availability_status = doctor.availability_status;

  const fields = Object.keys(payload);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map((field) => payload[field]);
  const result = await run(
    connection,
    `INSERT INTO doctor_profiles (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return { profileId: result.insertId, skipped: false };
};

const createPatientProfile = async (connection, userId) => {
  const existing = await run(
    connection,
    'SELECT patient_id FROM patient_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );

  if (existing.length > 0) {
    return { profileId: existing[0].patient_id, skipped: true };
  }

  const result = await run(
    connection,
    'INSERT INTO patient_profiles (user_id) VALUES (?)',
    [userId]
  );

  return { profileId: result.insertId, skipped: false };
};

const seed = async () => {
  const password = sampleData.password || '123456';
  let connection;

  try {
    connection = await getConnection();
    const departmentMap = await ensureDepartments(connection, sampleData.departments);

    let doctorsCreated = 0;
    let doctorsSkipped = 0;
    let patientsCreated = 0;
    let patientsSkipped = 0;

    for (const doctor of sampleData.doctors) {
      const { userId, skipped: userSkipped } = await createUser(connection, {
        username: doctor.username,
        full_name: doctor.full_name,
        role: 'doctor',
        password,
      });
      const { skipped: profileSkipped } = await createDoctorProfile(connection, userId, doctor, departmentMap);

      if (userSkipped && profileSkipped) doctorsSkipped += 1;
      else doctorsCreated += 1;
    }

    for (const patient of sampleData.patients) {
      const { userId, skipped: userSkipped } = await createUser(connection, {
        username: patient.username,
        full_name: patient.full_name,
        role: 'patient',
        password,
      });
      const { skipped: profileSkipped } = await createPatientProfile(connection, userId);

      if (userSkipped && profileSkipped) patientsSkipped += 1;
      else patientsCreated += 1;
    }

    console.log('HealthSync sample data seeded successfully.');
    console.log(`Password for all accounts: ${password}`);
    console.log(`Doctors: ${doctorsCreated} created/updated, ${doctorsSkipped} already existed`);
    console.log(`Patients: ${patientsCreated} created/updated, ${patientsSkipped} already existed`);
    console.log('Doctor logins: doctor1 … doctor15');
    console.log('Patient logins: patient1 … patient30');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    db.end();
  }
};

seed();

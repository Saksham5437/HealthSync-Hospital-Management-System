/**
 * Give every doctor a unique specialization, experience, and fee.
 * Run once after adding doctors: npm run diversify-doctors
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const db = require('../config/db');
const templates = require('../data/doctor-profile-templates');

const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const ensureDepartment = async (name) => {
  const existing = await query(
    'SELECT department_id FROM departments WHERE department_name = ? LIMIT 1',
    [name]
  );
  if (existing.length > 0) return existing[0].department_id;

  const result = await query('INSERT INTO departments (department_name) VALUES (?)', [name]);
  return result.insertId;
};

const diversify = async () => {
  try {
    const doctors = await query(`
      SELECT dp.doctor_id, dp.specialization, dp.experience_years, dp.consultation_fee, su.full_name
      FROM doctor_profiles dp
      JOIN system_users su ON dp.user_id = su.user_id
      ORDER BY dp.doctor_id
    `);

    if (doctors.length === 0) {
      console.log('No doctors found in database.');
      return;
    }

    let updated = 0;

    for (let i = 0; i < doctors.length; i += 1) {
      const doctor = doctors[i];
      const profile = templates[i % templates.length];
      const departmentId = await ensureDepartment(profile.department_name);

      await query(
        `UPDATE doctor_profiles
         SET department_id = ?,
             specialization = ?,
             experience_years = ?,
             consultation_fee = ?,
             qualification = ?
         WHERE doctor_id = ?`,
        [
          departmentId,
          profile.specialization,
          profile.experience_years,
          profile.consultation_fee,
          profile.qualification,
          doctor.doctor_id,
        ]
      );

      await query(
        `UPDATE staff_members
         SET department_name = ?, full_name = ?
         WHERE doctor_id = ?`,
        [profile.department_name, doctor.full_name, doctor.doctor_id]
      );

      console.log(
        `  ${doctor.full_name} → ${profile.specialization} (${profile.experience_years} yrs, ₹${profile.consultation_fee})`
      );
      updated += 1;
    }

    console.log(`\nUpdated ${updated} doctor profile(s) with unique specializations and fees.`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
};

diversify();

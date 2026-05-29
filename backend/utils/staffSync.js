const db = require('../config/db');

const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });

/**
 * Ensures every doctor in doctor_profiles has a matching staff_members row.
 * Updates name/department if the doctor profile changed.
 */
const syncDoctorsToStaff = async () => {
    const doctors = await query(`
        SELECT
            dp.doctor_id,
            su.full_name,
            d.department_name,
            dp.specialization
        FROM doctor_profiles dp
        JOIN system_users su ON dp.user_id = su.user_id
        LEFT JOIN departments d ON dp.department_id = d.department_id
        ORDER BY dp.doctor_id
    `);

    let added = 0;
    let updated = 0;

    for (const doc of doctors) {
        const department =
            doc.department_name ||
            doc.specialization ||
            'General Medicine';

        const existing = await query(
            'SELECT staff_id FROM staff_members WHERE doctor_id = ? LIMIT 1',
            [doc.doctor_id]
        );

        if (existing.length === 0) {
            await query(
                `INSERT INTO staff_members (full_name, staff_type, doctor_id, department_name, status)
                 VALUES (?, 'doctor', ?, ?, 'active')`,
                [doc.full_name, doc.doctor_id, department]
            );
            added += 1;
        } else {
            await query(
                `UPDATE staff_members
                 SET full_name = ?, department_name = ?, staff_type = 'doctor', status = 'active'
                 WHERE doctor_id = ?`,
                [doc.full_name, department, doc.doctor_id]
            );
            updated += 1;
        }
    }

    return { added, updated, totalDoctors: doctors.length };
};

module.exports = { syncDoctorsToStaff };

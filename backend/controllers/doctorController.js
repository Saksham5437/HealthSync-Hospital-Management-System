const db = require('../config/db');

const getAllDoctors = (req, res) => {
    const sql = `
        SELECT 
            dp.doctor_id,
            su.full_name,
            d.department_name,
            dp.specialization,
            dp.experience_years,
            dp.qualification,
            dp.consultation_fee,
            dp.availability_status
        FROM doctor_profiles dp
        JOIN system_users su ON dp.user_id = su.user_id
        JOIN departments d ON dp.department_id = d.department_id
    `;

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
};

const getDoctorAppointments = (req, res) => {
    const doctorId = req.params.id;

    const sql = `
        SELECT
            a.appointment_id,
            a.patient_id,
            su.full_name AS patient_name,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason
        FROM appointments a
        JOIN patient_profiles pp ON a.patient_id = pp.patient_id
        JOIN system_users su ON pp.user_id = su.user_id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC
    `;

    db.query(sql, [doctorId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
};

module.exports = {
    getAllDoctors,
    getDoctorAppointments
};

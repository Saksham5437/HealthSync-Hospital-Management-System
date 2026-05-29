const db = require('../config/db');
const { syncDoctorsToStaff } = require('../utils/staffSync');

const sendError = (res, err) => res.status(500).json({ error: err.message });

const getDashboardStats = (req, res) => {
    const stats = {};

    db.query('SELECT COUNT(*) AS totalPatients FROM patient_profiles', (err, patientResults) => {
        if (err) return sendError(res, err);
        stats.totalPatients = patientResults[0].totalPatients;

        db.query('SELECT COUNT(*) AS totalDoctors FROM doctor_profiles', (err, doctorResults) => {
            if (err) return sendError(res, err);
            stats.totalDoctors = doctorResults[0].totalDoctors;

            db.query('SELECT COUNT(*) AS totalAppointments FROM appointments', (err, appointmentResults) => {
                if (err) return sendError(res, err);
                stats.totalAppointments = appointmentResults[0].totalAppointments;

                db.query(
                    'SELECT COUNT(*) AS todayAppointments FROM appointments WHERE appointment_date = CURDATE()',
                    (err, todayResults) => {
                        if (err) return sendError(res, err);
                        stats.todayAppointments = todayResults[0].todayAppointments;

                        db.query(
                            "SELECT COUNT(*) AS pendingBills FROM billing WHERE payment_status IN ('pending', 'unpaid')",
                            (err, billResults) => {
                                if (err) return sendError(res, err);
                                stats.pendingBills = billResults[0].pendingBills;

                                db.query(
                                    "SELECT IFNULL(SUM(amount), 0) AS totalRevenue FROM billing WHERE payment_status = 'paid'",
                                    (err, revenueResults) => {
                                        if (err) return sendError(res, err);
                                        stats.totalRevenue = revenueResults[0].totalRevenue;

                                        db.query(
                                            "SELECT COUNT(*) AS completedAppointments FROM appointments WHERE status = 'completed'",
                                            (err, completedResults) => {
                                                if (err) return sendError(res, err);
                                                stats.completedAppointments = completedResults[0].completedAppointments;

                                                db.query(
                                                    'SELECT COUNT(*) AS totalStaff FROM staff_members WHERE status = ?',
                                                    ['active'],
                                                    (err, staffResults) => {
                                                        if (err) {
                                                            stats.totalStaff = stats.totalDoctors;
                                                            stats.staffPresentToday = 0;
                                                            stats.occupiedRooms = 0;
                                                            stats.availableRooms = 0;
                                                            return res.json(stats);
                                                        }

                                                        stats.totalStaff = staffResults[0].totalStaff;

                                                        db.query(
                                                            `SELECT COUNT(*) AS staffPresentToday
                                                             FROM staff_attendance
                                                             WHERE attendance_date = CURDATE() AND status = 'present'`,
                                                            (err, presentResults) => {
                                                                if (err) return sendError(res, err);
                                                                stats.staffPresentToday = presentResults[0].staffPresentToday;

                                                                db.query(
                                                                    "SELECT COUNT(*) AS occupiedRooms FROM hospital_rooms WHERE status = 'occupied'",
                                                                    (err, occupiedResults) => {
                                                                        if (err) {
                                                                            stats.occupiedRooms = 0;
                                                                            stats.availableRooms = 0;
                                                                            return res.json(stats);
                                                                        }
                                                                        stats.occupiedRooms = occupiedResults[0].occupiedRooms;

                                                                        db.query(
                                                                            "SELECT COUNT(*) AS availableRooms FROM hospital_rooms WHERE status = 'available'",
                                                                            (err, availableResults) => {
                                                                                if (err) return sendError(res, err);
                                                                                stats.availableRooms = availableResults[0].availableRooms;
                                                                                res.json(stats);
                                                                            }
                                                                        );
                                                                    }
                                                                );
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    });
};

const getStaff = (req, res) => {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const staffType = req.query.staff_type;

    syncDoctorsToStaff()
        .then(() => {
            let sql = `
                SELECT
                    sm.staff_id,
                    sm.full_name,
                    sm.staff_type,
                    sm.doctor_id,
                    sm.department_name,
                    sm.phone,
                    sm.status,
                    sa.attendance_id,
                    sa.status AS attendance_status,
                    sa.check_in_time,
                    sa.check_out_time,
                    sa.notes AS attendance_notes
                FROM staff_members sm
                LEFT JOIN staff_attendance sa
                    ON sm.staff_id = sa.staff_id AND sa.attendance_date = ?
                WHERE sm.status = 'active'
            `;
            const params = [date];

            if (staffType && ['doctor', 'nurse', 'other'].includes(staffType)) {
                sql += ' AND sm.staff_type = ?';
                params.push(staffType);
            }

            sql += ` ORDER BY FIELD(sm.staff_type, 'doctor', 'nurse', 'other'), sm.full_name`;

            db.query(sql, params, (err, results) => {
                if (err) return sendError(res, err);
                res.json(results);
            });
        })
        .catch((err) => sendError(res, err));
};

const syncStaffDoctors = (req, res) => {
    syncDoctorsToStaff()
        .then((summary) => res.json({
            message: 'Doctors synced to staff list',
            ...summary,
        }))
        .catch((err) => sendError(res, err));
};

const upsertAttendance = (req, res) => {
    const { staff_id, attendance_date, status, check_in_time, check_out_time, notes } = req.body;

    if (!staff_id || !attendance_date || !status) {
        return res.status(400).json({ message: 'staff_id, attendance_date, and status are required' });
    }

    const sql = `
        INSERT INTO staff_attendance (staff_id, attendance_date, status, check_in_time, check_out_time, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            check_in_time = VALUES(check_in_time),
            check_out_time = VALUES(check_out_time),
            notes = VALUES(notes)
    `;

    db.query(
        sql,
        [staff_id, attendance_date, status, check_in_time || null, check_out_time || null, notes || null],
        (err) => {
            if (err) return sendError(res, err);
            res.json({ message: 'Attendance updated successfully' });
        }
    );
};

const bulkUpsertAttendance = (req, res) => {
    const { attendance_date, records } = req.body;
    const valid = (records || []).filter((record) => record.staff_id && record.status);

    if (!attendance_date || valid.length === 0) {
        return res.status(400).json({ message: 'attendance_date and records array are required' });
    }

    const sql = `
        INSERT INTO staff_attendance (staff_id, attendance_date, status, check_in_time, check_out_time, notes)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            check_in_time = VALUES(check_in_time),
            check_out_time = VALUES(check_out_time),
            notes = VALUES(notes)
    `;

    const saveNext = (index) => {
        if (index >= valid.length) {
            return res.json({ message: `Attendance saved for ${valid.length} staff member(s)` });
        }

        const record = valid[index];
        db.query(
            sql,
            [
                record.staff_id,
                attendance_date,
                record.status,
                record.check_in_time || null,
                record.check_out_time || null,
                record.notes || null,
            ],
            (err) => {
                if (err) return sendError(res, err);
                saveNext(index + 1);
            }
        );
    };

    saveNext(0);
};

const getStaffPerformance = (req, res) => {
    const sql = `
        SELECT
            sm.staff_id,
            sm.full_name,
            sm.staff_type,
            sm.department_name,
            sm.doctor_id,
            COUNT(a.appointment_id) AS total_appointments,
            SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments,
            SUM(CASE WHEN a.status = 'pending' OR a.status = 'scheduled' THEN 1 ELSE 0 END) AS pending_appointments,
            SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments,
            IFNULL(SUM(CASE WHEN b.payment_status = 'paid' THEN b.amount ELSE 0 END), 0) AS earnings_from_patients,
            IFNULL(SUM(CASE WHEN b.payment_status IN ('pending', 'unpaid') THEN b.amount ELSE 0 END), 0) AS pending_earnings
        FROM staff_members sm
        LEFT JOIN appointments a ON sm.doctor_id = a.doctor_id
        LEFT JOIN billing b ON a.appointment_id = b.appointment_id
        WHERE sm.status = 'active'
        GROUP BY sm.staff_id, sm.full_name, sm.staff_type, sm.department_name, sm.doctor_id
        ORDER BY earnings_from_patients DESC, sm.full_name
    `;

    db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        res.json(results);
    });
};

const addStaffMember = (req, res) => {
    const { full_name, staff_type, department_name, phone } = req.body;

    if (!full_name || !staff_type) {
        return res.status(400).json({ message: 'full_name and staff_type are required' });
    }

    if (!['doctor', 'nurse', 'other'].includes(staff_type)) {
        return res.status(400).json({ message: 'staff_type must be doctor, nurse, or other' });
    }

    const sql = `
        INSERT INTO staff_members (full_name, staff_type, department_name, phone, status)
        VALUES (?, ?, ?, ?, 'active')
    `;

    db.query(sql, [full_name, staff_type, department_name || null, phone || null], (err, result) => {
        if (err) return sendError(res, err);
        res.status(201).json({ message: 'Staff member added', staff_id: result.insertId });
    });
};

const getRooms = (req, res) => {
    const sql = `
        SELECT
            hr.room_id,
            hr.room_number,
            hr.ward_name,
            hr.floor_number,
            hr.room_type,
            hr.status AS room_status,
            hr.bed_capacity,
            pra.allocation_id,
            pra.patient_id,
            pra.admitted_at,
            pra.status AS allocation_status,
            pra.notes AS allocation_notes,
            su.full_name AS patient_name
        FROM hospital_rooms hr
        LEFT JOIN patient_room_allocations pra
            ON hr.room_id = pra.room_id AND pra.status = 'active'
        LEFT JOIN patient_profiles pp ON pra.patient_id = pp.patient_id
        LEFT JOIN system_users su ON pp.user_id = su.user_id
        ORDER BY hr.floor_number, hr.room_number
    `;

    db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        res.json(results);
    });
};

const assignRoom = (req, res) => {
    const { patient_id, room_id, notes } = req.body;

    if (!patient_id || !room_id) {
        return res.status(400).json({ message: 'patient_id and room_id are required' });
    }

    db.query(
        'SELECT allocation_id FROM patient_room_allocations WHERE patient_id = ? AND status = ? LIMIT 1',
        [patient_id, 'active'],
        (err, existing) => {
            if (err) return sendError(res, err);
            if (existing.length > 0) {
                return res.status(409).json({ message: 'Patient already has an active room allocation' });
            }

            db.query(
                "SELECT room_id FROM hospital_rooms WHERE room_id = ? AND status = 'available' LIMIT 1",
                [room_id],
                (err, room) => {
                    if (err) return sendError(res, err);
                    if (room.length === 0) {
                        return res.status(409).json({ message: 'Room is not available' });
                    }

                    db.query(
                        `INSERT INTO patient_room_allocations (patient_id, room_id, notes, status)
                         VALUES (?, ?, ?, 'active')`,
                        [patient_id, room_id, notes || null],
                        (err, result) => {
                            if (err) return sendError(res, err);

                            db.query(
                                "UPDATE hospital_rooms SET status = 'occupied' WHERE room_id = ?",
                                [room_id],
                                (err) => {
                                    if (err) return sendError(res, err);
                                    res.status(201).json({
                                        message: 'Patient allocated to room',
                                        allocation_id: result.insertId,
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

const dischargeRoom = (req, res) => {
    const allocationId = req.params.id;

    db.query(
        'SELECT allocation_id, room_id FROM patient_room_allocations WHERE allocation_id = ? AND status = ? LIMIT 1',
        [allocationId, 'active'],
        (err, rows) => {
            if (err) return sendError(res, err);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Active allocation not found' });
            }

            const { room_id } = rows[0];

            db.query(
                `UPDATE patient_room_allocations
                 SET status = 'discharged', discharged_at = NOW()
                 WHERE allocation_id = ?`,
                [allocationId],
                (err) => {
                    if (err) return sendError(res, err);

                    db.query(
                        "UPDATE hospital_rooms SET status = 'available' WHERE room_id = ?",
                        [room_id],
                        (err) => {
                            if (err) return sendError(res, err);
                            res.json({ message: 'Patient discharged from room' });
                        }
                    );
                }
            );
        }
    );
};

const getPatients = (req, res) => {
    const sql = `
        SELECT
            pp.patient_id,
            su.full_name AS patient_name,
            su.username,
            su.email,
            pra.allocation_id,
            pra.admitted_at,
            hr.room_number,
            hr.ward_name,
            hr.floor_number,
            hr.room_type,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = pp.patient_id) AS total_appointments,
            (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = pp.patient_id AND a.status = 'completed') AS completed_appointments,
            (SELECT IFNULL(SUM(b.amount), 0) FROM billing b WHERE b.patient_id = pp.patient_id AND b.payment_status = 'paid') AS total_paid
        FROM patient_profiles pp
        JOIN system_users su ON pp.user_id = su.user_id
        LEFT JOIN patient_room_allocations pra
            ON pp.patient_id = pra.patient_id AND pra.status = 'active'
        LEFT JOIN hospital_rooms hr ON pra.room_id = hr.room_id
        ORDER BY su.full_name
    `;

    db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        res.json(results);
    });
};

const getAllAppointments = (req, res) => {
    const sql = `
        SELECT
            a.appointment_id,
            a.appointment_date,
            a.appointment_time,
            a.status,
            a.reason,
            psu.full_name AS patient_name,
            a.patient_id,
            dsu.full_name AS doctor_name,
            a.doctor_id,
            dp.specialization,
            d.department_name,
            b.amount AS bill_amount,
            b.payment_status
        FROM appointments a
        JOIN patient_profiles pp ON a.patient_id = pp.patient_id
        JOIN system_users psu ON pp.user_id = psu.user_id
        JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        JOIN system_users dsu ON dp.user_id = dsu.user_id
        LEFT JOIN departments d ON dp.department_id = d.department_id
        LEFT JOIN billing b ON a.appointment_id = b.appointment_id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        res.json(results);
    });
};

const getAuditLogs = (req, res) => {
    const sql = `
        SELECT
            log_id,
            action_type,
            table_name,
            description,
            performed_by,
            created_at
        FROM audit_logs
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return sendError(res, err);
        res.json(results);
    });
};

module.exports = {
    getDashboardStats,
    getStaff,
    syncStaffDoctors,
    upsertAttendance,
    bulkUpsertAttendance,
    getStaffPerformance,
    addStaffMember,
    getRooms,
    assignRoom,
    dischargeRoom,
    getPatients,
    getAllAppointments,
    getAuditLogs,
};

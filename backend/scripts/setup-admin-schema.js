const path = require('path');
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

const TABLES = [
  `CREATE TABLE IF NOT EXISTS staff_members (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    staff_type ENUM('doctor', 'nurse', 'other') NOT NULL DEFAULT 'other',
    doctor_id INT NULL,
    department_name VARCHAR(100),
    phone VARCHAR(20),
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_doctor_staff (doctor_id)
  )`,
  `CREATE TABLE IF NOT EXISTS staff_attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent', 'leave', 'half_day') NOT NULL DEFAULT 'present',
    check_in_time TIME NULL,
    check_out_time TIME NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_staff_date (staff_id, attendance_date),
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS hospital_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL UNIQUE,
    ward_name VARCHAR(100) NOT NULL,
    floor_number INT NOT NULL DEFAULT 1,
    room_type ENUM('general', 'private', 'icu', 'emergency') NOT NULL DEFAULT 'general',
    status ENUM('available', 'occupied', 'maintenance') NOT NULL DEFAULT 'available',
    bed_capacity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS patient_room_allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    room_id INT NOT NULL,
    admitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharged_at DATETIME NULL,
    status ENUM('active', 'discharged') NOT NULL DEFAULT 'active',
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES hospital_rooms(room_id) ON DELETE RESTRICT
  )`,
];

const SAMPLE_NURSES = [
  { full_name: 'Sunita Rao', department_name: 'General Medicine', phone: '9800001001' },
  { full_name: 'Meena Krishnan', department_name: 'Pediatrics', phone: '9800001002' },
  { full_name: 'Lata Verma', department_name: 'Cardiology', phone: '9800001003' },
  { full_name: 'Geeta Nambiar', department_name: 'ICU', phone: '9800001004' },
  { full_name: 'Rekha Das', department_name: 'Orthopedics', phone: '9800001005' },
];

const SAMPLE_ROOMS = [
  { room_number: '101', ward_name: 'General Ward A', floor_number: 1, room_type: 'general', status: 'available' },
  { room_number: '102', ward_name: 'General Ward A', floor_number: 1, room_type: 'general', status: 'available' },
  { room_number: '201', ward_name: 'General Ward B', floor_number: 2, room_type: 'general', status: 'available' },
  { room_number: '202', ward_name: 'General Ward B', floor_number: 2, room_type: 'private', status: 'available' },
  { room_number: '301', ward_name: 'Private Wing', floor_number: 3, room_type: 'private', status: 'available' },
  { room_number: '302', ward_name: 'Private Wing', floor_number: 3, room_type: 'private', status: 'available' },
  { room_number: 'ICU-01', ward_name: 'Intensive Care', floor_number: 4, room_type: 'icu', status: 'available' },
  { room_number: 'ICU-02', ward_name: 'Intensive Care', floor_number: 4, room_type: 'icu', status: 'available' },
  { room_number: 'ER-01', ward_name: 'Emergency', floor_number: 0, room_type: 'emergency', status: 'available' },
  { room_number: 'ER-02', ward_name: 'Emergency', floor_number: 0, room_type: 'emergency', status: 'available' },
];

const syncDoctorStaff = async () => {
  const doctors = await query(`
    SELECT dp.doctor_id, su.full_name, d.department_name
    FROM doctor_profiles dp
    JOIN system_users su ON dp.user_id = su.user_id
    LEFT JOIN departments d ON dp.department_id = d.department_id
  `);

  for (const doc of doctors) {
    const existing = await query(
      'SELECT staff_id FROM staff_members WHERE doctor_id = ? LIMIT 1',
      [doc.doctor_id]
    );
    if (existing.length > 0) continue;

    await query(
      `INSERT INTO staff_members (full_name, staff_type, doctor_id, department_name, status)
       VALUES (?, 'doctor', ?, ?, 'active')`,
      [doc.full_name, doc.doctor_id, doc.department_name || 'General Medicine']
    );
  }
};

const seedNursesAndRooms = async () => {
  for (const nurse of SAMPLE_NURSES) {
    const existing = await query(
      'SELECT staff_id FROM staff_members WHERE full_name = ? AND staff_type = ? LIMIT 1',
      [nurse.full_name, 'nurse']
    );
    if (existing.length > 0) continue;
    await query(
      `INSERT INTO staff_members (full_name, staff_type, department_name, phone, status)
       VALUES (?, 'nurse', ?, ?, 'active')`,
      [nurse.full_name, nurse.department_name, nurse.phone]
    );
  }

  for (const room of SAMPLE_ROOMS) {
    await query(
      `INSERT IGNORE INTO hospital_rooms (room_number, ward_name, floor_number, room_type, status, bed_capacity)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [room.room_number, room.ward_name, room.floor_number, room.room_type, room.status]
    );
  }
};

const setup = async () => {
  try {
    for (const sql of TABLES) {
      await query(sql);
    }
    await syncDoctorStaff();
    await seedNursesAndRooms();
    console.log('Admin tables ready (staff, attendance, rooms, allocations).');
    console.log('Create an admin user with: npm run create-admin -- <username> <password> [full name]');
  } catch (err) {
    console.error('Setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    db.end();
  }
};

setup();

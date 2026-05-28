const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard', adminController.getDashboardStats);
router.get('/staff', adminController.getStaff);
router.post('/staff', adminController.addStaffMember);
router.get('/staff/performance', adminController.getStaffPerformance);
router.post('/staff/attendance', adminController.upsertAttendance);
router.get('/rooms', adminController.getRooms);
router.post('/rooms/assign', adminController.assignRoom);
router.put('/rooms/discharge/:id', adminController.dischargeRoom);
router.get('/patients', adminController.getPatients);
router.get('/appointments', adminController.getAllAppointments);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;

import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ─────────────────────────────────────────────
export const loginUser = (username, password, role) =>
  API.post('/api/auth/login', { username, password, role });

export const registerUser = (data) => API.post('/api/auth/register', data);

// ─── Doctors ──────────────────────────────────────────
export const getDoctors = () => API.get('/api/doctors');
export const getDoctorAppointments = (doctorId) =>
  API.get(`/api/doctors/${doctorId}/appointments`);

// ─── Appointments ─────────────────────────────────────
export const bookAppointment = (data) => API.post('/api/appointments', data);
export const getPatientAppointments = (patientId) =>
  API.get(`/api/appointments/patient/${patientId}`);
export const updateAppointmentStatus = (appointmentId, status) =>
  API.put(`/api/appointments/${appointmentId}/status`, { status });

// ─── Medical Records ──────────────────────────────────
export const getPatientMedicalRecords = (patientId) =>
  API.get(`/api/medical-records/patient/${patientId}`);
export const createMedicalRecord = (data) =>
  API.post('/api/medical-records', data);

// ─── Billing ──────────────────────────────────────────
export const getPatientBilling = (patientId) =>
  API.get(`/api/billing/patient/${patientId}`);

// ─── Admin ────────────────────────────────────────────
export const getAdminDashboard = () => API.get('/api/admin/dashboard');
export const getAuditLogs = () => API.get('/api/admin/audit-logs');
export const getAdminStaff = (date) => API.get('/api/admin/staff', { params: { date } });
export const updateStaffAttendance = (data) => API.post('/api/admin/staff/attendance', data);
export const getStaffPerformance = () => API.get('/api/admin/staff/performance');
export const addStaffMember = (data) => API.post('/api/admin/staff', data);
export const getAdminRooms = () => API.get('/api/admin/rooms');
export const assignPatientRoom = (data) => API.post('/api/admin/rooms/assign', data);
export const dischargePatientRoom = (allocationId) => API.put(`/api/admin/rooms/discharge/${allocationId}`);
export const getAdminPatients = () => API.get('/api/admin/patients');
export const getAdminAppointments = () => API.get('/api/admin/appointments');

export default API;

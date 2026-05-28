import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 15000,
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

export default API;

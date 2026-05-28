import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FileText, CreditCard, Stethoscope, User
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import PatientOverview from './PatientOverview';
import DoctorsPage from './DoctorsPage';
import AppointmentsPage from './AppointmentsPage';
import MedicalRecordsPage from './MedicalRecordsPage';
import BillingPage from './BillingPage';
import { useAuth } from '../../utils/AuthContext';

const navItems = (userId) => [
  { path: '/patient', label: 'Overview', icon: LayoutDashboard },
  { path: '/patient/doctors', label: 'Find Doctors', icon: Stethoscope },
  { path: '/patient/appointments', label: 'Appointments', icon: Calendar },
  { path: '/patient/records', label: 'Medical Records', icon: FileText },
  { path: '/patient/billing', label: 'Billing', icon: CreditCard },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const items = navItems(user?.id);
  const currentNavLabel = items.find(i => window.location.pathname === i.path)?.label || 'Dashboard';

  return (
    <DashboardLayout navItems={items} title="Patient Portal">
      <Routes>
        <Route index element={<PatientOverview />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="records" element={<MedicalRecordsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

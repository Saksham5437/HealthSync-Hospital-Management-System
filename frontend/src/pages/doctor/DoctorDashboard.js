import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, FilePlus } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import DoctorOverview from './DoctorOverview';
import DoctorAppointments from './DoctorAppointments';

const navItems = [
  { path: '/doctor', label: 'Overview', icon: LayoutDashboard },
  { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
  { path: '/doctor/records', label: 'Add Records', icon: FilePlus },
];

export default function DoctorDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Doctor Portal">
      <Routes>
        <Route index element={<DoctorOverview />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="records" element={<DoctorAppointments showRecords />} />
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

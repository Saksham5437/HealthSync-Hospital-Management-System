import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, ScrollText, ClipboardCheck, BedDouble, Activity,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminOverview from './AdminOverview';
import AuditLogsPage from './AuditLogsPage';
import StaffManagementPage from './StaffManagementPage';
import RoomAllocationPage from './RoomAllocationPage';
import HospitalOperationsPage from './HospitalOperationsPage';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/staff', label: 'Staff & Attendance', icon: ClipboardCheck },
  { path: '/admin/rooms', label: 'Room Allocation', icon: BedDouble },
  { path: '/admin/operations', label: 'All Operations', icon: Activity },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Console">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="staff" element={<StaffManagementPage />} />
        <Route path="rooms" element={<RoomAllocationPage />} />
        <Route path="operations" element={<HospitalOperationsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

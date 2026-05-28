import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, ScrollText } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminOverview from './AdminOverview';
import AuditLogsPage from './AuditLogsPage';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Console">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

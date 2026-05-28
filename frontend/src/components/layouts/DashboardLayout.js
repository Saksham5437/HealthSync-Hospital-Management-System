import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LogOut, Bell, ChevronDown, Activity,
  Settings, User
} from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const HealthSyncLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-card">
      <Activity size={18} className="text-white" />
    </div>
    <div>
      <div className="font-display font-bold text-dark text-base leading-none">HealthSync</div>
      <div className="text-muted text-xs leading-none mt-0.5">Hospital Platform</div>
    </div>
  </div>
);

export default function DashboardLayout({ children, navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    patient: 'bg-accent/10 text-accent',
    doctor: 'bg-primary/10 text-primary',
    admin: 'bg-warning/10 text-warning',
  };

  const isActive = (itemPath) => {
    // Base dashboard routes (e.g. /patient, /doctor, /admin) — exact match only
    const basePaths = ['/patient', '/doctor', '/admin'];
    if (basePaths.includes(itemPath)) {
      return location.pathname === itemPath || location.pathname === itemPath + '/';
    }
    // Sub-routes: exact match or starts with path + /
    return location.pathname === itemPath || location.pathname.startsWith(itemPath + '/');
  };

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-dark/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-border flex flex-col
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <HealthSyncLogo />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-hover">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={isActive(item.path) ? 'nav-item-active' : 'nav-item'}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-danger text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-hover">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-dark text-sm truncate">{user?.name}</div>
              <span className={`text-xs font-medium capitalize px-1.5 py-0.5 rounded ${roleColors[user?.role] || 'text-muted'}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl text-muted hover:bg-danger/5 hover:text-danger transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav */}
        <header className="h-16 bg-white border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-hover text-muted"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-dark text-lg">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-hover text-muted transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-hover transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="font-semibold text-dark text-sm hidden sm:block">{user?.name}</span>
                <ChevronDown size={14} className="text-muted hidden sm:block" />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-modal border border-border py-2 z-50"
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  >
                    <div className="px-4 py-3 border-b border-border mb-1">
                      <div className="font-semibold text-dark text-sm">{user?.name}</div>
                      <div className="text-muted text-xs truncate">{user?.username || user?.email}</div>
                    </div>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-hover hover:text-dark transition-colors">
                      <User size={14} /> Profile
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-hover hover:text-dark transition-colors">
                      <Settings size={14} /> Settings
                    </button>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
                      >
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

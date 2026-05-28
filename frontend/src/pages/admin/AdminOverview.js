import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Stethoscope, Calendar, AlertCircle,
  IndianRupee, TrendingUp, Activity, ArrowRight,
  CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import { getAdminDashboard } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { CardSkeleton } from '../../components/common/UIComponents';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'from-primary/10 to-primary-light/10', iconColor: 'text-primary', trend: '+12%' },
    { label: 'Total Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'from-accent/10 to-emerald-500/10', iconColor: 'text-accent', trend: '+3%' },
    { label: 'Total Appointments', value: stats.totalAppointments, icon: Calendar, color: 'from-purple-500/10 to-indigo-500/10', iconColor: 'text-purple-500', trend: '+8%' },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: Clock, color: 'from-blue-500/10 to-cyan-500/10', iconColor: 'text-blue-500', trend: 'Today' },
    { label: 'Pending Bills', value: stats.pendingBills, icon: AlertCircle, color: 'from-warning/10 to-orange-500/10', iconColor: 'text-warning', trend: 'Unpaid' },
    { label: 'Total Revenue', value: `₹${parseFloat(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'from-success/10 to-emerald-500/10', iconColor: 'text-success', trend: '+15%' },
  ] : [];

  const systemHealth = [
    { label: 'System Uptime', value: '99.9%', color: 'bg-success', width: '99' },
    { label: 'Active Sessions', value: '47', color: 'bg-primary-light', width: '60' },
    { label: 'DB Performance', value: '98%', color: 'bg-accent', width: '98' },
    { label: 'API Response', value: '145ms', color: 'bg-amber-500', width: '85' },
  ];

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-hero rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-full opacity-10">
            <BarChart3 size={200} className="text-white absolute right-4 bottom-0" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <Activity size={14} /> Admin Console
            </div>
            <h1 className="font-display font-bold text-white text-2xl mb-1">Executive Dashboard</h1>
            <p className="text-white/60 text-sm">
              Real-time overview of HealthSync operations · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)
          : cards.map((c, i) => (
            <motion.div key={i} variants={fadeUp} className="stat-card group">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                  <c.icon size={22} className={c.iconColor} />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  c.trend.includes('%') && c.trend.startsWith('+')
                    ? 'bg-success/10 text-success'
                    : c.trend === 'Unpaid'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-hover text-muted'
                }`}>
                  {c.trend.includes('%') && c.trend.startsWith('+') ? (
                    <span className="flex items-center gap-1"><TrendingUp size={10} /> {c.trend}</span>
                  ) : c.trend}
                </span>
              </div>
              <div className="font-display font-bold text-dark text-3xl mb-1">{c.value}</div>
              <div className="text-muted text-sm">{c.label}</div>
            </motion.div>
          ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-card border border-border/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-dark">System Health</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse-soft" /> All Systems Operational
            </span>
          </div>
          <div className="space-y-5">
            {systemHealth.map((m, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-dark text-sm font-medium">{m.label}</span>
                  <span className="font-display font-bold text-dark text-sm">{m.value}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${m.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.width}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-card border border-border/50 p-6"
        >
          <h3 className="font-display font-semibold text-dark mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'View Audit Logs', desc: 'Monitor all system activity', icon: CheckCircle2, path: '/admin/audit-logs', color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Revenue Overview', desc: `₹${parseFloat(stats?.totalRevenue || 0).toLocaleString('en-IN')} total collected`, icon: IndianRupee, path: '/admin', color: 'text-success', bg: 'bg-success/10' },
              { label: 'Pending Bills', desc: `${stats?.pendingBills || 0} invoices awaiting payment`, icon: AlertCircle, path: '/admin', color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'Appointment Analytics', desc: `${stats?.totalAppointments || 0} total appointments`, icon: Calendar, path: '/admin', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((item, i) => (
              <Link key={i} to={item.path} className="flex items-center gap-4 p-4 rounded-xl hover:bg-hover transition-colors group">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon size={18} className={item.color} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-dark text-sm">{item.label}</div>
                  <div className="text-muted text-xs">{item.desc}</div>
                </div>
                <ArrowRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

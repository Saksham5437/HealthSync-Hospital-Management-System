import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDoctorAppointments } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { StatusBadge, CardSkeleton } from '../../components/common/UIComponents';

export default function DoctorOverview() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoctorAppointments(user.id)
      .then(r => setAppointments(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const pending = appointments.filter(a => a.status === 'scheduled');
  const completed = appointments.filter(a => a.status === 'completed');

  const stats = [
    { label: 'Total Patients', value: appointments.length, icon: Users, color: 'from-primary/10 to-primary-light/10', iconColor: 'text-primary' },
    { label: "Today's Appointments", value: todayAppts.length, icon: Calendar, color: 'from-accent/10 to-green-500/10', iconColor: 'text-accent' },
    { label: 'Pending', value: pending.length, icon: Clock, color: 'from-warning/10 to-orange-500/10', iconColor: 'text-warning' },
    { label: 'Completed', value: completed.length, icon: CheckCircle2, color: 'from-success/10 to-emerald-500/10', iconColor: 'text-success' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-hero rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="text-white/70 text-sm mb-1">Clinical Dashboard</div>
            <h1 className="font-display font-bold text-white text-2xl mb-1">
              Dr. {user?.name}
            </h1>
            <p className="text-white/60 text-sm">
              {todayAppts.length > 0
                ? `You have ${todayAppts.length} appointment${todayAppts.length > 1 ? 's' : ''} today`
                : 'No appointments scheduled for today'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {loading ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />) :
          stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
                <s.icon size={22} className={s.iconColor} />
              </div>
              <div className="font-display font-bold text-dark text-2xl mb-1">{s.value}</div>
              <div className="text-muted text-sm">{s.label}</div>
            </motion.div>
          ))}
      </motion.div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-dark">Today's Schedule</h3>
          <Link to="/doctor/appointments" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            All Appointments <ArrowRight size={14} />
          </Link>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
          ) : todayAppts.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar size={36} className="text-muted/30 mx-auto mb-3" />
              <p className="text-muted text-sm">No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppts.map((a, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-hover transition-colors">
                  <div className="text-center w-16 flex-shrink-0">
                    <div className="font-bold text-primary text-sm">{a.appointment_time?.slice(0,5)}</div>
                    <div className="text-muted text-xs">AM/PM</div>
                  </div>
                  <div className="w-px h-10 bg-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-dark text-sm">{a.patient_name}</div>
                    <div className="text-muted text-xs truncate">{a.reason || 'Consultation'}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

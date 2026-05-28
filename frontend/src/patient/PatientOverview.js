import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, FileText, CreditCard, Activity, Clock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getPatientAppointments, getPatientMedicalRecords, getPatientBilling } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { CardSkeleton, StatusBadge, EmptyState } from '../../components/common/UIComponents';

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

export default function PatientOverview() {
  const { user } = useAuth();
  const [data, setData] = useState({ appointments: [], records: [], bills: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [apptRes, recRes, billRes] = await Promise.all([
          getPatientAppointments(user.id),
          getPatientMedicalRecords(user.id),
          getPatientBilling(user.id),
        ]);
        setData({
          appointments: apptRes.data || [],
          records: recRes.data || [],
          bills: billRes.data || [],
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (user?.id) fetch();
  }, [user]);

  const upcoming = data.appointments.filter(a => a.status === 'scheduled');
  const unpaidBills = data.bills.filter(b => b.payment_status === 'unpaid');
  const totalPaid = data.bills.filter(b => b.payment_status === 'paid')
    .reduce((s, b) => s + parseFloat(b.amount || 0), 0);

  const stats = [
    { label: 'Upcoming Appointments', value: upcoming.length, icon: Calendar, color: 'from-primary/10 to-primary-light/10', iconColor: 'text-primary', link: '/patient/appointments' },
    { label: 'Medical Records', value: data.records.length, icon: FileText, color: 'from-accent/10 to-green-500/10', iconColor: 'text-accent', link: '/patient/records' },
    { label: 'Pending Bills', value: unpaidBills.length, icon: AlertCircle, color: 'from-warning/10 to-orange-500/10', iconColor: 'text-warning', link: '/patient/billing' },
    { label: 'Total Spent', value: `₹${totalPaid.toFixed(0)}`, icon: CreditCard, color: 'from-success/10 to-emerald-500/10', iconColor: 'text-success', link: '/patient/billing' },
  ];

  return (
    <div>
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-gradient-hero rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <Activity size={14} />
              <span>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</span>
            </div>
            <h1 className="font-display font-bold text-white text-2xl mb-1">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-white/60 text-sm">
              {upcoming.length > 0
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}.`
                : 'No upcoming appointments. Stay healthy!'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((s, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Link to={s.link}>
                <div className="stat-card group cursor-pointer hover:-translate-y-0.5 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <s.icon size={22} className={s.iconColor} />
                  </div>
                  <div className="font-display font-bold text-dark text-2xl mb-1">{s.value}</div>
                  <div className="text-muted text-sm">{s.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-card border border-border/50">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-dark">Recent Appointments</h3>
            <Link to="/patient/appointments" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : data.appointments.length === 0 ? (
              <EmptyState icon={Calendar} title="No appointments yet" description="Book your first appointment with our doctors" />
            ) : (
              <div className="space-y-2">
                {data.appointments.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-hover transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-dark text-sm truncate">Dr. {a.doctor_name || 'Unknown'}</div>
                      <div className="text-muted text-xs">{a.appointment_date} at {a.appointment_time?.slice(0,5)}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Records */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-card border border-border/50">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-dark">Recent Medical Records</h3>
            <Link to="/patient/records" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            ) : data.records.length === 0 ? (
              <EmptyState icon={FileText} title="No records found" description="Your medical records will appear here" />
            ) : (
              <div className="space-y-2">
                {data.records.slice(0, 4).map((r, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-hover transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-dark text-sm truncate">{r.diagnosis}</div>
                      <div className="text-muted text-xs">Dr. {r.doctor_name} · {r.specialization}</div>
                      <div className="text-muted text-xs mt-0.5">{new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

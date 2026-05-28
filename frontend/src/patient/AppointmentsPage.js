import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, ChevronDown } from 'lucide-react';
import { getPatientAppointments } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { PageHeader, StatusBadge, TableSkeleton, EmptyState } from '../../components/common/UIComponents';

const FILTERS = ['All', 'Scheduled', 'Completed', 'Cancelled'];

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    getPatientAppointments(user.id)
      .then(r => setAppointments(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const filtered = filter === 'All'
    ? appointments
    : appointments.filter(a => a.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <PageHeader title="My Appointments" subtitle="View and manage all your appointments" />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === f
                ? 'bg-gradient-primary text-white shadow-card'
                : 'bg-white text-muted border border-border hover:bg-hover hover:text-primary'
            }`}
          >
            {f}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              filter === f ? 'bg-white/20 text-white' : 'bg-border text-muted'
            }`}>
              {f === 'All'
                ? appointments.length
                : appointments.filter(a => a.status?.toLowerCase() === f.toLowerCase()).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={5} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Calendar}
              title="No appointments found"
              description={filter !== 'All' ? `No ${filter.toLowerCase()} appointments` : 'You have no appointments yet'}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-hover border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden md:table-cell">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {a.doctor_name ? a.doctor_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'Dr'}
                        </div>
                        <div>
                          <div className="font-semibold text-dark text-sm">Dr. {a.doctor_name || 'N/A'}</div>
                          <div className="text-muted text-xs">{a.specialization || 'General'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-muted" />
                        <span className="text-dark font-medium">{a.appointment_date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted mt-1">
                        <Clock size={12} />
                        <span>{a.appointment_time?.slice(0, 5)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-dark/80 line-clamp-2 max-w-xs">{a.reason || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

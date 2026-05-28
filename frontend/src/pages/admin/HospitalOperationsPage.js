import React, { useEffect, useState } from 'react';
import { Calendar, Users, Stethoscope } from 'lucide-react';
import { getAdminAppointments, getAdminPatients } from '../../services/api';
import { PageHeader, TableSkeleton, EmptyState, StatusBadge } from '../../components/common/UIComponents';

export default function HospitalOperationsPage() {
  const [tab, setTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([getAdminAppointments(), getAdminPatients()])
      .then(([a, p]) => {
        setAppointments(a.data || []);
        setPatients(p.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const q = search.toLowerCase();
  const filteredAppts = appointments.filter((a) =>
    JSON.stringify(a).toLowerCase().includes(q)
  );
  const filteredPatients = patients.filter((p) =>
    JSON.stringify(p).toLowerCase().includes(q)
  );

  return (
    <div>
      <PageHeader
        title="Hospital Operations"
        subtitle="View all appointments, patients, billing, and allocations in one place"
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { id: 'appointments', label: 'All Appointments', icon: Calendar },
          { id: 'patients', label: 'All Patients', icon: Users },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
              tab === t.id ? 'bg-primary text-white' : 'bg-white border border-border text-muted'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <input
        className="input-field mb-6"
        placeholder="Search by name, doctor, status, room..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="bg-white rounded-2xl p-6 border"><TableSkeleton rows={10} /></div>
      ) : tab === 'appointments' ? (
        filteredAppts.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments" description="Appointments will appear here once patients book visits." />
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-hover border-b border-border">
                    {['ID', 'Patient', 'Doctor', 'Department', 'Date', 'Time', 'Status', 'Bill', 'Payment'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppts.map((a) => (
                    <tr key={a.appointment_id} className="table-row border-b border-border/50">
                      <td className="px-4 py-3 text-xs font-mono text-muted">#{a.appointment_id}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{a.patient_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1"><Stethoscope size={12} className="text-primary" />{a.doctor_name}</div>
                        <div className="text-xs text-muted">{a.specialization}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{a.department_name || '—'}</td>
                      <td className="px-4 py-3 text-sm">{a.appointment_date ? new Date(a.appointment_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-sm">{a.appointment_time?.slice(0, 5) || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3 text-sm font-semibold">{a.bill_amount ? `₹${a.bill_amount}` : '—'}</td>
                      <td className="px-4 py-3 text-sm">{a.payment_status ? <StatusBadge status={a.payment_status} /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredPatients.length === 0 ? (
        <EmptyState icon={Users} title="No patients" description="Register patients or run the seed script." />
      ) : (
        <div className="bg-white rounded-2xl border border-border/50 overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-hover border-b border-border">
                  {['ID', 'Patient', 'Username', 'Room', 'Ward', 'Appointments Done', 'Revenue Paid'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="table-row border-b border-border/50">
                    <td className="px-4 py-3 text-xs font-mono text-muted">#{p.patient_id}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{p.patient_name}</td>
                    <td className="px-4 py-3 text-sm text-muted">{p.username || p.email}</td>
                    <td className="px-4 py-3 text-sm">{p.room_number || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted">{p.ward_name || '—'}</td>
                    <td className="px-4 py-3 text-sm">{p.completed_appointments} / {p.total_appointments}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-success">₹{Number(p.total_paid || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

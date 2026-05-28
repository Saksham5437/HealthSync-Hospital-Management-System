import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Users, IndianRupee, CalendarCheck, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminStaff, updateStaffAttendance, getStaffPerformance, addStaffMember,
} from '../../services/api';
import { PageHeader, TableSkeleton, EmptyState, Modal, Spinner } from '../../components/common/UIComponents';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'On Leave' },
  { value: 'half_day', label: 'Half Day' },
];

const staffTypeBadge = (type) => {
  const map = {
    doctor: 'badge-info',
    nurse: 'badge-success',
    other: 'badge-muted',
  };
  return map[type] || 'badge-muted';
};

export default function StaffManagementPage() {
  const [tab, setTab] = useState('attendance');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', staff_type: 'nurse', department_name: '', phone: '' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [staffRes, perfRes] = await Promise.all([
        getAdminStaff(date),
        getStaffPerformance(),
      ]);
      setStaff(staffRes.data || []);
      setPerformance(perfRes.data || []);
      const initial = {};
      (staffRes.data || []).forEach((s) => {
        initial[s.staff_id] = {
          status: s.attendance_status || 'present',
          check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
          check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
          notes: s.attendance_notes || '',
        };
      });
      setDrafts(initial);
    } catch (e) {
      toast.error('Could not load staff data');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [date]);

  const saveAttendance = async (staffId) => {
    const draft = drafts[staffId];
    if (!draft) return;
    setSavingId(staffId);
    try {
      await updateStaffAttendance({
        staff_id: staffId,
        attendance_date: date,
        status: draft.status,
        check_in_time: draft.check_in_time || null,
        check_out_time: draft.check_out_time || null,
        notes: draft.notes || null,
      });
      toast.success('Attendance saved');
      load();
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.full_name.trim()) return toast.error('Name is required');
    setAdding(true);
    try {
      await addStaffMember(newStaff);
      toast.success('Staff member added');
      setAddOpen(false);
      setNewStaff({ full_name: '', staff_type: 'nurse', department_name: '', phone: '' });
      load();
    } catch {
      toast.error('Could not add staff member');
    } finally {
      setAdding(false);
    }
  };

  const presentCount = staff.filter((s) => (drafts[s.staff_id]?.status || s.attendance_status) === 'present').length;

  return (
    <div>
      <PageHeader
        title="Staff & Attendance"
        subtitle="Manage doctors, nurses, and hospital staff — track attendance and earnings"
        action={
          <button onClick={() => setAddOpen(true)} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={16} /> Add Staff
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Total Staff</div>
          <div className="font-display font-bold text-2xl text-dark">{staff.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Present Today</div>
          <div className="font-display font-bold text-2xl text-success">{presentCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Selected Date</div>
          <input type="date" className="input-field mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
          { id: 'performance', label: 'Performance & Earnings', icon: IndianRupee },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-primary text-white shadow-card' : 'bg-white border border-border text-muted hover:text-primary'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-6 border border-border/50"><TableSkeleton rows={8} /></div>
      ) : tab === 'attendance' ? (
        staff.length === 0 ? (
          <EmptyState icon={Users} title="No staff found" description="Run npm run setup-admin in the backend, or add staff manually." />
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-hover border-b border-border">
                    {['Staff', 'Type', 'Department', 'Status', 'Check In', 'Check Out', 'Notes', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => {
                    const draft = drafts[s.staff_id] || {};
                    return (
                      <tr key={s.staff_id} className="table-row border-b border-border/50">
                        <td className="px-4 py-3 font-semibold text-sm text-dark">{s.full_name}</td>
                        <td className="px-4 py-3"><span className={staffTypeBadge(s.staff_type)}>{s.staff_type}</span></td>
                        <td className="px-4 py-3 text-sm text-muted">{s.department_name || '—'}</td>
                        <td className="px-4 py-3">
                          <select
                            className="input-field py-1.5 text-sm"
                            value={draft.status || 'present'}
                            onChange={(e) => setDrafts((d) => ({ ...d, [s.staff_id]: { ...draft, status: e.target.value } }))}
                          >
                            {ATTENDANCE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input type="time" className="input-field py-1.5 text-sm w-28" value={draft.check_in_time || ''} onChange={(e) => setDrafts((d) => ({ ...d, [s.staff_id]: { ...draft, check_in_time: e.target.value } }))} />
                        </td>
                        <td className="px-4 py-3">
                          <input type="time" className="input-field py-1.5 text-sm w-28" value={draft.check_out_time || ''} onChange={(e) => setDrafts((d) => ({ ...d, [s.staff_id]: { ...draft, check_out_time: e.target.value } }))} />
                        </td>
                        <td className="px-4 py-3">
                          <input className="input-field py-1.5 text-sm min-w-[120px]" placeholder="Notes" value={draft.notes || ''} onChange={(e) => setDrafts((d) => ({ ...d, [s.staff_id]: { ...draft, notes: e.target.value } }))} />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => saveAttendance(s.staff_id)} disabled={savingId === s.staff_id} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
                            {savingId === s.staff_id ? <Spinner size={14} /> : <Save size={14} />} Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : performance.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No performance data" description="Performance appears once staff have linked appointments." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {performance.map((p, i) => (
            <motion.div key={p.staff_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="bg-white rounded-2xl p-5 border border-border/50 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-dark">{p.full_name}</h3>
                  <p className="text-muted text-sm">{p.department_name || 'General'} · <span className={staffTypeBadge(p.staff_type)}>{p.staff_type}</span></p>
                </div>
                <div className="text-right">
                  <div className="text-muted text-xs">Earned</div>
                  <div className="font-display font-bold text-success text-lg">₹{Number(p.earnings_from_patients || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-hover rounded-xl p-3">
                  <div className="font-bold text-dark">{p.total_appointments || 0}</div>
                  <div className="text-muted text-xs">Total Appts</div>
                </div>
                <div className="bg-hover rounded-xl p-3">
                  <div className="font-bold text-success">{p.completed_appointments || 0}</div>
                  <div className="text-muted text-xs">Completed</div>
                </div>
                <div className="bg-hover rounded-xl p-3">
                  <div className="font-bold text-warning">{p.pending_appointments || 0}</div>
                  <div className="text-muted text-xs">Pending</div>
                </div>
              </div>
              {Number(p.pending_earnings) > 0 && (
                <p className="text-xs text-warning mt-3">₹{Number(p.pending_earnings).toLocaleString('en-IN')} pending from unpaid bills</p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member">
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Full Name</label>
            <input className="input-field mt-1" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Staff Type</label>
            <select className="input-field mt-1" value={newStaff.staff_type} onChange={(e) => setNewStaff({ ...newStaff, staff_type: e.target.value })}>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Department</label>
            <input className="input-field mt-1" value={newStaff.department_name} onChange={(e) => setNewStaff({ ...newStaff, department_name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Phone</label>
            <input className="input-field mt-1" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} />
          </div>
          <button type="submit" disabled={adding} className="btn-primary w-full flex items-center justify-center gap-2">
            {adding ? <Spinner size={18} /> : <Plus size={16} />} Add Staff
          </button>
        </form>
      </Modal>
    </div>
  );
}

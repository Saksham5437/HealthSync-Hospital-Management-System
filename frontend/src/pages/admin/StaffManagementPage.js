import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Users, IndianRupee, CalendarCheck, Plus, Save,
  UserCheck, Stethoscope, HeartPulse, Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAdminStaff,
  updateStaffAttendance,
  bulkUpdateStaffAttendance,
  getStaffPerformance,
  addStaffMember,
} from '../../services/api';
import { PageHeader, TableSkeleton, EmptyState, Modal, Spinner } from '../../components/common/UIComponents';

const ATTENDANCE_OPTIONS = [
  { value: 'present', label: 'Arrived (Present)' },
  { value: 'absent', label: 'Absent' },
  { value: 'leave', label: 'On Leave' },
  { value: 'half_day', label: 'Half Day' },
];

const STAFF_FILTERS = [
  { id: 'all', label: 'All Staff', icon: Users },
  { id: 'doctor', label: 'Doctors', icon: Stethoscope },
  { id: 'nurse', label: 'Nurses', icon: HeartPulse },
  { id: 'other', label: 'Other', icon: Briefcase },
];

const staffTypeBadge = (type) => {
  const map = { doctor: 'badge-info', nurse: 'badge-success', other: 'badge-muted' };
  return map[type] || 'badge-muted';
};

const attendanceStatusBadge = (status) => {
  const map = {
    present: 'badge-success',
    absent: 'badge-danger',
    leave: 'badge-warning',
    half_day: 'badge-info',
  };
  return map[status] || 'badge-muted';
};

const currentTime = () => new Date().toTimeString().slice(0, 5);

export default function StaffManagementPage() {
  const [tab, setTab] = useState('attendance');
  const [filter, setFilter] = useState('all');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [staff, setStaff] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', staff_type: 'nurse', department_name: '', phone: '' });
  const [adding, setAdding] = useState(false);

  const buildDrafts = (rows) => {
    const initial = {};
    rows.forEach((s) => {
      initial[s.staff_id] = {
        status: s.attendance_status || '',
        check_in_time: s.check_in_time?.slice(0, 5) || '09:00',
        check_out_time: s.check_out_time?.slice(0, 5) || '17:00',
        notes: s.attendance_notes || '',
      };
    });
    return initial;
  };

  const load = async () => {
    setLoading(true);
    try {
      const staffType = filter === 'all' ? undefined : filter;
      const [staffRes, perfRes] = await Promise.all([
        getAdminStaff(date, staffType),
        getStaffPerformance(),
      ]);
      const rows = staffRes.data || [];
      setStaff(rows);
      setPerformance(perfRes.data || []);
      setDrafts(buildDrafts(rows));
    } catch {
      toast.error('Could not load staff data');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [date, filter]);

  const updateDraft = (staffId, patch) => {
    setDrafts((d) => ({
      ...d,
      [staffId]: { ...d[staffId], ...patch },
    }));
  };

  const markArrived = (staffId, autoSave = false) => {
    const patch = { status: 'present', check_in_time: currentTime() };
    updateDraft(staffId, patch);
    if (autoSave) {
      saveAttendance(staffId, { ...drafts[staffId], ...patch });
    }
  };

  const saveAttendance = async (staffId, draftOverride) => {
    const draft = draftOverride || drafts[staffId];
    if (!draft?.status) return toast.error('Select attendance status first');
    setSavingId(staffId);
    try {
      await updateStaffAttendance({
        staff_id: staffId,
        attendance_date: date,
        status: draft.status,
        check_in_time: draft.status === 'present' || draft.status === 'half_day' ? draft.check_in_time : null,
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

  const saveAllAttendance = async () => {
    const records = staff
      .map((s) => {
        const draft = drafts[s.staff_id];
        if (!draft?.status) return null;
        return {
          staff_id: s.staff_id,
          status: draft.status,
          check_in_time: draft.status === 'present' || draft.status === 'half_day' ? draft.check_in_time : null,
          check_out_time: draft.check_out_time || null,
          notes: draft.notes || null,
        };
      })
      .filter(Boolean);

    if (records.length === 0) return toast.error('Set attendance status for at least one person');

    setSavingAll(true);
    try {
      await bulkUpdateStaffAttendance({ attendance_date: date, records });
      toast.success(`Attendance saved for ${records.length} staff`);
      load();
    } catch {
      toast.error('Failed to save all attendance');
    } finally {
      setSavingAll(false);
    }
  };

  const markAllArrived = () => {
    const next = { ...drafts };
    staff.forEach((s) => {
      next[s.staff_id] = {
        ...next[s.staff_id],
        status: 'present',
        check_in_time: currentTime(),
      };
    });
    setDrafts(next);
    toast.success('Marked all as arrived — click Save All to confirm');
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

  const doctorCount = staff.filter((s) => s.staff_type === 'doctor').length;
  const nurseCount = staff.filter((s) => s.staff_type === 'nurse').length;
  const otherCount = staff.filter((s) => s.staff_type === 'other').length;
  const presentCount = staff.filter((s) => (drafts[s.staff_id]?.status || s.attendance_status) === 'present').length;
  const notMarkedCount = staff.filter((s) => !(drafts[s.staff_id]?.status || s.attendance_status)).length;

  return (
    <div>
      <PageHeader
        title="Staff & Attendance"
        subtitle="All doctors are listed here automatically. Mark arrival and attendance for doctors, nurses, and other staff."
        action={
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={markAllArrived} className="btn-secondary text-sm flex items-center gap-2">
              <UserCheck size={16} /> Mark All Arrived
            </button>
            <button type="button" onClick={saveAllAttendance} disabled={savingAll} className="btn-primary text-sm flex items-center gap-2">
              {savingAll ? <Spinner size={16} /> : <Save size={16} />} Save All
            </button>
            <button type="button" onClick={() => setAddOpen(true)} className="btn-secondary text-sm flex items-center gap-2">
              <Plus size={16} /> Add Staff
            </button>
          </div>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Doctors</div>
          <div className="font-display font-bold text-2xl text-primary">{doctorCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Nurses</div>
          <div className="font-display font-bold text-2xl text-success">{nurseCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Other Staff</div>
          <div className="font-display font-bold text-2xl text-dark">{otherCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Arrived Today</div>
          <div className="font-display font-bold text-2xl text-success">{presentCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-muted text-xs mb-1">Date</div>
          <input type="date" className="input-field mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STAFF_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
              filter === f.id ? 'bg-primary text-white' : 'bg-white border border-border text-muted'
            }`}
          >
            <f.icon size={15} /> {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'attendance', label: 'Daily Attendance', icon: ClipboardCheck },
          { id: 'performance', label: 'Performance & Earnings', icon: IndianRupee },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
              tab === t.id ? 'bg-primary text-white shadow-card' : 'bg-white border border-border text-muted'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {notMarkedCount > 0 && tab === 'attendance' && !loading && (
        <p className="text-sm text-warning bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 mb-4">
          {notMarkedCount} staff member(s) have no attendance marked for this date yet.
        </p>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-6 border border-border/50"><TableSkeleton rows={10} /></div>
      ) : tab === 'attendance' ? (
        staff.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No staff in this category"
            description="Doctors are added automatically when they register. Run setup-admin or add nurses/other staff manually."
          />
        ) : (
          <div className="bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-hover border-b border-border">
                    {['Staff', 'Role', 'Department', 'Arrival / Status', 'Check In', 'Check Out', 'Notes', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => {
                    const draft = drafts[s.staff_id] || {};
                    const savedStatus = s.attendance_status;
                    const currentStatus = draft.status || savedStatus;
                    return (
                      <tr key={s.staff_id} className="table-row border-b border-border/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-sm text-dark">{s.full_name}</div>
                          {s.doctor_id && <div className="text-xs text-muted">Doctor ID #{s.doctor_id}</div>}
                        </td>
                        <td className="px-4 py-3"><span className={staffTypeBadge(s.staff_type)}>{s.staff_type}</span></td>
                        <td className="px-4 py-3 text-sm text-muted">{s.department_name || '—'}</td>
                        <td className="px-4 py-3">
                          <select
                            className="input-field py-1.5 text-sm min-w-[140px]"
                            value={draft.status || ''}
                            onChange={(e) => updateDraft(s.staff_id, { status: e.target.value })}
                          >
                            <option value="">— Not marked —</option>
                            {ATTENDANCE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          {currentStatus && (
                            <div className="mt-1"><span className={attendanceStatusBadge(currentStatus)}>{currentStatus}</span></div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            className="input-field py-1.5 text-sm w-28"
                            value={draft.check_in_time || ''}
                            disabled={!draft.status || draft.status === 'absent' || draft.status === 'leave'}
                            onChange={(e) => updateDraft(s.staff_id, { check_in_time: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            className="input-field py-1.5 text-sm w-28"
                            value={draft.check_out_time || ''}
                            onChange={(e) => updateDraft(s.staff_id, { check_out_time: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="input-field py-1.5 text-sm min-w-[100px]"
                            placeholder="Notes"
                            value={draft.notes || ''}
                            onChange={(e) => updateDraft(s.staff_id, { notes: e.target.value })}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => markArrived(s.staff_id, true)}
                              className="btn-accent text-xs py-1.5 px-2 flex items-center justify-center gap-1"
                            >
                              <UserCheck size={13} /> Arrived
                            </button>
                            <button
                              type="button"
                              onClick={() => saveAttendance(s.staff_id)}
                              disabled={savingId === s.staff_id || !draft.status}
                              className="btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1"
                            >
                              {savingId === s.staff_id ? <Spinner size={13} /> : <Save size={13} />} Save
                            </button>
                          </div>
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
          {performance
            .filter((p) => filter === 'all' || p.staff_type === filter)
            .map((p, i) => (
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
              </motion.div>
            ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member (Nurse / Other)">
        <p className="text-sm text-muted mb-4">Doctors are added automatically from the doctors list. Use this form for nurses and other staff only.</p>
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Full Name</label>
            <input className="input-field mt-1" value={newStaff.full_name} onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Staff Type</label>
            <select className="input-field mt-1" value={newStaff.staff_type} onChange={(e) => setNewStaff({ ...newStaff, staff_type: e.target.value })}>
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

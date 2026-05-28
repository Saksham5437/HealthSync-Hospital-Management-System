import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, FilePlus, User, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDoctorAppointments, updateAppointmentStatus, createMedicalRecord } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { PageHeader, StatusBadge, Modal, Spinner, TableSkeleton, EmptyState } from '../../components/common/UIComponents';

export default function DoctorAppointments({ showRecords = false }) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const [recordForm, setRecordForm] = useState({ diagnosis: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = () => {
    getDoctorAppointments(user.id)
      .then(r => setAppointments(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user.id]);

  const markComplete = async (apptId) => {
    setUpdating(apptId);
    try {
      await updateAppointmentStatus(apptId, 'completed');
      toast.success('Appointment marked as completed');
      setAppointments(prev => prev.map(a =>
        a.appointment_id === apptId ? { ...a, status: 'completed' } : a
      ));
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!recordForm.diagnosis) { toast.error('Diagnosis is required'); return; }
    setSubmitting(true);
    try {
      await createMedicalRecord({
        appointment_id: recordModal.appointment_id,
        patient_id: recordModal.patient_id,
        doctor_id: user.id,
        diagnosis: recordForm.diagnosis,
        notes: recordForm.notes,
      });
      toast.success('Medical record added successfully');
      setRecordModal(null);
      setRecordForm({ diagnosis: '', notes: '' });
    } catch { toast.error('Failed to add record'); }
    finally { setSubmitting(false); }
  };

  const filters = ['All', 'Scheduled', 'Completed', 'Cancelled'];
  const filtered = filter === 'All' ? appointments : appointments.filter(a => a.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <PageHeader
        title={showRecords ? 'Add Medical Records' : 'Patient Appointments'}
        subtitle={showRecords ? 'Add diagnoses and notes for completed appointments' : 'Manage and update appointment statuses'}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f ? 'bg-gradient-primary text-white shadow-card' : 'bg-white text-muted border border-border hover:bg-hover'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Calendar} title="No appointments found" description="No appointments match the selected filter" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-hover border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider hidden md:table-cell">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                          {a.patient_name?.charAt(0) || 'P'}
                        </div>
                        <span className="font-semibold text-dark text-sm">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-dark font-medium">
                        <Calendar size={13} className="text-muted" />{a.appointment_date}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-0.5">
                        <Clock size={11} />{a.appointment_time?.slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-dark/80 max-w-xs line-clamp-1">{a.reason || '—'}</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {a.status === 'scheduled' && (
                          <button
                            onClick={() => markComplete(a.appointment_id)}
                            disabled={updating === a.appointment_id}
                            className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 hover:bg-success/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {updating === a.appointment_id ? <Spinner size={12} /> : <CheckCircle size={13} />}
                            Complete
                          </button>
                        )}
                        {(a.status === 'completed' || showRecords) && (
                          <button
                            onClick={() => { setRecordModal(a); setRecordForm({ diagnosis: '', notes: '' }); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <FilePlus size={13} /> Add Record
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      <Modal isOpen={!!recordModal} onClose={() => setRecordModal(null)} title="Add Medical Record" size="md">
        {recordModal && (
          <div>
            <div className="flex items-center gap-3 p-4 bg-hover rounded-xl mb-5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <User size={18} className="text-accent" />
              </div>
              <div>
                <div className="font-semibold text-dark text-sm">{recordModal.patient_name}</div>
                <div className="text-muted text-xs">{recordModal.appointment_date} · {recordModal.appointment_time?.slice(0,5)}</div>
              </div>
            </div>
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block font-semibold text-dark text-sm mb-2">Diagnosis <span className="text-danger">*</span></label>
                <input
                  className="input-field"
                  placeholder="Enter primary diagnosis..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-dark text-sm mb-2">Clinical Notes</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Detailed clinical observations, treatment plan, prescriptions..."
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRecordModal(null)} className="flex-1 btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary text-sm flex items-center justify-center gap-2">
                  {submitting ? <><Spinner size={16} /> Saving...</> : <><FilePlus size={16} /> Save Record</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { BedDouble, DoorOpen, UserPlus, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminRooms, getAdminPatients, assignPatientRoom, dischargePatientRoom } from '../../services/api';
import { PageHeader, CardSkeleton, EmptyState, Modal, Spinner } from '../../components/common/UIComponents';

const roomStatusColor = (status) => {
  if (status === 'available') return 'badge-success';
  if (status === 'occupied') return 'badge-warning';
  return 'badge-danger';
};

export default function RoomAllocationPage() {
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [form, setForm] = useState({ patient_id: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [roomsRes, patientsRes] = await Promise.all([getAdminRooms(), getAdminPatients()]);
      setRooms(roomsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch {
      toast.error('Could not load room data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unallocatedPatients = patients.filter((p) => !p.room_number);

  const openAssign = (room) => {
    setSelectedRoom(room);
    setForm({ patient_id: '', notes: '' });
    setAssignOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.patient_id) return toast.error('Select a patient');
    setSubmitting(true);
    try {
      await assignPatientRoom({
        patient_id: Number(form.patient_id),
        room_id: selectedRoom.room_id,
        notes: form.notes,
      });
      toast.success('Patient allocated to room');
      setAssignOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Allocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischarge = async (allocationId) => {
    if (!window.confirm('Discharge this patient from the room?')) return;
    try {
      await dischargePatientRoom(allocationId);
      toast.success('Patient discharged');
      load();
    } catch {
      toast.error('Could not discharge patient');
    }
  };

  const occupied = rooms.filter((r) => r.room_status === 'occupied').length;
  const available = rooms.filter((r) => r.room_status === 'available').length;

  return (
    <div>
      <PageHeader
        title="Room Allocation"
        subtitle="Assign patients to rooms and track ward occupancy"
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card"><div className="text-muted text-xs">Total Rooms</div><div className="font-display font-bold text-2xl">{rooms.length}</div></div>
        <div className="stat-card"><div className="text-muted text-xs">Occupied</div><div className="font-display font-bold text-2xl text-warning">{occupied}</div></div>
        <div className="stat-card"><div className="text-muted text-xs">Available</div><div className="font-display font-bold text-2xl text-success">{available}</div></div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState icon={BedDouble} title="No rooms configured" description="Run npm run setup-admin in the backend to create sample rooms." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.room_id} className="bg-white rounded-2xl p-5 border border-border/50 shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BedDouble size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-dark text-lg">Room {room.room_number}</h3>
                    <p className="text-muted text-xs">{room.ward_name} · Floor {room.floor_number}</p>
                  </div>
                </div>
                <span className={roomStatusColor(room.room_status)}>{room.room_status}</span>
              </div>
              <p className="text-xs text-muted mb-3 capitalize">{room.room_type} ward</p>
              {room.patient_name ? (
                <div className="bg-hover rounded-xl p-3 mb-3">
                  <div className="text-xs text-muted mb-1">Patient</div>
                  <div className="font-semibold text-dark text-sm">{room.patient_name}</div>
                  <div className="text-xs text-muted mt-1">
                    Admitted {room.admitted_at ? new Date(room.admitted_at).toLocaleDateString('en-IN') : '—'}
                  </div>
                </div>
              ) : (
                <div className="bg-hover rounded-xl p-3 mb-3 text-sm text-muted flex items-center gap-2">
                  <DoorOpen size={14} /> No patient assigned
                </div>
              )}
              {room.patient_name && room.allocation_id ? (
                <button onClick={() => handleDischarge(room.allocation_id)} className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-2">
                  <LogOut size={14} /> Discharge Patient
                </button>
              ) : room.room_status === 'available' ? (
                <button onClick={() => openAssign(room)} className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-2">
                  <UserPlus size={14} /> Assign Patient
                </button>
              ) : (
                <span className="text-xs text-muted block text-center">Room under maintenance</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 bg-white rounded-2xl border border-border/50 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display font-semibold text-dark">All Patients — Room Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-hover border-b border-border">
                {['Patient', 'Room', 'Ward', 'Floor', 'Admitted', 'Appointments', 'Paid'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-muted uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.patient_id} className="table-row border-b border-border/50">
                  <td className="px-4 py-3 font-semibold text-sm">{p.patient_name}</td>
                  <td className="px-4 py-3 text-sm">{p.room_number || <span className="text-warning">Not allocated</span>}</td>
                  <td className="px-4 py-3 text-sm text-muted">{p.ward_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted">{p.floor_number ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted">{p.admitted_at ? new Date(p.admitted_at).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-3 text-sm">{p.completed_appointments}/{p.total_appointments}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-success">₹{Number(p.total_paid || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign to Room ${selectedRoom?.room_number}`}>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Patient</label>
            <select className="input-field mt-1" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
              <option value="">Select patient</option>
              {unallocatedPatients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>{p.patient_name}</option>
              ))}
            </select>
            {unallocatedPatients.length === 0 && (
              <p className="text-xs text-warning mt-2">All patients already have a room. Discharge one first.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase">Notes</label>
            <input className="input-field mt-1" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional admission notes" />
          </div>
          <button type="submit" disabled={submitting || unallocatedPatients.length === 0} className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <Spinner size={18} /> : <UserPlus size={16} />} Assign Room
          </button>
        </form>
      </Modal>
    </div>
  );
}

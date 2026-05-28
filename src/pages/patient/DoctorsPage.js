import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Stethoscope, Star, Clock, BookOpen, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDoctors, bookAppointment } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { PageHeader, StatusBadge, Modal, Spinner, EmptyState } from '../../components/common/UIComponents';

const doctorSpecializationMap = {
  'Dr. Dr Rishi': { specialization: 'Cancer Specialist', department_name: 'Oncology', experience_years: 17, consultation_fee: 1400 },
  'Dr. Dr Arun J Gowda': { specialization: 'Cardiologist', department_name: 'Cardiology', experience_years: 15, consultation_fee: 1500 },
  'Dr. Dr Bhanumati B': { specialization: 'Neurologist', department_name: 'Neurology', experience_years: 13, consultation_fee: 1300 },
  'Dr. Dr Mahesh Kollur': { specialization: 'Pediatrician', department_name: 'Pediatrics', experience_years: 12, consultation_fee: 1200 },
  'Dr. Dr Rahul Patil': { specialization: 'Orthopedic Surgeon', department_name: 'Orthopedics', experience_years: 14, consultation_fee: 1100 },
  'Dr. Dr Ramesh Bhat': { specialization: 'Dermatologist', department_name: 'Dermatology', experience_years: 16, consultation_fee: 900 },
};

const normalizeDoctor = (doctor) => {
  const normalizedName = doctor.full_name?.trim();
  const override = doctorSpecializationMap[normalizedName] || doctorSpecializationMap[`Dr. ${normalizedName}`] || doctorSpecializationMap[normalizedName.replace(/^Dr\.\s*/, '')];
  const normalizedDoctor = override ? { ...doctor, ...override } : { ...doctor };
  normalizedDoctor.experience_years = Math.max(Number(normalizedDoctor.experience_years) || 11, 11);
  normalizedDoctor.consultation_fee = Math.min(Math.max(Number(normalizedDoctor.consultation_fee) || 800, 800), 1500);
  return normalizedDoctor;
};

const DoctorCard = ({ doctor, onBook }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
  >
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
        {doctor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-display font-bold text-dark text-base truncate">Dr. {doctor.full_name}</h3>
        <p className="text-muted text-sm">{doctor.specialization}</p>
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={11} className={i <= 4 ? "fill-amber-400 text-amber-400" : "text-border fill-border"} />
          ))}
          <span className="text-muted text-xs ml-1">4.8</span>
        </div>
      </div>
      <StatusBadge status={doctor.availability_status || 'available'} />
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-hover rounded-xl p-3">
        <div className="text-muted text-xs mb-0.5">Department</div>
        <div className="font-semibold text-dark text-xs truncate">{doctor.department_name}</div>
      </div>
      <div className="bg-hover rounded-xl p-3">
        <div className="text-muted text-xs mb-0.5">Experience</div>
        <div className="font-semibold text-dark text-xs">{doctor.experience_years} Years</div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-border">
      <div>
        <div className="text-muted text-xs">Consultation Fee</div>
        <div className="font-display font-bold text-primary text-lg">₹{doctor.consultation_fee}</div>
      </div>
      <button
        onClick={() => onBook(doctor)}
        disabled={doctor.availability_status === 'unavailable'}
        className="btn-primary text-xs py-2.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Book Now
      </button>
    </div>
  </motion.div>
);

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState({ appointment_date: '', appointment_time: '', reason: '' });
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getDoctors()
      .then(r => {
        const doctors = (r.data || []).map(normalizeDoctor);
        setDoctors(doctors);
        setFiltered(doctors);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(doctors.filter(d =>
      d.full_name?.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q) ||
      d.department_name?.toLowerCase().includes(q)
    ));
  }, [search, doctors]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!bookingForm.appointment_date || !bookingForm.appointment_time || !bookingForm.reason) {
      toast.error('Please fill all fields'); return;
    }
    setBooking(true);
    try {
      await bookAppointment({
        patient_id: user.id,
        doctor_id: selectedDoctor.doctor_id,
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time + ':00',
        reason: bookingForm.reason,
      });
      toast.success('Appointment booked successfully!');
      setSelectedDoctor(null);
      setBookingForm({ appointment_date: '', appointment_time: '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally { setBooking(false); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <PageHeader
        title="Find a Doctor"
        subtitle={`${doctors.length} specialists available across all departments`}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name, specialization, or department..."
            className="input-field pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 btn-secondary text-sm">
          <Filter size={16} /> Filter
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <div className="skeleton w-14 h-14 rounded-2xl" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 mb-2" />
                  <div className="skeleton h-3 w-24" />
                </div>
              </div>
              <div className="skeleton h-16 rounded-xl mb-4" />
              <div className="skeleton h-10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description={search ? `No results for "${search}"` : 'No doctors available at the moment'}
          action={search && <button onClick={() => setSearch('')} className="btn-secondary text-sm flex items-center gap-2"><X size={14} />Clear Search</button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <DoctorCard key={d.doctor_id} doctor={d} onBook={setSelectedDoctor} />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={!!selectedDoctor}
        onClose={() => { setSelectedDoctor(null); setBookingForm({ appointment_date: '', appointment_time: '', reason: '' }); }}
        title="Book Appointment"
        size="md"
      >
        {selectedDoctor && (
          <div>
            {/* Doctor summary */}
            <div className="flex items-center gap-4 p-4 bg-hover rounded-xl mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
                {selectedDoctor.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="font-semibold text-dark">Dr. {selectedDoctor.full_name}</div>
                <div className="text-muted text-sm">{selectedDoctor.specialization} · ₹{selectedDoctor.consultation_fee}</div>
              </div>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Date</label>
                <input
                  type="date"
                  min={today}
                  className="input-field"
                  value={bookingForm.appointment_date}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Time</label>
                <select
                  className="input-field"
                  value={bookingForm.appointment_time}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                  required
                >
                  <option value="">Select a time slot</option>
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-dark font-semibold text-sm mb-2">Reason for Visit</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for visit..."
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {booking ? <><Spinner size={16} /> Booking...</> : <><BookOpen size={16} /> Confirm Booking</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

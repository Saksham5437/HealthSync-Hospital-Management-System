import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Stethoscope, Calendar, Search } from 'lucide-react';
import { getPatientMedicalRecords } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { PageHeader, EmptyState, Skeleton } from '../../components/common/UIComponents';

export default function MedicalRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getPatientMedicalRecords(user.id)
      .then(r => setRecords(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const filtered = records.filter(r =>
    r.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Medical Records" subtitle="Your complete health history" />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input-field pl-11"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-border/50">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32 mb-3" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-border/50 p-6">
          <EmptyState icon={FileText} title="No medical records" description="Your medical records will appear here after consultations" />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={20} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-display font-bold text-dark text-base">{r.diagnosis}</h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <div className="flex items-center gap-1.5 text-muted text-xs">
                          <Stethoscope size={12} />
                          Dr. {r.doctor_name} · {r.specialization}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted text-xs">
                          <Calendar size={12} />
                          {new Date(r.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-success flex-shrink-0">Verified</span>
                  </div>
                  {r.notes && (
                    <div className="bg-hover rounded-xl p-4">
                      <p className="text-sm font-semibold text-muted mb-1">Doctor's Notes</p>
                      <p className="text-dark/80 text-sm leading-relaxed">{r.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

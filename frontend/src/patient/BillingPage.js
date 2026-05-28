import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Receipt, IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import { getPatientBilling } from '../../services/api';
import { useAuth } from '../../utils/AuthContext';
import { PageHeader, StatusBadge, EmptyState, TableSkeleton } from '../../components/common/UIComponents';

export default function BillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatientBilling(user.id)
      .then(r => setBills(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const totalPaid = bills.filter(b => b.payment_status === 'paid').reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalPending = bills.filter(b => b.payment_status === 'unpaid').reduce((s, b) => s + parseFloat(b.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Billing & Payments" subtitle="Manage your invoices and payment history" />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Bills', value: bills.length, icon: Receipt, color: 'from-primary/10 to-primary-light/10', iconColor: 'text-primary' },
          { label: 'Amount Paid', value: `₹${totalPaid.toFixed(2)}`, icon: IndianRupee, color: 'from-success/10 to-emerald-500/10', iconColor: 'text-success' },
          { label: 'Pending Amount', value: `₹${totalPending.toFixed(2)}`, icon: TrendingUp, color: 'from-warning/10 to-orange-500/10', iconColor: 'text-warning' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
              <s.icon size={22} className={s.iconColor} />
            </div>
            <div className="font-display font-bold text-dark text-2xl mb-1">{s.value}</div>
            <div className="text-muted text-sm">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display font-semibold text-dark">Invoice History</h3>
        </div>
        {loading ? (
          <div className="p-6"><TableSkeleton rows={4} /></div>
        ) : bills.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={CreditCard} title="No bills found" description="Your billing history will appear here" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-hover border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Appointment</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Generated</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary font-semibold text-sm">INV-{String(b.bill_id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-dark text-sm font-medium">APT-{String(b.appointment_id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-display font-bold text-dark text-base">₹{parseFloat(b.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted text-sm">
                        <Calendar size={13} />
                        {new Date(b.generated_at).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.payment_status} />
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

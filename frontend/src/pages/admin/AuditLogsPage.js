import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Search, RefreshCw, Shield, Clock } from 'lucide-react';
import { getAuditLogs } from '../../services/api';
import { PageHeader, TableSkeleton, EmptyState, Spinner } from '../../components/common/UIComponents';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const r = await getAuditLogs();
      setLogs(r.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter(l =>
    JSON.stringify(l).toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action) => {
    if (!action) return 'badge-muted';
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('insert')) return 'badge-success';
    if (a.includes('update') || a.includes('edit')) return 'badge-info';
    if (a.includes('delete') || a.includes('remove')) return 'badge-danger';
    if (a.includes('login') || a.includes('auth')) return 'badge-warning';
    return 'badge-muted';
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="Complete activity trail for compliance and security monitoring"
        action={
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {refreshing ? <Spinner size={16} /> : <RefreshCw size={16} />}
            Refresh
          </button>
        }
      />

      {/* Security badge */}
      <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl mb-6">
        <Shield size={18} className="text-primary" />
        <p className="text-primary/80 text-sm font-medium">
          All system activities are logged and timestamped for compliance. Logs are retained for 90 days.
        </p>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input-field pl-11"
          placeholder="Search logs by action, user, or table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-dark flex items-center gap-2">
            <ScrollText size={18} className="text-muted" />
            Activity Log
          </h3>
          <span className="text-muted text-sm">{filtered.length} entries</span>
        </div>

        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={ScrollText} title="No audit logs found" description={search ? `No logs match "${search}"` : 'No activity recorded yet'} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-hover border-b border-border">
                  {['Log ID', 'Action', 'Table', 'Record ID', 'User ID', 'Timestamp'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="table-row"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-muted">#{log.log_id || log.id || i + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getActionColor(log.action)}>
                        {log.action || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-hover text-dark px-2 py-1 rounded">
                        {log.table_name || log.table || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark/80">{log.record_id || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark/80">{log.user_id || log.performed_by || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted text-sm">
                        <Clock size={13} />
                        {log.timestamp || log.created_at
                          ? new Date(log.timestamp || log.created_at).toLocaleString('en-IN')
                          : '—'}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

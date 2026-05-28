import React from 'react';
import { X, InboxIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Skeleton ──────────────────────────────────────────
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-border/50">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-8 w-20 mb-2" />
    <Skeleton className="h-3 w-full" />
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-b border-border/50">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-white rounded-2xl shadow-modal w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="font-display font-bold text-lg text-dark">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-hover text-muted hover:text-dark transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Empty State ──────────────────────────────────────
export const EmptyState = ({ icon: Icon = InboxIcon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-hover rounded-2xl flex items-center justify-center mb-4">
      <Icon size={28} className="text-primary/40" />
    </div>
    <h4 className="font-display font-semibold text-dark mb-2">{title}</h4>
    <p className="text-muted text-sm max-w-sm mb-6">{description}</p>
    {action}
  </div>
);

// ─── Status Badge ─────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    scheduled: { cls: 'badge-info', label: 'Scheduled' },
    completed: { cls: 'badge-success', label: 'Completed' },
    cancelled: { cls: 'badge-danger', label: 'Cancelled' },
    pending: { cls: 'badge-warning', label: 'Pending' },
    paid: { cls: 'badge-success', label: 'Paid' },
    unpaid: { cls: 'badge-danger', label: 'Unpaid' },
    available: { cls: 'badge-success', label: 'Available' },
    unavailable: { cls: 'badge-danger', label: 'Unavailable' },
  };
  const cfg = map[status?.toLowerCase()] || { cls: 'badge-muted', label: status };
  return <span className={cfg.cls}>{cfg.label}</span>;
};

// ─── Page Header ─────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-8">
    <div>
      <h1 className="section-title text-2xl mb-1">{title}</h1>
      {subtitle && <p className="text-muted text-sm">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ─── Loading Spinner ──────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <svg
    className="animate-spin text-current"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

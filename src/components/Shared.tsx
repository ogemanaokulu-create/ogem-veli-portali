import { ReactNode } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

export function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, action, onAction, children, className }: { title: string; action?: string; onAction?: () => void; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className ?? ''}`}>
      <div className="panel-header">
        <h2>{title}</h2>
        {action && <button onClick={onAction}>{action}<ChevronRight size={15} /></button>}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ icon, label, value, change, tone }: { icon: ReactNode; label: string; value: string; change: string; tone: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={tone === 'orange' ? 'text-orange' : tone === 'yellow' ? 'text-yellow' : 'text-green'}>{change}</small>
      </div>
      <MoreHorizontal size={18} className="stat-more" />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <b>{title}</b>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return <div className="loading-state"><div className="spinner" /><span>{label ?? 'Yükleniyor…'}</span></div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}><MoreHorizontal size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

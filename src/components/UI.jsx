import React, { useEffect, useRef, useId } from 'react';
import { X, ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
export function IconButton({ label, children, ...props }) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}
export function Badge({ children, tone = 'neutral', dot = false }) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <i />}
      {children}
    </span>
  );
}
export function Avatar({ name, initials, size = 'normal', index = 0 }) {
  return (
    <span aria-hidden="true" className={`avatar ${size} avatar-${index % 6}`}>
      {initials ||
        name
          ?.split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')}
    </span>
  );
}
export function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function TextButton({ children, onClick, ...props }) {
  return (
    <button className="text-button" onClick={onClick} {...props}>
      {children}
      <ArrowUpRight size={14} />
    </button>
  );
}
export function Modal({ title, children, onClose, wide = false, drawer = false }) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      className={`modal ${wide ? 'wide' : ''} ${drawer ? 'drawer' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <IconButton label="Close dialog" onClick={onClose}>
          <X size={19} />
        </IconButton>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty-state">
      <span>
        <Check size={24} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Busy({ children = 'Working…' }) {
  return (
    <span className="busy">
      <LoaderCircle size={16} className="spin" />
      {children}
    </span>
  );
}
export function formatStatus(status) {
  return String(status || '')
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
export function timeAgo(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return 'Demo event';
  const diff = Math.max(0, Date.now() - d);
  return diff < 60000
    ? 'Just now'
    : diff < 3600000
      ? `${Math.floor(diff / 60000)}m ago`
      : diff < 86400000
        ? `${Math.floor(diff / 3600000)}h ago`
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

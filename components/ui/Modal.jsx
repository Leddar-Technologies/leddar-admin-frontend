import { X } from 'lucide-react';

export default function Modal({ title, open, onClose, children, className }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF22] p-4 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-xl bg-white p-6 shadow-card ${className || ''}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-200 hover:bg-neutral-100" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

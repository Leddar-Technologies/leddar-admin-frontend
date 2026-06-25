import { X } from 'lucide-react';

export default function Modal({ title, open, onClose, children, className }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#FFFFFF22] p-0 sm:p-4 backdrop-blur-sm">
      <div className={`w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl bg-white shadow-card flex flex-col max-h-[92vh] sm:max-h-[90vh] ${className || ''}`}>
        <div className="flex-shrink-0 px-5 pt-5 pb-4 flex items-center justify-between border-b border-[#F4EFEA]">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-200 hover:bg-neutral-100" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

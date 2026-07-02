"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, CheckCircle } from "lucide-react";

export default function FilterDropdown({ options, value, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-leather/10 focus:border-leather text-sm font-semibold bg-white text-[#6A5B54] ${
          open ? "ring-2 ring-leather/10 border-leather" : "border-[#E8DED5]"
        }`}
      >
        <span>{selected?.label || "Select"}</span>
        <ChevronDown
          size={16}
          className={`text-[#A39289] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E8DED5] bg-white shadow-xl overflow-hidden">
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                  isSelected
                    ? "bg-leather text-white font-semibold"
                    : "text-[#3C2F2A] hover:bg-atmosphere hover:text-leather"
                } ${i !== 0 ? "border-t border-[#F4EFEA]" : ""}`}
              >
                <span>{opt.label}</span>
                {isSelected && <CheckCircle size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

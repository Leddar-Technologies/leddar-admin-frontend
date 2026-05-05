"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  UserX,
  Phone,
  MapPin,
  Hammer,
  Eye,
  X,
  Mail,
  Calendar,
  Briefcase,
  ExternalLink,
} from "lucide-react";

const statusConfig = {
  APPROVED: {
    label: "Verified",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100",
    dot: "bg-emerald-500",
  },
  PENDING: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100",
    dot: "bg-amber-400",
  },
  REJECTED: {
    label: "Suspended",
    className:
      "bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-100",
    dot: "bg-rose-500",
  },
};

const actionConfig = {
  PENDING: [
    {
      type: "approve",
      label: "Approve",
      icon: CheckCircle2,
      className:
        "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200",
    },
    {
      type: "reject",
      label: "Suspend",
      icon: XCircle,
      className:
        "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200",
    },
  ],
  APPROVED: [
    {
      type: "reject",
      label: "Suspend",
      icon: UserX,
      className:
        "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200",
    },
  ],
  REJECTED: [
    {
      type: "approve",
      label: "Reinstate",
      icon: CheckCircle2,
      className:
        "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200",
    },
  ],
};

function getInitials(name = "") {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name = "") {
  const colors = [
    "bg-amber-100 text-amber-700",
    "bg-[#C4A882]/20 text-[#7A5C3A]",
    "bg-emerald-100 text-emerald-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function ArtisanDetailModal({ artisan, onClose }) {
  const status = artisan.status || "PENDING";
  const statusInfo = statusConfig[status] || statusConfig.PENDING;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E8DED5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header strip */}
        <div className="bg-gradient-to-br from-[#F5EDE4] to-[#EDE0D4] px-6 pt-6 pb-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/70 hover:bg-white text-[#A39289] hover:text-ink transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${getAvatarColor(artisan.fullName)}`}
            >
              {getInitials(artisan.fullName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">
                {artisan.fullName || "Unknown Artisan"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Hammer className="w-3.5 h-3.5 text-[#C4A882]" />
                <span className="text-sm text-[#6A5B54]">
                  {artisan.specialty || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge — floats over the card below */}
          <span
            className={`absolute bottom-[-14px] left-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${statusInfo.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Body */}
        <div className="px-6 pt-8 pb-6 flex flex-col gap-4">
          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3">
            <InfoRow icon={Mail} label="Email" value={artisan.email} />
            <InfoRow
              icon={Phone}
              label="WhatsApp"
              value={artisan.whatsapp}
            />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={
                artisan.location && artisan.location !== "N/A"
                  ? artisan.location
                  : "Not provided"
              }
            />
            <InfoRow
              icon={Calendar}
              label="Joined"
              value={artisan.registrationDate || "N/A"}
            />
          </div>

          {/* Portfolio */}
          {artisan.portfolio?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#A39289] mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Portfolio
              </p>
              <div className="flex flex-wrap gap-2">
                {/* <a> */}
                {artisan.portfolio.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url || item}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F2] rounded-lg border border-[#E8DED5] text-xs text-leather font-medium hover:border-leather hover:shadow-sm transition-all"
                  >
                    {item.title || item.name || `Work ${idx + 1}`}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF6F2] border border-[#F0E8E2]">
      <div className="w-7 h-7 rounded-lg bg-white border border-[#E8DED5] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[#C4A882]" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A39289]">
          {label}
        </p>
        <p className="text-sm text-ink font-medium mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

// ── Main Row ────────────────────────────────────────────────────────────────
export default function ArtisanRow({ artisan, onAction }) {
  const [loadingType, setLoadingType] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const status = artisan.status || "PENDING";
  const statusInfo = statusConfig[status] || statusConfig.PENDING;
  const actions = actionConfig[status] || [];

  const handleAction = async (type) => {
    setLoadingType(type);
    try {
      await onAction(artisan.id, type);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <>
      <tr className="border-b border-[#F0E8E2] transition-colors hover:bg-[#FDFAF8]">
        {/* Artisan Details */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(artisan.fullName)}`}
            >
              {getInitials(artisan.fullName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate max-w-[160px]">
                {artisan.fullName || "Unknown Artisan"}
              </p>
              <p className="text-xs text-[#A39289] truncate max-w-[160px]">
                {artisan.email}
              </p>
            </div>
          </div>
        </td>

        {/* Specialty */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <Hammer className="w-3.5 h-3.5 text-[#C4A882] flex-shrink-0" />
            <span className="text-sm text-[#5C4E45] font-medium">
              {artisan.specialty || "N/A"}
            </span>
          </div>
        </td>

        {/* Contact */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#C4A882]" />
              <span className="text-xs text-[#6A5B54]">
                {artisan.whatsapp || "N/A"}
              </span>
            </div>
            {artisan.location && artisan.location !== "N/A" && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-[#C4A882]" />
                <span className="text-xs text-[#A39289]">
                  {artisan.location}
                </span>
              </div>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </td>

        {/* Joined Date */}
        <td className="px-6 py-4">
          <span className="text-sm text-[#A39289]">
            {artisan.registrationDate || "N/A"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              const isLoading = loadingType === action.type;
              return (
                <button
                  key={action.type}
                  onClick={() => handleAction(action.type)}
                  disabled={!!loadingType}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
                >
                  {isLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ActionIcon className="w-3.5 h-3.5" />
                  )}
                  {isLoading ? "..." : action.label}
                </button>
              );
            })}

            {/* View Details icon button */}
            <button
              onClick={() => setShowDetail(true)}
              className="p-1.5 rounded-lg text-[#A39289] hover:bg-[#F5EDE4] hover:text-leather transition-colors"
              title="View artisan details"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Detail Modal */}
      {showDetail && (
        <ArtisanDetailModal
          artisan={artisan}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  UserX,
  Phone,
  MapPin,
  Hammer,
  Eye,
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

export default function ArtisanRow({ artisan, onAction }) {
  const [loadingType, setLoadingType] = useState(null);

  const status = artisan.status || "PENDING";
  const statusInfo = statusConfig[status] || statusConfig.PENDING;
  const actions = actionConfig[status] || [];

  const handleAction = async (type) => {
    setLoadingType(type);
    try {
      // ✅ Use userId for approve/reject API calls (admin routes use User ID)
      await onAction(artisan.userId, type);
    } finally {
      setLoadingType(null);
    }
  };

  return (
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
              <span className="text-xs text-[#A39289]">{artisan.location}</span>
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

          {/* View Details — links to artisan profile page */}
          <Link
            href={`/artisans/${artisan.id}`}
            className="p-1.5 rounded-lg text-[#A39289] hover:bg-[#F5EDE4] hover:text-leather transition-colors inline-flex items-center"
            title="View artisan details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

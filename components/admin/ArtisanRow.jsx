"use client";

import { Check, X, ExternalLink, MessageCircle } from "lucide-react";
import moment from "moment";
import Link from "next/link";

const statusStyles = {
  APPROVED: "bg-green-50 text-green-700 border-green-100",
  PENDING:  "bg-amber-50 text-amber-700 border-amber-100",
  REJECTED: "bg-red-50 text-red-700 border-red-100",
};

export default function ArtisanRow({ artisan, onAction }) {
  const handleClick = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    onAction(artisan.userId, type);
  };

  const specialty = Array.isArray(artisan.specialty)
    ? artisan.specialty.join(", ")
    : artisan.specialty || "N/A";

  return (
    <tr className="group hover:bg-atmosphere/30 transition-colors border-b border-[#F4EFEA] last:border-0 cursor-default">
      {/* Artisan Details */}
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="font-bold text-ink">
            {artisan.fullName || "Unknown Artisan"}
          </span>
          <span className="text-xs text-[#A39289]">{artisan.email}</span>
        </div>
      </td>

      {/* Specialty */}
      <td className="px-6 py-5 text-sm text-[#6A5B54] font-medium">
        {specialty}
      </td>

      {/* Contact */}
      <td className="px-6 py-5 text-sm text-green-600 font-bold">
        <a
          href={`https://wa.me/${artisan.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </td>

      {/* Status */}
      <td className="px-6 py-5">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
            statusStyles[artisan.status] || statusStyles.PENDING
          }`}
        >
          {artisan.status || "PENDING"}
        </span>
      </td>

      {/* Joined Date */}
      <td className="px-6 py-5 text-sm text-[#A39289]">
        {artisan.registrationDate
          ? moment(artisan.registrationDate).format("MMM DD, YYYY")
          : "N/A"}
      </td>

      {/* Actions */}
      <td className="px-6 py-5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {artisan.status !== "APPROVED" && (
            <button
              onClick={(e) => handleClick(e, "approve")}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {artisan.status !== "REJECTED" && (
            <button
              onClick={(e) => handleClick(e, "reject")}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
              title="Suspend"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <Link
            href={`/artisans/${artisan.id}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-atmosphere text-[#6A5B54] rounded-lg hover:bg-[#E8DED5] transition-all"
            title="View Details"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

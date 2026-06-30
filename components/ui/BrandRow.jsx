import {
  Check,
  X,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import moment from "moment";
import Link from "next/link";

export default function BrandRow({ brand, onAction }) {
  const statusStyles = {
    APPROVED: "bg-green-50 text-green-700 border-green-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };

  const handleButtonClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    onAction(brand.id, action);
  };

  const formatType = (s) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const types = Array.isArray(brand.productType)
    ? brand.productType.map(formatType)
    : brand.productType ? [formatType(brand.productType)] : [];
  const visible = types.slice(0, 2);
  const overflow = types.length - visible.length;

  return (
    <tr className="group hover:bg-atmosphere/30 transition-colors border-b border-[#F4EFEA] last:border-0 cursor-default">
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="font-bold text-ink">
            {brand.businessName || "Unnamed Brand"}
          </span>
          <span className="text-xs text-[#A39289]">{brand.email}</span>
        </div>
      </td>

      <td className="px-6 py-5">
        <div className="flex flex-wrap items-center gap-1">
          {visible.map((t) => (
            <span key={t} className="inline-block rounded-full border border-[#E8DED5] bg-atmosphere px-2.5 py-0.5 text-[10px] font-semibold text-leather whitespace-nowrap">
              {t}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-[10px] font-semibold text-[#A39289]">+{overflow} more</span>
          )}
          {types.length === 0 && <span className="text-sm text-[#A39289]">—</span>}
        </div>
      </td>

      <td className="px-6 py-5 text-sm text-green-600 font-bold">
        < a
          href={`https://wa.me/${brand.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </td>

      <td className="px-6 py-5">
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyles[brand.status] || statusStyles.PENDING}`}
        >
          {brand.status}
        </span>
      </td>

      <td className="px-6 py-5 text-sm text-[#A39289]">
        {moment(brand.createdAt).format("MMM DD, YYYY")}
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {brand.status !== "APPROVED" && (
            <button
              onClick={(e) => handleButtonClick(e, "approve")}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Approve / Activate"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {brand.status !== "REJECTED" && (
            <button
              onClick={(e) => handleButtonClick(e, "reject")}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
              title="Reject / Suspend"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <Link
            href={`/brands/${brand.id}`}
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
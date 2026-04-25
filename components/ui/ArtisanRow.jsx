import {
  Check,
  X,
  ExternalLink,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function ArtisanRow({ artisan, onAction }) {
  const statusStyles = {
    APPROVED: "bg-green-50 text-green-700 border-green-100",
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };

  const handleButtonClick = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    onAction(artisan.id, action);
  };

  return (
    <tr
      className="group hover:bg-atmosphere/30 transition-colors border-b border-[#F4EFEA] last:border-0 cursor-default"
      onClick={(e) => e.preventDefault()}
    >
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <span className="font-bold text-ink">
            {artisan.fullName || "Unnamed Artisan"}
          </span>
          <span className="text-xs text-[#A39289]">{artisan.email}</span>
        </div>
      </td>

      <td className="px-6 py-5 text-sm text-[#6A5B54] font-medium">
        {artisan.specialty || "General"}
      </td>

      <td className="px-6 py-5 text-sm text-green-600 font-bold">
        <a  {/* ✅ this was missing */}
          href={`https://wa.me/${artisan.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </a>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          {artisan.status === "APPROVED" ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : artisan.status === "REJECTED" ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Clock className="w-4 h-4 text-amber-500" />
          )}
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              statusStyles[artisan.status] || statusStyles.PENDING
            }`}
          >
            {artisan.status}
          </span>
        </div>
      </td>

      <td className="px-6 py-5 text-sm text-[#A39289]">
        {artisan.registrationDate}
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {artisan.status !== "APPROVED" && (
            <button
              onClick={(e) => handleButtonClick(e, "approve")}
              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm"
              title="Approve Artisan"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {artisan.status !== "REJECTED" && (
            <button
              onClick={(e) => handleButtonClick(e, "reject")}
              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
              title="Reject / Suspend"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            className="p-2 bg-atmosphere text-[#6A5B54] rounded-lg hover:bg-[#E8DED5] transition-all"
            onClick={(e) => e.stopPropagation()}
            title="View Portfolio"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
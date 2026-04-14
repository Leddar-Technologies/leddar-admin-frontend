import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function ArtisanRow({ artisan, onAction }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{artisan.fullName}</td>
      <td className="px-4 py-3 text-muted-300">{artisan.specialty}</td>
      <td className="px-4 py-3 text-muted-300">{artisan.whatsapp}</td>
      <td className="px-4 py-3"><Badge>{artisan.kycStatus}</Badge></td>
      <td className="px-4 py-3">
        <div className="h-10 w-12 rounded bg-neutral-300" />
      </td>
      <td className="px-4 py-3 text-muted-300">{formatDate(artisan.registrationDate)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Link href={`/artisans/${artisan.id}`} className="text-xs font-semibold text-leather underline">View Profile</Link>
          <Button size="sm" variant="accent" onClick={() => onAction(artisan.id, 'Active')}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => onAction(artisan.id, 'Rejected')}>Reject</Button>
          <Button size="sm" variant="outline" onClick={() => onAction(artisan.id, 'Suspended')}>Suspend</Button>
        </div>
      </td>
    </tr>
  );
}

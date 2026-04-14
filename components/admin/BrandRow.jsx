import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function BrandRow({ brand, onAction }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{brand.businessName}</td>
      <td className="px-4 py-3 text-muted-300">{brand.productType}</td>
      <td className="px-4 py-3 text-muted-300">{brand.whatsapp}</td>
      <td className="px-4 py-3"><Badge>{brand.kycStatus}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{formatDate(brand.registrationDate)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Link href={`/brands/${brand.id}`} className="text-xs font-semibold text-leather underline">View Profile</Link>
          <Button size="sm" variant="accent" onClick={() => onAction(brand.id, 'Active')}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => onAction(brand.id, 'Rejected')}>Reject</Button>
          <Button size="sm" variant="outline" onClick={() => onAction(brand.id, 'Suspended')}>Suspend</Button>
        </div>
      </td>
    </tr>
  );
}

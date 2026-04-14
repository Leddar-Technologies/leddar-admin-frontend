import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function QuoteRow({ quote, onCreateQuote, onProductionPricing }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{quote.brandName}</td>
      <td className="px-4 py-3"><Badge>{quote.requestType}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{quote.productType}</td>
      <td className="px-4 py-3 text-muted-300">{formatDate(quote.date)}</td>
      <td className="px-4 py-3"><Badge>{quote.status}</Badge></td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={() => onCreateQuote(quote)}>
            Create Quote
          </Button>
          {quote.status === 'Awaiting Production Pricing' ? (
            <Button size="sm" variant="accent" onClick={() => onProductionPricing(quote)}>
              Send Production Pricing
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

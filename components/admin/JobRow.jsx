import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function JobRow({ job, onReviewVideo }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{job.id}</td>
      <td className="px-4 py-3"><Badge>{job.jobType}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{job.brand}</td>
      <td className="px-4 py-3 text-muted-300">{job.assignedArtisan}</td>
      <td className="px-4 py-3 text-muted-300">{job.product}</td>
      <td className="px-4 py-3 text-muted-300">{formatDate(job.deadline)}</td>
      <td className="px-4 py-3"><Badge>{job.status}</Badge></td>
      <td className="px-4 py-3">
        {job.hasVideo ? (
          <Button size="sm" variant="accent" onClick={() => onReviewVideo(job)}>
            Review Video
          </Button>
        ) : (
          <span className="text-xs text-muted-200">Awaiting Upload</span>
        )}
      </td>
    </tr>
  );
}

import Badge from '@/components/ui/Badge';

export default function NotificationItem({ notification }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold text-ink">{notification.recipient}</td>
      <td className="px-4 py-3"><Badge>{notification.channel}</Badge></td>
      <td className="px-4 py-3 text-muted-300">{notification.triggerEvent}</td>
      <td className="px-4 py-3 text-muted-300">{notification.messagePreview}</td>
      <td className="px-4 py-3 text-muted-300">{new Date(notification.timestamp).toLocaleString()}</td>
      <td className="px-4 py-3"><Badge>{notification.status}</Badge></td>
    </tr>
  );
}

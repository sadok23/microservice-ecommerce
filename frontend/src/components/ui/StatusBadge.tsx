import Badge, { type BadgeTone } from './Badge';

const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'yellow',
  CONFIRMED: 'green',
  CANCELLED: 'red',
};

const STATUS_ICON: Record<string, string> = {
  PENDING: '⏳',
  CONFIRMED: '✓',
  CANCELLED: '✕',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Single source of truth for order-status badges.
 * Replaces the duplicated STATUS_STYLES maps in pages.
 */
export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'gray'} className={className}>
      <span aria-hidden className="text-[10px]">
        {STATUS_ICON[status] ?? ''}
      </span>
      {status}
    </Badge>
  );
}
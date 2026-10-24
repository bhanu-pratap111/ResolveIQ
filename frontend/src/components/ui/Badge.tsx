import { cn, STATUS_COLORS, PRIORITY_COLORS, formatStatus } from '../../utils/helpers';

interface BadgeProps {
  status?: string;
  priority?: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, priority, label, className }: BadgeProps) {
  const text = label || (status ? formatStatus(status) : priority || '');
  const color = status ? (STATUS_COLORS[status] || 'bg-gray-100 text-gray-600')
    : priority ? (PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-600')
    : 'bg-gray-100 text-gray-600';

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', color, className)}>
      {text}
    </span>
  );
}


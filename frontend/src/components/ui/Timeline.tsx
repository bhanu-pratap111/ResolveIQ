import { formatDate, formatStatus, STATUS_COLORS } from '../../utils/helpers';
import { cn } from '../../utils/helpers';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface TimelineItem {
  id: number;
  previous_status: string | null;
  new_status: string;
  changed_by_name: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-6">
        {items.map((item, i) => (
          <div key={item.id} className="relative flex items-start gap-4 pl-12">
            <div className={cn(
              'absolute left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm',
              STATUS_COLORS[item.new_status]?.includes('green') ? 'bg-green-100' :
              STATUS_COLORS[item.new_status]?.includes('red') ? 'bg-red-100' : 'bg-white'
            )}>
              {item.new_status === 'RESOLVED' || item.new_status === 'CLOSED'
                ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                : item.new_status === 'REJECTED'
                ? <AlertCircle className="h-5 w-5 text-red-600" />
                : <Clock className="h-5 w-5 text-gray-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_COLORS[item.new_status] || 'bg-gray-100 text-gray-600')}>
                  {formatStatus(item.new_status)}
                </span>
                {item.previous_status && (
                  <span className="text-xs text-gray-400">← from {formatStatus(item.previous_status)}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                By <span className="font-medium">{item.changed_by_name}</span>
                {' · '}{formatDate(item.created_at, true)}
              </p>
              {item.reason && <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded p-2">{item.reason}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


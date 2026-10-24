import { ReactNode } from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-gray-300 mb-4">
        {icon || <FileX className="h-12 w-12" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-red-300 mb-4">
        <FileX className="h-12 w-12" />
      </div>
      <p className="text-sm text-red-600 mb-3">{message || 'Failed to load data.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-teal-600 hover:underline font-medium">
          Try again
        </button>
      )}
    </div>
  );
}


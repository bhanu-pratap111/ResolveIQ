import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  limit?: number;
}

export function Pagination({ page, totalPages, onPageChange, total, limit }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * (limit || 20) + 1;
  const end = Math.min(page * (limit || 20), total || 0);

  return (
    <div className="flex items-center justify-between pt-4 border-t mt-4">
      {total !== undefined && (
        <p className="text-sm text-gray-500">Showing {start}–{end} of {total}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-gray-700 px-2">Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


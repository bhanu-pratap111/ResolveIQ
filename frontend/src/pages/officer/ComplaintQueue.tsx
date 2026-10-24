import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import { Search, Filter, AlertTriangle, ArrowUpDown } from 'lucide-react';

export default function ComplaintQueue() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [error, setError] = useState(false);

  function fetchQueue() {
    setLoading(true);
    setError(false);
    const params: any = { page, limit: 12 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (isOverdue) params.is_overdue = 'true';

    complaintService.list(params)
      .then(res => {
        setComplaints(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchQueue();
  }, [page, status, priority, isOverdue]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bureau Complaint Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, investigate, and record official resolutions for institutional grievances
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference number or title..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="UNDER_ACTION">Under Action</option>
            <option value="AWAITING_RESPONSE">Awaiting Response</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <label className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={isOverdue}
              onChange={(e) => { setIsOverdue(e.target.checked); setPage(1); }}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-xs font-semibold text-rose-700 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Overdue Only
            </span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : error ? (
          <ErrorState message="Could not load complaint queue." onRetry={fetchQueue} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No complaints in queue"
            description="No complaints matched your current queue filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Deadline</th>
                  <th className="py-3 px-4 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-900 text-xs">
                      {c.reference_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 max-w-xs truncate">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {c.institution_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {c.category_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {c.is_overdue ? (
                        <span className="text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {formatDate(c.deadline_date)} (Overdue)
                        </span>
                      ) : (
                        <span className="text-gray-500">{formatDate(c.deadline_date)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/officer/complaints/${c.id}`}
                        className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Open Workspace →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              total={pagination.total}
              limit={pagination.limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}


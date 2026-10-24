import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { StatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/helpers';
import { Search, Filter, PlusCircle } from 'lucide-react';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [error, setError] = useState(false);

  function fetchComplaints() {
    setLoading(true);
    setError(false);
    const params: any = { page, limit: 10 };
    if (search) params.search = search;
    if (status) params.status = status;

    complaintService.list(params)
      .then(res => {
        setComplaints(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchComplaints();
  }, [page, status]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Grievances</h1>
          <p className="text-sm text-gray-500 mt-1">Review the status and investigation trail of all submitted complaints</p>
        </div>
        <Link
          to="/student/submit"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          File New Complaint
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference number or subject..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : error ? (
          <ErrorState message="Could not retrieve complaints." onRetry={fetchComplaints} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="No matching complaints found"
            description="Try modifying your search filter or file a new grievance."
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Filed On</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                      {c.category_name || 'Triage Pending'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/student/complaints/${c.id}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                      >
                        View Details →
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


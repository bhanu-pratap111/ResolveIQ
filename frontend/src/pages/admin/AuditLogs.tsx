import { useState, useEffect } from 'react';
import { auditService } from '../../services/user.service';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/helpers';
import { FileCheck2, Filter, Shield } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    auditService.getActions()
      .then(res => setActions(res.data.data || []))
      .catch(() => {});
  }, []);

  function fetchLogs() {
    setLoading(true);
    const params: any = { page, limit: 15 };
    if (selectedAction) params.action = selectedAction;

    auditService.list(params)
      .then(res => {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLogs();
  }, [page, selectedAction]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">
            Append-only tamper-evident compliance log recording all system actions, assignments, and status transitions
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg">
          <Shield className="h-4 w-4 text-emerald-600" />
          Immutable Storage
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={selectedAction}
          onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
          className="py-1.5 px-3 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">All Action Types</option>
          {actions.map((act) => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400 italic">No audit log entries recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-4">Actor</th>
                  <th className="py-4 px-4">Target Entity</th>
                  <th className="py-4 px-6">Payload / Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-xs text-gray-500 font-mono">
                      {formatDate(log.created_at, true)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-800 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-gray-900">
                      {log.actor_name || log.actor_email || 'System / Auto'}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 capitalize">
                      {log.entity_type ? `${log.entity_type} #${log.entity_id || ''}` : '—'}
                    </td>
                    <td className="py-3 px-6 text-xs font-mono text-gray-600 max-w-xs truncate">
                      {log.new_value ? JSON.stringify(log.new_value) : log.notes || '—'}
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


import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analytics.service';
import { complaintService } from '../../services/complaint.service';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/helpers';
import {
  Building2,
  Calendar,
  Download,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function BureauMonitoring() {
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drilldown state
  const [selectedBureau, setSelectedBureau] = useState<any>(null);
  const [drilldownComplaints, setDrilldownComplaints] = useState<any[]>([]);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  function fetchStats() {
    setLoading(true);
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    analyticsService.getBureauStats(params)
      .then(res => setBureaus(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  function handleDrilldown(bureau: any) {
    setSelectedBureau(bureau);
    setDrilldownLoading(true);
    complaintService.list({ bureau_id: bureau.id, limit: 50 })
      .then(res => setDrilldownComplaints(res.data.data))
      .catch(() => {})
      .finally(() => setDrilldownLoading(false));
  }

  function exportCSV() {
    if (bureaus.length === 0) return;
    const headers = ['Bureau Name', 'Total', 'Under Review', 'Under Action', 'Awaiting Response', 'Resolved', 'Closed', 'Rejected', 'Overdue', 'Resolution Rate (%)', 'Avg Processing Days'];
    const rows = bureaus.map(b => [
      `"${b.bureau_name}"`,
      b.total || 0,
      b.under_review || 0,
      b.under_action || 0,
      b.awaiting_response || 0,
      b.resolved || 0,
      b.closed || 0,
      b.rejected || 0,
      b.overdue || 0,
      b.resolution_rate || 0,
      b.avg_days || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResolveIQ_Bureau_Monitoring_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const chartData = bureaus.map(b => ({
    name: b.bureau_name.replace(' Bureau', ''),
    Active: (b.under_action || 0) + (b.under_review || 0),
    Resolved: (b.resolved || 0) + (b.closed || 0),
    Overdue: b.overdue || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bureau & Cell Monitoring Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comparative performance, caseload distribution, and SLA resolution compliance across AICTE bureaus.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4 text-sm">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-rose-600" />
          Filter Time Period:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">From</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">To</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-xs text-rose-600 hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Monitoring Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-4 px-6">Bureau Name</th>
                  <th className="py-4 px-4 text-center">Total</th>
                  <th className="py-4 px-4 text-center">Review</th>
                  <th className="py-4 px-4 text-center">Action</th>
                  <th className="py-4 px-4 text-center">Awaiting</th>
                  <th className="py-4 px-4 text-center">Resolved</th>
                  <th className="py-4 px-4 text-center">Closed</th>
                  <th className="py-4 px-4 text-center">Rejected</th>
                  <th className="py-4 px-4 text-center">Overdue</th>
                  <th className="py-4 px-4 text-center">Resolution Rate</th>
                  <th className="py-4 px-4 text-center">Avg Days</th>
                  <th className="py-4 px-4 text-right">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bureaus.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6 font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-rose-600" />
                      {b.bureau_name}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-gray-900">{b.total || 0}</td>
                    <td className="py-4 px-4 text-center text-purple-600 font-medium">{b.under_review || 0}</td>
                    <td className="py-4 px-4 text-center text-amber-600 font-medium">{b.under_action || 0}</td>
                    <td className="py-4 px-4 text-center text-gray-500">{b.awaiting_response || 0}</td>
                    <td className="py-4 px-4 text-center text-emerald-600 font-bold">{b.resolved || 0}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{b.closed || 0}</td>
                    <td className="py-4 px-4 text-center text-rose-600">{b.rejected || 0}</td>
                    <td className="py-4 px-4 text-center">
                      {b.overdue > 0 ? (
                        <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-xs">
                          {b.overdue}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-gray-900">
                      {b.resolution_rate !== null ? `${b.resolution_rate}%` : '0.0%'}
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-mono text-gray-500">
                      {b.avg_days ? `${b.avg_days}d` : '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDrilldown(b)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg"
                      >
                        Inspect Cases →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Comparative Bureau Workload & Resolution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down Modal */}
      <Modal
        open={!!selectedBureau}
        onClose={() => setSelectedBureau(null)}
        title={`Contributing Cases: ${selectedBureau?.bureau_name}`}
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Drill-down breakdown of complaints currently active or resolved under this bureau.
          </p>

          {drilldownLoading ? (
            <TableSkeleton rows={4} />
          ) : drilldownComplaints.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">No cases found under this bureau.</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 border-b sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Ref No.</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Overdue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {drilldownComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-900">{c.reference_number}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900 truncate max-w-xs">{c.title}</td>
                      <td className="py-2.5 px-3 text-gray-500">{c.institution_name}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-2.5 px-3">
                        {c.is_overdue ? (
                          <span className="font-bold text-red-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}


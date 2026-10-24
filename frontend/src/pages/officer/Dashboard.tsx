import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analytics.service';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import {
  Inbox,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Layers
} from 'lucide-react';

export default function OfficerDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getOfficerDashboard()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recent = data?.recentComplaints || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bureau Workload Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complaints routed to your assigned bureau. Monitor SLAs and review cross-bureau intelligence links.
          </p>
        </div>
        <Link
          to="/officer/queue"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
        >
          <Inbox className="h-4 w-4" />
          Open Complaint Queue
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Active Workload"
          value={stats.total || 0}
          icon={<Inbox className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Under Review"
          value={stats.under_review || 0}
          icon={<Clock className="h-5 w-5" />}
          color="purple"
        />
        <KPICard
          title="Under Action"
          value={stats.under_action || 0}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
        <KPICard
          title="Pending Student"
          value={stats.awaiting_response || 0}
          icon={<Clock className="h-5 w-5" />}
          color="gray"
        />
        <KPICard
          title="Overdue SLAs"
          value={stats.overdue || 0}
          subtitle="Past statutory deadline"
          icon={<AlertTriangle className="h-5 w-5" />}
          color={stats.overdue > 0 ? "red" : "green"}
        />
      </div>

      {/* Recent Workload */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Recently Updated Bureau Complaints</h2>
          </div>
          <Link to="/officer/queue" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            Full Queue <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="Queue is clear"
            description="There are currently no active complaints assigned to your bureau queue."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Overdue</th>
                  <th className="py-3 px-4 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((c: any) => (
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
                    <td className="py-3.5 px-4">
                      <StatusBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {c.is_overdue ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">On Track</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/officer/complaints/${c.id}`}
                        className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Workspace →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


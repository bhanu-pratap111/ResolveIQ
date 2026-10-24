import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analytics.service';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/helpers';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const s = data?.stats || {};
  const trend = data?.trend || [];
  const statusDist = (data?.statusDistribution || []).map((x: any) => ({
    name: x.status.replace(/_/g, ' '),
    value: x.count,
  }));
  const bureauStats = (data?.bureauStats || []).map((x: any) => ({
    name: x.bureau.replace(' Bureau', ''),
    complaints: x.count,
  }));
  const overdueAlerts = data?.overdueAlerts || [];
  const recent = data?.recentActivity || [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#f97316', '#10b981', '#6b7280', '#ef4444'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">National AICTE Intelligence Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time aggregate analytics across all bureaus, cells, and affiliated technical institutions.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/bureaus"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Bureau Monitoring Matrix
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Total Registered"
          value={s.total || 0}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        <KPICard
          title="Resolved Cases"
          value={s.resolved || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Under Action"
          value={s.under_action || 0}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
        />
        <KPICard
          title="Under Review"
          value={s.under_review || 0}
          icon={<Clock className="h-5 w-5" />}
          color="purple"
        />
        <KPICard
          title="Awaiting Response"
          value={s.awaiting_response || 0}
          icon={<Clock className="h-5 w-5" />}
          color="gray"
        />
        <KPICard
          title="Unassigned Triage"
          value={s.unassigned || 0}
          icon={<Building2 className="h-5 w-5" />}
          color="teal"
        />
        <KPICard
          title="SLA Overdue"
          value={s.overdue || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={s.overdue > 0 ? "red" : "gray"}
        />
        <KPICard
          title="Resolution Rate"
          value={`${s.resolution_rate || 0}%`}
          subtitle="(Resolved + Closed) / Total"
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Escalation Alerts (if any) */}
      {overdueAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <h3 className="font-bold text-rose-900 text-sm uppercase tracking-wider">
              High Priority Escalation Alerts ({overdueAlerts.length} Overdue Cases)
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {overdueAlerts.map((oa: any) => (
              <div key={oa.id} className="p-3.5 bg-white border border-rose-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span className="font-mono text-rose-900">{oa.reference_number}</span>
                  <span className="text-rose-600">Past SLA</span>
                </div>
                <p className="font-medium text-gray-800 truncate">{oa.title}</p>
                <p className="text-[10px] text-gray-500">Bureau: {oa.bureau_name || 'Unassigned'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Monthly Grievance Filing Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#e11d48" fill="#ffe4e6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {statusDist.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bureau Comparison Bar Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Active Complaints by Primary AICTE Bureau</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bureauStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="complaints" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent System Activity */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Live Complaint Register Stream</h3>
          <Link to="/admin/assignments" className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1">
            Assignment Center <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-900 text-xs">
                    {r.reference_number}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 truncate max-w-xs">
                    {r.title}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {r.institution_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500">
                    {formatDate(r.updated_at, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


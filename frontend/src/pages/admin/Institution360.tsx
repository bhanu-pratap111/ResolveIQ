import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { institutionService } from '../../services/institution.service';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';
import {
  School,
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Institution360() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      institutionService.get360(parseInt(id))
        .then(res => setData(res.data.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Institution 360° Profile...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Institution not found.</p>
        <Link to="/admin/institutions" className="mt-4 inline-block text-rose-600 font-semibold text-sm">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const inst = data.institution || {};
  const stats = data.stats || {};
  const trend = data.trend || [];
  const catBreakdown = (data.categoryBreakdown || []).map((x: any) => ({
    name: x.category || 'Uncategorized',
    value: x.count,
  }));
  const complaints = data.recentComplaints || [];

  const COLORS = ['#e11d48', '#4f46e5', '#0d9488', '#d97706', '#2563eb', '#84cc16'];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Link to="/admin/institutions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back to Institutions
        </Link>
        <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-full">
          AICTE 360° Profile
        </span>
      </div>

      {/* Institution Identity Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
            <School className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900">{inst.name}</h1>
              {inst.is_demo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Code: <span className="font-mono font-semibold">{inst.code || 'N/A'}</span> · {inst.type?.toUpperCase()} · {inst.city}, {inst.state}
            </p>
          </div>
        </div>
      </div>

      {/* Compliance & Due Process Note */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Notice of Due Process:</strong> High grievance count does not establish guilt or adverse regulatory action.
          Complaints reflect submitted allegations undergoing independent investigation across respective AICTE bureaus.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Total Registered"
          value={stats.total || 0}
          icon={<FileText className="h-5 w-5" />}
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
          title="Resolved"
          value={stats.resolved || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <KPICard
          title="Overdue SLAs"
          value={stats.overdue || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={stats.overdue > 0 ? "red" : "gray"}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Grievance Trends (Last 12 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#e11d48" fill="#ffe4e6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-900 text-base">Complaint Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {catBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Complaints History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Consolidated Complaints Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
              <tr>
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Bureau</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Filed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complaints.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900 text-xs">{c.reference_number}</td>
                  <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs">{c.title}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{c.bureau_name || 'Unassigned'}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{c.category_name || '—'}</td>
                  <td className="py-3 px-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


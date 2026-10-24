import { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analytics.service';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { Download, BarChart2, TrendingUp, PieChart as PieIcon, Clock } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AnalyticsReports() {
  const [trends, setTrends] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [resTimes, setResTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getComplaintTrends(12),
      analyticsService.getCategoryDistribution(),
      analyticsService.getStatusDistribution(),
      analyticsService.getResolutionTime(),
    ])
      .then(([tRes, cRes, sRes, rRes]) => {
        setTrends(tRes.data.data);
        setCategories((cRes.data.data || []).map((x: any) => ({ name: x.category || 'Other', count: x.count })));
        setStatuses((sRes.data.data || []).map((x: any) => ({ name: x.status.replace(/_/g, ' '), count: x.count })));
        setResTimes(rRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const COLORS = ['#e11d48', '#4f46e5', '#0d9488', '#d97706', '#2563eb', '#8b5cf6', '#64748b'];

  function exportReportCSV() {
    const headers = ['Category', 'Complaint Count'];
    const rows = categories.map(c => [`"${c.name}"`, c.count]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ResolveIQ_Category_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Generating analytics reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Intelligence Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Institutional grievance patterns, resolution efficiency, and category volumes
          </p>
        </div>
        <button
          onClick={exportReportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export Category Breakdown
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-600" />
            <h3 className="font-bold text-gray-900 text-base">Annual Filing & Resolution Trends</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#e11d48" fill="#ffe4e6" strokeWidth={2} name="Total Filed" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-base">Current Status Distribution</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statuses} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {statuses.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-gray-900 text-base">Grievance Volume by Category</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Processing Days */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-gray-900 text-base">Average Resolution Time (Days by Category)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resTimes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} unit="d" />
                <Tooltip />
                <Bar dataKey="avg_days" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Days to Resolve" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}


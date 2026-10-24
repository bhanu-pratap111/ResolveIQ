import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../../services/analytics.service';
import { KPICard } from '../../components/ui/KPICard';
import { StatusBadge } from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/helpers';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  ArrowRight
} from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getStudentDashboard()
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

  const stats = data?.stats || {};
  const recent = data?.recentComplaints || [];

  return (
    <div className="space-y-8">
      {/* Welcome header & CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track grievances, view bureau updates, and respond to inquiries</p>
        </div>
        <Link
          to="/student/submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          <PlusCircle className="h-5 w-5" />
          File New Complaint
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          title="Total Complaints"
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
          title="Action Required"
          value={stats.awaiting_response || 0}
          subtitle="Awaiting your response"
          icon={<AlertCircle className="h-5 w-5" />}
          color={stats.awaiting_response > 0 ? "red" : "gray"}
        />
        <KPICard
          title="Resolved"
          value={stats.resolved || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Recent Complaints */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Complaints</h2>
          <Link to="/student/complaints" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No complaints filed yet"
            description="You have not submitted any complaints to the AICTE grievance platform."
            action={
              <Link
                to="/student/submit"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold"
              >
                Submit Your First Complaint
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {formatDate(c.updated_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/student/complaints/${c.id}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800"
                      >
                        Details →
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


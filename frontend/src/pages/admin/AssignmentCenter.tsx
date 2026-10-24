import { useState, useEffect } from 'react';
import { complaintService } from '../../services/complaint.service';
import { bureauService } from '../../services/bureau.service';
import { userService } from '../../services/user.service';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import { formatDate } from '../../utils/helpers';
import { GitPullRequestDraft, AlertTriangle, Building2, UserCheck, Search } from 'lucide-react';

export default function AssignmentCenter() {
  const [activeTab, setActiveTab] = useState<'unassigned' | 'overdue'>('unassigned');
  const [complaints, setComplaints] = useState<any[]>([]);
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [selectedBureauId, setSelectedBureauId] = useState('');
  const [selectedCellId, setSelectedCellId] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [assigning, setAssigning] = useState(false);

  const toast = useToast();

  function loadQueue() {
    setLoading(true);
    const params: any = { limit: 50 };
    if (activeTab === 'unassigned') {
      params.status = 'REGISTERED';
    } else {
      params.is_overdue = 'true';
    }

    complaintService.list(params)
      .then(res => setComplaints(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadQueue();
  }, [activeTab]);

  useEffect(() => {
    bureauService.list().then(res => setBureaus(res.data.data)).catch(() => {});
    userService.list({ role: 'officer', limit: 100 }).then(res => setOfficers(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBureauId) {
      bureauService.listCells(parseInt(selectedBureauId)).then(res => setCells(res.data.data)).catch(() => {});
    } else {
      setCells([]);
    }
  }, [selectedBureauId]);

  function openAssign(c: any) {
    setSelectedComplaint(c);
    setSelectedBureauId(c.current_bureau_id ? String(c.current_bureau_id) : '');
    setSelectedCellId('');
    setSelectedOfficerId('');
    setTransferReason('');
    setAssignModalOpen(true);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBureauId) {
      toast.error('Please select an assigned bureau.');
      return;
    }

    setAssigning(true);
    try {
      // Direct status/assignment update via complaint service or update
      await complaintService.changeStatus(
        selectedComplaint.id,
        'UNDER_REVIEW',
        transferReason || 'Assigned by Administrator'
      );
      // Update ai suggestion / routing mapping
      await complaintService.updateAiSuggestion(
        selectedComplaint.id,
        true,
        undefined,
        parseInt(selectedBureauId)
      );

      toast.success(`Complaint ${selectedComplaint.reference_number} assigned successfully.`);
      setAssignModalOpen(false);
      loadQueue();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment & Escalation Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centrally triage unassigned complaints and manage overdue SLA escalations across bureaus.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-2xl shadow-sm gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`py-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'unassigned'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Unassigned & Triage Queue
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`py-4 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-500" />
          Overdue Escalation Queue
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : complaints.length === 0 ? (
          <p className="p-8 text-center text-xs text-gray-400 italic">No complaints in this queue.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-4 px-6">Ref Number</th>
                  <th className="py-4 px-4">Subject</th>
                  <th className="py-4 px-4">Institution</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">SLA Deadline</th>
                  <th className="py-4 px-6 text-right">Triage Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-mono font-bold text-gray-900 text-xs">{c.reference_number}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 truncate max-w-xs">{c.title}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{c.institution_name}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{c.category_name || 'Triage Pending'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {c.is_overdue ? (
                        <span className="font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Past Deadline
                        </span>
                      ) : (
                        <span className="text-gray-500">{formatDate(c.deadline_date)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => openAssign(c)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Assign / Transfer →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign/Transfer: ${selectedComplaint?.reference_number}`}
        size="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Designate the responsible AICTE bureau and reviewing cell. All assignment history is logged in the audit trail.
          </p>

          <div>
            <label className="form-label text-xs">AICTE Bureau *</label>
            <select
              value={selectedBureauId}
              onChange={(e) => setSelectedBureauId(e.target.value)}
              required
              className="form-input"
            >
              <option value="">-- Select Bureau --</option>
              {bureaus.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Specialized Cell</label>
            <select
              value={selectedCellId}
              onChange={(e) => setSelectedCellId(e.target.value)}
              disabled={!selectedBureauId}
              className="form-input disabled:bg-gray-100"
            >
              <option value="">-- General Cell --</option>
              {cells.map((cell) => (
                <option key={cell.id} value={cell.id}>{cell.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Transfer / Assignment Reason</label>
            <textarea
              rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="e.g. Routed based on fee violation keywords"
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assigning}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { StatusBadge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { useToast } from '../../components/ui/ToastProvider';
import { formatDate } from '../../utils/helpers';
import {
  FileText,
  School,
  Calendar,
  Clock,
  ArrowLeft,
  Send,
  Download,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Paperclip
} from 'lucide-react';

export default function ComplaintDetailStudent() {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [submittingMsg, setSubmittingMsg] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const complaintId = parseInt(id || '0', 10);

  function loadData() {
    if (!complaintId) return;
    setLoading(true);

    Promise.all([
      complaintService.getOne(complaintId),
      complaintService.getTimeline(complaintId),
      complaintService.getMessages(complaintId),
      complaintService.listEvidence(complaintId),
      complaintService.getResolution(complaintId),
    ])
      .then(([cRes, tRes, mRes, eRes, rRes]) => {
        setComplaint(cRes.data.data);
        setTimeline(tRes.data.data);
        setMessages(mRes.data.data);
        setEvidence(eRes.data.data);
        setResolution(rRes.data.data);
      })
      .catch((err) => {
        toast.error('Failed to load complaint details.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [complaintId]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSubmittingMsg(true);
    try {
      await complaintService.sendMessage(complaintId, newMessage.trim());
      setNewMessage('');
      toast.success('Message sent to the assigned officer.');
      // Refresh messages
      const mRes = await complaintService.getMessages(complaintId);
      setMessages(mRes.data.data);
    } catch (err: any) {
      toast.error('Failed to send message.');
    } finally {
      setSubmittingMsg(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading complaint details...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Complaint not found or access restricted.</p>
        <Link to="/student/complaints" className="mt-4 inline-block text-teal-600 font-semibold text-sm">
          ← Back to My Complaints
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Ref header */}
      <div className="flex items-center gap-3">
        <Link to="/student/complaints" className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-gray-900">{complaint.reference_number}</span>
            <StatusBadge status={complaint.status} />
            <StatusBadge priority={complaint.priority} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{complaint.title}</h1>
        </div>
      </div>

      {/* Official Decision Alert (if RESOLVED) */}
      {complaint.status === 'RESOLVED' && resolution && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-900 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-bold text-emerald-800">Official AICTE Resolution Decision</h2>
          </div>
          <div className="bg-white/80 p-4 rounded-xl border border-emerald-100 text-sm space-y-2">
            <p><strong>Outcome:</strong> {resolution.outcome?.replace(/_/g, ' ')}</p>
            <p><strong>Decision:</strong> {resolution.decision}</p>
            {resolution.findings && <p><strong>Investigation Findings:</strong> {resolution.findings}</p>}
            {resolution.action_taken && <p><strong>Action Enforced:</strong> {resolution.action_taken}</p>}
            <p className="text-xs text-emerald-700 pt-1">
              Resolved on: {formatDate(resolution.resolved_at, true)} by {resolution.resolved_by_name}
            </p>
          </div>
        </div>
      )}

      {/* Info Notice when Awaiting Response */}
      {complaint.status === 'AWAITING_RESPONSE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Officer Action Required</p>
            <p className="mt-0.5">The reviewing bureau officer has requested additional documentation or clarification. Please review the messages below and submit your response.</p>
          </div>
        </div>
      )}

      {/* Overview Metadata Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid sm:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-xs text-gray-500 uppercase font-semibold">Educational Institution</span>
          <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
            <School className="h-4 w-4 text-teal-600" />
            {complaint.institution_name}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase font-semibold">Grievance Category</span>
          <p className="font-semibold text-gray-900 mt-0.5">
            {complaint.category_name || 'Pending Categorization'}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase font-semibold">Filed Date</span>
          <p className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-600" />
            {formatDate(complaint.created_at)}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider">Complaint Description</h2>
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
          {complaint.description}
        </p>
      </div>

      {/* Uploaded Evidence */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider flex items-center gap-2">
          <Paperclip className="h-4 w-4" /> Supporting Evidence ({evidence.length})
        </h2>
        {evidence.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No files attached to this complaint.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {evidence.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border rounded-xl text-sm">
                <div className="truncate pr-2">
                  <p className="font-medium text-gray-900 truncate text-xs">{file.original_filename}</p>
                  <p className="text-[10px] text-gray-400">{(file.file_size / 1024).toFixed(1)} KB · {formatDate(file.created_at)}</p>
                </div>
                <a
                  href={`/api/complaints/${complaintId}/evidence/${file.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white border border-gray-200 rounded text-teal-600 hover:bg-teal-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Communications Thread */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Communications & Responses
        </h2>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No messages yet on this case.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl text-sm ${
                  m.sender_role === 'student'
                    ? 'bg-teal-50 border border-teal-100 ml-8'
                    : 'bg-slate-50 border border-slate-200 mr-8'
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold text-gray-900">
                    {m.sender_name} ({m.sender_role === 'student' ? 'You' : 'AICTE Officer'})
                  </span>
                  <span className="text-gray-400">{formatDate(m.created_at, true)}</span>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{m.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Reply Box */}
        {complaint.status !== 'CLOSED' && complaint.status !== 'REJECTED' && (
          <form onSubmit={handleSendMessage} className="pt-3 border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send response or additional clarification..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={submittingMsg || !newMessage.trim()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              Reply
            </button>
          </form>
        )}
      </div>

      {/* Status History Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider">
          Audit & Status Timeline
        </h2>
        <Timeline items={timeline} />
      </div>
    </div>
  );
}


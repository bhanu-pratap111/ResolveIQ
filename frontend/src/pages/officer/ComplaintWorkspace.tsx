import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { relatedCaseService } from '../../services/user.service';
import { StatusBadge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/ToastProvider';
import { formatDate } from '../../utils/helpers';
import {
  FileText,
  School,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Layers,
  MessageSquare,
  Lock,
  Download,
  CheckCircle,
  AlertTriangle,
  Send,
  PlusCircle,
  Paperclip,
  Check,
  X,
  FileCheck2
} from 'lucide-react';

export default function ComplaintWorkspace() {
  const { id } = useParams<{ id: string }>();
  const complaintId = parseInt(id || '0', 10);

  const [complaint, setComplaint] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [resolution, setResolution] = useState<any>(null);
  const [relatedSuggestions, setRelatedSuggestions] = useState<any[]>([]);
  const [confirmedRelated, setConfirmedRelated] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'overview' | 'comms' | 'evidence' | 'related' | 'resolve'>('overview');
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Communications state
  const [newMessage, setNewMessage] = useState('');
  const [msgType, setMsgType] = useState('OFFICIAL_COMMUNICATION');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Internal Note state
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Resolution Form state
  const [outcome, setOutcome] = useState('RESOLVED_IN_FAVOR');
  const [decision, setDecision] = useState('');
  const [findings, setFindings] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolving, setResolving] = useState(false);

  const toast = useToast();

  function loadAll() {
    if (!complaintId) return;
    setLoading(true);

    Promise.all([
      complaintService.getOne(complaintId),
      complaintService.getTimeline(complaintId),
      complaintService.getMessages(complaintId),
      complaintService.getNotes(complaintId),
      complaintService.listEvidence(complaintId),
      complaintService.getResolution(complaintId),
      complaintService.getRelated(complaintId),
      relatedCaseService.getForComplaint(complaintId),
    ])
      .then(([c, t, m, n, e, r, relSug, relConf]) => {
        setComplaint(c.data.data);
        setTimeline(t.data.data);
        setMessages(m.data.data);
        setNotes(n.data.data);
        setEvidence(e.data.data);
        setResolution(r.data.data);
        setRelatedSuggestions(relSug.data.data || []);
        setConfirmedRelated(relConf.data.data || []);
      })
      .catch((err) => {
        toast.error('Failed to load complaint data.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, [complaintId]);

  // Handle status change
  async function handleStatusChangeSubmit() {
    if (!targetStatus) return;
    if (targetStatus === 'REJECTED' && !statusReason.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }

    setStatusSubmitting(true);
    try {
      await complaintService.changeStatus(complaintId, targetStatus, statusReason.trim());
      toast.success(`Complaint status changed to ${targetStatus}`);
      setStatusModalOpen(false);
      setStatusReason('');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status transition rejected.');
    } finally {
      setStatusSubmitting(false);
    }
  }

  // Handle AI suggestion acceptance
  async function handleAiSuggestion(accept: boolean) {
    try {
      await complaintService.updateAiSuggestion(
        complaintId,
        accept,
        accept ? complaint.ai_suggested_category_id : undefined,
        accept ? complaint.ai_suggested_bureau_id : undefined
      );
      toast.success(accept ? 'AI suggestion accepted and applied.' : 'AI suggestion dismissed.');
      loadAll();
    } catch (err: any) {
      toast.error('Failed to update AI suggestion.');
    }
  }

  // Handle sending message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMsg(true);
    try {
      await complaintService.sendMessage(complaintId, newMessage.trim(), msgType, true);
      setNewMessage('');
      toast.success('Communication dispatched to student.');
      const res = await complaintService.getMessages(complaintId);
      setMessages(res.data.data);
    } catch {
      toast.error('Failed to send communication.');
    } finally {
      setSendingMsg(false);
    }
  }

  // Handle adding internal note
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await complaintService.addNote(complaintId, newNote.trim());
      setNewNote('');
      toast.success('Internal officer note recorded.');
      const res = await complaintService.getNotes(complaintId);
      setNotes(res.data.data);
    } catch {
      toast.error('Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  }

  // Handle confirming or rejecting related case
  async function handleRelatedAction(targetComplaintId: number, relType: string) {
    try {
      await relatedCaseService.confirm({
        complaint_id_1: complaintId,
        complaint_id_2: targetComplaintId,
        relationship_type: relType,
        confirmation_notes: `Relationship updated by investigating officer`,
      });
      toast.success(`Case marked as ${relType.replace(/_/g, ' ')}`);
      loadAll();
    } catch (err: any) {
      toast.error('Failed to update case relationship.');
    }
  }

  // Handle final resolution
  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!decision.trim()) {
      toast.error('Please enter the official decision text.');
      return;
    }

    setResolving(true);
    try {
      await complaintService.resolve(complaintId, {
        outcome,
        findings,
        decision,
        action_taken: actionTaken,
      });
      toast.success('Complaint officially marked as RESOLVED.');
      loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit resolution.');
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading investigation workspace...</div>;
  }

  if (!complaint) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 font-medium">Complaint not found or unauthorized.</p>
        <Link to="/officer/queue" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          ← Return to Queue
        </Link>
      </div>
    );
  }

  // Allowed transitions
  const transitions: Record<string, string[]> = {
    REGISTERED: ['UNDER_REVIEW', 'REJECTED'],
    UNDER_REVIEW: ['UNDER_ACTION', 'AWAITING_RESPONSE', 'REJECTED'],
    UNDER_ACTION: ['AWAITING_RESPONSE', 'RESOLVED', 'CLOSED', 'REJECTED'],
    AWAITING_RESPONSE: ['UNDER_ACTION', 'UNDER_REVIEW', 'CLOSED'],
    RESOLVED: ['CLOSED'],
    REJECTED: [],
    CLOSED: [],
  };
  const availableTransitions = transitions[complaint.status] || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/officer/queue" className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                {complaint.reference_number}
              </span>
              <StatusBadge status={complaint.status} />
              <StatusBadge priority={complaint.priority} />
              {complaint.is_overdue && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> SLA Overdue
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{complaint.title}</h1>
          </div>
        </div>

        {/* Transition Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {availableTransitions.map((st) => (
            <button
              key={st}
              onClick={() => {
                setTargetStatus(st);
                setStatusModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-colors"
            >
              Move to {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-2xl shadow-sm gap-6 text-sm font-medium">
        {[
          { key: 'overview', label: 'Overview & AI Triage' },
          { key: 'comms', label: `Communications (${messages.length + notes.length})` },
          { key: 'evidence', label: `Evidence (${evidence.length})` },
          { key: 'related', label: `Cross-Bureau Related Cases (${relatedSuggestions.length})` },
          { key: 'resolve', label: 'Official Resolution' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-4 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Suggestion Card */}
          {complaint.ai_suggested_category_name && (
            <div className="bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200 p-6 rounded-2xl shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    <h3 className="font-bold text-gray-900 text-base">Local AI Classification & Bureau Routing</h3>
                    <span className="text-xs font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                      Score: {complaint.ai_confidence ? `${(complaint.ai_confidence * 100).toFixed(0)}%` : 'Rule-based'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Suggested Category: <strong>{complaint.ai_suggested_category_name}</strong> · Suggested Bureau: <strong>{complaint.ai_suggested_bureau_name}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence score is a rule-weighted text signal metric, not a calibrated probability.
                  </p>
                </div>
                {complaint.ai_suggestion_accepted === null && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAiSuggestion(true)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Accept Routing
                    </button>
                    <button
                      onClick={() => handleAiSuggestion(false)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Override
                    </button>
                  </div>
                )}
                {complaint.ai_suggestion_accepted === 1 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" /> Accepted by Officer
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 grid sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">Complainant</span>
              <p className="font-bold text-gray-900 mt-1">{complaint.student_name}</p>
              <p className="text-xs text-gray-500">{complaint.student_email}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">Educational Institution</span>
              <p className="font-bold text-gray-900 mt-1">{complaint.institution_name}</p>
              <p className="text-xs text-gray-500">{complaint.institution_code || 'AICTE Affiliated'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">Assigned Bureau</span>
              <p className="font-bold text-gray-900 mt-1">{complaint.bureau_name || 'Unassigned'}</p>
              <p className="text-xs text-gray-500">{complaint.cell_name || 'General Cell'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase font-semibold">SLA Deadline</span>
              <p className="font-bold text-gray-900 mt-1">{formatDate(complaint.deadline_date)}</p>
              <p className="text-xs text-gray-500">Filed: {formatDate(complaint.created_at)}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm uppercase font-semibold text-gray-500 tracking-wider">Grievance Narrative</h3>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
              {complaint.description}
            </p>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm uppercase font-semibold text-gray-500 tracking-wider">Status History & Audit Trail</h3>
            <Timeline items={timeline} />
          </div>
        </div>
      )}

      {/* Tab 2: Communications & Internal Notes */}
      {activeTab === 'comms' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Public / Student Messages */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                Student-Visible Communications
              </h3>
              <span className="text-xs text-gray-400">Audited</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No messages sent yet.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      m.sender_role === 'student'
                        ? 'bg-teal-50 border border-teal-100 mr-4'
                        : 'bg-slate-50 border border-slate-200 ml-4'
                    }`}
                  >
                    <div className="flex justify-between font-bold text-gray-700">
                      <span>{m.sender_name} ({m.sender_role})</span>
                      <span className="text-[10px] text-gray-400">{formatDate(m.created_at, true)}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-line">{m.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="pt-3 border-t space-y-2">
              <div className="flex gap-2 text-xs">
                <select
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value)}
                  className="px-2 py-1 bg-gray-50 border rounded text-gray-600"
                >
                  <option value="INFORMATION_REQUEST">Request Additional Information</option>
                  <option value="OFFICIAL_COMMUNICATION">Official Status Update</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send inquiry to student..."
                  className="flex-1 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Internal Confidential Notes */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-600" />
                Confidential Officer Investigation Notes
              </h3>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                Never visible to student
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {notes.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No internal notes recorded yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>{n.author_name}</span>
                      <span className="text-[10px] text-amber-700">{formatDate(n.created_at, true)}</span>
                    </div>
                    <p className="text-gray-800 whitespace-pre-line">{n.note}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="pt-3 border-t space-y-2">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Record confidential investigation note or departmental finding..."
                className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={addingNote || !newNote.trim()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                Save Confidential Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Evidence */}
      {activeTab === 'evidence' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm uppercase font-semibold text-gray-500 tracking-wider">
            Verified Supporting Evidence Documents ({evidence.length})
          </h3>
          {evidence.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No documents attached.</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {evidence.map((file) => (
                <div key={file.id} className="p-4 bg-gray-50 border rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <p className="font-bold text-gray-900 text-xs truncate">{file.original_filename}</p>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    Uploaded by: {file.uploaded_by_name} · {(file.file_size / 1024).toFixed(1)} KB
                  </p>
                  <a
                    href={`/api/complaints/${complaintId}/evidence/${file.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1 py-1.5 bg-white border border-gray-300 rounded text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Document
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cross-Bureau Related Cases (SIGNATURE FEATURE) */}
      {activeTab === 'related' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl">
            <h3 className="font-bold text-indigo-900 text-base mb-1 flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-600" />
              Cross-Bureau Related Case Intelligence
            </h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              AICTE ResolveIQ compares normalized complaint text, incident details, and institution identifiers across bureaus
              to discover related investigations. Authorized officers can confirm or reject proposed relationships without altering independent case timelines.
            </p>
          </div>

          {/* AI Candidate Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-900">AI-Detected Candidate Matches ({relatedSuggestions.length})</h4>
            {relatedSuggestions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No candidate complaints met the similarity threshold.</p>
            ) : (
              <div className="space-y-4">
                {relatedSuggestions.map((match) => (
                  <div key={match.complaint_id} className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-800 bg-white border px-2 py-0.5 rounded">
                          {match.reference_number}
                        </span>
                        <StatusBadge status={match.status} />
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {(match.similarity_score * 100).toFixed(1)}% Similarity
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRelatedAction(match.complaint_id, 'CONFIRMED_RELATED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> Confirm Related
                        </button>
                        <button
                          onClick={() => handleRelatedAction(match.complaint_id, 'DUPLICATE')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Mark Duplicate
                        </button>
                        <button
                          onClick={() => handleRelatedAction(match.complaint_id, 'NOT_RELATED')}
                          className="px-3 py-1 bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Not Related
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900">{match.title}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {match.match_reasons?.map((reason: string, rIdx: number) => (
                        <span key={rIdx} className="text-[11px] bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmed Relationships */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-900">Confirmed Case Links ({confirmedRelated.length})</h4>
            {confirmedRelated.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No confirmed links on this case yet.</p>
            ) : (
              <div className="space-y-3">
                {confirmedRelated.map((r) => {
                  const otherRef = r.complaint_id_1 === complaintId ? r.ref2 : r.ref1;
                  const otherTitle = r.complaint_id_1 === complaintId ? r.title2 : r.title1;
                  const otherStatus = r.complaint_id_1 === complaintId ? r.status2 : r.status1;
                  return (
                    <div key={r.id} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-900">{otherRef}</span>
                          <StatusBadge status={otherStatus} />
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {r.relationship_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-800 mt-1">{otherTitle}</p>
                        {r.confirmed_by_name && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Confirmed by {r.confirmed_by_name} on {formatDate(r.confirmed_at, true)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Official Resolution */}
      {activeTab === 'resolve' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-emerald-600" />
              Official Dispute Resolution Record
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Finalizing resolution records binding institutional orders and notifies the student.
            </p>
          </div>

          {resolution ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Established Outcome: {resolution.outcome.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-emerald-700">{formatDate(resolution.resolved_at, true)}</span>
              </div>
              <div className="space-y-2 text-sm text-gray-800">
                <p><strong>Formal Decision:</strong> {resolution.decision}</p>
                {resolution.findings && <p><strong>Factual Findings:</strong> {resolution.findings}</p>}
                {resolution.action_taken && <p><strong>Mandated Action:</strong> {resolution.action_taken}</p>}
                <p className="text-xs text-gray-500 pt-2">Authorized Officer: {resolution.resolved_by_name}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="form-label font-semibold">Resolution Outcome *</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="form-input"
                >
                  <option value="RESOLVED_IN_FAVOR">Resolved in Favor of Complainant</option>
                  <option value="RESOLVED_PARTIALLY">Partially Resolved with Directives</option>
                  <option value="RESOLVED_NOT_IN_FAVOR">Resolved - Allegation Not Substantiated</option>
                  <option value="NO_FURTHER_ACTION">No Further Action Warranted</option>
                  <option value="COMPLAINT_WITHDRAWN">Complaint Formally Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="form-label font-semibold">Official Order & Decision *</label>
                <textarea
                  rows={4}
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  placeholder="Enter the official binding order to be transmitted to the student and institution..."
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label font-semibold">Summary of Investigation Findings</label>
                <textarea
                  rows={3}
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Summarize evidence examined, hearings held, or documents audited..."
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label font-semibold">Institutional Directive / Corrective Action Enforced</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Refund of Rs. 15,000 ordered within 30 days"
                  className="form-input"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  {resolving ? 'Recording Resolution...' : 'Submit Official Resolution'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Status Transition Modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Transition Case to ${targetStatus.replace(/_/g, ' ')}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Confirm transitioning this grievance from <strong>{complaint.status}</strong> to <strong>{targetStatus}</strong>.
          </p>

          <div>
            <label className="form-label text-xs">
              Reason / Justification {targetStatus === 'REJECTED' && '*'}
            </label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Provide a mandatory reason for this status change..."
              className="form-input"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStatusModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusChangeSubmit}
              disabled={statusSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {statusSubmitting ? 'Updating...' : 'Confirm Change'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


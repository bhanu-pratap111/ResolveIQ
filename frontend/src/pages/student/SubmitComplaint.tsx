import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { complaintService } from '../../services/complaint.service';
import { institutionService } from '../../services/institution.service';
import { settingService } from '../../services/user.service';
import { useToast } from '../../components/ui/ToastProvider';
import {
  FileText,
  School,
  Tag,
  Calendar,
  UploadCloud,
  CheckSquare,
  Loader2,
  CheckCircle,
  Copy,
  ArrowRight
} from 'lucide-react';

export default function SubmitComplaint() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [institutionId, setInstitutionId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [privacyAck, setPrivacyAck] = useState(false);
  const [declarationAck, setDeclarationAck] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<any>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    institutionService.list({ limit: 100 })
      .then(res => setInstitutions(res.data.data))
      .catch(() => {});

    settingService.getCategories()
      .then(res => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!institutionId || !title || !description) {
      toast.error('Please complete all mandatory fields.');
      return;
    }
    if (description.length < 20) {
      toast.error('Please provide a detailed description (minimum 20 characters).');
      return;
    }
    if (!privacyAck || !declarationAck) {
      toast.error('Please accept the required declarations.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        institution_id: parseInt(institutionId),
        category_id: categoryId ? parseInt(categoryId) : null,
        title,
        description,
        incident_date: incidentDate || null,
        priority,
        privacy_acknowledged: privacyAck,
        declaration_acknowledged: declarationAck,
      };

      const res = await complaintService.create(payload);
      const newComp = res.data.data;
      setCreatedComplaint(newComp);

      // If evidence was attached, upload it
      if (evidenceFile && newComp.id) {
        try {
          await complaintService.uploadEvidence(newComp.id, evidenceFile);
        } catch (uploadErr) {
          console.warn('Evidence upload failed:', uploadErr);
        }
      }

      toast.success('Complaint submitted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  }

  if (createdComplaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaint Registered!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Your complaint has been submitted to the AICTE centralized resolution system.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 inline-flex items-center gap-3">
            <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">Reference No:</span>
            <span className="font-mono text-lg font-bold text-slate-900">{createdComplaint.reference_number}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdComplaint.reference_number);
                toast.success('Reference number copied!');
              }}
              className="p-1 hover:bg-slate-200 rounded text-gray-500"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              to={`/student/complaints/${createdComplaint.id}`}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              View Complaint Details
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/student/complaints"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-xl text-sm transition-colors"
            >
              Back to My Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">File a Grievance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Provide complete details. Our AI will analyze your description to route your case to the responsible AICTE bureau.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Institution selection */}
        <div>
          <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
            <School className="h-4 w-4 text-teal-600" />
            Educational Institution *
          </label>
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            required
            className="form-input"
          >
            <option value="">-- Select Institution --</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.code || i.city || 'College'})
              </option>
            ))}
          </select>
        </div>

        {/* Category selection */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
              <Tag className="h-4 w-4 text-teal-600" />
              Grievance Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="form-input"
            >
              <option value="">-- Not Sure (Let AI Suggest) --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
              <Calendar className="h-4 w-4 text-teal-600" />
              Incident Date (if applicable)
            </label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
            <FileText className="h-4 w-4 text-teal-600" />
            Subject / Complaint Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Unauthorized fee charged for 2nd semester"
            required
            className="form-input"
          />
        </div>

        {/* Description */}
        <div>
          <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
            Detailed Description * (min 20 characters)
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the incident with dates, departments, and specific facts. The AI classifier will use this text to detect related complaints across bureaus."
            required
            className="form-input"
          />
        </div>

        {/* Evidence Attachment */}
        <div>
          <label className="form-label flex items-center gap-1.5 font-semibold text-gray-800">
            <UploadCloud className="h-4 w-4 text-teal-600" />
            Supporting Evidence (PDF, PNG, JPG - max 10MB)
          </label>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 pt-4 border-t">
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAck}
              onChange={(e) => setPrivacyAck(e.target.checked)}
              required
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <span>I acknowledge that this grievance will be processed by authorized AICTE officers and cell investigators under statutory confidentiality norms.</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationAck}
              onChange={(e) => setDeclarationAck(e.target.checked)}
              required
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <span>I declare that the statements made above are true to the best of my knowledge and no deliberate falsehood has been introduced.</span>
          </label>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Grievance'}
          </button>
        </div>
      </form>
    </div>
  );
}


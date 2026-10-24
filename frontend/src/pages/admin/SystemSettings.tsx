import { useState, useEffect } from 'react';
import { settingService } from '../../services/user.service';
import { useToast } from '../../components/ui/ToastProvider';
import { Settings, CheckCircle2, Shield, Brain, Sliders, Database } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState<any>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [deadlineDays, setDeadlineDays] = useState('30');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    settingService.getAll()
      .then(res => {
        const s = res.data.data || {};
        setSettings(s);
        if (s.default_deadline_days) setDeadlineDays(s.default_deadline_days.value);
      })
      .catch(() => {});

    settingService.getCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  async function handleSaveDeadline(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.update('default_deadline_days', deadlineDays);
      toast.success('Default SLA deadline updated.');
    } catch {
      toast.error('Failed to update deadline.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">System Parameters & Policies</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure statutory deadlines, local AI service connectivity, and regulatory formulas
        </p>
      </div>

      {/* SLA Deadline Form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Sliders className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-bold text-gray-900">Statutory SLA Resolution Deadlines</h2>
        </div>
        <form onSubmit={handleSaveDeadline} className="max-w-md space-y-4">
          <div>
            <label className="form-label text-xs">Default Statutory Deadline (Days)</label>
            <input
              type="number"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
              min={1}
              max={180}
              required
              className="form-input"
            />
            <p className="text-xs text-gray-400 mt-1">
              Complaints unresolved beyond this period are automatically flagged as overdue by the deadline monitoring daemon.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Save Deadline Setting'}
          </button>
        </form>
      </div>

      {/* Local AI Engine Status */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Brain className="h-5 w-5 text-teal-600" />
          <h2 className="text-base font-bold text-gray-900">Local AI Intelligence Architecture</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <span className="font-semibold text-gray-700">Classification Model</span>
            <p className="text-gray-600">Rule-based weighted keyword matching across 8 official grievance domains.</p>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <span className="font-semibold text-gray-700">Similarity Vectorizer</span>
            <p className="text-gray-600">scikit-learn TF-IDF n-gram vectorizer with cosine similarity scoring.</p>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <span className="font-semibold text-gray-700">Endpoint Configuration</span>
            <p className="text-gray-600 font-mono">{settings.ai_service_url?.value || 'http://localhost:8000'}</p>
          </div>
          <div className="p-4 bg-slate-50 border rounded-xl space-y-1">
            <span className="font-semibold text-gray-700">Privacy & Air-Gap Compliance</span>
            <p className="text-emerald-700 font-semibold">100% Offline Local Model · Zero Cloud Inference</p>
          </div>
        </div>
      </div>

      {/* Category Reference Matrix */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <Database className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-bold text-gray-900">Official AICTE Category-to-Bureau Routing Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 border-b">
              <tr>
                <th className="py-2.5 px-4">Grievance Category</th>
                <th className="py-2.5 px-4">Responsible AICTE Bureau</th>
                <th className="py-2.5 px-4">Default SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 px-4 font-bold text-gray-900">{c.name}</td>
                  <td className="py-2.5 px-4">{c.bureau_name || 'Academic Affairs Bureau'}</td>
                  <td className="py-2.5 px-4 font-mono font-semibold">{c.default_deadline_days} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


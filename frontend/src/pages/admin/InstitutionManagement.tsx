import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { institutionService } from '../../services/institution.service';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import { School, Plus, Search, ExternalLink, Edit } from 'lucide-react';

export default function InstitutionManagement() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('college');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  function loadInstitutions() {
    setLoading(true);
    institutionService.list({ page, limit: 10, search })
      .then(res => {
        setInstitutions(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadInstitutions();
  }, [page]);

  function openCreate() {
    setEditingId(null);
    setName('');
    setCode('');
    setType('college');
    setState('');
    setCity('');
    setAddress('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setModalOpen(true);
  }

  function openEdit(inst: any) {
    setEditingId(inst.id);
    setName(inst.name);
    setCode(inst.code || '');
    setType(inst.type || 'college');
    setState(inst.state || '');
    setCity(inst.city || '');
    setAddress(inst.address || '');
    setEmail(inst.email || '');
    setPhone(inst.phone || '');
    setWebsite(inst.website || '');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const payload = { name, code, type, state, city, address, email, phone, website };
      if (editingId) {
        await institutionService.update(editingId, payload);
        toast.success('Institution updated successfully.');
      } else {
        await institutionService.create(payload);
        toast.success('Institution added to master list.');
      }
      setModalOpen(false);
      loadInstitutions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institution Master Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Maintain AICTE-affiliated technical institutes, colleges, and university records
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Institution
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadInstitutions(); } }}
            placeholder="Search by institution name (press Enter)..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-4 px-6">Institution Name</th>
                  <th className="py-4 px-4">Code</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Origin</th>
                  <th className="py-4 px-6 text-right">360° Profile & Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutions.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-bold text-gray-900">
                      {i.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{i.code || '—'}</td>
                    <td className="py-3.5 px-4 text-xs capitalize text-gray-700">{i.type}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{i.city ? `${i.city}, ${i.state}` : '—'}</td>
                    <td className="py-3.5 px-4">
                      {i.is_demo ? (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                          DEMO SEED
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                          RECORDED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <Link
                        to={`/admin/institutions/${i.id}/360`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg"
                      >
                        <ExternalLink className="h-3 w-3" />
                        360° Profile
                      </Link>
                      <button
                        onClick={() => openEdit(i)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <div className="px-4 pb-4">
            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              total={pagination.total}
              limit={pagination.limit}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Institution Record' : 'Register Technical Institution'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label text-xs">Institution Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. National Institute of Technology"
              required
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">AICTE/Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="NIT-001"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label text-xs">Institution Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-input"
              >
                <option value="college">College</option>
                <option value="university">University</option>
                <option value="institute">Institute</option>
                <option value="polytechnic">Polytechnic</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bangalore"
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label text-xs">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Karnataka"
                className="form-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


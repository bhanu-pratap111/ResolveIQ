import { useState, useEffect } from 'react';
import { userService } from '../../services/user.service';
import { bureauService } from '../../services/bureau.service';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import { formatDate } from '../../utils/helpers';
import { Users, UserPlus, KeyRound, Check, X, Shield, Search } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [bureaus, setBureaus] = useState<any[]>([]);
  const [cells, setCells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create Officer modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bureauId, setBureauId] = useState('');
  const [cellId, setCellId] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset password modal
  const [resetModalUser, setResetModalUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const toast = useToast();

  function loadUsers() {
    setLoading(true);
    const params: any = { page, limit: 12 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;

    userService.list(params)
      .then(res => {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  useEffect(() => {
    bureauService.list().then(res => setBureaus(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (bureauId) {
      bureauService.listCells(parseInt(bureauId)).then(res => setCells(res.data.data)).catch(() => {});
    } else {
      setCells([]);
    }
  }, [bureauId]);

  async function handleCreateOfficer(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    setCreating(true);
    try {
      await userService.create({
        name,
        email,
        password,
        phone,
        bureau_id: bureauId ? parseInt(bureauId) : null,
        cell_id: cellId ? parseInt(cellId) : null,
      });
      toast.success('Officer account provisioned successfully.');
      setCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setBureauId('');
      setCellId('');
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create officer.');
    } finally {
      setCreating(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setResetting(true);
    try {
      await userService.resetPassword(resetModalUser.id, newPassword);
      toast.success(`Password reset for ${resetModalUser.email}`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error('Failed to reset password.');
    } finally {
      setResetting(false);
    }
  }

  async function toggleActive(u: any) {
    try {
      await userService.update(u.id, {
        name: u.name,
        phone: u.phone,
        is_active: !u.is_active,
      });
      toast.success(`User ${!u.is_active ? 'activated' : 'deactivated'}.`);
      loadUsers();
    } catch {
      toast.error('Failed to update status.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User & Officer Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage authorized investigators, bureau personnel, and complainant accounts
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Provision Officer Account
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadUsers(); } }}
            placeholder="Search by name or email (press Enter)..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="py-2 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <option value="">All Roles</option>
          <option value="officer">Bureau Officers</option>
          <option value="super_admin">Administrators</option>
          <option value="student">Students</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Last Login</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-6 font-bold text-gray-900">{u.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        u.role === 'super_admin' ? 'bg-rose-100 text-rose-800' :
                        u.role === 'officer' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {u.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-gray-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{u.phone || '—'}</td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                      ) : (
                        <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded">Deactivated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {formatDate(u.last_login, true)}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900"
                        title="Reset Password"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => toggleActive(u)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded ${
                            u.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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

      {/* Provision Officer Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision Bureau Officer Account"
        size="md"
      >
        <form onSubmit={handleCreateOfficer} className="space-y-4">
          <div>
            <label className="form-label text-xs">Officer Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Verma"
              required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label text-xs">Official Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@resolveiq.demo"
              required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label text-xs">Initial Password * (min 8 chars)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label text-xs">Direct Phone (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9000000000"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label text-xs">Assigned Bureau</label>
              <select
                value={bureauId}
                onChange={(e) => setBureauId(e.target.value)}
                className="form-input"
              >
                <option value="">-- Select Bureau --</option>
                {bureaus.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">Assigned Cell</label>
              <select
                value={cellId}
                onChange={(e) => setCellId(e.target.value)}
                disabled={!bureauId}
                className="form-input disabled:bg-gray-100"
              >
                <option value="">-- General Cell --</option>
                {cells.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetModalUser}
        onClose={() => setResetModalUser(null)}
        title={`Reset Password: ${resetModalUser?.email}`}
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-gray-500">
            Authorized administrator reset for user account. User will be required to log in with this new credential.
          </p>
          <div>
            <label className="form-label text-xs">New Password (min 8 chars) *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="form-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResetModalUser(null)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


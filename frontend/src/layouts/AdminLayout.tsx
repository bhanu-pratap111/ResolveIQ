import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  School,
  BarChart3,
  FileCheck2,
  Settings,
  LogOut,
  ShieldAlert,
  GitPullRequestDraft,
  Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { notificationService } from '../services/user.service';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount()
      .then(res => setUnreadCount(res.data.data.count || 0))
      .catch(() => {});
  }, []);

  const navLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/bureaus', icon: Building2, label: 'Bureau Monitoring' },
    { to: '/admin/assignments', icon: GitPullRequestDraft, label: 'Assignment Center' },
    { to: '/admin/institutions', icon: School, label: 'Institution Master' },
    { to: '/admin/users', icon: Users, label: 'User & Officers' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics & Reports' },
    { to: '/admin/audit-logs', icon: FileCheck2, label: 'Audit Trail' },
    { to: '/admin/settings', icon: Settings, label: 'System Settings' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-rose-500 rounded-lg text-white font-black">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ResolveIQ</h1>
            <p className="text-xs text-rose-400 font-medium">Super Admin Portal</p>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-3 px-3 py-2 bg-slate-800/60 rounded-lg">
            <p className="text-xs text-slate-400">System Administrator</p>
            <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-950/40 hover:text-red-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              Super Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold flex items-center justify-center">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
              <span className="font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


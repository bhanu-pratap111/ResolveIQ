import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { useToast } from '../../components/ui/ToastProvider';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Signed in successfully.');

      // Check current user role stored in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'super_admin') navigate('/admin/dashboard');
        else if (u.role === 'officer') navigate('/officer/dashboard');
        else navigate('/student/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(e: string, p: string) {
    setEmail(e);
    setPassword(p);
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="p-2 bg-teal-500 rounded-lg text-slate-950 font-black">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">ResolveIQ</span>
        </Link>
        <h2 className="text-xl font-bold text-white">Sign in to your account</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter your AICTE portal credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-xl border border-slate-700/80 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@resolveiq.demo"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" tabIndex={-1} className="text-xs text-teal-400 hover:text-teal-300">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credential Pills */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillDemo('super_admin@resolveiq.demo', 'Admin@123456')}
                className="p-2 bg-slate-700/60 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 rounded border border-slate-600 font-medium transition-colors truncate"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('officer1@resolveiq.demo', 'Officer@123')}
                className="p-2 bg-slate-700/60 hover:bg-indigo-500/20 text-slate-200 hover:text-indigo-300 rounded border border-slate-600 font-medium transition-colors truncate"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('student1@resolveiq.demo', 'Student@123')}
                className="p-2 bg-slate-700/60 hover:bg-teal-500/20 text-slate-200 hover:text-teal-300 rounded border border-slate-600 font-medium transition-colors truncate"
              >
                Student
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              New student?{' '}
              <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToast } from '../../components/ui/ToastProvider';
import { Shield, Mail, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [debugToken, setDebugToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      if (res.data?.data?.debug_token) {
        setDebugToken(res.data.data.debug_token);
      }
      toast.success('Reset token generated. For this prototype, enter your new password below.');
    } catch (err: any) {
      toast.error('Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!debugToken || !newPassword) return;
    setLoading(true);
    try {
      await authService.resetPassword(debugToken, newPassword);
      setResetSuccess(true);
      toast.success('Password reset successfully. You can now log in.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-xl font-bold text-white">Reset Password</h2>
        <p className="mt-1 text-sm text-slate-400">
          Recover your account credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-xl border border-slate-700/80 rounded-2xl sm:px-10">
          {!submitted ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@resolveiq.demo"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg text-sm font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Reset Token'}
              </button>
            </form>
          ) : !resetSuccess ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-xs text-teal-300">
                Demo Token Loaded: <span className="font-mono">{debugToken}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Reset Token
                </label>
                <input
                  type="text"
                  value={debugToken}
                  onChange={(e) => setDebugToken(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg text-sm font-bold text-slate-950 bg-teal-500 hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply New Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-emerald-400 font-semibold">
                Your password has been reset successfully!
              </p>
              <Link
                to="/login"
                className="w-full block py-3 px-4 rounded-lg text-sm font-bold text-slate-950 bg-teal-500 hover:bg-teal-400"
              >
                Sign In Now
              </Link>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
              <ArrowLeft className="h-3 w-3" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


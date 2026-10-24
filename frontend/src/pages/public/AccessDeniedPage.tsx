import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-6">
        <ShieldX className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-extrabold mb-2">Access Denied</h1>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        You do not have the required role or authorization to access this bureau or admin workspace.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 transition-colors"
      >
        <Home className="h-4 w-4" />
        Return to Home
      </Link>
    </div>
  );
}


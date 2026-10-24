import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 bg-slate-800 text-teal-400 rounded-full flex items-center justify-center mb-6">
        <HelpCircle className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-extrabold mb-2">404</h1>
      <p className="text-xl font-semibold mb-2">Page Not Found</p>
      <p className="text-slate-400 text-sm max-w-md mb-8">
        The requested resource or complaint record does not exist or has been relocated.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition-colors"
      >
        <Home className="h-4 w-4" />
        Return to Home
      </Link>
    </div>
  );
}


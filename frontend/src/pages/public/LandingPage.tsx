import { Link } from 'react-router-dom';
import {
  Shield,
  Layers,
  Building,
  Brain,
  Clock,
  ArrowRight,
  CheckCircle,
  FileText,
  Search,
  School,
  Lock
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-xs font-medium text-amber-300">
        AICTE Hackathon Prototype — For demonstration purposes only. Not affiliated with live government portals.
      </div>

      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500 rounded-lg text-slate-950 font-black">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">ResolveIQ</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                AICTE Intelligence
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2"
            >
              Student Register
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 text-center max-w-5xl mx-auto flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-teal-400 text-xs font-semibold mb-6 mx-auto">
          <Brain className="h-4 w-4" />
          Cross-Bureau Intelligence & 360° Institution Profiling
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Intelligent Complaints.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
            Transparent Resolution.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          A centralized complaint-management and intelligence platform connecting students,
          educational institutions, and AICTE bureaus. Detect related grievances across departments,
          enforce strict SLA resolution deadlines, and safeguard student rights.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 text-base"
          >
            Submit a Student Grievance
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 text-base"
          >
            Officer & Admin Portal
            <Lock className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </section>

      {/* Core Distinguishing Features */}
      <section className="py-20 bg-slate-950/60 border-t border-slate-800/80 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs uppercase tracking-widest text-teal-400 font-bold mb-3">Distinguishing Capabilities</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">More Than Just a Complaint Register</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-colors">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-6">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cross-Bureau Linkage</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Uses local TF-IDF and keyword matching to identify related cases filed under different bureaus
                (e.g., fee irregularities and harassment). Prevent fragmented investigations.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl w-fit mb-6">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Institution 360°</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Consolidated institutional profiles detailing complaint frequency, category breakdown,
                open escalations, and past compliance history across all AICTE cells.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-6">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Deadline & Escalation</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatic scheduled monitoring of resolution SLAs. Cases past statutory deadlines are
                flagged as overdue and escalated directly to the Super Admin queue.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bureau Monitoring Live Preview (Illustrative Mockup) */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Bureau & Cell Live Monitoring</h2>
            <p className="text-slate-400 text-sm">System-wide transparency across active complaint categories</p>
          </div>
          <span className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded-full">
            Live Database Demo
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-4 px-6">Bureau Name</th>
                  <th className="py-4 px-6 text-center">Total</th>
                  <th className="py-4 px-6 text-center">Under Action</th>
                  <th className="py-4 px-6 text-center">Resolved</th>
                  <th className="py-4 px-6 text-center">Overdue</th>
                  <th className="py-4 px-6 text-center">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Academic Affairs Bureau</td>
                  <td className="py-4 px-6 text-center">4</td>
                  <td className="py-4 px-6 text-center text-amber-400">2</td>
                  <td className="py-4 px-6 text-center text-emerald-400">1</td>
                  <td className="py-4 px-6 text-center text-rose-400 font-bold">1</td>
                  <td className="py-4 px-6 text-center font-bold text-white">50.0%</td>
                </tr>
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Fee & Finance Bureau</td>
                  <td className="py-4 px-6 text-center">2</td>
                  <td className="py-4 px-6 text-center text-amber-400">1</td>
                  <td className="py-4 px-6 text-center text-emerald-400">1</td>
                  <td className="py-4 px-6 text-center text-rose-400 font-bold">1</td>
                  <td className="py-4 px-6 text-center font-bold text-white">50.0%</td>
                </tr>
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">Student Welfare Bureau</td>
                  <td className="py-4 px-6 text-center">2</td>
                  <td className="py-4 px-6 text-center text-indigo-400">0</td>
                  <td className="py-4 px-6 text-center text-emerald-400">0</td>
                  <td className="py-4 px-6 text-center text-slate-500">0</td>
                  <td className="py-4 px-6 text-center font-bold text-white">0.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-12 px-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            <span className="font-bold text-white text-sm">ResolveIQ Platform</span>
            <span>— AICTE Complaint Intelligence Prototype</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-slate-300">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300">Student Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}


import { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'gray' | 'teal';
  onClick?: () => void;
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-700' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', text: 'text-green-700' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', text: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-700' },
  gray: { bg: 'bg-gray-50', icon: 'bg-gray-100 text-gray-600', text: 'text-gray-700' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-100 text-teal-600', text: 'text-teal-700' },
};

export function KPICard({ title, value, icon, subtitle, color = 'blue', onClick }: KPICardProps) {
  const c = colors[color];
  return (
    <div
      className={`card p-5 ${c.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <div className={`p-2 rounded-lg ${c.icon}`}>{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value ?? '—'}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}


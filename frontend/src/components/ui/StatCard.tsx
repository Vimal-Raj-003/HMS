import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Trend {
  value: number;
  isPositive: boolean;
  label?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: Trend;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'teal';
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-100',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
    trend: 'text-green-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-100',
    trend: 'text-purple-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-100',
    trend: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-100',
    trend: 'text-red-600',
  },
  teal: {
    bg: 'bg-teal-50',
    icon: 'text-teal-600',
    border: 'border-teal-100',
    trend: 'text-teal-600',
  },
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle,
  onClick,
  className = '',
}: StatCardProps) {
  const colors = colorVariants[color];
  const isInteractive = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-xl border border-secondary-100 p-5
        shadow-stat transition-all duration-200
        ${isInteractive ? 'cursor-pointer hover:shadow-stat-hover hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left Side - Icon */}
        <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
          <div className={colors.icon}>{icon}</div>
        </div>

        {/* Right Side - Trend */}
        {trend && (
          <div
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${trend.isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}
            `}
          >
            {trend.value === 0 ? (
              <Minus className="w-3 h-3" />
            ) : trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className="text-2xl font-bold text-secondary-900 tracking-tight">
          {value}
        </p>
      </div>

      {/* Title & Subtitle */}
      <div className="mt-1">
        <p className="text-sm text-secondary-500 font-medium">{title}</p>
        {subtitle && (
          <p className="text-xs text-secondary-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Hover indicator for interactive cards */}
      {isInteractive && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-500 to-healthcare-500 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      )}
    </div>
  );
}

// Compact variant for smaller spaces
interface StatCardCompactProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'teal';
  onClick?: () => void;
}

export function StatCardCompact({
  title,
  value,
  icon,
  color = 'blue',
  onClick,
}: StatCardCompactProps) {
  const colors = colorVariants[color];
  const isInteractive = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-4 bg-white rounded-xl border border-secondary-100 p-4
        shadow-stat transition-all duration-200
        ${isInteractive ? 'cursor-pointer hover:shadow-stat-hover hover:-translate-y-0.5' : ''}
      `}
    >
      <div className={`p-2.5 rounded-lg ${colors.bg}`}>
        <div className={colors.icon}>{icon}</div>
      </div>
      <div>
        <p className="text-lg font-bold text-secondary-900">{value}</p>
        <p className="text-xs text-secondary-500">{title}</p>
      </div>
    </div>
  );
}

// Mini variant for inline stats
interface StatCardMiniProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'teal';
}

export function StatCardMini({ label, value, color = 'blue' }: StatCardMiniProps) {
  const colors = colorVariants[color];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors.bg.replace('50', '500')}`}></div>
      <span className="text-xs text-secondary-500">{label}:</span>
      <span className="text-xs font-semibold text-secondary-900">{value}</span>
    </div>
  );
}

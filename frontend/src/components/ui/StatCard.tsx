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

// Futuristic color variants aligned with design system
const colorVariants = {
  blue: {
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    icon: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-100 dark:border-primary-800',
    trend: 'text-primary-600',
    gradient: 'from-primary-500 to-primary-600',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-100 dark:border-green-800',
    trend: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-100 dark:border-purple-800',
    trend: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
  },
  yellow: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-100 dark:border-amber-800',
    trend: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-100 dark:border-red-800',
    trend: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/30',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-100 dark:border-teal-800',
    trend: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600',
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
        relative rounded-xl p-4
        transition-all duration-200 overflow-hidden
        ${isInteractive ? 'cursor-pointer hover:-translate-y-0.5 group' : ''}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Futuristic top accent line - visible on hover */}
      {isInteractive && (
        <div 
          className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{
            background: `linear-gradient(90deg, #2563EB, #14B8A6)`,
          }}
        />
      )}

      <div className="flex items-start justify-between">
        {/* Left Side - Icon */}
        <div 
          className={`p-2.5 rounded-xl ${colors.bg} ${colors.border} border`}
        >
          <div className={colors.icon}>{icon}</div>
        </div>

        {/* Right Side - Trend */}
        {trend && (
          <div
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
              ${trend.isPositive ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400'}
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

      {/* Value - Primary blue for emphasis */}
      <div className="mt-3">
        <p
          className="text-xl sm:text-2xl font-bold tracking-tight"
          style={{ color: 'var(--color-card-value)' }}
        >
          {value}
        </p>
      </div>

      {/* Title & Subtitle */}
      <div className="mt-0.5">
        <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
        )}
      </div>
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
        flex items-center gap-4 rounded-xl p-4
        transition-all duration-200
        ${isInteractive ? 'cursor-pointer hover:-translate-y-0.5 group' : ''}
      `}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      <div className={`p-2.5 rounded-lg ${colors.bg}`}>
        <div className={colors.icon}>{icon}</div>
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--color-card-value)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{title}</p>
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
      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors.gradient}`}></div>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}:</span>
      <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value}</span>
    </div>
  );
}

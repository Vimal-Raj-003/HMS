import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
  collapsedContent?: React.ReactNode;
}

/**
 * CollapsibleCard - A reusable card component with collapse/expand functionality
 * Futuristic design with smooth animations and consistent styling
 * 
 * @param title - Card title text
 * @param subtitle - Optional subtitle/description shown in header
 * @param icon - Optional icon to display in header
 * @param iconBgColor - Background color class for icon container (e.g., 'bg-primary-100')
 * @param children - Card content (shown when expanded)
 * @param defaultCollapsed - Whether card starts collapsed (default: true)
 * @param className - Additional CSS classes for the card container
 * @param headerAction - Optional action element in header (e.g., "View all" link)
 * @param collapsedContent - Optional content to show when collapsed (e.g., summary)
 */
export default function CollapsibleCard({
  title,
  subtitle,
  icon,
  iconBgColor = 'bg-primary-100',
  children,
  defaultCollapsed = true,
  className = '',
  headerAction,
  collapsedContent,
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-200 border shadow-stat ${className}`}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderColor: 'var(--color-card-border)',
      }}
    >
      {/* Card Header - Always visible */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-1.5 rounded-lg ${iconBgColor}`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-card-title)' }}>{title}</h2>
            {subtitle && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headerAction && (
            <div className="hidden sm:block">
              {headerAction}
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-navy-500 hover:bg-navy-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-navy-900 dark:hover:text-gray-200"
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
        `}
      >
        {/* Optional collapsed content - shown when collapsed */}
        {isCollapsed && collapsedContent && (
          <div className="p-4 bg-background-soft dark:bg-gray-800/50" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {collapsedContent}
          </div>
        )}
        
        {/* Main content - shown when expanded */}
        <div className={`${isCollapsed ? 'hidden' : ''}`}>
          {children}
        </div>
      </div>

      {/* Collapsed Summary - shown when content is hidden */}
      {isCollapsed && collapsedContent && (
        <div className="p-4 bg-background-soft dark:bg-gray-800/50">
          {collapsedContent}
        </div>
      )}
    </div>
  );
}

/**
 * CollapsibleCardSimple - A simpler variant without icon styling
 * Use this when you want a cleaner header without the icon container
 */
export function CollapsibleCardSimple({
  title,
  subtitle,
  children,
  defaultCollapsed = true,
  className = '',
  headerAction,
}: Omit<CollapsibleCardProps, 'icon' | 'iconBgColor' | 'collapsedContent'>) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all duration-200 border shadow-stat ${className}`}
      style={{
        backgroundColor: 'var(--color-card-bg)',
        borderColor: 'var(--color-card-border)',
      }}
    >
      {/* Card Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-card-title)' }}>{title}</h2>
          {subtitle && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {headerAction && (
            <div className="hidden sm:block">
              {headerAction}
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-navy-500 hover:bg-navy-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-navy-900 dark:hover:text-gray-200"
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}
        `}
      >
        <div className={`${isCollapsed ? 'hidden' : ''}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

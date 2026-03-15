import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerAction?: ReactNode;
  collapsedContent?: ReactNode;
}

/**
 * CollapsibleCard - A reusable card component with collapse/expand functionality
 * 
 * Designed for large content cards in dashboards (tables, lists, charts, etc.)
 * Small metric cards (StatCard) should remain unchanged.
 * 
 * @param title - Card title text
 * @param subtitle - Optional subtitle/description shown in header
 * @param icon - Optional icon to display in header
 * @param iconBgColor - Background color class for icon container (e.g., 'bg-blue-100')
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
  iconBgColor = 'bg-secondary-100',
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
      className={`bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden ${className}`}
    >
      {/* Card Header - Always visible */}
      <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`p-2 rounded-lg ${iconBgColor}`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-secondary-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-secondary-500">{subtitle}</p>
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
            className="
              p-2 rounded-lg text-secondary-500 hover:text-secondary-700 
              hover:bg-secondary-100 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            "
            aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
            title={isCollapsed ? 'Click to expand' : 'Click to collapse'}
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
        {/* Optional collapsed content - shown when collapsed */}
        {isCollapsed && collapsedContent && (
          <div className="p-4 bg-secondary-50/50 border-b border-secondary-100">
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
        <div className="p-4 bg-secondary-50/50">
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
      className={`bg-white rounded-xl border border-secondary-200 shadow-card overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-secondary-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-secondary-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-secondary-500">{subtitle}</p>
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
            className="
              p-2 rounded-lg text-secondary-500 hover:text-secondary-700 
              hover:bg-secondary-100 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            "
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

interface SkeletonProps {
  className?: string;
}

// Base Skeleton component
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-gradient-to-r from-secondary-200 via-secondary-100 to-secondary-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
    />
  );
}

// Text Skeleton
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 1, className = '' }: SkeletonTextProps) {
  if (lines === 1) {
    return <Skeleton className={`h-4 ${className}`} />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-4 ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

// Title Skeleton
export function SkeletonTitle({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-6 w-48 ${className}`} />;
}

// Avatar Skeleton
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className = '' }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full ${className}`} />;
}

// Card Skeleton
interface SkeletonCardProps {
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export function SkeletonCard({ className = '', showAvatar = false, lines = 3 }: SkeletonCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-secondary-200 p-5 ${className}`}>
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

// Stat Card Skeleton
export function SkeletonStatCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-white rounded-xl border border-secondary-100 p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

// Table Row Skeleton
interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export function SkeletonTableRow({ columns = 4, className = '' }: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-5 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Table Skeleton
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`bg-white rounded-xl border border-secondary-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-secondary-50/80">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-5 py-3.5">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <SkeletonTableRow key={rowIndex} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// List Item Skeleton
export function SkeletonListItem({ className = '' }: SkeletonProps) {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Form Skeleton
interface SkeletonFormProps {
  fields?: number;
  className?: string;
}

export function SkeletonForm({ fields = 4, className = '' }: SkeletonFormProps) {
  return (
    <div className={`space-y-5 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

// Dashboard Skeleton - Full page loading state
export function SkeletonDashboard({ className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={5} columns={4} />
        </div>
        <div className="space-y-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    </div>
  );
}

// Loading Spinner
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-2',
  };

  return (
    <div
      className={`animate-spin rounded-full border-secondary-200 border-t-primary-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-secondary-500">{message}</p>
    </div>
  );
}

// Inline Loading
interface InlineLoadingProps {
  message?: string;
}

export function InlineLoading({ message = 'Loading...' }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2 text-secondary-500">
      <Spinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

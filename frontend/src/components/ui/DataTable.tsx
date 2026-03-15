import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  maxHeight?: string;
  className?: string;
  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  };
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRowClick,
  stickyHeader = true,
  maxHeight,
  className = '',
  pagination,
}: DataTableProps<T>) {
  const getCellValue = (row: T, key: string): any => {
    return key.split('.').reduce((obj, key) => obj?.[key], row as any);
  };

  const getAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border border-secondary-200 overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-secondary-50/80">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider"
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {[...Array(5)].map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4">
                      <div className="h-4 bg-secondary-100 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-secondary-200 overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          {emptyIcon ? (
            <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
              <div className="text-secondary-400">{emptyIcon}</div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          )}
          <p className="text-sm font-medium text-secondary-700">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-secondary-200 overflow-hidden ${className}`}>
      <div className={`overflow-x-auto ${maxHeight ? maxHeight : ''}`}>
        <table className="min-w-full">
          <thead className={`bg-secondary-50/80 backdrop-blur-sm ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-3.5 text-xs font-semibold text-secondary-500 uppercase tracking-wider border-b border-secondary-200 ${getAlignment(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-primary-50/50 transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-5 py-4 text-sm text-secondary-900 ${getAlignment(column.align)}`}
                  >
                    {column.render
                      ? column.render(getCellValue(row, column.key), row, index)
                      : getCellValue(row, column.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-secondary-100 bg-secondary-50/50">
          <div className="text-xs text-secondary-500">
            Showing{' '}
            <span className="font-medium text-secondary-700">
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-secondary-700">
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-secondary-700">{pagination.totalItems}</span> results
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm font-medium text-secondary-900">{pagination.currentPage}</span>
              <span className="text-xs text-secondary-400">of</span>
              <span className="text-sm text-secondary-600">{pagination.totalPages}</span>
            </div>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Table variant without pagination
interface SimpleTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function SimpleTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className = '',
}: SimpleTableProps<T>) {
  const getCellValue = (row: T, key: string): any => {
    return key.split('.').reduce((obj, key) => obj?.[key], row as any);
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-secondary-200 ${className}`}>
      <table className="min-w-full divide-y divide-secondary-100">
        <thead className="bg-secondary-50/80">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-5 py-3.5 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-100">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-primary-50/50 transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 text-sm text-secondary-900">
                  {column.render
                    ? column.render(getCellValue(row, column.key), row, 0)
                    : getCellValue(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

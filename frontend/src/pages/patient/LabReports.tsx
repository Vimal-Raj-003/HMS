import { useEffect, useState } from 'react';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { DocumentViewer } from '../../components/ui';
import {
  Download,
  Calendar,
  User,
  FlaskConical,
  AlertCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  FileDown,
  Eye
} from 'lucide-react';

interface LabReport {
  id: string;
  date: string;
  testName: string;
  category: string;
  doctorName: string;
  status: string;
  results: {
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
    interpretation: string;
  }[];
  notes?: string;
  // New document fields
  reportFileUrl?: string;
  reportFileType?: string;
}

// Dummy data removed - all data comes from patient-specific API calls

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'PENDING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending'
      };
    case 'COMPLETED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: FlaskConical,
        label: 'Completed'
      };
    case 'CANCELLED':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: AlertCircle,
        label: 'Cancelled'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: AlertCircle,
        label: status
      };
  }
};

const getInterpretationColor = (interpretation: string) => {
  switch (interpretation) {
    case 'NORMAL':
      return 'text-green-600 bg-green-50';
    case 'ABNORMAL':
      return 'text-yellow-600 bg-yellow-50';
    case 'CRITICAL':
      return 'text-red-600 bg-red-50 font-bold';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export default function LabReports() {
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [filter, setFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const response = await patientPortalAPI.getLabReports(filter !== 'all' ? filter : undefined);
      // Only use data from the API - no dummy data fallback
      // This ensures patient data isolation
      setReports(response.data || []);
    } catch (error: any) {
      console.error('Error fetching lab reports:', error);
      toast.error(error.response?.data?.message || 'Failed to load lab reports');
      // Set empty reports on error - no dummy data
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: LabReport) => {
    if (report.status !== 'COMPLETED') {
      toast.error('Report is not yet available for viewing');
      return;
    }

    if (!report.reportFileUrl) {
      toast.error('Report file not available');
      return;
    }

    setViewingDocument({
      fileUrl: report.reportFileUrl,
      fileName: `${report.testName.replace(/\s+/g, '-').toLowerCase()}-report.pdf`,
      fileType: report.reportFileType || 'application/pdf'
    });
    setViewerOpen(true);
  };

  const handleDownloadPDF = async (report: LabReport) => {
    if (report.status !== 'COMPLETED') {
      toast.error('Report is not yet available for download');
      return;
    }

    setDownloadingId(report.id);

    try {
      const fileUrl = report.reportFileUrl;
      const fileName = `${report.testName.replace(/\s+/g, '-').toLowerCase()}-report.pdf`;
      
      if (!fileUrl) {
        // Generate a PDF content for demo purposes
        const content = `
LAB REPORT
==========

Test Name: ${report.testName}
Category: ${report.category}
Date: ${new Date(report.date).toLocaleDateString()}
Ordered By: Dr. ${report.doctorName}
Status: ${report.status}

RESULTS
-------
${report.results.map(r => `${r.parameter}: ${r.value} ${r.unit} (Reference: ${r.referenceRange}) - ${r.interpretation}`).join('\n')}

${report.notes ? `Notes: ${report.notes}` : ''}

---
This is a demo lab report generated for demonstration purposes.
        `.trim();

        const blob = new Blob([content], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download the actual file
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success('Report downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download report. Please try viewing it instead.');
    } finally {
      setDownloadingId(null);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewingDocument(null);
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all bg-white"
          >
            <option value="all">All Reports</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FlaskConical className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No lab reports found</h3>
          <p className="text-gray-500">Your lab reports will appear here once they are ready.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const statusConfig = getStatusConfig(report.status);
            const StatusIcon = statusConfig.icon;
            const isExpanded = selectedReport?.id === report.id;
            const isDownloading = downloadingId === report.id;

            return (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Report Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedReport(isExpanded ? null : report)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        report.status === 'COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <FlaskConical className={`w-6 h-6 ${
                          report.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">{report.testName}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Dr. {report.doctorName}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span>{report.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.status === 'COMPLETED' && (
                        <div className="hidden sm:flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReport(report);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-[#14B8A6] text-[#14B8A6] rounded-lg font-medium hover:bg-[#14B8A6]/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(report);
                            }}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                Download PDF
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {report.status === 'COMPLETED' && report.results.length > 0 && (
                      <div className="p-4 bg-gray-50">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Test Results</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {report.results.map((result, index) => (
                                <tr key={index} className="hover:bg-white transition-colors">
                                  <td className="py-3 text-sm font-medium text-gray-900">{result.parameter}</td>
                                  <td className="py-3 text-sm font-semibold text-gray-900">{result.value}</td>
                                  <td className="py-3 text-sm text-gray-500">{result.unit}</td>
                                  <td className="py-3 text-sm text-gray-500">{result.referenceRange}</td>
                                  <td className="py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getInterpretationColor(result.interpretation)}`}>
                                      {result.interpretation}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {report.notes && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-blue-800">Notes</p>
                                <p className="text-sm text-blue-700 mt-0.5">{report.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mobile Action Buttons */}
                        <div className="mt-4 flex flex-wrap justify-end gap-3 sm:hidden">
                          <button
                            onClick={() => handleViewReport(report)}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-[#14B8A6] text-[#14B8A6] rounded-lg font-medium hover:bg-[#14B8A6]/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(report)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <FileDown className="w-4 h-4" />
                                Download PDF
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {report.status === 'PENDING' && (
                      <div className="p-6 bg-yellow-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-yellow-800">Results Pending</p>
                            <p className="text-sm text-yellow-700 mt-0.5">
                              {report.notes || 'Your test results are being processed. You will be notified when the report is ready.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Total Reports</p>
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'COMPLETED').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'PENDING').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-[#2563EB]">{new Set(reports.map(r => r.category)).size}</p>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && viewingDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={closeViewer}
          fileUrl={viewingDocument.fileUrl}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          onDownload={() => {
            const report = reports.find(r => r.reportFileUrl === viewingDocument.fileUrl);
            if (report) {
              handleDownloadPDF(report);
            }
          }}
        />
      )}
    </div>
  );
}

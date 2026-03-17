import { useEffect, useState, useRef } from 'react';
import { patientPortalAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { DocumentViewer } from '../../components/ui';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Image, 
  FileIcon,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Eye
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  date: string;
  doctorName: string;
  specialization: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  followUpDate?: string;
  // New document fields
  documentName?: string;
  fileUrl?: string;
  fileType?: string;
  uploadDate?: string;
  uploadedBy?: 'PATIENT' | 'SYSTEM';
  fileSize?: number;
}

interface UploadedDocument {
  id: string;
  documentName: string;
  fileUrl: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: 'PATIENT' | 'SYSTEM';
  fileSize: number;
}

// Dummy data removed - all data comes from patient-specific API calls

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) {
    return <FileText className="w-8 h-8 text-red-500" />;
  } else if (fileType.includes('image') || fileType.includes('png') || fileType.includes('jpeg') || fileType.includes('jpg')) {
    return <Image className="w-8 h-8 text-blue-500" />;
  }
  return <FileIcon className="w-8 h-8 text-gray-500" />;
};

const getFileTypeLabel = (fileType: string) => {
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('png')) return 'PNG';
  if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'JPEG';
  return 'FILE';
};

const getFileExtension = (fileType: string, fileName: string): string => {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('png')) return 'png';
  if (fileType.includes('jpeg')) return 'jpeg';
  if (fileType.includes('jpg')) return 'jpg';
  // Fallback to extracting from filename
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && ['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
    return ext;
  }
  return 'pdf'; // Default fallback
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Document viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{
    fileUrl: string;
    fileName: string;
    fileType: string;
  } | null>(null);

  useEffect(() => {
    fetchRecords();
    fetchUploadedDocuments();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await patientPortalAPI.getRecords();
      // Only use data from the API - no dummy data fallback
      // This ensures patient data isolation
      setRecords(response.data || []);
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      toast.error(error.response?.data?.message || 'Failed to load medical records');
      // Set empty records on error - no dummy data
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedDocuments = async () => {
    try {
      const response = await patientPortalAPI.getDocuments();
      setUploadedDocuments(response.data || []);
    } catch (error: any) {
      console.error('Error fetching uploaded documents:', error);
      // Don't show toast for this error as it's a secondary load
      setUploadedDocuments([]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, PNG, JPEG, and JPG files are allowed.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setSelectedFile(file);
    setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentTitle.trim()) {
      toast.error('Please select a file and enter a document title');
      return;
    }

    setUploading(true);

    try {
      // Use FormData for efficient file upload (avoids base64 size overhead)
      const formData = new FormData();
      formData.append('documentName', documentTitle);
      formData.append('documentType', 'MEDICAL_RECORD');
      formData.append('file', selectedFile);
      formData.append('notes', '');

      // Upload to server
      await patientPortalAPI.uploadDocument(formData);

      // Refresh the documents list from server
      await fetchUploadedDocuments();

      toast.success('Document uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setDocumentTitle('');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = (record: MedicalRecord | UploadedDocument) => {
    const fileUrl = record.fileUrl || '';
    const fileName = record.documentName || 'document';
    const fileType = record.fileType || 'application/pdf';

    if (!fileUrl) {
      toast.error('Document not available for viewing');
      return;
    }

    setViewingDocument({ fileUrl, fileName, fileType });
    setViewerOpen(true);
  };

  const handleDownload = async (record: MedicalRecord | UploadedDocument) => {
    const fileUrl = record.fileUrl;
    const fileName = record.documentName || 'document';
    const fileType = record.fileType || 'application/pdf';
    
    if (!fileUrl) {
      toast.error('Document not available for download');
      return;
    }

    try {
      // If it's a blob URL (uploaded document), download directly
      if (fileUrl.startsWith('blob:')) {
        const a = window.document.createElement('a');
        a.href = fileUrl;
        a.download = fileName;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        toast.success('Download started!');
        return;
      }

      // For remote files, fetch and download with correct format
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Determine the correct file extension
      const extension = getFileExtension(fileType, fileName);
      const downloadFileName = fileName.endsWith(`.${extension}`) 
        ? fileName 
        : `${fileName}.${extension}`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Download started!');
    } catch (error: any) {
      console.error('Download error:', error);
      // Fallback: try direct download
      try {
        const extension = getFileExtension(fileType, fileName);
        const downloadFileName = fileName.endsWith(`.${extension}`) 
          ? fileName 
          : `${fileName}.${extension}`;
        
        const a = window.document.createElement('a');
        a.href = fileUrl;
        a.download = downloadFileName;
        a.target = '_blank';
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        toast.success('Download started!');
      } catch (fallbackError) {
        toast.error('Failed to download document');
      }
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await patientPortalAPI.deleteDocument(docId);
      await fetchUploadedDocuments();
      toast.success('Document deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setDocumentTitle('');
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewingDocument(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Action */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white rounded-xl font-medium hover:from-[#2563EB]/90 hover:to-[#14B8A6]/90 transition-all shadow-lg shadow-[#2563EB]/20 hover:shadow-xl"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Uploaded Documents Section */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#2563EB]/5 to-[#14B8A6]/5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#2563EB]" />
              My Uploaded Documents
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {uploadedDocuments.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.documentName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {getFileTypeLabel(doc.fileType)}
                        </span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <User className="w-4 h-4" />
                          You
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="p-2 text-[#14B8A6] hover:bg-[#14B8A6]/10 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Medical Records */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#2563EB]/5 to-[#14B8A6]/5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2563EB]" />
            Hospital Records
          </h2>
          <p className="text-sm text-gray-500 mt-1">Records uploaded by healthcare providers</p>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No medical records available</h3>
            <p className="text-gray-500">Your medical records will appear here once added by your healthcare provider.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((record) => (
              <div key={record.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        {record.fileType ? getFileIcon(record.fileType) : <FileText className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] text-xs font-medium rounded-full">
                            {record.specialization}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">
                          {record.documentName || `Dr. ${record.doctorName}`}
                        </h3>
                        <p className="text-sm text-gray-500 mt-0.5">{record.diagnosis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {record.fileType && (
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {getFileTypeLabel(record.fileType)}
                        </span>
                      )}
                      <div className="text-gray-400">
                        <svg
                          className={`w-5 h-5 transition-transform ${selectedRecord?.id === record.id ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedRecord?.id === record.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Doctor</h4>
                          <p className="text-sm text-gray-900">Dr. {record.doctorName}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Date</h4>
                          <p className="text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h4>
                        <p className="text-sm text-gray-600">{record.diagnosis}</p>
                      </div>

                      {record.prescription && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Prescription</h4>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{record.prescription}</p>
                        </div>
                      )}

                      {record.notes && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}

                      {record.followUpDate && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="text-sm text-yellow-800">
                            Follow-up scheduled: {new Date(record.followUpDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        {record.fileUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDocument(record);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-[#14B8A6] text-[#14B8A6] rounded-lg font-medium hover:bg-[#14B8A6]/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(record);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeUploadModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#2563EB]/5 to-[#14B8A6]/5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upload Medical Document</h2>
                <button
                  onClick={closeUploadModal}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Drag and Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-[#2563EB] bg-[#2563EB]/5'
                    : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setDocumentTitle('');
                      }}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Drag and drop your file here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#2563EB] hover:underline font-medium"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-gray-400">
                      Supported formats: PDF, PNG, JPEG, JPG (max 10MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpeg,.jpg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g., Blood Test Report"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
                />
              </div>

              {/* File Type Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-1">Allowed file types:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-blue-600">
                    <li>PDF documents</li>
                    <li>PNG images</li>
                    <li>JPEG/JPG images</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeUploadModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !documentTitle.trim() || uploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] text-white rounded-lg font-medium hover:from-[#2563EB]/90 hover:to-[#14B8A6]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerOpen && viewingDocument && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={closeViewer}
          fileUrl={viewingDocument.fileUrl}
          fileName={viewingDocument.fileName}
          fileType={viewingDocument.fileType}
          onDownload={() => {
            // Find the document to download
            const doc = [...uploadedDocuments, ...records].find(
              d => d.fileUrl === viewingDocument.fileUrl
            );
            if (doc) {
              handleDownload(doc);
            }
          }}
        />
      )}
    </div>
  );
}

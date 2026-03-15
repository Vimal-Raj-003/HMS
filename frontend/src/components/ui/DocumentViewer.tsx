import { useEffect, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: string;
  onDownload?: () => void;
}

const getFileExtension = (fileType: string, fileName: string): string => {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('png')) return 'png';
  if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'jpg';
  // Fallback to extracting from filename
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && ['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'unknown';
};

export default function DocumentViewer({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  onDownload
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, fileUrl]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError('Unable to load document. Please try downloading instead.');
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior
      const a = window.document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = '_blank';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    }
  };

  if (!isOpen) return null;

  const fileExtension = getFileExtension(fileType, fileName);
  const isPDF = fileExtension === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg'].includes(fileExtension);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#2563EB]/5 to-[#14B8A6]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {fileName}
              </h2>
              <p className="text-sm text-gray-500">
                {fileType || 'Document'} Preview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
                <p className="text-sm text-gray-600">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Preview</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Instead
                </button>
              </div>
            </div>
          )}

          {!error && isPDF && (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ minHeight: '500px' }}
            >
              <iframe
                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=${zoom / 100}`}
                className="w-full h-full rounded-lg border border-gray-300"
                style={{ 
                  minHeight: '500px',
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onLoad={handleLoad}
                onError={handleError}
                title={fileName}
              />
            </div>
          )}

          {!error && isImage && (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full rounded-lg shadow-lg transition-transform duration-200"
                style={{ 
                  zoom: zoom / 100,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}

          {!error && !isPDF && !isImage && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Not Available</h3>
                <p className="text-gray-500 mb-4">
                  This file type cannot be previewed. Please download to view.
                </p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#2563EB]/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {fileName}
          </p>
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface FilePreviewProps {
  fileUrl: string;
  onClear: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileUrl, onClear }) => {
  return (
    <div className="relative p-2 bg-gray-100 rounded-lg flex items-center justify-between mt-2">
      <img src={fileUrl} alt="File preview" className="max-h-24 max-w-full rounded-md object-contain" />
      <button
        onClick={onClear}
        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold shadow hover:bg-red-600 transition-colors"
        aria-label="Clear file"
      >
        &times;
      </button>
    </div>
  );
};

export default FilePreview;
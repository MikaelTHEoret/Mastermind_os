import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';

// 10MB in bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function FileUpload() {
  const [dragActive, setDragActive] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        // Handle file upload
        console.log('File accepted:', file.name);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        // Handle file upload
        console.log('File accepted:', file.name);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <label
          htmlFor="file-upload"
          className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-12 h-12 mb-3 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Maximum file size: 10MB</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleChange}
          />
        </label>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
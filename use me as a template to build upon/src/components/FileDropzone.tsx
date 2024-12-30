import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileDropzoneProps {
  accept?: Record<string, string[]>;
  maxSize?: number;
  onDrop: (files: File[]) => void;
  value?: string;
  preview?: string;
  onClear?: () => void;
  className?: string;
}

export default function FileDropzone({
  accept,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onDrop,
  value,
  preview,
  onClear,
  className,
}: FileDropzoneProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections,
  } = useDropzone({
    accept,
    maxSize,
    onDrop,
    multiple: false,
  });

  return (
    <div className={cn('relative', className)}>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {onClear && (
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-50 rounded-full text-white hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          )}
        >
          <input {...getInputProps()} />
          <Upload className={cn(
            'w-8 h-8 mx-auto mb-2',
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          )} />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop a file here, or click to select'}
          </p>
          {maxSize && (
            <p className="text-xs text-gray-500 mt-1">
              Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          )}
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-2 text-sm text-red-500">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map(error => (
                <p key={error.code}>{error.message}</p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
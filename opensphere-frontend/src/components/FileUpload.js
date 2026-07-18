import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadToCloudinary, getFileIcon, formatFileSize } from '../utils/cloudinary';
import toast from 'react-hot-toast';

export default function FileUpload({ onUploadComplete, accept, label = 'Drag & drop files here, or click to browse' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      try {
        setProgress(prev => ({ ...prev, [file.name]: 'uploading' }));
        const result = await uploadToCloudinary(file);
        setProgress(prev => ({ ...prev, [file.name]: 'done' }));
        onUploadComplete(result);
        toast.success(`${file.name} uploaded!`);
      } catch (err) {
        setProgress(prev => ({ ...prev, [file.name]: 'error' }));
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
    >
      <input {...getInputProps()} />
      <div className="text-3xl mb-2">📤</div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xs text-gray-400 mt-1">Images, PDFs, Docs, Spreadsheets, Videos — all supported</p>
      {uploading && (
        <div className="mt-4 space-y-1">
          {Object.entries(progress).map(([name, status]) => (
            <div key={name} className="text-xs flex items-center justify-center gap-2 text-gray-500">
              <span>{getFileIcon(name.split('.').pop())}</span>
              <span className="truncate max-w-xs">{name}</span>
              <span>
                {status === 'uploading' && '⏳'}
                {status === 'done' && '✅'}
                {status === 'error' && '❌'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AttachmentChip({ file, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
      <span className="text-lg">{getFileIcon(file.format)}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-gray-700">{file.originalName}</p>
        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 text-xs">
          ✕
        </button>
      )}
    </div>
  );
}
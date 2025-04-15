import React, { useState, useRef } from 'react';
import axios from 'axios';
import Loader from '../utils/Loader'
import apiConfig from "../../config/api";

const FileUploader = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  const maxSize = 30 * 1024 * 1024; 

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) {
      setDragging(true);
    }
  };

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported. Please upload PDF, Word, Excel or text files.');
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      setError('File size exceeds 30MB limit.');
      return false;
    }

    return true;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const processFile = (file) => {
    if (!validateFile(file)) return;

    setFile(file);
    setFileName(file.name);
    setFileSize(formatFileSize(file.size));
    setError(null);
    
    if (onFileUpload) {
      onFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      processFile(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const uploadFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(apiConfig.DOCUMENT_API, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (onFileUpload) {
        onFileUpload(response.data);
      }
    } catch (err) {
      console.error('Error analyzing file:', err);
      setError(err.response?.data?.error || 'Failed to analyze file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName('');
    setFileSize('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return (
          <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        );
      case 'doc':
      case 'docx':
        return (
          <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        );
      case 'xls':
      case 'xlsx':
        return (
          <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        );
      case 'txt':
        return (
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full max-w-[90vw] mb-8">
      <div 
        className={`relative overflow-hidden border-2 border-dashed p-6 rounded-lg transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] 
          ${dragging ? 'border-purple-400/80 bg-black/60 scale-105' : 'border-white/30 bg-black/40'} 
          ${file ? 'border-green-400/50' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!file ? handleClick : undefined}
        style={{ cursor: !file ? 'pointer' : 'default' }}
      >
        {/* Background Gradient Effects */}
        <div className="absolute -z-10 w-full h-full overflow-hidden">
          <div className="absolute w-48 h-48 bg-purple-500/30 rounded-full blur-3xl -top-10 -right-10"></div>
          <div className="absolute w-32 h-32 bg-blue-400/30 rounded-full blur-3xl bottom-0 left-1/3"></div>
          <div className="absolute w-24 h-24 bg-cyan-300/30 rounded-full blur-2xl bottom-1/3 -left-5"></div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
        />

        {loading ? (
          <Loader/>
        ) : file ? (
          <div className="relative w-full flex flex-col items-center">
            <div className="flex flex-col items-center justify-center mb-4 bg-black/30 p-4 rounded-lg w-full max-w-md">
              {getFileIcon(fileName)}
              <p className="text-lg font-medium text-white/80 mt-2 break-all text-center">{fileName}</p>
              <p className="text-sm text-white/50">{fileSize}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={removeFile}
                className="button whitespace-nowrap"
              >
                <span>Remove</span>
              </button>
              <button 
                onClick={() => uploadFile(file)}
                className="button whitespace-nowrap"
              >
                <span>Analyze Document</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-white/80 mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-white/50">PDF, DOC, DOCX, XLS, XLSX or TXT (Max 30MB)</p>
            </div>
          </>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 text-red-200 rounded-md w-full max-w-md text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader; 
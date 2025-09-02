import React, { useState, useCallback } from 'react';
import { uploadAudio } from '../services/api';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
      setMessage('');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const result = await uploadAudio(file);
      setMessage(`Upload successful! Job ID: ${result.job_id}`);
      setFile(null);
      e.target.reset();
    } catch (error) {
      setMessage('Upload failed: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <h2>Upload Audio File</h2>
      
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="file-selected">
            <p>✅ Selected: <strong>{file.name}</strong></p>
            <p>({Math.round(file.size / 1024)} KB)</p>
          </div>
        ) : (
          <div className="drop-instructions">
            <p>📁 Drag & drop your audio file here</p>
            <p>or</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.mp4"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setMessage('');
          }}
          disabled={loading}
          style={{ marginTop: '15px' }}
        />
        
        <button 
          type="submit" 
          disabled={loading || !file}
          className="upload-button"
        >
          {loading ? '📤 Uploading...' : '🚀 Upload File'}
        </button>
      </form>
      
      {message && (
        <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

// MAKE SURE IT SAYS export DEFAULT
export default UploadForm;
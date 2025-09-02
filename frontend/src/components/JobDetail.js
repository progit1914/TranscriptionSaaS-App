import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getJob } from '../services/api';

const JobDetail = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchJob = async () => {
    try {
      const jobData = await getJob(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchJob();
}, [jobId]); // ← Only jobId as dependency

  const fetchJob = async () => {
    try {
      const jobData = await getJob(jobId);
      setJob(jobData);
    } catch (error) {
      console.error('Failed to fetch job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading job details...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="job-detail">
      <h2>Job Details: {job.file_name}</h2>
      
      <div className="job-info">
        <p><strong>Status:</strong> <span className={`status-${job.status}`}>{job.status}</span></p>

	{/* ADD PROGRESS INDICATOR HERE */}
        {job.status === 'processing' && (
          <div className="progress-indicator">
            <div className="spinner"></div>
               Processing your audio... ⏳
          </div>
        )}

        <p><strong>Created:</strong> {new Date(job.created_at).toLocaleString()}</p>
        {job.completed_at && (
          <p><strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}</p>
        )}
        {job.processing_time && (
          <p><strong>Processing Time:</strong> {job.processing_time.toFixed(2)} seconds</p>
        )}
      </div>

      {job.status === 'completed' && job.transcription && (
        <div className="transcription-result">
          <h3>Transcription Result:</h3>
          <div className="transcription-text">
            {typeof job.transcription === 'string' 
              ? job.transcription 
              : job.transcription.transcription}
          </div>
          {job.transcription.word_count && (
            <p><strong>Word Count:</strong> {job.transcription.word_count}</p>
          )}
          {job.transcription.language && (
            <p><strong>Language:</strong> {job.transcription.language}</p>
          )}
        </div>
      )}

      {job.status === 'failed' && job.error && (
        <div className="error-message">
          <h3>Error:</h3>
          <p>{job.error}</p>
        </div>
      )}

      <button onClick={() => window.history.back()}>Back to Jobs</button>
    </div>
  );
};

export default JobDetail;
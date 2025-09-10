import React, { useState, useEffect } from 'react';
import { getJobs } from '../services/api';

const JobsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // In JobsList.js, add polling:
useEffect(() => {
  const interval = setInterval(fetchJobs, 5000); // Update every 5 seconds
  return () => clearInterval(interval);
}, []);

  const fetchJobs = async () => {
    try {
      const response = await getJobs();
      setJobs(response.jobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div className="jobs-list">
      <h2>Your Transcription Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs yet. Upload an audio file to get started!</p>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.file_name}</h3>
              <p>Status: <span className={`status-${job.status}`}>{job.status}</span></p>
	   
              {/* ADD PROGRESS INDICATOR HERE */}
              {job.status === 'processing' && (
                <div className="progress-indicator">Processing... ⏳</div>
              )}

              <p>Created: {new Date(job.created_at).toLocaleString()}</p>
              {job.processing_time && (
                <p>Processing: {job.processing_time.toFixed(2)}s</p>
              )}
              <button onClick={() => window.location.href = `/job/${job.id}`}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsList;
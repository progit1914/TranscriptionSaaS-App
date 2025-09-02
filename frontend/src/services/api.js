// frontend/src/services/api.js
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Add debug logging to check if token is being added
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apiToken');
  console.log('API Token being used:', token); // ← Add this line
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadAudio = async (file, apiKey) => {
  const formData = new FormData();
  formData.append('file', file);
  
const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/upload`, formData, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getJobs = async () => {
  const response = await api.get('/api/jobs');
  return response.data;
};

export const getJob = async (jobId) => {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await api.delete(`/api/jobs/${jobId}`);
  return response.data;
};

export default api;
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import UploadForm from './components/UploadForm';
import JobsList from './components/JobsList';
import JobDetail from './components/JobDetail';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if API token exists in localStorage
    const token = localStorage.getItem('apiToken');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('apiToken');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🎙️ Transcription SaaS</h1>
          {isAuthenticated && (
            <nav>
              <Link to="/">Home</Link>
              <Link to="/upload">Upload</Link>
              <Link to="/jobs">Jobs</Link>
              <button onClick={handleLogout}>Logout</button>
            </nav>
          )}
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? (
                <div className="dashboard">
                  <h2>Welcome to Transcription SaaS</h2>
                  <p>Upload audio files and get AI-powered transcriptions!</p>
                  <div className="quick-actions">
                    <Link to="/upload" className="action-button">Upload Audio</Link>
                    <Link to="/jobs" className="action-button">View Jobs</Link>
                  </div>
                </div>
              ) : (
                <Login onLogin={handleLogin} />
              )
            } />
            
            <Route path="/upload" element={
              isAuthenticated ? <UploadForm /> : <Login onLogin={handleLogin} />
            } />
            
            <Route path="/jobs" element={
              isAuthenticated ? <JobsList /> : <Login onLogin={handleLogin} />
            } />
            
            <Route path="/job/:jobId" element={
              isAuthenticated ? <JobDetail /> : <Login onLogin={handleLogin} />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
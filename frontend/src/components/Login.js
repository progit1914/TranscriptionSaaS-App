import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('apiToken', apiKey);
      onLogin(apiKey);
      setApiKey('');
    }
  };

  return (
    <div className="login-form">
      <h2>Enter Your API Key</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
        <button type="submit">Save API Key</button>
      </form>
      <p>Use: <code>your-super-secure-production-token-2024</code></p>
    </div>
  );
};

export default Login;
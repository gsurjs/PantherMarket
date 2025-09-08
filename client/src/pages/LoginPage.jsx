// client/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Make sure you export 'auth' from firebase.js
import { signInWithEmailAndPassword } from 'firebase/auth';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/'); // Redirect to homepage on successful login
    } catch (err) {
      setError('Failed to log in. Please check your email and password.');
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <h2>Login to PantherMarket</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="GSU Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
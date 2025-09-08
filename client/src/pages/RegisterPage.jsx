import React, { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Client-side validation ---
    const isValidGsuEmail = email.endsWith('@student.gsu.edu') || email.endsWith('@gsu.edu');
    if (!isValidGsuEmail) { //edge case check for valid gsu email
      setError('Please use a valid GSU student or faculty email.');
      return;
    }

    try {
      // --- Send data to the backend ---
      const response = await axios.post('/api/auth/register', { email, password });
      setSuccess('Registration successful! You can now log in.');
      setEmail('');
      setPassword('');
    } catch (err) {
      // --- Handle errors from the backend ---
      setError(err.response?.data?.message || 'An error occurred during registration.');
    }
  };

  return (
    <div>
      <h2>Register for PantherMarket</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="GSU Email (e.g., jdoe@student.gsu.edu)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
    </div>
  );
}

export default RegisterPage;
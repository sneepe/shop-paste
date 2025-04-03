import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase'; // Adjust path if needed

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/'); // Navigate to home page on success
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || 'Failed to register. Please try again.'); // Set error message
    }
  };

  return (
    <div>
      <h1>Register Page</h1>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message */}
        <button type="submit">Register</button>
      </form>
      {/* Link to login page can be added here */}
    </div>
  );
};

export default RegisterPage; 
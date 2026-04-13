import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, UserPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiCall } from '../api';
import './Auth.css';

export default function Signup() {
  const navigate = useNavigate();
  const { loginUser } = useAppContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await apiCall('signup', { username, email, password });
      if (res.success) {
        loginUser(res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || "Failed to create account.");
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page flex-center">
      <div className="glass-panel auth-card animate-fade-in">
        <div className="auth-header">
          <div className="logo-circle">
            <Wallet size={24} color="white" />
          </div>
          <h2>Create Account</h2>
          <p>Start tracking your earnings with <span className="text-gradient">Finlog</span></p>
        </div>
        
        {error && <p style={{color:'var(--danger)', fontSize:'0.85rem', textAlign:'center', marginTop:'1rem'}}>{error}</p>}
        
        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop:'1.25rem'}}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" required className="input-field" placeholder="how should we call you?" value={username} onChange={e => setUsername(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" required className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Creating...' : <>Sign Up <UserPlus size={18} /></>}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}

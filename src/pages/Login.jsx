import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { apiCall } from '../api';
import './Auth.css';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await apiCall('login', { email, password });
      if (res.success) {
        loginUser(res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || "Failed to log in.");
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
          <h2>Welcome Back</h2>
          <p>Login to your <span className="text-gradient">Finlog</span> account</p>
        </div>
        
        {error && <p style={{color:'var(--danger)', fontSize:'0.85rem', textAlign:'center', marginTop:'1rem'}}>{error}</p>}
        
        <form onSubmit={handleSubmit} className="auth-form" style={{marginTop:'1.25rem'}}>
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" required className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" required className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <button type="submit" className="btn btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Signing In...' : <>Sign In <ArrowRight size={18} /></>}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup" className="auth-link">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}

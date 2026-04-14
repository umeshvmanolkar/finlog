import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, TrendingUp, Wallet, Plus, LogOut, Activity, Edit2, Loader, ArrowDownCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { apiCall } from '../api';
import CalendarWidget from '../components/CalendarWidget';
import './Dashboard.css';



export default function Dashboard({ onLogout }) {
  const navigate = useNavigate();
  const { user, dashboardData, refreshDashboard, loading } = useAppContext();
  
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [savingTarget, setSavingTarget] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [savingWithdraw, setSavingWithdraw] = useState(false);

  if (loading && !dashboardData) {
    return <div className="container dashboard-page flex-center" style={{minHeight:'80vh'}}><Loader className="animate-spin" size={40} color="var(--accent-primary)"/></div>;
  }

  const data = dashboardData || { targetAmount: 10000, accounts: [], transactions: [] };
  const target = data.targetAmount || 10000;
  const accounts = data.accounts || [];
  const transactions = data.transactions || [];

  // Calculate totals
  const totalOverall = transactions.reduce((sum, tx) => {
    if (tx.type === 'profit') return sum + Number(tx.amount);
    if (tx.type === 'loss') return sum - Number(tx.amount);
    return sum;
  }, 0);
  
  const totalWithdrawn = transactions.reduce((sum, tx) => tx.type === 'withdraw' ? sum + Number(tx.amount) : sum, 0);
  const remainingBalance = totalOverall - totalWithdrawn;
  
  // Quick hack: 'date' in JS today matched
  const todayDateStr = new Date().toISOString().split('T')[0];
  const totalToday = transactions
    .filter(tx => tx.date && tx.date.startsWith(todayDateStr))
    .reduce((sum, tx) => tx.type === 'profit' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
    
  const progress = target > 0 ? Math.min((totalOverall / target) * 100, 100) : 0;
  const todayProgress = target > 0 ? ((totalToday / target) * 100).toFixed(2) : 0;
  
  const withdrawnPercent = target > 0 ? Math.min((totalWithdrawn / target) * 100, 100) : 0;
  const remainingPercent = target > 0 ? Math.min((remainingBalance / target) * 100, 100) : 0;

  // Compute account balances
  const enrichedAccounts = accounts.map(acc => {
    const accTxs = transactions.filter(t => t.accountId === acc.id);
    const overall = accTxs.reduce((sum, tx) => tx.type === 'profit' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
    const today = accTxs.filter(tx => tx.date && tx.date.startsWith(todayDateStr)).reduce((sum, tx) => tx.type === 'profit' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
    return { ...acc, overall, today };
  });

  const chartData = [];
  const todayObj = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayObj);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const dailyEarning = transactions
      .filter(tx => tx.date && tx.date.startsWith(dateStr) && tx.type === 'profit')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
    chartData.push({ name: dayNames[d.getDay()], earning: dailyEarning });
  }

  const handleUpdateTarget = async () => {
    if(!newTarget) return;
    setSavingTarget(true);
    try {
      await apiCall('updateTarget', { userId: user.id, targetAmount: Number(newTarget) });
      await refreshDashboard();
      setIsEditingTarget(false);
    } catch(err) {
      console.error(err);
    }
    setSavingTarget(false);
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if(!newSourceName.trim()) return;
    setSavingSource(true);
    try {
      await apiCall('addAccount', { userId: user.id, accountName: newSourceName });
      await refreshDashboard();
      setNewSourceName('');
      setShowAddSource(false);
    } catch(err) {
      console.error(err);
    }
    setSavingSource(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if(!withdrawAmount) return;
    setSavingWithdraw(true);
    try {
      await apiCall('addTransaction', { userId: user.id, accountId: 'GLOBAL', amount: Number(withdrawAmount), type: 'withdraw' });
      await refreshDashboard();
      setWithdrawAmount('');
      setShowWithdraw(false);
    } catch(err) {
      console.error(err);
    }
    setSavingWithdraw(false);
  };

  return (
    <div className="container dashboard-page">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h2>Welcome back, <span className="text-gradient">{user?.username || 'User'}</span></h2>
          <p>Here is your financial overview for today.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <div className="summary-cards animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel stat-card" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3>Earnings vs Target</h3>
              <button 
                disabled={savingTarget}
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: 'none' }}
                onClick={() => { setIsEditingTarget(!isEditingTarget); setNewTarget(target); }}
              >
                {savingTarget ? <Loader size={14} className="animate-spin"/> : <Edit2 size={14} color="var(--text-muted)" />}
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.2rem 0.5rem', background: 'transparent', border: '1px solid var(--border)', fontSize: '0.8rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
                onClick={() => setShowWithdraw(!showWithdraw)}
              >
                <ArrowDownCircle size={14} color="var(--text-muted)" /> Withdraw
              </button>
            </div>
            <div className="stat-icon primary"><Wallet size={20} /></div>
          </div>
          
          {isEditingTarget && (
             <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input type="number" className="input-field" style={{ padding: '0.5rem' }} value={newTarget} onChange={e => setNewTarget(e.target.value)} />
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleUpdateTarget} disabled={savingTarget}>Save</button>
             </div>
          )}

          {showWithdraw && (
             <form style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(37, 99, 235, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)' }} onSubmit={handleWithdraw}>
                <input type="number" required className="input-field" style={{ padding: '0.5rem' }} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Amount to withdraw" disabled={savingWithdraw}/>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: '#2563eb' }} disabled={savingWithdraw}>
                  {savingWithdraw ? 'Processing...' : 'Withdraw'}
                </button>
             </form>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="stat-value" style={{ marginBottom: 0 }}>₹ {totalOverall.toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500 }}>/ {target.toLocaleString()}</span>
          </div>

          <div style={{ position: 'relative', marginBottom: '2rem', marginTop: '1.5rem', paddingBottom: '0.5rem' }}>
            <div className="progress-bubble" style={{ left: `${withdrawnPercent + remainingPercent}%` }}>
              ₹ {totalOverall.toLocaleString()}
            </div>
            <div className="stacked-progress-bg">
              <div className="stacked-progress-segment withdrawn" style={{ width: `${withdrawnPercent}%` }}>
                 {withdrawnPercent > 5 && <span className="segment-label">₹ {totalWithdrawn.toLocaleString()}</span>}
              </div>
              <div className="stacked-progress-segment remaining" style={{ width: `${remainingPercent}%` }}>
                 {remainingPercent > 5 && <span className="segment-label">₹ {remainingBalance.toLocaleString()}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{progress.toFixed(1)}% achieved overall</p>
            <p style={{ color: 'var(--success)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
              <TrendingUp size={14} /> +₹ {totalToday} today ({todayProgress}%)
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel chart-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="section-header">
          <h3>Earnings Overview (Last 7 Days)</h3>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip contentStyle={{ backgroundColor: '#151822', borderColor: '#2A2D3A', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#6366f1' }} />
              <Area type="monotone" dataKey="earning" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorEarning)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="accounts-section animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="section-header">
          <h3>Earning Sources</h3>
          <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => setShowAddSource(!showAddSource)}>
            <Plus size={16} /> Add Source
          </button>
        </div>

        {showAddSource && (
          <form className="glass-panel transaction-form animate-fade-in" style={{ marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid var(--border)' }} onSubmit={handleAddSource}>
            <div className="form-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Add New Source</h3>
              <button type="button" style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'1.5rem', cursor:'pointer' }} onClick={() => setShowAddSource(false)}>×</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Source Name</label>
              <input type="text" required className="input-field" value={newSourceName} onChange={e => setNewSourceName(e.target.value)} placeholder="e.g. Side Hustle" disabled={savingSource}/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingSource}>
              {savingSource ? 'Saving...' : 'Add Source'}
            </button>
          </form>
        )}
        
        <div className="accounts-grid">
          {enrichedAccounts.length === 0 && <p style={{color:'var(--text-muted)'}}>No earning sources yet!</p>}
          {enrichedAccounts.map(account => (
            <div key={account.id} className="glass-panel account-card" onClick={() => navigate(`/account/${account.id}`)}>
              <div className="account-header">
                <div className="account-name">
                  <Activity size={18} color="var(--accent-secondary)" />
                  {account.accountName}
                </div>
              </div>
              <div className="account-stats">
                <div className="stat-item">
                  <h4>Overall</h4>
                  <p>₹ {account.overall.toLocaleString()}</p>
                </div>
                <div className="stat-item" style={{ textAlign: 'right' }}>
                  <h4>Today</h4>
                  <p className={account.today >= 0 ? 'today' : ''} style={{color: account.today < 0 ? 'var(--danger)' : ''}}>
                    {account.today >= 0 ? '+' : ''}₹ {account.today}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CalendarWidget />
    </div>
  );
}

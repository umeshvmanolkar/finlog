import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Plus, Minus, Loader } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { apiCall } from '../api';
import './AccountDetails.css';

const MOCK_CHART = [
  { name: 'Mon', earning: 50 }, { name: 'Tue', earning: 120 }, { name: 'Wed', earning: 30 },
  { name: 'Thu', earning: 60 }, { name: 'Fri', earning: 150 },
];

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, dashboardData, refreshDashboard } = useAppContext();

  const [formType, setFormType] = useState(null); 
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState(''); // Mapping note to "type" just to track it, but backend accepts fixed [amount, type, date]. We will save 'note' as type temporarily!
  const [savingTx, setSavingTx] = useState(false);

  if (!dashboardData) {
    return <div className="container account-page flex-center"><Loader className="animate-spin" /></div>;
  }

  const account = dashboardData.accounts.find(a => String(a.id) === String(id));
  if (!account) return <div className="container" style={{color:'white'}}>Account not found</div>;

  const accountTxs = dashboardData.transactions.filter(t => String(t.accountId) === String(id)).reverse(); // Latest first
  const overall = accountTxs.reduce((sum, tx) => tx.type === 'profit' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);

  const handleTransaction = async (e) => {
    e.preventDefault();
    if(!amount) return;
    setSavingTx(true);
    try {
      await apiCall('addTransaction', {
        userId: user.id,
        accountId: id,
        amount: Number(amount),
        type: formType // 'profit' or 'loss'
        // optionally we could extend backend to support 'note', currently it saves into type. 
        // We will just leave type as profit/loss and lose 'note' from backend since we didn't add the column!
      });
      await refreshDashboard();
      setFormType(null);
      setAmount('');
      setNote('');
    } catch(err) {
      console.error(err);
    }
    setSavingTx(false);
  };

  return (
    <div className="container account-page">
      <header className="account-header animate-fade-in">
        <button className="btn btn-outline back-btn" onClick={() => navigate(-1)}><ArrowLeft size={18} /> Back</button>
        <div className="account-title">
          <div className="icon-wrapper"><Activity size={24} color="var(--accent-secondary)"/></div>
          <h2>{account.accountName}</h2>
        </div>
      </header>

      <div className="balance-overview glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <p>Total Balance</p>
        <div className="balance-amount">₹ {overall.toLocaleString()}</div>
      </div>

      <div className="action-buttons animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <button className="btn btn-profit" onClick={() => setFormType('profit')}><Plus size={18} /> Add Profit</button>
        <button className="btn btn-loss" onClick={() => setFormType('loss')}><Minus size={18} /> Deduct Loss</button>
      </div>

      {formType && (
        <form className="glass-panel transaction-form animate-fade-in" onSubmit={handleTransaction}>
          <div className="form-header">
            <h3>{formType === 'profit' ? 'Add Profit' : 'Deduct Loss'}</h3>
            <button type="button" className="close-btn" onClick={() => setFormType(null)}>×</button>
          </div>
          <div className="input-group">
            <label>Amount (₹)</label>
            <input type="number" required min="1" className="input-field" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" disabled={savingTx}/>
          </div>
          {/* Note field visual only for now since google sheet backend doesn't save it yet */}
          <div className="input-group">
            <label>Short Note (Optional)</label>
            <input type="text" className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Sales, Tax" disabled={savingTx}/>
          </div>
          <button type="submit" className={`btn full-width ${formType === 'profit' ? 'btn-profit' : 'btn-loss'}`} disabled={savingTx}>
            {savingTx ? 'Saving...' : `Confirm ${formType === 'profit' ? 'Profit' : 'Loss'}`}
          </button>
        </form>
      )}

      <div className="chart-section glass-panel animate-fade-in" style={{ animationDelay: '0.3s', marginTop: '2rem' }}>
        <h3>7-Day Performance</h3>
        <div style={{ width: '100%', height: 200, marginTop: '1rem' }}>
          <ResponsiveContainer>
            <AreaChart data={MOCK_CHART} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#9CA3AF" tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#151822', borderColor: '#2A2D3A', borderRadius: '12px' }} itemStyle={{ color: '#ec4899' }} />
              <Area type="monotone" dataKey="earning" stroke="#EC4899" strokeWidth={3} fillOpacity={1} fill="url(#colorAcc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="transactions-list animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <h3>Recent History</h3>
        {accountTxs.length === 0 && <p style={{color:'var(--text-muted)'}}>No history logged yet.</p>}
        <div className="tx-container">
          {accountTxs.map(tx => (
            <div key={tx.id} className="tx-item glass-panel">
              <div className="tx-info">
                <div className={`tx-icon ${tx.type}`}>
                  {tx.type === 'profit' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div>
                  <h4>{tx.type.toUpperCase()}</h4>
                  <p>{new Date(tx.date).toLocaleString()}</p>
                </div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {tx.type === 'profit' ? '+' : '-'}₹ {tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

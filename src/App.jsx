import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AccountDetails from './pages/AccountDetails';
import { AppProvider, useAppContext } from './context/AppContext';
import './App.css'; 

function AppContent() {
  const { user, logoutUser } = useAppContext();

  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
        <Route path="/dashboard" element={user ? <Dashboard onLogout={logoutUser} /> : <Navigate to="/login" />} />
        <Route path="/account/:id" element={user ? <AccountDetails /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}

export default App;

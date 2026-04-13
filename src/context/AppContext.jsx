import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDashboard } from '../api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('finlog_user')) || null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('finlog_user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    setDashboardData(null);
    localStorage.removeItem('finlog_user');
  };

  const refreshDashboard = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchDashboard(user.id);
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load dashboard data.", err);
    }
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (user) {
      refreshDashboard();
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ user, loginUser, logoutUser, dashboardData, refreshDashboard, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);

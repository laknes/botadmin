import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Broadcast from './pages/Broadcast';
import BotDesigner from './pages/BotDesigner';
import UsersPage from './pages/Users';
import BotUsers from './pages/BotUsers';
import Login from './pages/Login';
import { FeedbackProvider } from './components/Feedback';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check local storage for mock session
    const storedAuth = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('user_role');
    if (storedAuth) {
      setIsAuthenticated(true);
      setUserRole(storedRole || 'editor');
    }
  }, []);

  const handleLogin = (role: string) => {
    localStorage.setItem('auth_token', 'mock_jwt_token_12345');
    localStorage.setItem('user_role', role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
    setUserRole('');
  };

  return (
    <FeedbackProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/*" element={
            isAuthenticated ? (
              <Layout userRole={userRole} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/broadcast" element={<Broadcast />} />
                  <Route path="/bot-designer" element={<BotDesigner />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/bot-users" element={<BotUsers />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </Router>
    </FeedbackProvider>
  );
};

export default App;
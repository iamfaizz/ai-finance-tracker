import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function AppContent() {
  const { token } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  if (!token) {
    return showLogin
      ? <Login onSwitch={() => setShowLogin(false)} />
      : <Register onSwitch={() => setShowLogin(true)} />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
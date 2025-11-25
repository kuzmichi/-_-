import { useState } from 'react';
import './styles/app.css';
import LoginPage from './pages/LoginForm';
import RegisterPage from './pages/RegisterForm';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'client' | 'admin' | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="main-card">
          <div className="card-inner">
            <div className="form-section">
              {showRegister ? (
                <RegisterPage onSwitch={() => setShowRegister(false)} />
              ) : (
                <LoginPage
                  onSwitch={() => setShowRegister(true)}
                  onLoginSuccess={(role) => {
                    setUserRole(role);
                    setIsAuthenticated(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return userRole === 'admin' ? (
    <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <ClientDashboard onLogout={() => setIsAuthenticated(false)} />
  );
}

export default App;

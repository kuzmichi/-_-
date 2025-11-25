import { useState, useEffect } from 'react';
import { profileUser } from '../api/authAPI';
import type { UserData } from '../types';
import { ProgressIndicator } from '../components/ProgressIndicator';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

const handleLogout = () => {
  localStorage.removeItem('token');
  onLogout();
};


useEffect(() => {
  if (activeTab === 'profile') {
    const token = localStorage.getItem('token') ?? '';
    setLoading(true);

    profileUser(token)
      .then(setProfile)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }
}, [activeTab]);




  return (
    <div className="dashboard-container">
      {/* Сайдбар */}
      <aside className="dashboard-sidebar">
        <h2 className="sidebar-title">Админ-панель</h2>
        <button
          className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Дашборд
        </button>
        <button
          className={`sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Профиль
        </button>
        <button className="sidebar-btn btn-danger" onClick={handleLogout}>
          Выйти
        </button>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-cards">
            <div className="stat-card">
              <div className="stat-number">25</div>
              <div className="stat-label">Пользователей</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">12</div>
              <div className="stat-label">Активных клиентов</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">4</div>
              <div className="stat-label">Тренеров</div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Мой профиль</h2>
            {loading && <ProgressIndicator label="Загрузка профиля..." />}
            {profile && (
              <div className="profile-info">
                <p><strong>ФИО:</strong> {profile.surname} {profile.name} {profile.secondname}</p>
                <p><strong>Login:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Телефон:</strong> {profile.phonenumber}</p>
                <p><strong>Роль:</strong> {profile.role}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

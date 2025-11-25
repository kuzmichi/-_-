

export default function ClientDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-container">
      <div className="main-card dashboard-view">
        <div className="form-section">
          <div className="form-container">
            <div className="dashboard-header">
              <div className="user-info">
                <div className="avatar">C</div>
                <h2>Добро пожаловать, клиент!</h2>
              </div>
              <button className="btn btn-danger" onClick={onLogout}>
                Выйти
              </button>
            </div>

            <div className="dashboard-content">
              <div className="stat-card">
                <div className="stat-number">5</div>
                <div className="stat-label">Тренировки</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">3</div>
                <div className="stat-label">Посещения</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

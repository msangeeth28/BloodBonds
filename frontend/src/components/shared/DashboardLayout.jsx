import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/dashboard.css";

export default function DashboardLayout({ title, navItems, activeTab, onTabChange, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    logout();
  };

  const displayName = user?.organizationName || user?.name || "User";
  const initial = displayName[0]?.toUpperCase() || "U";
  const avatarSrc = user?.profileImage || null;

  return (
    <div className="db-root">
      <nav className="db-nav">
        <div className="db-nav-inner">
          <div className="db-logo">❤ Blood-Bonds</div>
          <div className="db-nav-user">
            <div className="db-avatar">
              {avatarSrc
                ? <img src={avatarSrc} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : initial
              }
            </div>
            <span className="db-welcome">Welcome, <strong>{displayName}</strong></span>
            <button className="db-logout" onClick={() => setShowLogoutModal(true)}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="db-body">
        <aside className="db-sidebar">
          <nav className="db-sidenav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`db-navbtn ${activeTab === item.id ? "active" : ""}`}
                onClick={() => onTabChange(item.id)}
              >
                <span className="db-navicon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="db-main">{children}</main>
      </div>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">👋</div>
            <h3 className="logout-modal-title">Leaving so soon?</h3>
            <p className="logout-modal-text">
              Are you sure you want to logout? You'll need to sign in again to access your dashboard.
            </p>
            <div className="logout-modal-actions">
              <button className="logout-btn-cancel" onClick={() => setShowLogoutModal(false)}>
                Stay
              </button>
              <button className="logout-btn-confirm" onClick={handleLogoutConfirm}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

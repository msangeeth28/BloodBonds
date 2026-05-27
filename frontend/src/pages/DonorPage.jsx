import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import { LOCATIONS, API_BASE } from "../utils/constants";
import DashboardLayout from "../components/shared/DashboardLayout";
import EmptyState from "../components/shared/EmptyState";
import Toast from "../components/shared/Toast";
import Modal from "../components/shared/Modal";
import "../styles/dashboard.css";
import "../styles/donor-page.css";

const NAV = [
  { id: "requests",     icon: "🚨", label: "Emergency Requests" },
  { id: "requirements", icon: "🩸", label: "Blood Requirements" },
  { id: "history",      icon: "📋", label: "Donation History" },
  { id: "profile",      icon: "👤", label: "My Profile" },
];

export default function DonorPage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  
  const [tab, setTab] = useState("requests");
  const [toast, setToast] = useState(null);
  const displayName = user?.name || "Donor";
  const initial = displayName[0]?.toUpperCase() || "U";
  const avatarSrc = user?.profileImage || null;

  const [emergencyReqs, setEmergencyReqs] = useState([]);
  const [bloodReqs, setBloodReqs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState({});

  // Profile view/edit mode
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    mobile: user?.mobile || "",
    city: user?.city || "",
    subLocation: user?.subLocation || "",
  });
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "donor") navigate("/");
  }, [user]);

  useEffect(() => {
    loadEmergency();
    loadRequirements();
    loadHistory();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });
  const setLoad = (key, val) => setLoading((p) => ({ ...p, [key]: val }));

  const loadEmergency = async () => {
    setLoad("emergency", true);
    try { setEmergencyReqs(await apiFetch("/donor/matching-requests")); }
    catch { setEmergencyReqs([]); }
    finally { setLoad("emergency", false); }
  };

  const loadRequirements = async () => {
    setLoad("requirements", true);
    try { setBloodReqs(await apiFetch("/donor/blood-requirements")); }
    catch { setBloodReqs([]); }
    finally { setLoad("requirements", false); }
  };

  const loadHistory = async () => {
    setLoad("history", true);
    try { setHistory(await apiFetch("/donor/donation-history")); }
    catch { setHistory([]); }
    finally { setLoad("history", false); }
  };

  const handleEditToggle = () => {
    if (!editMode) {
      setProfileForm({
        mobile: user?.mobile || "",
        city: user?.city || "",
        subLocation: user?.subLocation || "",
      });
      setImagePreview(user?.profileImage || null);
    }
    setEditMode((p) => !p);
  };

  const handleCancel = () => {
    setProfileForm({
      mobile: user?.mobile || "",
      city: user?.city || "",
      subLocation: user?.subLocation || "",
    });
    setImagePreview(user?.profileImage || null);
    setEditMode(false);
  };


  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.city || !profileForm.subLocation) return showToast("Select city and area", "error");
    setLoad("profile", true);
    try {
      const data = await apiFetch("/donor/update-profile", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      updateUser(data.donor);
      showToast("Profile updated successfully ✅");
      setEditMode(false);
      loadEmergency();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoad("profile", false);
    }
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) return showToast("Please upload a JPG, PNG, or WebP image", "error");
    if (file.size > 2 * 1024 * 1024) return showToast("Image must be less than 2MB", "error");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      setImageUploading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/profile-image`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ profileImage: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        updateUser({ profileImage: data.profileImage });
        showToast("Profile picture updated ✅");
      } catch (err) {
        showToast(err.message || "Upload failed", "error");
        setImagePreview(user?.profileImage || null);
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  // Animated removal of fulfilled card
  const removeWithAnimation = (id, setter) => {
    setRemovingId(id);
    setTimeout(() => {
      setter((prev) => prev.filter((r) => r._id !== id));
      setRemovingId(null);
    }, 420);
  };

  const handleLogoutConfirm = () => {
  logout();
};

  useEffect(() => {
    if (!user) {
      logout();
    }
  }, [user, navigate]);

 return (
    <div className="donor-db-root">
      {/* NEW TOP NAVIGATION */}
      <nav className="donor-top-nav-wrapper">
        <div className="donor-top-nav-inner">
          <div className="donor-logo">❤ Blood-Bonds</div>
          <div className="donor-nav-tabs">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`donor-nav-btn ${tab === item.id ? "active" : ""}`}
                onClick={() => setTab(item.id)}
              >
                <span className="donor-nav-icon">{item.icon}</span>
                <span className="donor-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="donor-nav-user">
            <div className="donor-avatar">
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                initial
              )}
            </div>
            <span className="donor-welcome"><strong>{displayName}</strong></span>
            <button className="donor-logout-btn" onClick={() => setShowLogoutModal(true)}>Logout</button>
          </div>
        </div>
      </nav>

      <main className="donor-main-content">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* ── EMERGENCY REQUESTS ───────────────────────────────────────── */}
        {tab === "requests" && (
          <div>
            <div className="sec-header">
              <h2>🚨 Emergency Requests</h2>
              <p>Urgent blood needs matching your blood group & city</p>
            </div>
            {loading.emReqs ? (
              <p style={{ color: "#94a3b8" }}>Loading requests...</p>
            ) : emergencyReqs.length === 0 ? (
              <EmptyState icon="🚨" title="No matching requests right now" subtitle="We'll notify you if an emergency arises." />
            ) : (
              <div className="card-grid">
                {emergencyReqs.map((req) => (
                  <div key={req._id} className="req-card">
                    <div className="req-card-top">
                      <div className="blood-badge pulse-red">{req.bloodGroup}</div>
                      <span className="badge badge-urgent">{req.urgency} Urgency</span>
                    </div>
                    <div className="req-card-meta">
                      <strong>{req.patientName}</strong>
                      <span>🩸 {req.units} Units Needed</span>
                      <span>🏥 {req.hospital}</span>
                      <span>📍 {req.city} — {req.subLocation}</span>
                      {req.createdBy?.mobile && (
                        /* FIXED: textDecoration none to remove underline */
                        <a href={`tel:${req.createdBy.mobile}`} style={{ color: "#ef4444", fontWeight: 600, marginTop: "0.75rem", display: "inline-block", textDecoration: "none" }}>
                          📞 Call Now
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BLOOD REQUIREMENTS ───────────────────────────────────────── */}
        {tab === "requirements" && (
          <div>
            <div className="sec-header">
              <h2>🩸 Blood Requirements</h2>
              <p>Organizations currently stocking up on your exact blood group</p>
            </div>
            {loading.blReqs ? (
              <p style={{ color: "#94a3b8" }}>Loading requirements...</p>
            ) : bloodReqs.length === 0 ? (
              <EmptyState icon="🩸" title="No storage requirements right now" subtitle="Your blood group stock is currently stable in your area." />
            ) : (
              <div className="card-grid">
                {bloodReqs.map((req) => {
                  const filled = req.requiredUnits - req.remainingUnits;
                  const percent = Math.round((filled / req.requiredUnits) * 100);
                  return (
                    <div key={req._id} className="req-card">
                      <div className="req-card-top">
                        <div className="blood-badge">{req.bloodGroup}</div>
                        <span className="badge badge-active">Accepting Donations</span>
                      </div>
                      <div className="req-card-meta">
                        <strong>{req.organizationName}</strong>
                        <span>🩸 {req.remainingUnits} units still needed</span>
                        <span>📍 {req.city} — {req.subLocation}</span>
                        {req.organizationMobile && (
                          /* FIXED: textDecoration none to remove underline */
                          <a href={`tel:${req.organizationMobile}`} style={{ color: "#ef4444", fontWeight: 600, marginTop: "0.75rem", display: "inline-block", textDecoration: "none" }}>
                            📞 Call Now
                          </a>
                        )}
                      </div>
                      <div className="req-progress-bar">
                        <div className="req-progress-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DONATION HISTORY ───────────────────────────────────────── */}
        {tab === "history" && (
          <div>
            <div className="sec-header">
              <h2>📋 My Donation History</h2>
              <p>Thank you for being a hero! 🏅</p>
            </div>
            {loading.hist ? (
              <p style={{ color: "#94a3b8" }}>Loading history...</p>
            ) : history.length === 0 ? (
              <EmptyState icon="🏅" title="No donations yet" subtitle="Your journey to save lives starts today." />
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Organization / Hospital</th>
                      <th>Type</th>
                      <th>Blood Group</th>
                      <th>Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id}>
                        <td>{new Date(h.donatedAt).toLocaleDateString()}</td>
                        <td><strong>{h.organizationName}</strong></td>
                        <td>
                          <span className={`badge ${h.requestType === "emergency" ? "badge-urgent" : "badge-active"}`}>
                            {h.requestType === "emergency" ? "Emergency" : "Stock"}
                          </span>
                        </td>
                        <td><span className="blood-group-chip">{h.bloodGroup}</span></td>
                        <td>{h.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MY PROFILE ───────────────────────────────────────── */}
        {tab === "profile" && (
          <div>
            <div className="sec-header">
              <h2>👤 My Profile</h2>
              <p>Manage your donor identity</p>
            </div>

            <div className="profile-v2-card">
              {/* AVATAR + IMAGE UPLOAD */}
              <div className="profile-v2-avatar-section">
                <div 
                  className={`profile-v2-avatar-wrap ${editMode ? "editable" : ""}`}
                  onDrop={editMode ? handleDrop : undefined}
                  onDragOver={editMode ? (e) => e.preventDefault() : undefined}
                  onClick={editMode ? () => fileInputRef.current?.click() : undefined}
                  title={editMode ? "Click or drop image to change" : ""}
                >
                  {imageUploading && (
                    <div className="profile-img-overlay">
                      <div className="profile-img-spinner" />
                    </div>
                  )}
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" className="profile-v2-img" />
                  ) : (
                    <div className="profile-v2-initials">
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  {editMode && !imageUploading && (
                    <div className="profile-img-edit-badge">📷</div>
                  )}
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  style={{ display: "none" }} 
                  onChange={(e) => handleImageSelect(e.target.files[0])} 
                />
                
                <h2 className="profile-v2-name">{user?.name}</h2>
                <div className="profile-v2-blood-pill">{user?.bloodGroup}</div>
                <div className="profile-v2-total-donations">
                  🔥 {history.length} donation{history.length !== 1 ? "s" : ""} made
                </div>
              </div>

              {/* INFO / EDIT FORM */}
              <div className="profile-v2-info-section">
                {!editMode ? (
                  <>
                    <div className="profile-v2-fields-grid">
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">Full Name</span>
                        <span className="profile-v2-field-value">{user?.name}</span>
                      </div>
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">Email Address</span>
                        <span className="profile-v2-field-value">{user?.email}</span>
                      </div>
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">Mobile Number</span>
                        <span className="profile-v2-field-value">{user?.mobile}</span>
                      </div>
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">Blood Group</span>
                        <span className="profile-v2-field-value" style={{ color: "#ef4444", fontWeight: 700 }}>
                          {user?.bloodGroup}
                        </span>
                      </div>
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">City</span>
                        <span className="profile-v2-field-value">{user?.city}</span>
                      </div>
                      <div className="profile-v2-field">
                        <span className="profile-v2-field-label">Area / Sub-location</span>
                        <span className="profile-v2-field-value">{user?.subLocation}</span>
                      </div>
                    </div>
                    <button className="btn btn-primary profile-edit-btn" onClick={handleEditToggle}>
                      ✏️ Edit Profile
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleProfileSave}>
                    <div className="profile-v2-fields-grid">
                      <div className="profile-v2-edit-group">
                        <label>Full Name</label>
                        <input value={user?.name} disabled className="input-disabled" />
                      </div>
                      <div className="profile-v2-edit-group">
                        <label>Email Address</label>
                        <input value={user?.email} disabled className="input-disabled" />
                      </div>
                      <div className="profile-v2-edit-group">
                        <label>Blood Group</label>
                        <input value={user?.bloodGroup} disabled className="input-disabled" />
                      </div>
                      <div className="profile-v2-edit-group">
                        <label>Mobile Number</label>
                        <input 
                          type="tel" 
                          value={profileForm.mobile} 
                          onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                          placeholder="10-digit mobile"
                        />
                      </div>
                      <div className="profile-v2-edit-group">
                        <label>City</label>
                        <select 
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value, subLocation: "" })}
                          className="styled-select"
                        >
                          <option value="">Select City</option>
                          {Object.keys(LOCATIONS).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      {profileForm.city && (
                        <div className="profile-v2-edit-group">
                          <label>Area / Sub-location</label>
                          <select 
                            value={profileForm.subLocation}
                            onChange={(e) => setProfileForm({ ...profileForm, subLocation: e.target.value })}
                            className="styled-select"
                          >
                            <option value="">Select Area</option>
                            {LOCATIONS[profileForm.city]?.map((l) => <option key={l}>{l}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="profile-edit-actions">
                      <button type="submit" className="btn btn-success" disabled={loading.profile}>
                        {loading.profile ? "Saving…" : "✅ Update Profile"}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={handleCancel}>
                        ✕ Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="donor-logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="donor-logout-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👋</div>
            <h3>Leaving so soon?</h3>
            <p>Are you sure you want to logout? You'll need to sign in again to access your dashboard.</p>
            <div className="donor-logout-actions">
              <button className="donor-btn-cancel" onClick={() => setShowLogoutModal(false)}>Stay</button>
              <button className="donor-btn-confirm" onClick={handleLogoutConfirm}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
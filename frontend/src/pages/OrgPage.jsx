import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import { BLOOD_GROUPS, LOCATIONS, API_BASE } from "../utils/constants";
import DashboardLayout from "../components/shared/DashboardLayout";
import EmptyState from "../components/shared/EmptyState";
import Toast from "../components/shared/Toast";
import Modal from "../components/shared/Modal";
import "../styles/dashboard.css";
import "../styles/org-page.css";

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "emergency", icon: "🚨", label: "Emergency Requests" },
  { id: "requirements", icon: "🩸", label: "Blood Requirements" },
  { id: "profile", icon: "🏥", label: "Organization Profile" },
];

const initialEmergencyForm = {
  patientName: "",
  bloodGroup: "",
  compatibleGroups: [],
  units: "",
  urgency: "",
};
const initialReqForm = { bloodGroup: "", requiredUnits: "" };

export default function OrgPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  const [stats, setStats] = useState({});
  const [emergencyList, setEmergencyList] = useState([]);
  const [reqList, setReqList] = useState([]);

  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState(initialEmergencyForm);

  const [showReqForm, setShowReqForm] = useState(false);
  const [reqForm, setReqForm] = useState(initialReqForm);

  // fulfillModal now also stores the bloodGroup + compatibleGroups of the request
  // so we can display the required blood group clearly inside the modal
  const [fulfillModal, setFulfillModal] = useState(null);
  const [fulfillData, setFulfillData] = useState({
    method: "aadhaar",
    aadhaar: "",
    name: "",
    mobile: "",
    units: "",
  });
  // bloodGroupError: shown as a red alert inside the modal when a mismatch happens
  const [bloodGroupError, setBloodGroupError] = useState(null);

  const [addUnitsModal, setAddUnitsModal] = useState(null);
  const [addUnitsVal, setAddUnitsVal] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);

  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    mobile: user?.mobile || "",
    subLocation: user?.subLocation || "",
  });
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [imageUploading, setImageUploading] = useState(false);

  // For the card-removal animation
  const [removingId, setRemovingId] = useState(null);

  // ── Route guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || user.role !== "organization") navigate("/");
  }, [user]);

  useEffect(() => {
    loadStats();
    loadEmergency();
    loadRequirements();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const setLoad = (k, v) => setLoading((prev) => ({ ...prev, [k]: v }));

  // ── Data loaders ─────────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      setStats(await apiFetch("/organization/dashboard-stats"));
    } catch {}
  };

  const loadEmergency = async () => {
    setLoad("emergency", true);
    try {
      setEmergencyList(await apiFetch("/organization/emergency-requests"));
    } catch {
      setEmergencyList([]);
    } finally {
      setLoad("emergency", false);
    }
  };

  const loadRequirements = async () => {
    setLoad("reqs", true);
    try {
      setReqList(await apiFetch("/organization/blood-requirements"));
    } catch {
      setReqList([]);
    } finally {
      setLoad("reqs", false);
    }
  };

  // ── Create emergency request ─────────────────────────────────────────────
  const handleCreateEmergency = async (e) => {
    e.preventDefault();
    const { patientName, bloodGroup, units, urgency } = emergencyForm;
    if (!patientName || !bloodGroup || !units || !urgency) {
      return showToast("All fields required", "error");
    }
    setLoad("cemergency", true);
    try {
      await apiFetch("/organization/emergency-requests", {
        method: "POST",
        body: JSON.stringify(emergencyForm),
      });
      showToast("Emergency request created ✅");
      setShowEmergencyForm(false);
      setEmergencyForm(initialEmergencyForm);
      loadEmergency();
      loadStats();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoad("cemergency", false);
    }
  };

  // ── Create blood requirement ─────────────────────────────────────────────
  const handleCreateReq = async (e) => {
    e.preventDefault();
    if (!reqForm.bloodGroup || !reqForm.requiredUnits) {
      return showToast("All fields required", "error");
    }
    setLoad("creq", true);
    try {
      await apiFetch("/organization/blood-requirements", {
        method: "POST",
        body: JSON.stringify(reqForm),
      });
      showToast("Blood requirement created ✅");
      setShowReqForm(false);
      setReqForm(initialReqForm);
      loadRequirements();
      loadStats();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoad("creq", false);
    }
  };

  // ── Open the fulfill modal ────────────────────────────────────────────────
  // We pass the full request object so the modal knows which blood group is needed.
  const openFulfill = (req, type) => {
    setFulfillModal({
      id: req._id,
      type,
      maxUnits: type === "requirement" ? req.remainingUnits : null,
      // Store required blood group + compatible groups for validation display
      bloodGroup: req.bloodGroup,
      compatibleGroups: req.compatibleGroups || [],
    });
    setFulfillData({
      method: "aadhaar",
      aadhaar: "",
      name: "",
      mobile: "",
      units: "",
    });
    setBloodGroupError(null); // clear any previous mismatch error
  };

  // ── Animate a card out of the list before removing it from state ─────────
  const removeCard = (id, type) => {
    setRemovingId(id);
    setTimeout(() => {
      if (type === "emergency") {
        setEmergencyList((prev) => prev.filter((r) => r._id !== id));
      } else {
        setReqList((prev) => prev.filter((r) => r._id !== id));
      }
      setRemovingId(null);
    }, 420);
  };

  // ── Confirm fulfillment ───────────────────────────────────────────────────
  const handleFulfill = async () => {
    const { id, type, maxUnits } = fulfillModal;
    const { method, aadhaar, name, mobile, units } = fulfillData;

    // Front-end unit validation for requirements
    if (type === "requirement") {
      if (!units || Number(units) < 1)
        return showToast("Enter units donated", "error");
      if (Number(units) > maxUnits)
        return showToast(`Max ${maxUnits} units remaining`, "error");
    }

    // Clear any previous blood group error before the new attempt
    setBloodGroupError(null);
    setLoad("fulfill", true);

    try {
      const body = {};
      if (type === "requirement") body.units = Number(units);

      if (method === "aadhaar" && aadhaar) {
        body.donorAadhaar = aadhaar;
      } else if (method === "manual") {
        if (!name || !mobile)
          return showToast("Enter donor name and mobile", "error");
        body.donorName = name;
        body.donorMobile = mobile;
      }

      const endpoint =
        type === "emergency"
          ? `/organization/emergency-requests/${id}/fulfill`
          : `/organization/blood-requirements/${id}/fulfill`;

      const result = await apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      // Success — close modal and animate card out
      setFulfillModal(null);
      showToast("Request fulfilled successfully ✅");

      const wasFullyFulfilled =
        type === "requirement" ? result.remainingUnits === 0 : true;

      if (wasFullyFulfilled) {
        removeCard(id, type);
      } else {
        // Partial fulfillment — just refresh the list so the progress bar updates
        loadRequirements();
      }

      loadStats();

      // Warn if Aadhaar was given but not found in DB (still fulfilled)
      if (result.donorNotFound) {
        showToast(result.donorNotFound, "warning");
      }
    } catch (err) {
      // The backend sends HTTP 422 for a blood group mismatch.
      // Show it as a red alert inside the modal — NOT a toast — so the user
      // can immediately correct the Aadhaar without the modal closing.
      setBloodGroupError(err.message);
    } finally {
      setLoad("fulfill", false);
    }
  };

  const confirmDelete = (req, type) => {
    setDeleteModal({
      id: req._id,
      type,
      name: type === "emergency" ? req.patientName : req.bloodGroup,
    });
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setLoad("delete", true);
    try {
      if (deleteModal.type === "emergency") {
        await apiFetch(`/organization/emergency-requests/${deleteModal.id}`, {
          method: "DELETE",
        });
        showToast("Emergency request permanently deleted ✅");
        loadEmergency();
      } else {
        await apiFetch(`/organization/blood-requirements/${deleteModal.id}`, {
          method: "DELETE",
        });
        showToast("Blood requirement permanently deleted ✅");
        loadRequirements();
      }
      loadStats(); // instantly updates dashboard numbers
      setDeleteModal(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoad("delete", false);
    }
  };

  // ── Add more units to a requirement ─────────────────────────────────────
  const handleAddUnits = async () => {
    if (!addUnitsVal || Number(addUnitsVal) < 1) {
      return showToast("Enter valid units", "error");
    }
    setLoad("addunits", true);
    try {
      await apiFetch(
        `/organization/blood-requirements/${addUnitsModal}/add-units`,
        {
          method: "PUT",
          body: JSON.stringify({ additionalUnits: Number(addUnitsVal) }),
        },
      );
      showToast("Units added ✅");
      setAddUnitsModal(null);
      setAddUnitsVal("");
      loadRequirements();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoad("addunits", false);
    }
  };

  // ── Profile image upload (base64) ────────────────────────────────────────
  const handleImageSelect = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type))
      return showToast("Upload JPG, PNG, or WebP only", "error");
    if (file.size > 2 * 1024 * 1024)
      return showToast("Image must be under 2 MB", "error");

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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoad("profile", true);
    try {
      const data = await apiFetch("/organization/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm),
      });
      updateUser(data.org);
      showToast("Profile updated ✅");
      setEditMode(false);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoad("profile", false);
    }
  };

  const handleCancel = () => {
    setProfileForm({
      mobile: user?.mobile || "",
      subLocation: user?.subLocation || "",
    });
    setImagePreview(user?.profileImage || null);
    setEditMode(false);
  };

  const urgencyClass = (u = "") => u.toLowerCase();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Organization"
      navItems={NAV}
      activeTab={tab}
      onTabChange={setTab}
    >
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <div>
          <div className="sec-header">
            <h2>📊 Dashboard</h2>
            <p>Overview of your blood bank activity</p>
          </div>
          <div className="stats-row">
            {[
              {
                icon: "📋",
                num: stats.totalRequests || 0,
                label: "Total Emergency Reqs",
              },
              { icon: "⏳", num: stats.pendingRequests || 0, label: "Pending Requests" },
              {
                icon: "✅",
                num: stats.fulfilledRequests || 0,
                label: "Fulfilled Requests",
              },
              {
                icon: "🩸",
                num: stats.totalRequirements || 0,
                label: "Total Blood Requirements",
              },
              {
                icon: "🔴",
                num: stats.activeRequirements || 0,
                label: "Active Requirements",
              },
            ].map((s) => (
              <div className="stat-box" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EMERGENCY REQUESTS ─────────────────────────────────────────── */}
      {tab === "emergency" && (
        <div>
          <div className="sec-header">
            <h2>🚨 Emergency Blood Requests</h2>
            <p>Create and manage emergency requests for patients</p>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginBottom: "1.5rem" }}
            onClick={() => setShowEmergencyForm((p) => !p)}
          >
            {showEmergencyForm ? "✕ Cancel" : "+ New Emergency Request"}
          </button>

          {showEmergencyForm && (
            <div className="form-card" style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  marginBottom: "1.25rem",
                }}
              >
                New Emergency Request
              </h3>
              <form onSubmit={handleCreateEmergency}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Patient Name</label>
                    <input
                      placeholder=" "
                      value={emergencyForm.patientName}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          patientName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      className="styled-select"
                      value={emergencyForm.bloodGroup}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          bloodGroup: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Urgency Level</label>
                    <select
                      className="styled-select"
                      value={emergencyForm.urgency}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          urgency: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Urgency</option>
                      <option value="High">🔴 High</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="Low">🟢 Low</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Units Required</label>
                    <input
                      type="number"
                      min="1"
                      placeholder=""
                      value={emergencyForm.units}
                      onChange={(e) =>
                        setEmergencyForm({
                          ...emergencyForm,
                          units: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Optional: also accept compatible blood groups */}
                <div className="form-group">
                  <label>Also accept compatible blood groups (optional)</label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginTop: "0.25rem",
                    }}
                  >
                    {BLOOD_GROUPS.filter(
                      (bg) => bg !== emergencyForm.bloodGroup,
                    ).map((bg) => (
                      <label
                        key={bg}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          cursor: "pointer",
                          fontSize: "0.88rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={emergencyForm.compatibleGroups.includes(bg)}
                          onChange={(e) => {
                            const groups = e.target.checked
                              ? [...emergencyForm.compatibleGroups, bg]
                              : emergencyForm.compatibleGroups.filter(
                                  (g) => g !== bg,
                                );
                            setEmergencyForm({
                              ...emergencyForm,
                              compatibleGroups: groups,
                            });
                          }}
                        />
                        {bg}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading.cemergency}
                  >
                    {loading.cemergency ? "Saving…" : "✅ Create Request"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowEmergencyForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading.emergency ? (
            <p style={{ color: "#94a3b8" }}>Loading…</p>
          ) : emergencyList.length === 0 ? (
            <EmptyState
              icon="🚨"
              title="No emergency requests yet"
              subtitle="Click the button above to create one."
            />
          ) : (
            <div className="card-grid">
              {emergencyList.map((req) => (
                <div
                  key={req._id}
                  className={`req-card ${req.status === "Fulfilled" ? "fulfilled" : ""} ${removingId === req._id ? "card-removing" : ""}`}
                >
                  <div className="req-card-top">
                    <div className="blood-badge">{req.bloodGroup}</div>
                    <span
                      className={`urgency-pill ${urgencyClass(req.urgency)}`}
                    >
                      {req.urgency}
                    </span>
                  </div>
                  <h3>{req.patientName}</h3>
                  <div className="req-card-meta">
                    <span>🩸 {req.units} units</span>
                    <span>
                      📍 {req.city} — {req.subLocation}
                    </span>
                    <span style={{ marginTop: "0.25rem" }}>
                      <span
                        className={`badge ${req.status === "Fulfilled" ? "badge-fulfilled" : "badge-pending"}`}
                      >
                        {req.status}
                      </span>
                    </span>
                    {req.compatibleGroups?.length > 0 && (
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Also accepts: {req.compatibleGroups.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="req-card-actions">
                    <button
                      className="btn btn-success btn-sm"
                      disabled={req.status === "Fulfilled"}
                      onClick={() => openFulfill(req, "emergency")}
                    >
                      {req.status === "Fulfilled"
                        ? "✅ Fulfilled"
                        : "Mark Fulfilled"}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => confirmDelete(req, "emergency")}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BLOOD REQUIREMENTS ─────────────────────────────────────────── */}
      {tab === "requirements" && (
        <div>
          <div className="sec-header">
            <h2>🩸 Blood Requirements</h2>
            <p>Track and manage blood storage requirements</p>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginBottom: "1.5rem" }}
            onClick={() => setShowReqForm((p) => !p)}
          >
            {showReqForm ? "✕ Cancel" : "+ New Blood Requirement"}
          </button>

          {showReqForm && (
            <div className="form-card" style={{ marginBottom: "2rem" }}>
              <h3
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  marginBottom: "1.25rem",
                }}
              >
                New Blood Requirement
              </h3>
              <form onSubmit={handleCreateReq}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      className="styled-select"
                      value={reqForm.bloodGroup}
                      onChange={(e) =>
                        setReqForm({ ...reqForm, bloodGroup: e.target.value })
                      }
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Units Required (max 20 to start)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="e.g. 10"
                      value={reqForm.requiredUnits}
                      onChange={(e) =>
                        setReqForm({
                          ...reqForm,
                          requiredUnits: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading.creq}
                  >
                    {loading.creq ? "Saving…" : "✅ Create Requirement"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowReqForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading.reqs ? (
            <p style={{ color: "#94a3b8" }}>Loading…</p>
          ) : reqList.length === 0 ? (
            <EmptyState icon="🩸" title="No requirements yet" />
          ) : (
            <div className="card-grid">
              {reqList.map((req) => {
                const filled = req.requiredUnits - req.remainingUnits;
                const percent = Math.round((filled / req.requiredUnits) * 100);
                return (
                  <div
                    key={req._id}
                    className={`req-card ${req.status === "Fulfilled" ? "fulfilled" : ""} ${removingId === req._id ? "card-removing" : ""}`}
                  >
                    <div className="req-card-top">
                      <div className="blood-badge">{req.bloodGroup}</div>
                      <span
                        className={`badge ${req.status === "Fulfilled" ? "badge-fulfilled" : "badge-active"}`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="req-card-meta">
                      <span>
                        🩸 {req.remainingUnits} remaining of {req.requiredUnits}{" "}
                        units
                      </span>
                      <span>
                        📍 {req.city} — {req.subLocation}
                      </span>
                    </div>
                    <div className="req-progress-bar">
                      <div
                        className="req-progress-fill"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="req-card-actions">
                      <button
                        className="btn btn-success btn-sm"
                        disabled={
                          req.status === "Fulfilled" || req.remainingUnits === 0
                        }
                        onClick={() => openFulfill(req, "requirement")}
                      >
                        Partial Fulfill
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setAddUnitsModal(req._id);
                          setAddUnitsVal("");
                        }}
                      >
                        + Add Units
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmDelete(req, "requirement")}
                      >
                        🗑 Delete
                      </button>
                    </div>
                    {req.fulfillmentLogs?.length > 0 && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.82rem",
                          color: "#64748b",
                        }}
                      >
                        {req.fulfillmentLogs.length} donation
                        {req.fulfillmentLogs.length > 1 ? "s" : ""} recorded
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ORGANIZATION PROFILE ───────────────────────────────────────── */}
      {tab === "profile" && (
        <div>
          <div className="sec-header">
            <h2>🏥 Organization Profile</h2>
            <p>Manage your organization's details and contact information</p>
          </div>

          <div className="profile-v2-card">
            {/* Avatar / image upload */}
            <div className="profile-v2-avatar-section">
              <div
                className={`profile-v2-avatar-wrap ${editMode ? "editable" : ""}`}
                onClick={
                  editMode ? () => fileInputRef.current?.click() : undefined
                }
                onDrop={
                  editMode
                    ? (e) => {
                        e.preventDefault();
                        handleImageSelect(e.dataTransfer.files[0]);
                      }
                    : undefined
                }
                onDragOver={editMode ? (e) => e.preventDefault() : undefined}
                title={editMode ? "Click to change picture" : ""}
              >
                {imageUploading && (
                  <div className="profile-img-overlay">
                    <div className="profile-img-spinner" />
                  </div>
                )}
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Org"
                    className="profile-v2-img"
                  />
                ) : (
                  <div className="profile-v2-initials">
                    {(user?.organizationName || "O")[0]}
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
              <h2 className="profile-v2-name">{user?.organizationName}</h2>
              <div className="profile-v2-org-badge">
                🏥 Verified Organization
              </div>
            </div>

            {/* Info panel / edit form */}
            <div className="profile-v2-info-section">
              {!editMode ? (
                <>
                  <div className="profile-v2-fields-grid">
                    {[
                      {
                        label: "Organization Name",
                        value: user?.organizationName,
                      },
                      { label: "Email Address", value: user?.email },
                      { label: "Mobile Number", value: user?.mobile },
                      { label: "City", value: user?.city },
                      {
                        label: "Area / Sub-location",
                        value: user?.subLocation,
                      },
                    ].map(({ label, value }) => (
                      <div className="profile-v2-field" key={label}>
                        <span className="profile-v2-field-label">{label}</span>
                        <span className="profile-v2-field-value">{value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary profile-edit-btn"
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                </>
              ) : (
                <form onSubmit={handleProfileSave}>
                  <div className="profile-v2-fields-grid">
                    <div className="profile-v2-edit-group">
                      <label>Organization Name</label>
                      <input
                        value={user?.organizationName}
                        disabled
                        className="input-disabled"
                      />
                    </div>
                    <div className="profile-v2-edit-group">
                      <label>Email Address</label>
                      <input
                        value={user?.email}
                        disabled
                        className="input-disabled"
                      />
                    </div>
                    <div className="profile-v2-edit-group">
                      <label>City</label>
                      <input
                        value={user?.city}
                        disabled
                        className="input-disabled"
                      />
                    </div>
                    <div className="profile-v2-edit-group">
                      <label>Mobile Number</label>
                      <input
                        type="tel"
                        value={profileForm.mobile}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            mobile: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="profile-v2-edit-group">
                      <label>Area / Sub-location</label>
                      <select
                        className="styled-select"
                        value={profileForm.subLocation}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            subLocation: e.target.value,
                          })
                        }
                      >
                        <option value="">Select Area</option>
                        {LOCATIONS[user?.city]?.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="profile-edit-actions">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading.profile}
                    >
                      {loading.profile ? "Saving…" : "✅ Update Profile"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancel}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FULFILL MODAL ──────────────────────────────────────────────── */}
      {fulfillModal && (
        <Modal
          onClose={() => {
            setFulfillModal(null);
            setBloodGroupError(null);
          }}
          maxWidth="460px"
        >
          <p className="modal-title">Mark as Fulfilled</p>

          {/* Show the required blood group at the top so it's always visible */}
          <div className="fulfill-blood-group-banner">
            <span>Required blood group:</span>
            <strong className="fulfill-blood-badge">
              {fulfillModal.bloodGroup}
            </strong>
            {fulfillModal.compatibleGroups?.length > 0 && (
              <span className="fulfill-compat-note">
                (also accepts: {fulfillModal.compatibleGroups.join(", ")})
              </span>
            )}
          </div>

          {/* Units field — only for blood requirements, not emergency requests */}
          {fulfillModal.type === "requirement" && (
            <div className="form-group">
              <label>Units Donated (max: {fulfillModal.maxUnits})</label>
              <input
                type="number"
                min="1"
                max={fulfillModal.maxUnits}
                value={fulfillData.units}
                onChange={(e) =>
                  setFulfillData({ ...fulfillData, units: e.target.value })
                }
              />
            </div>
          )}

          {/* Donor identification method tabs */}
          <div className="modal-tabs">
            {[
              { key: "aadhaar", label: "By Aadhaar" },
              { key: "manual", label: "Name + Mobile" },
              { key: "none", label: "No Donor Info" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`modal-tab ${fulfillData.method === key ? "active" : ""}`}
                onClick={() => {
                  setFulfillData({ ...fulfillData, method: key });
                  setBloodGroupError(null); // clear error when switching methods
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Aadhaar input */}
          {fulfillData.method === "aadhaar" && (
            <div className="form-group">
              <label>Donor Aadhaar (12 digits)</label>
              <input
                placeholder="123456789012"
                maxLength={12}
                value={fulfillData.aadhaar}
                onChange={(e) => {
                  setFulfillData({ ...fulfillData, aadhaar: e.target.value });
                  setBloodGroupError(null); // clear error while typing
                }}
              />
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#94a3b8",
                  marginTop: "0.35rem",
                }}
              >
                The donor's blood group must be{" "}
                <strong>{fulfillModal.bloodGroup}</strong>
                {fulfillModal.compatibleGroups?.length > 0
                  ? ` or ${fulfillModal.compatibleGroups.join(", ")}`
                  : ""}
                . Entering a different blood group will be rejected.
              </p>
            </div>
          )}

          {/* Manual donor info */}
          {fulfillData.method === "manual" && (
            <>
              <div className="form-group">
                <label>Donor Name</label>
                <input
                  placeholder="Full name"
                  value={fulfillData.name}
                  onChange={(e) =>
                    setFulfillData({ ...fulfillData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Donor Mobile</label>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={fulfillData.mobile}
                  onChange={(e) =>
                    setFulfillData({ ...fulfillData, mobile: e.target.value })
                  }
                />
              </div>
            </>
          )}

          {/* ── BLOOD GROUP MISMATCH ERROR ───────────────────────────────
              This appears only when the backend returns a 422 mismatch.
              It stays visible inside the modal so the user can fix the Aadhaar
              without losing their progress. ──────────────────────────────── */}
          {bloodGroupError && (
            <div className="blood-group-mismatch-alert">
              <span className="mismatch-icon">🚫</span>
              <div>
                <strong>Invalid Aadhaar — Blood Group Mismatch</strong>
                <p>{bloodGroupError}</p>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              className="btn btn-success"
              onClick={handleFulfill}
              disabled={loading.fulfill}
            >
              {loading.fulfill ? "Processing…" : "✅ Confirm Fulfilled"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setFulfillModal(null);
                setBloodGroupError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* ── ADD UNITS MODAL ────────────────────────────────────────────── */}
      {addUnitsModal && (
        <Modal onClose={() => setAddUnitsModal(null)} maxWidth="360px">
          <p className="modal-title">Add More Units</p>
          <div className="form-group">
            <label>Additional Units to Add</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 3"
              value={addUnitsVal}
              onChange={(e) => setAddUnitsVal(e.target.value)}
            />
          </div>
          <div className="form-actions">
            <button
              className="btn btn-primary"
              onClick={handleAddUnits}
              disabled={loading.addunits}
            >
              {loading.addunits ? "Adding…" : "Add Units"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setAddUnitsModal(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────────────── */}
      {deleteModal && (
        <Modal onClose={() => setDeleteModal(null)} maxWidth="380px">
          <p className="modal-title">Confirm Deletion</p>
          <p
            style={{
              color: "#64748b",
              marginBottom: "1.5rem",
              fontSize: "0.95rem",
            }}
          >
            Are you sure you want to permanently delete this{" "}
            {deleteModal.type === "emergency"
              ? "emergency request"
              : "blood requirement"}
            ? This action cannot be undone.
          </p>
          <div className="form-actions">
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading.delete}
            >
              {loading.delete ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setDeleteModal(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

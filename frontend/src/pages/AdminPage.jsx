import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import DashboardLayout from "../components/shared/DashboardLayout";
import EmptyState from "../components/shared/EmptyState";
import Toast from "../components/shared/Toast";
import Modal from "../components/shared/Modal";
import "../styles/dashboard.css";

const NAV = [
  { id: "dashboard",     icon: "📊", label: "Dashboard"     },
  { id: "pending",       icon: "⏳", label: "Pending Orgs"  },
  { id: "organizations", icon: "🏥", label: "Organizations" },
  { id: "donors",        icon: "🩸", label: "All Donors"    },
];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab]                 = useState("dashboard");
  const [toast, setToast]             = useState(null);
  const [loading, setLoading]         = useState({});
  const [confirmModal, setConfirmModal] = useState(null);

  const [stats, setStats]             = useState({});
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [orgs, setOrgs]               = useState({ orgs: [], total: 0, pages: 1 });
  const [donors, setDonors]           = useState({ donors: [], total: 0, pages: 1 });

  const [orgSearch, setOrgSearch]     = useState("");
  const [donorSearch, setDonorSearch] = useState("");
  const [orgPage, setOrgPage]         = useState(1);
  const [donorPage, setDonorPage]     = useState(1);

  // Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/");
  }, [user]);

  useEffect(() => { loadStats(); loadPending(); }, []);
  useEffect(() => { loadOrgs(); },    [orgSearch, orgPage]);
  useEffect(() => { loadDonors(); },  [donorSearch, donorPage]);

  const showToast = (msg, type = "success") => setToast({ message: msg, type });
  const setLoad   = (k, v) => setLoading((prev) => ({ ...prev, [k]: v }));

  // ── Loaders ──────────────────────────────────────────────────────────────

  const loadStats = async () => {
    try { setStats(await apiFetch("/admin/dashboard-stats")); } catch {}
  };

  const loadPending = async () => {
    setLoad("pending", true);
    try   { setPendingOrgs(await apiFetch("/admin/pending-organizations")); }
    catch { setPendingOrgs([]); }
    finally { setLoad("pending", false); }
  };

  const loadOrgs = async () => {
    setLoad("orgs", true);
    try {
      const data = await apiFetch(
        `/admin/organizations?search=${orgSearch}&page=${orgPage}&limit=10`
      );
      setOrgs(data);
    } catch { setOrgs({ orgs: [], total: 0, pages: 1 }); }
    finally { setLoad("orgs", false); }
  };

  const loadDonors = async () => {
    setLoad("donors", true);
    try {
      // Fetch all donors A→Z with pagination (15 per page)
      const data = await apiFetch(
        `/admin/donors?search=${donorSearch}&page=${donorPage}&limit=15`
      );
      setDonors(data);
    } catch { setDonors({ donors: [], total: 0, pages: 1 }); }
    finally { setLoad("donors", false); }
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const verifyOrg = async (id) => {
    try {
      await apiFetch(`/admin/organizations/${id}/verify`, { method: "PUT" });
      showToast("Organization verified ✅");
      loadPending(); loadOrgs(); loadStats();
    } catch (e) { showToast(e.message, "error"); }
  };

  const deleteItem = async () => {
    const { type, id } = confirmModal;
    const endpoint = type === "org"
      ? `/admin/organizations/${id}`
      : `/admin/donors/${id}`;
    try {
      await apiFetch(endpoint, { method: "DELETE" });
      showToast("Removed successfully");
      setConfirmModal(null);
      if (type === "org") { loadPending(); loadOrgs(); loadStats(); }
      else                { loadDonors(); loadStats(); }
    } catch (e) { showToast(e.message, "error"); }
  };

  // ── Reusable pagination bar ───────────────────────────────────────────────

  const Pagination = ({ current, total, onChange }) => {
    if (total <= 1) return null;

    // Show max 7 page buttons to avoid overflow
    const pages = [];
    const start = Math.max(1, current - 3);
    const end   = Math.min(total, start + 6);
    for (let p = start; p <= end; p++) pages.push(p);

    return (
      <div className="pagination">
        <button disabled={current === 1}     onClick={() => onChange(current - 1)}>‹ Prev</button>
        {pages.map((p) => (
          <button key={p} className={p === current ? "active" : ""} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
        <button disabled={current === total} onClick={() => onChange(current + 1)}>Next ›</button>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Admin" navItems={NAV} activeTab={tab} onTabChange={setTab}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
      {tab === "dashboard" && (
        <div>
          <div className="sec-header">
            <h2>📊 Admin Dashboard</h2>
            <p>Platform-wide overview</p>
          </div>

          <div className="stats-row">
            {[
              { icon: "🩸", num: stats.totalDonors          || 0, label: "Total Donors"        },
              { icon: "🏥", num: stats.totalOrganizations   || 0, label: "Organizations"       },
              { icon: "✅", num: stats.verifiedOrganizations|| 0, label: "Verified Orgs"       },
              { icon: "💉", num: stats.totalDonations       || 0, label: "Donations Completed" },
            ].map((s) => (
              <div className="stat-box" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "0.5rem" }}>
            <div className="stat-box" style={{ textAlign: "left", padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Most Active Blood Group
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 900, color: "#ef4444", fontFamily: "Poppins", margin: 0 }}>
                {stats.mostActiveBloodGroup || "—"}
              </p>
            </div>
            <div className="stat-box" style={{ textAlign: "left", padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Most Active Location
              </p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", fontFamily: "Poppins", margin: 0 }}>
                {stats.mostActiveLocation || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING ORGANIZATIONS ────────────────────────────────────────── */}
      {tab === "pending" && (
        <div>
          <div className="sec-header">
            <h2>⏳ Pending Verifications</h2>
            <p>Organizations waiting for approval</p>
          </div>

          {loading.pending
            ? <p style={{ color: "#94a3b8" }}>Loading…</p>
            : pendingOrgs.length === 0
              ? <EmptyState icon="✅" title="No pending organizations" subtitle="All caught up!" />
              : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrgs.map((org) => (
                        <tr key={org._id}>
                          <td><strong>{org.organizationName}</strong></td>
                          <td>{org.email}</td>
                          <td>{org.mobile}</td>
                          <td>{org.city} — {org.subLocation}</td>
                          <td>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button className="btn btn-success btn-sm" onClick={() => verifyOrg(org._id)}>
                                ✅ Verify
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setConfirmModal({ type: "org", id: org._id, name: org.organizationName })}
                              >
                                🗑 Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
          }
        </div>
      )}

      {/* ── ORGANIZATIONS ────────────────────────────────────────────────── */}
      {tab === "organizations" && (
        <div>
          <div className="sec-header">
            <h2>🏥 Organizations</h2>
            <p>All verified organizations on the platform</p>
          </div>

          <div className="search-bar">
            <input
              placeholder="Search by organization name…"
              value={orgSearch}
              onChange={(e) => { setOrgSearch(e.target.value); setOrgPage(1); }}
            />
          </div>

          {loading.orgs
            ? <p style={{ color: "#94a3b8" }}>Loading…</p>
            : orgs.orgs.length === 0
              ? <EmptyState icon="🏥" title="No organizations found" />
              : (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Location</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgs.orgs.map((org) => (
                          <tr key={org._id}>
                            <td><strong>{org.organizationName}</strong></td>
                            <td>{org.email}</td>
                            <td>{org.mobile}</td>
                            <td>{org.city} — {org.subLocation}</td>
                            <td><span className="badge badge-verified">Verified</span></td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => setConfirmModal({ type: "org", id: org._id, name: org.organizationName })}
                              >
                                🗑 Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination current={orgPage} total={orgs.pages} onChange={setOrgPage} />
                </>
              )
          }
        </div>
      )}

      {/* ── ALL DONORS ───────────────────────────────────────────────────── */}
      {tab === "donors" && (
        <div>
          <div className="sec-header">
            <h2>🩸 All Donors</h2>
            <p>
              Every registered donor — sorted A to Z.
              Total: <strong>{donors.total}</strong> donor{donors.total !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="search-bar">
            <input
              placeholder="Search by donor name…"
              value={donorSearch}
              onChange={(e) => { setDonorSearch(e.target.value); setDonorPage(1); }}
            />
          </div>

          {loading.donors
            ? <p style={{ color: "#94a3b8" }}>Loading…</p>
            : donors.donors.length === 0
              ? (
                <EmptyState
                  icon="🩸"
                  title="No donors found"
                  subtitle={donorSearch ? `No results for "${donorSearch}"` : "No donors registered yet."}
                />
              )
              : (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Donor Name</th>
                          <th>Blood Group</th>
                          <th>Location</th>
                          <th>Mobile</th>
                          <th style={{ textAlign: "center" }}>Donations</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donors.donors.map((d, index) => {
                          // Calculate the row number across pages
                          const rowNum = (donorPage - 1) * 15 + index + 1;
                          return (
                            <tr key={d._id}>
                              {/* Simple sequential number, not a rank */}
                              <td style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.85rem" }}>
                                {rowNum}
                              </td>
                              <td>
                                <div className="donor-name-cell">
                                  {/* Avatar — profile image if available, else initial */}
                                  <div className="donor-mini-avatar">
                                    {d.profileImage
                                      ? <img
                                          src={d.profileImage}
                                          alt={d.name}
                                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                                        />
                                      : d.name?.[0]?.toUpperCase()
                                    }
                                  </div>
                                  <strong>{d.name}</strong>
                                </div>
                              </td>
                              <td>
                                <span className="blood-group-chip">{d.bloodGroup}</span>
                              </td>
                              <td>{d.city} — {d.subLocation}</td>
                              <td>{d.mobile}</td>
                              <td style={{ textAlign: "center" }}>
                                {/* Show 0 if they haven't donated yet */}
                                <div className={`donation-count-chip ${d.donationCount === 0 ? "zero" : ""}`}>
                                  🩸 {d.donationCount}
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setConfirmModal({ type: "donor", id: d._id, name: d.name })}
                                >
                                  🗑 Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination current={donorPage} total={donors.pages} onChange={setDonorPage} />
                </>
              )
          }
        </div>
      )}

      {/* ── REMOVE CONFIRM MODAL ─────────────────────────────────────────── */}
      {confirmModal && (
        <Modal onClose={() => setConfirmModal(null)} maxWidth="380px">
          <p className="modal-title">Confirm Removal</p>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            Are you sure you want to remove <strong>{confirmModal.name}</strong>?
            {confirmModal.type === "org" && " This will permanently delete the organization."}
          </p>
          <div className="form-actions">
            <button className="btn btn-danger"  onClick={deleteItem}>Yes, Remove</button>
            <button className="btn btn-outline" onClick={() => setConfirmModal(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

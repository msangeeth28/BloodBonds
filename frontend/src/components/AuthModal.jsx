import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../utils/api";
import { LOCATIONS, BLOOD_GROUPS } from "../utils/constants";
import "../styles/modal.css";

const ROLES = ["donor", "organization"];

const initialDonorForm = {
  name: "",
  email: "",
  mobile: "",
  aadhaar: "",
  password: "",
  bloodGroup: "",
  city: "",
  subLocation: "",
};
const initialOrgForm = {
  organizationName: "",
  email: "",
  mobile: "",
  password: "",
  city: "",
  subLocation: "",
};

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState("login"); // "login" | "register" | "otp"
  const [role, setRole] = useState("donor");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Controls which "screen" is shown inside the modal
  // "login"    → normal login / register tabs
  // "forgot"   → ask for Aadhaar to get OTP
  // "reset"    → enter OTP + new password
  const [view, setView] = useState("login");

  // Forgot password form fields
  const [aadhaarInput, setAadhaarInput]       = useState("");
  const [otpInput, setOtpInput]               = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPwd, setShowNewPwd]           = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [donorForm, setDonorForm] = useState(initialDonorForm);
  const [orgForm, setOrgForm]     = useState(initialOrgForm);

  // OTP state (for donor registration)
  const [otpMobile, setOtpMobile]   = useState("");
  const [otpDigits, setOtpDigits]   = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer]     = useState(0);
  const otpRefs  = useRef([]);
  const timerRef = useRef(null);

  const { login } = useAuth();
  const navigate  = useNavigate();

  // Countdown timer for registration OTP
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => setOtpTimer((t) => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [otpTimer]);

  // Helper: show an error message in the modal (no annoying alert popups)
  const err = (msg) => {
    setError(msg);
    setLoading(false);
  };
  const clearErr = () => setError("");

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 1 — Strong Password Validation Helper
  // Checks all 5 rules and returns a friendly error message, or null if OK.
  // ─────────────────────────────────────────────────────────────────────────────
  const validatePassword = (password) => {
    if (!password || password.length < 8)
      return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter (A–Z).";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter (a–z).";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number (0–9).";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return 'Password must contain at least one special character (e.g. @, #, !).';
    return null; // null = all good ✅
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearErr();
    if (!loginForm.email || !loginForm.password)
      return err("Please enter your email and password.");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      login(data.token, data.user);
      onClose();
      if (data.user.role === "donor")        navigate("/donor", { replace: true });
      else if (data.user.role === "organization") navigate("/org",   { replace: true });
      else if (data.user.role === "admin")   navigate("/admin", { replace: true });
    } catch (e) {
      if (e.message?.includes("pending")) {
        err("⏳ Your organization is awaiting admin verification. Please check back later.");
      } else {
        err(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Donor Registration: send OTP ──────────────────────────────────────────
  const handleDonorRegister = async () => {
    clearErr();
    const { name, email, mobile, aadhaar, password, bloodGroup, city, subLocation } = donorForm;

    // Check all fields are filled
    if (!name || !email || !mobile || !aadhaar || !password || !bloodGroup || !city || !subLocation) {
      return err("All fields are required.");
    }
    if (!/^\d{12}$/.test(aadhaar))
      return err("Aadhaar must be exactly 12 digits.");
    if (mobile.length < 10)
      return err("Please enter a valid 10-digit mobile number.");

    // --- REQUIREMENT 1: Validate password strength before sending OTP ---
    const passwordError = validatePassword(password);
    if (passwordError) {
      return err(passwordError); // Shows the message inside the modal, not an alert
    }

    setLoading(true);
    try {
      const otpData = await apiFetch("/auth/donor/send-otp", {
        method: "POST",
        body: JSON.stringify(donorForm),
      });
      console.log("🔐 Registration OTP:", otpData.otp);
      setOtpMobile(mobile);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpTimer(300);
      setTab("otp");
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Organization Registration ─────────────────────────────────────────────
  const handleOrgRegister = async () => {
    clearErr();
    const { organizationName, email, mobile, password, city, subLocation } = orgForm;

    // Check all fields are filled
    if (!organizationName || !email || !mobile || !password || !city || !subLocation) {
      return err("All fields are required.");
    }

    // --- REQUIREMENT 1: Validate password strength for org registration too ---
    const passwordError = validatePassword(password);
    if (passwordError) {
      return err(passwordError); // Shows the message inside the modal, not an alert
    }

    setLoading(true);
    try {
      await apiFetch("/auth/organization/register", {
        method: "POST",
        body: JSON.stringify(orgForm),
      });
      setError("");
      setTab("login");
      // Show a success message inline (reuses the error state for the green-ish message)
      err("✅ Registration submitted! Awaiting admin verification. Please login once approved.");
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 2 — Forgot Password: Step 1 → Ask for Aadhaar, send OTP
  // Uses apiFetch (the existing API utility) instead of hardcoded localhost URL
  // ─────────────────────────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearErr();

    // Basic validation
    if (!aadhaarInput || aadhaarInput.length !== 12 || !/^\d{12}$/.test(aadhaarInput)) {
      return err("Please enter a valid 12-digit Aadhaar number.");
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ aadhaarNumber: aadhaarInput }),
      });
      console.log("🔐 Forgot Password OTP:", data.otp);
      err(`✅ ${data.message}`);
      setView("reset");
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // REQUIREMENT 2 — Forgot Password: Step 2 → Verify OTP + set new password
  // ─────────────────────────────────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearErr();

    // Validate OTP field
    if (!otpInput || otpInput.length !== 6 || !/^\d{6}$/.test(otpInput)) {
      return err("Please enter the 6-digit OTP from the console.");
    }

    // --- REQUIREMENT 1 + 2: Validate new password strength ---
    const passwordError = validatePassword(newPasswordInput);
    if (passwordError) {
      return err(passwordError); // Shows inline, no alert
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          aadhaarNumber: aadhaarInput,
          otp:           otpInput,
          newPassword:   newPasswordInput,
        }),
      });

      // Success! Show message and go back to login
      err(`✅ ${data.message}`);
      setView("login");

      // Clear the forgot-password form fields
      setAadhaarInput("");
      setOtpInput("");
      setNewPasswordInput("");
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling (for donor registration OTP boxes) ─────────────────
  const handleOtpChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otpDigits];
    next[index] = val;
    setOtpDigits(next);
    if (val && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    clearErr();
    const otp = otpDigits.join("");
    if (otp.length < 6) return err("Please enter the full 6-digit OTP.");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/donor/verify-otp", {
        method: "POST",
        body: JSON.stringify({ mobile: otpMobile, otp }),
      });
      login(data.token, data.user);
      onClose();
      navigate("/donor", { replace: true });
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    clearErr();
    setLoading(true);
    try {
      const otpData = await apiFetch("/auth/donor/send-otp", {
        method: "POST",
        body: JSON.stringify(donorForm),
      });
      console.log("🔐 Resend OTP:", otpData.otp);
      setOtpTimer(300);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (e) {
      err(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // Helper to update a specific field inside a form state object
  const setField = (setter) => (key, val, key2, val2) => {
    setter((prev) => {
      const next = { ...prev, [key]: val };
      if (key2 !== undefined) next[key2] = val2;
      return next;
    });
  };

  return (
    <div className="modal" style={{ display: "flex" }} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>✕</span>

        {/* ═══════════════════════════════════════════════════════════
            SCREEN 1: OTP Verification (for donor registration)
        ═══════════════════════════════════════════════════════════ */}
        {tab === "otp" ? (
          <div className="otp-screen">
            <div className="otp-icon">🔐</div>
            <h3 className="otp-heading">Verify Your Mail</h3>
            <p className="otp-subtext">
              We sent a 6-digit OTP to your Mail.
              <br />
             </p>
            <div className="otp-boxes">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  className="otp-input"
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className="continue-btn" onClick={handleVerifyOtp} disabled={loading}>
              {loading ? "Verifying…" : "✅ Verify & Create Account"}
            </button>
            <div className="otp-resend">
              {otpTimer > 0 ? (
                <span>Resend in <strong>{formatTimer(otpTimer)}</strong></span>
              ) : (
                <button onClick={handleResendOtp} disabled={loading}>Resend OTP</button>
              )}
            </div>
            <button
              className="otp-back"
              onClick={() => { setTab("register"); clearErr(); }}
            >
              ← Back
            </button>
          </div>

        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════
                SCREEN 2: Forgot Password — Enter Aadhaar to get OTP
                REQUIREMENT 2 — Step 1
            ═══════════════════════════════════════════════════════════ */}
            {view === "forgot" && (
              <form onSubmit={handleForgotPassword} className="form-container active-tab">
                <h3 id="modalTitle">🔑 Forgot Password</h3>
                <p style={{ marginBottom: "1rem", color: "#64748b", textAlign: "center", fontSize: "0.95rem" }}>
                  Enter your Aadhaar number and we'll send an OTP!
                </p>

                <input
                  type="text"
                  placeholder="Enter 12-digit Aadhaar Number"
                  value={aadhaarInput}
                  maxLength={12}
                  onChange={(e) => { setAadhaarInput(e.target.value); clearErr(); }}
                />

                {/* Show error or info messages right here in the modal */}
                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="continue-btn" style={{ marginTop: "1rem" }} disabled={loading}>
                  {loading ? "Sending OTP…" : "Get OTP →"}
                </button>

                <p
                  onClick={() => { setView("login"); clearErr(); }}
                  style={{ textAlign: "center", cursor: "pointer", marginTop: "1rem", color: "#64748b" }}
                >
                  ← Back to Login
                </p>
              </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                SCREEN 3: Reset Password — Enter OTP + New Password
                REQUIREMENT 2 — Step 2
            ═══════════════════════════════════════════════════════════ */}
            {view === "reset" && (
              <form onSubmit={handleResetPassword} className="form-container active-tab">
                <h3 id="modalTitle">🔒 Create New Password</h3>
                <p style={{ marginBottom: "1rem", color: "#64748b", textAlign: "center", fontSize: "0.9rem" }}>
                  Enter the OTP from the console and your new password below.
                </p>

                {/* OTP input */}
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP (from console)"
                  value={otpInput}
                  maxLength={6}
                  onChange={(e) => { setOtpInput(e.target.value); clearErr(); }}
                />

                {/* New password input with show/hide toggle */}
                <div className="password-container">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    placeholder="Enter New Password"
                    value={newPasswordInput}
                    onChange={(e) => { setNewPasswordInput(e.target.value); clearErr(); }}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                  >
                    👁️
                  </button>
                </div>

                {/* Password strength hint */}
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
                  Password must be 8+ chars with uppercase, lowercase, number &amp; special character.
                </p>

                {/* Show error or success messages right here in the modal */}
                {error && <p className="form-error">{error}</p>}

                <button type="submit" className="continue-btn" style={{ marginTop: "0.5rem" }} disabled={loading}>
                  {loading ? "Resetting…" : "✅ Confirm New Password"}
                </button>

                <p
                  onClick={() => { setView("login"); clearErr(); }}
                  style={{ textAlign: "center", cursor: "pointer", marginTop: "1rem", color: "#64748b" }}
                >
                  Cancel
                </p>
              </form>
            )}

            {/* ═══════════════════════════════════════════════════════════
                SCREEN 4: Main Login / Register (shown when view === "login")
            ═══════════════════════════════════════════════════════════ */}
            {view === "login" && (
              <>
                <h3 id="modalTitle">
                  {tab === "login" ? "🔐 Sign In" : "📝 Create Account"}
                </h3>

                {/* Role selector (only shown on register tab) */}
                {tab === "register" && (
                  <div className="role-select">
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        className={role === r ? "active" : ""}
                        onClick={() => { setRole(r); clearErr(); }}
                      >
                        {r === "donor" ? "🩸 Donor" : "🏥 Organization"}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── LOGIN FORM ─────────────────────────────────────── */}
                {tab === "login" && (
                  <div className="form-container active-tab">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                    <div className="password-container">
                      <input
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      />
                      <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
                        👁️
                      </button>
                    </div>

                    {/* REQUIREMENT 2 — Forgot Password link */}
                    <p
                      style={{ color: "#ef4444", cursor: "pointer", fontSize: "0.9rem", textAlign: "right", marginTop: "5px", marginBottom: "5px" }}
                      onClick={() => { setView("forgot"); clearErr(); }}
                    >
                      Forgot Password?
                    </p>

                    {error && <p className="form-error">{error}</p>}
                    <button className="continue-btn" onClick={handleLogin} disabled={loading}>
                      {loading ? "Signing in…" : "Sign In"}
                    </button>
                  </div>
                )}

                {/* ── DONOR REGISTER FORM ───────────────────────────── */}
                {tab === "register" && role === "donor" && (
                  <div className="form-container active-tab">
                    <input
                      placeholder="Full Name"
                      value={donorForm.name}
                      onChange={(e) => setField(setDonorForm)("name", e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={donorForm.email}
                      onChange={(e) => setField(setDonorForm)("email", e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={donorForm.mobile}
                      onChange={(e) => setField(setDonorForm)("mobile", e.target.value)}
                    />
                    <input
                      placeholder="Aadhaar Number (12 digits)"
                      maxLength={12}
                      value={donorForm.aadhaar}
                      onChange={(e) => setField(setDonorForm)("aadhaar", e.target.value)}
                    />
                    <select
                      value={donorForm.bloodGroup}
                      onChange={(e) => setField(setDonorForm)("bloodGroup", e.target.value)}
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map((bg) => <option key={bg}>{bg}</option>)}
                    </select>
                    <select
                      value={donorForm.city}
                      onChange={(e) => setField(setDonorForm)("city", e.target.value, "subLocation", "")}
                    >
                      <option value="">Select City</option>
                      {Object.keys(LOCATIONS).map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {donorForm.city && (
                      <select
                        value={donorForm.subLocation}
                        onChange={(e) => setField(setDonorForm)("subLocation", e.target.value)}
                      >
                        <option value="">Select Area</option>
                        {LOCATIONS[donorForm.city]?.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    )}
                    <div className="password-container">
                      <input
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        value={donorForm.password}
                        onChange={(e) => setField(setDonorForm)("password", e.target.value)}
                      />
                      <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
                        👁️
                      </button>
                    </div>
                    {/* Small hint about password requirements */}
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                      8+ chars, uppercase, lowercase, number &amp; special character required.
                    </p>
                    {error && <p className="form-error">{error}</p>}
                    <button className="continue-btn" onClick={handleDonorRegister} disabled={loading}>
                      {loading ? "Sending OTP…" : "Send OTP →"}
                    </button>
                  </div>
                )}

                {/* ── ORG REGISTER FORM ─────────────────────────────── */}
                {tab === "register" && role === "organization" && (
                  <div className="form-container active-tab">
                    <input
                      placeholder="Organization Name"
                      value={orgForm.organizationName}
                      onChange={(e) => setField(setOrgForm)("organizationName", e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={orgForm.email}
                      onChange={(e) => setField(setOrgForm)("email", e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={orgForm.mobile}
                      onChange={(e) => setField(setOrgForm)("mobile", e.target.value)}
                    />
                    <select
                      value={orgForm.city}
                      onChange={(e) => setField(setOrgForm)("city", e.target.value, "subLocation", "")}
                    >
                      <option value="">Select City</option>
                      {Object.keys(LOCATIONS).map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {orgForm.city && (
                      <select
                        value={orgForm.subLocation}
                        onChange={(e) => setField(setOrgForm)("subLocation", e.target.value)}
                      >
                        <option value="">Select Area</option>
                        {LOCATIONS[orgForm.city]?.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    )}
                    <div className="password-container">
                      <input
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        value={orgForm.password}
                        onChange={(e) => setField(setOrgForm)("password", e.target.value)}
                      />
                      <button type="button" className="toggle-password" onClick={() => setShowPwd(!showPwd)}>
                        👁️
                      </button>
                    </div>
                    {/* Small hint about password requirements */}
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                      8+ chars, uppercase, lowercase, number &amp; special character required.
                    </p>
                    {error && <p className="form-error">{error}</p>}
                    <button className="continue-btn" onClick={handleOrgRegister} disabled={loading}>
                      {loading ? "Submitting…" : "Submit for Verification"}
                    </button>
                  </div>
                )}

                {/* Tab switcher: "New here? → Register" / "Have an account? → Sign In" */}
                <div className="tab-switcher">
                  <span>{tab === "login" ? "New here?" : "Have an account?"}</span>
                  <button
                    onClick={() => { setTab(tab === "login" ? "register" : "login"); clearErr(); }}
                  >
                    {tab === "login" ? "Create Account" : "Sign In"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

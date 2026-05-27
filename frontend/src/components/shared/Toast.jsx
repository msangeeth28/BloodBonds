import { useEffect, useState } from "react";

// Usage: <Toast message="Saved!" type="success" onClose={() => setToast(null)} />
export default function Toast({ message, type = "success", onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300); }, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46", icon: "✅" },
    error:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", icon: "❌" },
    info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", icon: "ℹ️" },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
      background: c.bg, border: `1.5px solid ${c.border}`, color: c.text,
      padding: "1rem 1.5rem", borderRadius: "12px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", gap: "0.75rem",
      fontWeight: 600, fontSize: "0.95rem", maxWidth: "360px",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-10px)",
      transition: "all 0.3s ease",
    }}>
      <span>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: c.text, padding: 0 }}>✕</button>
    </div>
  );
}

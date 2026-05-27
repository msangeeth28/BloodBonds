import { useEffect } from "react";

// Generic modal wrapper — handles backdrop, close-on-click, escape key
export default function Modal({ onClose, children, maxWidth = "480px" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 3000, padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: "20px", padding: "2.5rem",
          width: "100%", maxWidth, position: "relative",
          boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
          animation: "modalPop 0.2s ease",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1.25rem",
            background: "none", border: "none", fontSize: "1.4rem",
            cursor: "pointer", color: "#94a3b8", lineHeight: 1,
          }}
        >✕</button>
        {children}
      </div>
      <style>{`@keyframes modalPop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

import { useRef, useEffect, useState } from "react";
import { API_BASE } from "../utils/constants";

const BADGE_MAP = {
  1: { label: "Top Donor", color: "#f59e0b", bg: "#fef3c7" },
  2: { label: "Lifesaver", color: "#6366f1", bg: "#eef2ff" },
  3: { label: "Active Hero", color: "#10b981", bg: "#d1fae5" },
};

function rankClass(rank) {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "";
}

export default function TopDonors({ onOpenModal }) {
  const sliderRef = useRef(null);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/auth/top-donors`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDonors(data);
        } else {
          setDonors([]);
        }
      })
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  }, []);

  const scroll = (offset) => {
    sliderRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="donor-section" id="top-donors">
      <small>🏅 HALL OF HEROES</small>

      <h2>
        Our <span>Top Donors</span>
      </h2>

      <p>
        Meet the incredible individuals who have made the most impact through
        their generous donations. Real people. Real lives saved.
      </p>

      {loading ? (
        <div className="donors-loading">
          <div className="donors-loading-spinner" />
          <p>Loading top donors…</p>
        </div>
      ) : donors.length === 0 ? (
        <div className="donors-empty">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🩸</div>
          <h3>No donations recorded yet</h3>
          <p>Be the first to make a difference — every donation counts.</p>
          <button
            className="btn-primary"
            style={{ marginTop: "1.5rem" }}
            onClick={onOpenModal}
          >
            Become a Donor →
          </button>
        </div>
      ) : (
        <div className="slider-wrapper">
          <button className="nav-arrow" onClick={() => scroll(-320)}>
            ❮
          </button>

          <div className="donor-slider" ref={sliderRef}>
            {donors.map((donor, index) => {
              const badge = BADGE_MAP[donor.rank];
              return (
                <div className="donor-card" key={donor._id || index}>
                  <div className={`rank-badge ${rankClass(donor.rank)}`}>
                    #{donor.rank}
                  </div>

                  <div className="donor-card-avatar-wrap">
                    {donor.profileImage ? (
                      <img src={donor.profileImage} alt={donor.name} />
                    ) : (
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #ef4444, #dc2626)",
                          color: "#fff",
                          fontSize: "2.5rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "20px auto",
                        }}
                      >
                        {donor.name ? donor.name[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </div>

                  <h3>{donor.name}</h3>

                  <div className="donor-blood-pill">{donor.bloodGroup}</div>

                  {badge && (
                    <div
                      className="donor-badge-chip"
                      style={{
                        color: badge.color,
                        background: badge.bg,
                        border: `1px solid ${badge.color}30`,
                      }}
                    >
                      {badge.label}
                    </div>
                  )}

                  <div className="donations">
                    🔥 {donor.donationCount} donation
                    {donor.donationCount !== 1 ? "s" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <button className="nav-arrow" onClick={() => scroll(320)}>
            ❯
          </button>
        </div>
      )}

      <div className="top-donors-cta" onClick={onOpenModal}>
        <span>Want to see your name here?</span>
        <button className="btn-secondary" style={{ marginLeft: "1rem" }}>
          Register as Donor →
        </button>
      </div>
    </section>
  );
}

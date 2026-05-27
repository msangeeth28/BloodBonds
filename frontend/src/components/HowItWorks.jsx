import '../styles/global.css';

const steps = [
  {
    icon: '👤',
    step: '01',
    title: 'Smart Registration & Profiling',
    desc: 'Donors and healthcare organizations create secure accounts. By logging specific blood groups and precise location details, the system knows exactly who can safely donate and where they are needed most.',
    color: '#ef4444',
  },
  {
    icon: '🚨',
    step: '02',
    title: 'Real-Time Emergency Routing',
    desc: 'When a hospital or blood bank faces a shortage, they post an urgent requirement. The platform acts as a smart filter, instantly routing these critical needs directly to the dashboards of compatible local donors.',
    color: '#dc2626',
  },
  {
    icon: '🤝',
    step: '03',
    title: 'Direct Connection & Live Fulfillment',
    desc: 'Donors can use the "Call Now" feature to instantly reach out to the facility in need. As donations are completed, the organization updates their dashboard, and live progress bars update in real-time across the entire platform.',
    color: '#b91c1c',
  },
  {
    icon: '🏆',
    step: '04',
    title: 'A Lifesaving Community Ecosystem',
    desc: 'Every verified donation is permanently recorded in the donor’s history, and the most dedicated individuals are celebrated on a community leaderboard. This creates a continuous cycle where no request goes unanswered and every local hero is recognized.',
    color: '#991b1b',
  }
];

export default function HowItWorks({ onOpenModal }) {
  return (
    <section className="how-section" id="how-it-works">
      <small>✦ HOW IT WORKS</small>
      <h2>Four Steps That <span>Change Everything</span></h2>
      <p>
        From registration to saving lives — the entire journey is seamless, safe, and deeply rewarding.
        Every step you take brings someone closer to survival.
      </p>

      <div className="steps">
        {steps.map((s, i) => (
          <div className="card how-card" key={i}>
            <div className="how-step-number" style={{ color: s.color }}>{s.step}</div>
            <div className="how-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
            {i === 0 && (
              <button className="how-cta-btn" onClick={onOpenModal}>
                Get Started →
              </button>
            )}
          </div>
        ))}
      </div>

    </section>
  );
}

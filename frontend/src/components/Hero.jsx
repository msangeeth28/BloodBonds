import "../styles/hero.css";
import heroImg from "../assets/hero-illustration.png";

export default function Hero({ onOpenModal }) {
  return (
    <section className="hero" id="home">
      <div className="hero-left">
        <div className="badge">❤ Every drop counts</div>
      
        <h1>
          Give the Gift of <span>Life</span><svg 
            viewBox="0 0 800 60" 
            style={{ 
              height: "0.65em", /* Matches the height of lowercase letters */
              width: "280px",
              flexShrink: 0, /* Prevents the SVG from squishing if screen gets small */
              transform: "translateY(5px)", /* Nudges it precisely to the middle bar of the 'e' */
              overflow: "visible"
            }}
            preserveAspectRatio="xMinYMid meet"
          >
            <path 
              d="M0,30 L150,30 L180,30 L200,10 L220,50 L240,10 L260,50 L280,30 L320,30 L500,30 L530,30 L550,10 L570,50 L590,10 L610,50 L630,30 L800,30" 
              fill="none" 
              stroke="hsl(355, 78%, 56%)" 
              strokeWidth="5" /* Thickened slightly to look good at text scale */
              opacity="0.9" 
              strokeDasharray="1000" 
              className="animate-heartbeat-line"
            />
          </svg>
        </h1>

        <p>Every drop counts. Join thousands of heroes making a difference — one donation at a time.</p>

        <div className="hero-buttons">
          <button className="btn-primary" onClick={onOpenModal}>
            Donate Now →
          </button>

          <a href="#how-it-works">
            <button className="btn-secondary">Learn More</button>
          </a>
        </div>
      </div>
      <div className="hero-right" style={{ position: "relative" }}>
        <img
          src={heroImg}
          alt="Blood Donation Image!"
          
        />

        
      </div>
    </section>
  );
}

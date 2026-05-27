export default function Footer() {
  return (
    <footer className="footer" id="foot">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-col footer-brand">
          <div className="footer-logo">❤ <span>BloodBonds</span></div>
          <p className="footer-tagline">
            Connecting donors with patients in real time. Every drop of blood you give is a lifeline someone desperately needs.
          </p>
          <div className="footer-socials">
            <a href="mailto:admin@bloodbonds.com" className="footer-social-icon" title="Email Us">✉</a>
            <a href="#" className="footer-social-icon" title="Twitter">𝕏</a>
            <a href="#" className="footer-social-icon" title="Instagram">📷</a>
            <a href="#" className="footer-social-icon" title="Facebook">f</a>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#top-donors">Top Donors</a></li>
            <li><a href="#foot">Contact Us</a></li>
          </ul>
        </div>

        {/* CONTACT */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <div className="footer-contact-list">
            <div className="footer-contact-item">
              <span className="footer-contact-icon">✉</span>
              <div>
                <div className="footer-contact-label">Email</div>
                <a href="mailto:admin@bloodbonds.com">admin@bloodbonds.com</a>
              </div>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📞</span>
              <div>
                <div className="footer-contact-label">Helpline</div>
                <a href="tel:+919650816031">+91-9650816031</a>
              </div>
            </div>
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              <div>
                <div className="footer-contact-label">Address</div>
                <span>Blood Cell, National Health Mission,<br />Ministry of Health &amp; Family Welfare,<br />New Delhi-110011</span>
              </div>
            </div>
          </div>
        </div>

        {/* POLICIES */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Accessibility Statement</a></li>
            <li><a href="#">Cookie Policy</a></li>
          </ul>
          <div className="footer-emergency-box">
            <div className="footer-emergency-title">🆘 Blood Emergency?</div>
            <p>Call our 24/7 helpline immediately</p>
            <a href="tel:+919650816031" className="footer-emergency-btn">Call Now</a>
          </div>
        </div>

      </div>
      <div className="footer-bottom">
        <span>© 2026 BloodBonds. Saving lives together.</span>
        <span>Made with ❤ for humanity</span>
      </div>
    </footer>
  );
}

import '../styles/navbar.css';

export default function Navbar({ onOpenModal }) {
  return (
    <nav>
      <div className="logo"><span>❤</span>Blood-Bonds</div>
      <div className="nav-links">
        <a onClick={onOpenModal} style={{ cursor: 'pointer' }}>Emergency Blood</a>
        <a onClick={onOpenModal} style={{ cursor: 'pointer' }}>Blood Requirements</a>
        <a href="#top-donors">Our Top Donors</a>
        <a href="#foot">Contact Us</a>
      </div>
      <button className="nav-btn" onClick={onOpenModal}>Login / Register</button>
    </nav>
  );
}

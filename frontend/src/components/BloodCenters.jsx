import { useRef } from 'react';

const bloodBanks = [
  { name: "Government General Hospital Bhimavaram Blood Bank", distance: "3.8 km", address: "Government Hospital Road, Bhimavaram", phone: "+91 8816 233334" },
  { name: "Sri Satya Sai Super Specialty Hospital Blood Bank", distance: "4.6 km", address: "Bhimavaram, West Godavari", phone: "+91 8816 223344" },
  { name: "Sri Surya Hospital Blood Bank", distance: "5.2 km", address: "Undi Road, Bhimavaram", phone: "+91 8816 224455" }
];

export default function BloodCenters() {
  const sliderRef = useRef(null);

  const scroll = (offset) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <section className="blood-centers-section" id="blood-centers">
      <small>🏥 NEARBY BLOOD CENTERS</small>
      <h2>Find hospitals & blood banks close to you</h2>
      <div className="center-slider-wrapper">
        <button className="center-arrow left" onClick={() => scroll(-300)}>❮</button>
        <div className="center-slider" id="centerSlider" ref={sliderRef}>
          {bloodBanks.map((bank, index) => (
            <div className="center-card" key={index}>
              <h3>{bank.name}</h3>
              <div className="distance">{bank.distance}</div>
              <p>📍 {bank.address}</p>
              <p>📞 {bank.phone}</p>
            </div>
          ))}
        </div>
        <button className="center-arrow right" onClick={() => scroll(300)}>❯</button>
      </div>
      <div className="center-dots" id="centerDots"></div>
    </section>
  );
}
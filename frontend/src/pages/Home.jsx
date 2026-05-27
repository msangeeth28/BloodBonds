import { useState,useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import TopDonors from '../components/TopDonors';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Navbar onOpenModal={() => setIsModalOpen(true)} />
      <Hero onOpenModal={() => setIsModalOpen(true)} />
      <HowItWorks onOpenModal={() => setIsModalOpen(true)} />
      <TopDonors onOpenModal={() => setIsModalOpen(true)} />
      <Footer />
      {isModalOpen && <AuthModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

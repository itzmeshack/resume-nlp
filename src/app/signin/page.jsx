'use client';

import { useRef, useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Toaster } from 'react-hot-toast';
import GlassySignInForm from '../../components/GlassySignInForm';

export default function SignInPage() {
  const bgRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const loadVanta = async () => {
      if (!vantaEffect && typeof window !== 'undefined') {
        await import('three');
        const VANTA = await import('vanta/dist/vanta.net.min');
        setVantaEffect(
          VANTA.default({
            el: bgRef.current,
            color: 0x3b82f6,
            backgroundColor: 0x000000,
            points: 12.0,
            maxDistance: 20.0,
            spacing: 16.0,
            showDots: true,
            mouseControls: true,
            touchControls: true,
          })
        );
      }
    };
    loadVanta();
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <main className="min-h-screen relative overflow-hidden text-gray-900">
      {/* 3D background */}
      <div ref={bgRef} className="fixed inset-0 -z-10 pointer-events-none" />

      {/* Navbar (z-50 so always on top) */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <Toaster position="top-center" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <GlassySignInForm />
      </div>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

      <style jsx global>{`
        .animate-float {
          animation: floatCard 5s ease-in-out infinite;
        }
        @keyframes floatCard {
          0% {
            transform: translateY(0);
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.23);
          }
          50% {
            transform: translateY(-10px);
            box-shadow: 0 16px 48px rgba(59, 130, 246, 0.3);
          }
          100% {
            transform: translateY(0);
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.23);
          }
        }
      `}</style>
    </main>
  );
}

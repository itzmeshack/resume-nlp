'use client';
import { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const heroRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.VANTA && !vantaEffect) {
      const effect = window.VANTA.WAVES({
        el: heroRef.current,
        color: 0x000000,
        shininess: 50,
        waveHeight: 20,
        waveSpeed: 1.0,
        zoom: 1.5,
        backgroundColor: 0x000000,
      });
      setVantaEffect(effect);
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <section
      ref={heroRef}
      className="w-full h-[500px] text-white flex flex-col justify-center items-center text-center relative z-10"
    >
      <div className="z-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Enhance Your Resume with AI</h1>
        <p className="text-lg mb-6 max-w-xl mx-auto">
          Use AI and NLP to improve your resume and increase your chances of landing your dream job.
        </p>
        <a href="#signup">
          <button className="bg-white text-black hover:bg-gray-200 font-semibold px-6 py-3 rounded-md">
            Get Started
          </button>
        </a>
      </div>
    </section>
  );
}

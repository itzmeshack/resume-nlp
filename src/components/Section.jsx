'use client';
import { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const heroRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.VANTA && !vantaEffect) {
      const effect = window.VANTA.WAVES({
        el: heroRef.current,
       color: 0x000000, // ← black
        shininess: 50,
        waveHeight: 20,
        waveSpeed: 1.0,
        zoom: 1.2,
      });
      setVantaEffect(effect);
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return(
    <section 
    
     ref={heroRef}
    className="pt-24 px-6">
        <h1 className="text-3xl text-white font-bold mb-4">Welcome to ResumeAI</h1>
       <p className="max-w-xl text-white">

          This is where your future starts. Let's build a smarter resume with the power of AI & NLP.
        </p>
      </section>
       

  )

}  

'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Lightbulb, Sparkles, CheckCircle, FileText, Download, Smile } from 'lucide-react';

const features = [
  {
    icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
    title: 'AI-Powered Analysis',
    description: 'Get smart, personalized feedback based on job descriptions and resume content.',
  },
  {
    icon: <Sparkles className="w-8 h-8 text-green-600" />,
    title: 'Keyword Optimization',
    description: 'Identify and insert the right keywords to pass Applicant Tracking Systems.',
  },
  {
    icon: <CheckCircle className="w-8 h-8 text-purple-600" />,
    title: 'Smart Rewriting',
    description: 'Rephrase sections of your resume to be clearer and more impactful using AI.',
  },
  {
    icon: <FileText className="w-8 h-8 text-yellow-500" />,
    title: 'ATS Compatibility',
    description: 'Ensure your resume meets format and layout standards of modern hiring systems.',
  },
  {
    icon: <Download className="w-8 h-8 text-red-500" />,
    title: 'Export to PDF',
    description: 'Download your optimized resume instantly in a professional format.',
  },
  {
    icon: <Smile className="w-8 h-8 text-indigo-500" />,
    title: 'User-Friendly UI',
    description: 'No technical knowledge needed. Just upload, paste, and enhance.',
  },
];

export default function FeaturesPage() {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    const addScript = (src) =>
      new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

    const loadVanta = async () => {
      if (!vantaEffect && typeof window !== 'undefined') {
        await addScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js');
        await addScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js');

        setVantaEffect(
          window.VANTA.GLOBE({
            el: vantaRef.current,
            color: 0x3b82f6,
            backgroundColor: 0xffffff,
            size: 1.2,
            mouseControls: true,
            touchControls: true,
            minHeight: 200.0,
            minWidth: 200.0,
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
    <main className="min-h-screen text-gray-900 relative overflow-hidden">
      <Navbar />

      <div ref={vantaRef} className="w-full min-h-screen relative z-0">
        <section className="max-w-6xl mx-auto px-6 py-24 relative z-10 text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-10">Features of ResumeAI</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FileText, ArrowRightLeft, Sparkles, Download } from 'lucide-react';

export default function SamplesPage() {
  const sampleRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [vantaEffect, setVantaEffect] = useState(null);

  useEffect(() => {
    setMounted(true);

    const loadVanta = async () => {
      if (!vantaEffect && typeof window !== 'undefined') {
        await import('three');
        const VANTA = await import('vanta/dist/vanta.net.min');
        setVantaEffect(
          VANTA.default({
            el: sampleRef.current,
              color: 0x3b82f6,  
           backgroundColor: 0xffffff, // white
            points: 10.0,
            maxDistance: 25.0,
            spacing: 18.0,
            showDots: true,
          })
        );
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen text-gray-900 relative overflow-hidden">
      <Navbar />

      <div ref={sampleRef} className="w-full min-h-screen relative z-0">
        <section className="min-h-screen pt-28 pb-24 px-6 flex flex-col justify-center items-center text-center relative z-10">
          <div className="z-10 relative">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI Resume Samples
            </h1>
            <p className="text-lg max-w-2xl mx-auto mb-10 text-black-200">
              Discover how ResumeAI enhances resumes with keyword alignment, clarity, and formatting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20 space-y-4 hover:scale-105 transition">
                <FileText className="w-8 h-8 text-blue-400" />
                <h3 className="text-xl font-semibold text-black" >Original Resume</h3>
                <p className="text-sm text-black">
                  A simple resume submitted by the user before enhancement.
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20 space-y-4 hover:scale-105 transition">
                <ArrowRightLeft className="w-8 h-8 text-green-400" />
                <h3 className="text-xl font-semibold text-black">AI Rewriting</h3>
                <p className="text-sm text-black">
                  ResumeAI adjusts wording and layout using NLP techniques.
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20 space-y-4 hover:scale-105 transition">
                <Sparkles className="w-8 h-8 text-purple-400" />
                <h3 className="text-xl font-semibold text-black">Optimized Version</h3>
                <p className="text-sm text-black">
                  AI-optimized resume aligned with job keywords and ATS-friendly formatting.
                </p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-semibold mb-4">Before vs After Comparison</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <h3 className="font-semibold mb-2 text-blue-300">Original Resume</h3>
                  <pre className="text-sm text-black whitespace-pre-wrap">
                    {`• Designed banners for company blog
• Used Excel for project tracking
• Helped the sales team when needed`}
                  </pre>
                </div>
                <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <h3 className="font-semibold mb-2 text-green-300">AI Enhanced Resume</h3>
                  <pre className="text-sm text-black whitespace-pre-wrap">
                    {`• Created visual content for blog using Adobe tools
• Tracked project milestones and timelines with Excel
• Collaborated with sales team to optimize campaign results`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <h2 className="text-2xl font-semibold mb-4">What Users Are Saying</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="backdrop-blur-md bg-white/10 text-black p-4 rounded-xl shadow-2xl border border-white/20 italic">
                  “ResumeAI helped me completely transform my CV and I landed 2 interviews in a week!”
                  <div className="mt-2 text-sm text-black">– Fatima, Junior Designer</div>
                </div>
                <div className="backdrop-blur-md bg-white/10 text-black p-4 rounded-xl shadow-2xl border border-white/20 italic">
                  “The smart suggestions felt like a mentor edited my resume for me.”
                  <div className="mt-2 text-sm text-black">– Daniel, Marketing Graduate</div>
                </div>
              </div>
            </div>

            <div className="mt-24 text-center">
              <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-6 text-left">
                <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <h3 className="font-bold mb-2 text-blue-400">1. Upload Resume</h3>
                  <p className="text-black">Upload your current resume as a PDF or text.</p>
                </div>
                <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <h3 className="font-bold mb-2 text-green-400">2. Paste Job Description</h3>
                  <p className="text-black">Provide a job listing to help match keywords and content.</p>
                </div>
                <div className="backdrop-blur-md bg-white/10 text-white p-6 rounded-xl shadow-2xl border border-white/20">
                  <h3 className="font-bold mb-2 text-purple-400">3. Get AI Suggestions</h3>
                  <p className="text-black">Receive smart edits and formatting improvements instantly.</p>
                </div>
              </div>
            </div>

           
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

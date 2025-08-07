'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function AboutPage() {
  const aboutRef = useRef(null);
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
        await addScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js');

        setVantaEffect(
          window.VANTA.NET({
            el: aboutRef.current,
            color: 0x3b82f6,
            backgroundColor: 0xffffff,
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

  return (
    <main className="min-h-screen text-gray-900 relative overflow-hidden">
      <Navbar />

      <div ref={aboutRef} className="w-full min-h-screen relative z-0">
        {/* Main About Content */}
        <section className="max-w-6xl mx-auto px-6 py-24 flex flex-col-reverse md:flex-row items-center gap-10 relative z-10 text-black">
          {/* Text Content */}
          <div className="md:w-1/2">
            <h1 className="text-4xl font-bold text-blue-600 mb-6">About ResumeAI</h1>
            <p className="text-lg mb-4">
              ResumeAI is an intelligent web platform that empowers job seekers by transforming their resumes using Artificial Intelligence and Natural Language Processing (NLP).
            </p>
            <p className="mb-4 text-gray-800">
              We recognized a widespread issue — most resumes get filtered out by Applicant Tracking Systems (ATS) before a human even sees them. That’s why we built ResumeAI: to give everyone, regardless of their background, a fair chance to succeed in today’s competitive job market.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p className="mb-4 text-gray-800">
              Our mission is to level the playing field. We believe AI should be accessible to help real people secure real opportunities. Whether you're a student, graduate, or experienced professional — ResumeAI gives you personalized, AI-powered guidance to stand out.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">What Makes Us Different?</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-800">
              <li>AI-powered resume scoring & keyword matching</li>
              <li>Smart rewriting suggestions using advanced NLP</li>
              <li>Visual feedback and clean formatting advice</li>
              <li>Simple interface — no technical skills required</li>
            </ul>

            <p className="mt-6 text-gray-800">
              We are continuously improving our platform by integrating the latest AI models and listening to real user feedback.
            </p>
          </div>

          {/* Illustration */}
          <div className="md:w-1/2">
            <Image
              src="/resumeimg2.png"
              alt="AI Resume Illustration"
              width={600}
              height={400}
              className="rounded-xl shadow-lg w-full object-contain"
            />
          </div>
        </section>

        {/* Extra Sections */}
        <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10 text-black space-y-16">
          {/* Section 1: Meet the Technology */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Meet the Technology</h2>
            <p className="text-gray-800 mb-4">
              ResumeAI is powered by state-of-the-art Artificial Intelligence and Natural Language Processing models like <strong>GPT-4</strong> and <strong>spaCy</strong>. These tools allow us to deeply understand resume content, identify relevant keywords, and suggest meaningful improvements that align with job descriptions.
            </p>
            <p className="text-gray-800">
              Our smart engine can simulate how Applicant Tracking Systems (ATS) interpret resumes, helping you pass the initial filters and stand out to real recruiters.
            </p>
          </div>

          {/* Section 2: Success Stories */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Success Stories</h2>
            <ul className="space-y-4 text-gray-800">
              <li className="border-l-4 border-blue-500 pl-4 italic">
                "I submitted my resume after using ResumeAI and landed 3 interviews in a week. It's like having a career coach in your pocket!"
                <br />
                <span className="block mt-2 text-sm text-gray-500">— Sarah, Marketing Graduate</span>
              </li>
              <li className="border-l-4 border-green-500 pl-4 italic">
                "The AI rewrites were so good I barely had to touch anything. It was spot-on with job keywords."
                <br />
                <span className="block mt-2 text-sm text-gray-500">— Jamal, Software Developer</span>
              </li>
            </ul>
          </div>

          {/* Section 3: Why ResumeAI Matters */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Why ResumeAI Matters</h2>
            <p className="text-gray-800">
              In today’s world, over <strong>75%</strong> of resumes are rejected by automated systems before a human sees them.
              ResumeAI bridges the gap by helping job seekers optimize their resumes with AI-enhanced content, formatting, and targeting — improving visibility and success rates.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

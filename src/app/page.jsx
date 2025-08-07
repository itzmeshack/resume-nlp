'use client';
import Link from 'next/link';
import Hero from '@/components/Hero';
import FeaturesGrid from '@/components/FeaturesGrid';
import StatsSection from '@/components/StatsSection';
import HowItWorks from '@/components/HowItWorks';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ✅ Navbar */}
      <Navbar />

      {/* ✅ Hero Section */}
      <section
        className="w-full h-[270px] flex flex-col justify-center items-center text-center px-6 py-20"
      >
        <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-gradient-text">
          Welcome to ResumeAI
        </h1>
        <p className="max-w-6xl text-lg">
          This is where your future starts. Let's build a smarter resume with the power of AI & NLP.
        </p>
      </section>

      {/* ✅ Main Sections */}
      <Hero />
      <FeaturesGrid />
      <StatsSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}

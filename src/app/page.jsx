'use client';

import Link from 'next/link';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ✅ Navbar */}
      <nav className="w-full px-6 py-4 flex justify-between items-center shadow-md bg-white fixed top-0 z-50">
        <div className="text-xl font-bold text-blue-600">ResumeAI</div>
        <ul className="hidden md:flex gap-6 text-sm font-medium">
          <li><a href="#about" className="hover:text-blue-500">About</a></li>
          <li><a href="#features" className="hover:text-blue-500">Features</a></li>
          <li><a href="#samples" className="hover:text-blue-500">Samples</a></li>
          <li><a href="#faq" className="hover:text-blue-500">FAQ</a></li>
          <li><a href="#contact" className="hover:text-blue-500">Contact</a></li>
        </ul>
        <div className="flex gap-3">
          <Link href="/signin" className="text-sm font-semibold text-gray-800 hover:text-blue-600">Sign In</Link>
          <Link href="/signup" className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Sign Up</Link>
        </div>
      </nav>

      {/* 👇 This is placeholder until we build sections */}
      <section className="pt-24 px-6">
        <h1 className="text-3xl font-bold mb-4">Welcome to ResumeAI</h1>
        <p className="max-w-xl text-gray-600">
          This is where your future starts. Let's build a smarter resume with the power of AI & NLP.
        </p>
      </section>


      {/* ✅ Hero Section */}
          <Hero />
<section className="pt-32 px-6 pb-20 bg-gradient-to-br from-blue-100 to-white text-center">
  <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
    Enhance Your Resume with AI
  </h1>
  <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
    Use the power of AI and natural language processing to improve your resume and align it with your dream job.
  </p>
  <a href="#signup">
    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium">
      Get Started for Free
    </button>
  </a>
</section>

    </main>
  );
}

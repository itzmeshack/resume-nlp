'use client';
import Link from 'next/link';
import Hero from '@/components/Hero';
import FeaturesGrid from '@/components/FeaturesGrid';

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

      {/* ✅ Placeholder Section */}
  <Hero/>

  <FeaturesGrid/>
    </main>
  );
}

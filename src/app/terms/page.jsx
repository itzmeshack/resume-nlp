'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">Terms of Service</h1>
        <p className="mb-4 text-gray-700">
          By using ResumeAI, you agree to the following terms. Please read them carefully before using the service.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Use of Service</h2>
        <p className="mb-4 text-gray-700">
          ResumeAI is intended to help you optimize resumes. You agree not to misuse the platform or attempt to access it in unauthorized ways.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Intellectual Property</h2>
        <p className="mb-4 text-gray-700">
          All content and AI technology used on this site belongs to ResumeAI. You may not copy, distribute, or reproduce our assets without permission.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Liability</h2>
        <p className="mb-4 text-gray-700">
          We do not guarantee job placement. ResumeAI offers suggestions to improve your chances but cannot ensure hiring.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Changes to Terms</h2>
        <p className="mb-4 text-gray-700">
          We may update these terms from time to time. Continued use of the platform means you accept the new terms.
        </p>

        <p className="text-gray-500 mt-10">
          Last updated: August 2025
        </p>
      </section>

      <Footer />
    </main>
  );
}

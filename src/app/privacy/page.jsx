'use client';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">Privacy Policy</h1>
        <p className="mb-4 text-gray-700">
          At ResumeAI, we take your privacy seriously. This privacy policy outlines how we collect, use, and protect your information when you use our services.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4 text-gray-700">
          We may collect personal information such as your name, email address, resume details, and job preferences. We also collect usage data to improve our platform.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>To personalize your experience</li>
          <li>To improve ResumeAI’s functionality</li>
          <li>To communicate with you (e.g., notifications, updates)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h2>
        <p className="mb-4 text-gray-700">
          We use strong encryption and industry-standard measures to keep your data secure and confidential.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Your Rights</h2>
        <p className="mb-4 text-gray-700">
          You have the right to access, modify, or delete your data at any time. Please contact us for support regarding your data.
        </p>

        <p className="text-gray-500 mt-10">
          Last updated: August 2025
        </p>
      </section>

      <Footer />
    </main>
  );
}

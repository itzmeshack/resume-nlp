'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Trigger success toast
    toast.success('🎉 Message sent successfully!', {
      style: {
        background: '#1f2937', // dark gray
        color: '#fff',
        fontWeight: '500',
        border: '1px solid #3b82f6',
      },
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#1f2937',
      },
    });

    // Reset form
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* 🔔 Toaster Component for showing the notification */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1000,
          className: '',
          style: {
            animation: 'slide-in 0.2s ease-in-out',
          },
        }}
      />

      <section className="max-w-4xl mx-auto py-24 px-6">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-12">
          Contact Us
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Message</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows="5"
              className="w-full border border-gray-300 px-4 py-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}

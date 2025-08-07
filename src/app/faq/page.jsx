'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const faqs = [
  {
    question: 'What is ResumeAI?',
    answer:
      'ResumeAI is an AI-powered platform that enhances your resume by aligning it with job descriptions using NLP and machine learning.',
  },
  {
    question: 'Is ResumeAI free to use?',
    answer:
      'We offer a free version with limited features. Premium features including full resume rewrites and downloads require a subscription.',
  },
  {
    question: 'How does ResumeAI improve my resume?',
    answer:
      'It analyzes your content, matches it with job keywords, suggests rewording, and optimizes formatting to make your resume ATS-friendly.',
  },
  {
    question: 'Can I download the improved resume?',
    answer:
      'Yes! After analysis and improvement, users can download their AI-enhanced resume as a PDF or text file.',
  },
];

export default function FaqPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-4xl mx-auto py-24 px-6">
        <h1 className="text-4xl font-bold text-center text-blue-600 mb-12">Frequently Asked Questions</h1>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-4">
              <button
                onClick={() => toggleAnswer(index)}
                className="w-full text-left text-lg font-semibold flex justify-between items-center"
              >
                <span>{faq.question}</span>
                <span>{activeIndex === index ? '−' : '+'}</span>
              </button>
              {activeIndex === index && (
                <p className="mt-3 text-gray-700">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}

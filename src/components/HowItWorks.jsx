'use client';
import { Upload, ClipboardList, Sparkles, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      title: 'Upload Your Resume',
      description: 'Securely upload your resume in PDF or text format.',
      icon: <Upload className="w-6 h-6 text-blue-600" />,
    },
    {
      title: 'Paste Job Description',
      description: 'Provide the job listing you’re applying for.',
      icon: <ClipboardList className="w-6 h-6 text-green-600" />,
    },
    {
      title: 'AI Analysis',
      description: 'Our NLP engine analyzes your resume and job description.',
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
    },
    {
      title: 'Download Suggestions',
      description: 'Download the optimized resume and keyword suggestions.',
      icon: <Download className="w-6 h-6 text-yellow-500" />,
    },
  ];

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10">How ResumeAI Works</h2>

        <div className="space-y-10 relative">
          {steps.map((step, index) => (
            <div key={index}>
              {/* Step Block */}
              <motion.div
                className="flex items-start gap-4 text-left"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <div className="p-3 bg-gray-100 rounded-full">{step.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>

              {/* Arrow between steps, not after last one */}
              {index < steps.length - 1 && (
                <div className="my-6 flex justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400 animate-bounce drop-shadow-[0_0_8px_rgba(156,163,175,0.6)]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

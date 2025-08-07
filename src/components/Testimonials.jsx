'use client';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Specialist at Google',
    quote:
      'ResumeAI helped me land interviews within days! The AI suggestions made my resume way more professional.',
  },
  {
    name: 'James Smith',
    role: 'Software Engineer at Amazon',
    quote:
      'The keyword alignment feature is a game changer. I finally passed ATS filters and got real responses.',
  },
  {
    name: 'Amina Yusuf',
    role: 'Project Manager at Meta',
    quote:
      'I love how simple the platform is. I pasted my resume and job post and boom — perfect suggestions.',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white shadow-md rounded-lg p-6 text-left"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <User className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.role}</p>
                </div>
              </div>
              <p className="text-gray-700 italic">“{item.quote}”</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

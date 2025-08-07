'use client';

import { Sparkles, Brain, FileText } from 'lucide-react';

export default function FeaturesGrid() {
  return (
    <section className="w-full bg-gray-100 py-16 px-6">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ResumeAI?</h2>
        <p className="text-gray-600 text-lg">
          Built with smart features to help you land interviews faster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition">
          <div className="bg-blue-100 p-3 rounded-full inline-block mb-4">
            <Brain className="text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
          <p className="text-gray-600">
            Instantly analyze your resume and get smart suggestions using Natural Language Processing.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition">
          <div className="bg-green-100 p-3 rounded-full inline-block mb-4">
            <FileText className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Keyword Optimization</h3>
          <p className="text-gray-600">
            Match your resume with job descriptions and include the right keywords to beat the ATS bots.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg shadow-lg p-6 text-left hover:shadow-xl transition">
          <div className="bg-purple-100 p-3 rounded-full inline-block mb-4">
            <Sparkles className="text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Professional Formatting</h3>
          <p className="text-gray-600">
            Improve visual structure and readability to make a strong first impression with recruiters.
          </p>
        </div>
      </div>
    </section>
  );
}

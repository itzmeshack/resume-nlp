'use client';
import CountUp from 'react-countup';

export default function StatsSection() {
  return (
    <section className="bg-white py-20 px-6 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-8">What We've Achieved</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        <div>
          <p className="text-4xl font-extrabold text-blue-600">
            <CountUp end={1200} duration={2} />+
          </p>
          <p className="mt-2 text-gray-600">Resumes Enhanced</p>
        </div>

        <div>
          <p className="text-4xl font-extrabold text-green-600">
            <CountUp end={95} duration={2} />%
          </p>
          <p className="mt-2 text-gray-600">Interview Success</p>
        </div>

        <div>
          <p className="text-4xl font-extrabold text-purple-600">
            <CountUp end={4800} duration={2} />+
          </p>
          <p className="mt-2 text-gray-600">Hours Saved</p>
        </div>

        <div>
          <p className="text-4xl font-extrabold text-yellow-500">
            GPT-4
          </p>
          <p className="mt-2 text-gray-600">AI Model Behind It</p>
        </div>
      </div>
    </section>
  );
}

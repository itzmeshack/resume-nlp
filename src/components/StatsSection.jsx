'use client';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

export default function StatsSection() {
  const { ref, inView } = useInView({
    triggerOnce: true, // Only count once
    threshold: 0.3, // Start when 30% is visible
  });

  return (
    <section className="bg-white py-20 px-6 text-center" ref={ref}>
      <h2 className="text-3xl md:text-4xl font-bold mb-8">What We've Achieved</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        <div>
          <p className="text-4xl font-extrabold text-blue-600">
            {inView && <CountUp end={1200} duration={2} />}+
          </p>
          <p className="mt-2 text-gray-600">Resumes Enhanced</p>
        </div>

        <div>
          <p className="text-4xl font-extrabold text-green-600">
            {inView && <CountUp end={95} duration={2} />}%
          </p>
          <p className="mt-2 text-gray-600">Interview Success</p>
        </div>

        <div>
          <p className="text-4xl font-extrabold text-purple-600">
            {inView && <CountUp end={4800} duration={2} />}+
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

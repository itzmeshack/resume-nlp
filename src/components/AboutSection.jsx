'use client';

export default function AboutSection() {
  return (
    <section
      id="about"
      className="bg-gray-50 py-20 px-6 flex flex-col md:flex-row items-center justify-between gap-10 max-w-6xl mx-auto"
    >
      {/* Text Content */}
      <div className="md:w-1/2">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-600">About ResumeAI</h2>
        <p className="text-gray-700 mb-4">
          ResumeAI is an intelligent platform designed to help job seekers craft the perfect resume using AI and natural language processing (NLP).
        </p>
        <p className="text-gray-700 mb-4">
          We noticed that many talented individuals get overlooked by recruiters and automated systems due to poorly optimized resumes.
          Our goal is to fix that — by using smart technology to align resumes with job descriptions and industry standards.
        </p>
        <p className="text-gray-700">
          Whether you're a student, graduate, or professional, ResumeAI empowers you to present your best self and increase your chances of landing interviews.
        </p>
      </div>

      {/* Placeholder Image or Illustration */}
      <div className="md:w-1/2 flex justify-center">
        <div className="w-full h-64 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-lg font-semibold">
          [ AI Illustration Here ]
        </div>
      </div>
    </section>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(true);

  useEffect(() => {
    const isAccepted = localStorage.getItem('cookieAccepted');
    if (!isAccepted) setAccepted(false);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieAccepted', 'true');
    setAccepted(true);
  };

  if (accepted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-6 bg-white text-black shadow-lg p-4 rounded-md z-50 flex justify-between items-center">
  <div className="flex items-center gap-2">
        <Cookie className="w-5 h-5 text-yellow-600" /> {/* 🍪 Icon */}
        <p className="text-sm">
          We use cookies to enhance your experience. By continuing, you agree to our privacy policy.
        </p>
      </div>      
      
      <button
        onClick={handleAccept}
        className="ml-4 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
      >
        Accept
      </button>
    </div>
  );
}

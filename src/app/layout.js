

/*** for responsive design across all devices  */
import './globals.css';
import Script from 'next/script';
import CookieBanner from '../components/CookieBanner';

export const metadata = {
  title: 'ResumeAI',
  description: 'AI Resume Optimizer using NLP',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        <CookieBanner/>
   
      </body>
    </html>
  );
}

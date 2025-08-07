'use client';
import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white text-gray-800 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        
        {/* Logo & Socials */}
        <div className="space-y-4">
          <div className="text-2xl font-bold text-blue-600">ResumeAI</div>
          <p className="text-sm text-gray-500">
            AI-powered resume enhancement platform built to help you stand out.
          </p>
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-blue-500" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-blue-400" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-blue-600" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-pink-500" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Navigation</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/about" className="hover:text-blue-600">About</a></li>
            <li><a href="/features" className="hover:text-blue-600">Features</a></li>
            <li><a href="/samples" className="hover:text-blue-600">Samples</a></li>
            <li><a href="/faq" className="hover:text-blue-600">FAQ</a></li>
            <li><a href="/contact" className="hover:text-blue-600">Contact</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><a href="/terms" className="hover:text-blue-600">Terms of Service</a></li>
            <li><a href="privacy" className="hover:text-blue-600">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} ResumeAI. All rights reserved.
      </div>
    </footer>
  );
}

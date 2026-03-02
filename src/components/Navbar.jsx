'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const navLinks = [
    { href: '/about', label: 'About' },
    { href: '/features', label: 'Features' },
    { href: '/samples', label: 'Samples' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center shadow-md bg-white fixed top-0 z-50">

      <Link href="/" className="text-xl font-bold text-blue-600">
        ResumeAI
      </Link>

      {/* Desktop Nav */}
      <ul className="hidden md:flex gap-6 text-sm font-medium">
        {navLinks.map((link) => {
          const active = pathname === link.href;

          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className={`transition ${
                  active
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600 pb-1'
                    : 'text-gray-800 hover:text-blue-500'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop Auth */}
      <div className="hidden md:flex gap-3">
        <Link href="/signin" className="text-sm font-semibold text-gray-800 hover:text-blue-600">
          Sign In
        </Link>
        <Link href="/signup" className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">
          Sign Up
        </Link>
      </div>

      {/* Mobile Toggle */}
      <button onClick={toggleMenu} className="md:hidden">
        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 left-0 w-full bg-white shadow-md py-6 px-4 z-40 md:hidden"
          >
            <ul className="flex flex-col gap-4 text-sm font-medium mb-4">
              {navLinks.map((link) => {
                const active = pathname === link.href;

                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`block transition ${
                        active
                          ? 'text-blue-600 font-semibold'
                          : 'text-gray-800 hover:text-blue-500'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col gap-3">
              <Link href="/signin" className="text-sm font-semibold text-gray-800 hover:text-blue-600">
                Sign In
              </Link>
              <Link href="/signup" className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 text-center">
                Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </nav>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060608]/85 backdrop-blur-2xl border-b border-white/[0.07]'
          : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Activity className="h-4 w-4 text-blue-400" />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">OptionLabs</span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-sm text-white/50">
          <a href="#features"     className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How it works</a>
          <a href="#join"         className="hover:text-white transition-colors duration-200">Join beta</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-white/50 hover:text-white transition-colors duration-200 hidden sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Get Access
          </Link>
        </div>
      </div>
    </header>
  );
}

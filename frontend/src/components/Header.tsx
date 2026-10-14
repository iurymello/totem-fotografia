'use client';

import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const { theme } = useTheme();

  return (
    <header
      className={`max-w-5xl mx-auto rounded-3xl p-6 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border transition-colors ${
        theme === 'dark'
          ? 'bg-gray-900 border-amber-400/20'
          : 'bg-white border-amber-500/30'
      }`}
    >
      <div className="flex items-center gap-5">
        <img
          src="/fotografo.jpeg"
          alt="Iury Mello"
          className="w-24 h-24 rounded-full border-2 border-amber-400 object-cover shadow-md"
        />
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Fotografia Profissional
          </span>
          <h1 className={`text-2xl sm:text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Iury Mello
          </h1>
          <p className="text-sm text-gray-400 max-w-sm">
            Monte o seu orçamento personalizado em tempo real.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <img src="/logo.jpg" alt="Logo" className="h-12 object-contain rounded-lg" />
      </div>
    </header>
  );
}
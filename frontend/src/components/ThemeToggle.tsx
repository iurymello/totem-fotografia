'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all ${
        theme === 'dark'
          ? 'bg-gray-900 border-gray-800 text-amber-400 hover:bg-gray-800'
          : 'bg-white border-gray-300 text-amber-600 hover:bg-gray-50 shadow-sm'
      }`}
      title="Alternar Tema"
    >
      {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
    </button>
  );
}
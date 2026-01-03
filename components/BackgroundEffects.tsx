import React from 'react';

export const BackgroundEffects: React.FC<{ themeKey: string }> = ({ themeKey }) => {
  // Map themes to color palettes for the blobs
  const palettes: Record<string, string[]> = {
    default: ['bg-blue-300', 'bg-purple-300', 'bg-indigo-300'],
    ocean: ['bg-cyan-300', 'bg-blue-400', 'bg-teal-300'],
    sunset: ['bg-orange-300', 'bg-rose-400', 'bg-yellow-300'],
    forest: ['bg-emerald-300', 'bg-green-400', 'bg-lime-300'],
    royal: ['bg-indigo-300', 'bg-violet-400', 'bg-fuchsia-300'],
    midnight: ['bg-indigo-900', 'bg-blue-900', 'bg-slate-800'] 
  };

  const currentPalette = palettes[themeKey] || palettes.default;
  const isDark = themeKey === 'midnight' || document.documentElement.classList.contains('dark');

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
       {/* Blob 1: Top Left */}
       <div 
         className={`absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob ${currentPalette[0]} ${isDark ? 'mix-blend-normal opacity-10' : ''}`}
       ></div>
       
       {/* Blob 2: Top Right */}
       <div 
         className={`absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 ${currentPalette[1]} ${isDark ? 'mix-blend-normal opacity-10' : ''}`}
       ></div>
       
       {/* Blob 3: Bottom Left */}
       <div 
         className={`absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 ${currentPalette[2]} ${isDark ? 'mix-blend-normal opacity-10' : ''}`}
       ></div>
    </div>
  );
};
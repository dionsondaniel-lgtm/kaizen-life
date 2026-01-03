import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Wallet, Link as LinkIcon, ArrowUpRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center relative z-10">
      <div className="mb-8 animate-bounce">
        <Zap size={64} className="text-brand-600 dark:text-brand-500 mx-auto" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
        Kaizen Life
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mb-12 leading-relaxed">
        Your personal dashboard for productivity, finance, and continuous self-improvement.
        <br/><span className="text-sm opacity-75">1% Better Every Day.</span>
      </p>
      <Link 
        to="/auth" 
        className="px-8 py-4 bg-brand-600 text-white text-lg font-bold rounded-full hover:bg-brand-700 transition-all transform hover:scale-105 shadow-xl shadow-brand-500/30 flex items-center gap-2"
      >
        Get Started <ArrowUpRight />
      </Link>
      
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl w-full">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform">
          <Wallet className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="font-bold text-lg mb-2 dark:text-white">Budget Planner</h3>
          <p className="text-slate-500 text-sm">Track income and expenses with visual charts and financial health metrics.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform">
          <LinkIcon className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="font-bold text-lg mb-2 dark:text-white">Link Vault</h3>
          <p className="text-slate-500 text-sm">Organize your important links, resources, and bookmarks in one secure place.</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform">
           <Zap className="w-10 h-10 text-orange-500 mb-4" />
           <h3 className="font-bold text-lg mb-2 dark:text-white">AI & Habits</h3>
           <p className="text-slate-500 text-sm">Leverage Gemini AI for assistance and track your Atomic Habits daily.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
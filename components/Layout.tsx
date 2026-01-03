import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutGrid, 
  Wallet, 
  Link as LinkIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  Zap,
  BookOpen,
  Sparkles,
  Sunrise,
  Sprout
} from 'lucide-react';
import { User as UserType } from '../types';
import Modal from './Modal';

interface LayoutProps {
  user: UserType;
  onLogout: () => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, toggleTheme, isDark }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTrivia, setShowTrivia] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Link Vault', path: '/vault', icon: LinkIcon },
    { label: 'Budget', path: '/budget', icon: Wallet },
    { label: 'AI Tools', path: '/tools', icon: Zap },
  ];

  if (user.isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin', icon: Settings });
    navItems.push({ label: 'Dev Guide', path: '/guide', icon: BookOpen });
  }

  const handleNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // Function to handle logo click logic
  const handleLogoClick = () => {
    setShowTrivia(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <button onClick={handleLogoClick} className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-500 group">
          <Zap className="w-6 h-6 group-hover:text-yellow-500 transition-colors animate-wave" /> 
          <span>Kaizen</span>
        </button>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop) / Drawer (Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button 
          onClick={handleLogoClick} 
          className="w-full p-6 hidden md:flex items-center gap-2 font-bold text-2xl text-brand-600 dark:text-brand-500 group text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <Zap className="w-8 h-8 group-hover:text-yellow-500 transition-colors animate-wave" /> 
          <span>Kaizen</span>
        </button>

        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
              {user.firstName[0]}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-sm truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 dark:border-slate-800">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg mb-2">
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-65px)] md:h-screen bg-transparent p-4 md:p-8">
        <Outlet />
      </main>

      {/* Kaizen Philosophy Modal */}
      <Modal isOpen={showTrivia} onClose={() => setShowTrivia(false)} title="">
        <div className="space-y-8 p-2">
          {/* Header Section */}
          <div className="text-center animate-slide-up">
             <div className="inline-block p-4 rounded-full bg-slate-50 dark:bg-slate-800 mb-4 shadow-sm animate-wave">
                <Sparkles size={32} className="text-yellow-500" />
             </div>
             <h2 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-teal-500 mb-2 font-serif">改善</h2>
             <p className="text-sm text-slate-400 tracking-[0.2em] uppercase font-bold">Kaizen • The Art of Improvement</p>
          </div>
          
          {/* Definition Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border-l-4 border-blue-500 animate-slide-up delay-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="text-blue-600 dark:text-blue-400" size={20}/>
                  <h3 className="font-bold text-blue-800 dark:text-blue-200 text-lg">Kai (改)</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  "Change" or "To correct". The action to modify one's self for a better outcome.
                </p>
             </div>
             <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 p-5 rounded-2xl border-l-4 border-teal-500 animate-slide-up delay-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Sunrise className="text-teal-600 dark:text-teal-400" size={20}/>
                  <h3 className="font-bold text-teal-800 dark:text-teal-200 text-lg">Zen (善)</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  "Good" or "Benefit". Ensuring that the change serves a positive purpose.
                </p>
             </div>
          </div>

          {/* Philosophy Card */}
          <div className="relative p-8 bg-gradient-to-br from-brand-600 to-violet-600 rounded-3xl text-white shadow-xl transform hover:scale-[1.02] transition-transform duration-500 animate-slide-up delay-300 overflow-hidden group">
             {/* Abstract Background Shapes */}
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:rotate-12 transition-transform duration-700">
                <Zap size={120} />
             </div>
             <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>

             <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
               Your Daily Life
             </h3>
             <p className="text-white/90 leading-relaxed text-lg font-light relative z-10 italic">
               "It is not about one giant leap, but a thousand small steps forward. 
               Improving yourself <span className="font-bold text-yellow-300">1% every day</span> leads to being <span className="font-bold text-yellow-300">37x better</span> by the end of the year."
             </p>
             
             <div className="mt-6 pt-6 border-t border-white/20 flex justify-between items-end relative z-10">
                <div>
                   <p className="text-xs uppercase tracking-widest opacity-70">Philosophy</p>
                   <p className="font-medium">Continuous Improvement</p>
                </div>
                <button onClick={() => setShowTrivia(false)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold backdrop-blur-sm transition-colors">
                   Let's Begin
                </button>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Layout;
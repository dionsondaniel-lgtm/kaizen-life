import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Settings, Palette, Globe, Image, MessageSquare, HardDrive, Heart, 
  X, Maximize2, ScanLine, Download, WifiOff
} from 'lucide-react';
import { format } from 'date-fns';

import Layout from './components/Layout';
import Guide from './guide';
import Modal from './components/Modal';
import { BackgroundEffects } from './components/BackgroundEffects';
import { StorageManager } from './components/StorageManager';
import { loadState, saveState } from './services/storage';
import { uploadFeedback } from './services/supabase';
import { User, AppState } from './types';
import { TRANSLATIONS, APP_BACKGROUNDS } from './constants';

// Import Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Vault from './pages/Vault';
import Budget from './pages/Budget';
import Admin from './pages/Admin';
import AITools from './pages/AITools';

/* --- SUB-COMPONENTS --- */

// UPDATED: Accepts isOnline prop to show warning
const DonateModal: React.FC<{ isOpen: boolean; onClose: () => void; settings: any; isOnline: boolean }> = ({ isOpen, onClose, settings, isOnline }) => {
  const [expandedQr, setExpandedQr] = useState<'gcash' | 'rcbc' | null>(null);

  // Close lightbox if Escape is pressed
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedQr(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleDownload = (type: 'gcash' | 'rcbc') => {
    const link = document.createElement('a');
    link.href = type === 'gcash' ? '/gcash.jpg' : '/rcbc.jpg';
    link.download = `kaizen-${type}-qr.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Support Development">
         <div className="space-y-6">
            
            {/* Offline Warning */}
            {!isOnline && (
               <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="p-1.5 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                     <WifiOff size={16} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-red-700 dark:text-red-300">Offline Mode</p>
                     <p className="text-[10px] text-red-600 dark:text-red-400">Transaction apps may require an internet connection.</p>
                  </div>
               </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
              <p className="text-center text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                "Optional developer support ✨ In-kind contributions are greatly appreciated 🤍"
              </p>
            </div>

            <div className={`grid grid-cols-2 gap-4 ${!isOnline ? 'opacity-90' : ''}`}>
               {/* GCash Card */}
               <button 
                  onClick={() => setExpandedQr('gcash')}
                  className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-transparent hover:border-blue-500/30 dark:hover:border-blue-400/50 shadow-sm hover:shadow-xl transition-all duration-300 text-left overflow-hidden w-full"
               >
                  <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex items-center justify-between mb-3">
                     <span className="font-bold text-blue-600 dark:text-blue-400 text-sm tracking-wide">GCASH</span>
                     <Maximize2 size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110" />
                  </div>
                  
                  <div className="relative z-10 bg-white p-2 rounded-xl shadow-inner aspect-square flex items-center justify-center">
                     <img src="/gcash.jpg" alt="GCash QR" className="w-full h-full object-contain" />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center">
                        <span className="bg-white/90 text-xs font-bold px-2 py-1 rounded-full shadow opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-slate-700">
                           Click to Enlarge
                        </span>
                     </div>
                  </div>
               </button>

               {/* RCBC Card */}
               <button 
                  onClick={() => setExpandedQr('rcbc')}
                  className="group relative bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-transparent hover:border-yellow-500/30 dark:hover:border-yellow-400/50 shadow-sm hover:shadow-xl transition-all duration-300 text-left overflow-hidden w-full"
               >
                  <div className="absolute inset-0 bg-yellow-50/50 dark:bg-yellow-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 flex items-center justify-between mb-3">
                     <span className="font-bold text-yellow-600 dark:text-yellow-500 text-sm tracking-wide">RCBC</span>
                     <Maximize2 size={16} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110" />
                  </div>
                  
                  <div className="relative z-10 bg-white p-2 rounded-xl shadow-inner aspect-square flex items-center justify-center">
                     <img src="/rcbc.jpg" alt="RCBC QR" className="w-full h-full object-contain" />
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl flex items-center justify-center">
                        <span className="bg-white/90 text-xs font-bold px-2 py-1 rounded-full shadow opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-slate-700">
                           Click to Enlarge
                        </span>
                     </div>
                  </div>
               </button>
            </div>
            
            <div className="flex justify-center text-slate-400 gap-2 text-xs items-center">
              <ScanLine size={14} />
              <span>Tap any QR code to expand and scan</span>
            </div>
         </div>
      </Modal>

      {/* Lightbox Overlay using Portal */}
      {expandedQr && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setExpandedQr(null)}
        >
          {/* Main Card Container */}
          <div 
            className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 relative border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()} 
          >
             {/* Header with Title and Close Button */}
             <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex flex-col">
                  <h3 className={`text-lg font-bold tracking-tight leading-none ${expandedQr === 'gcash' ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-500'}`}>
                    {expandedQr === 'gcash' ? 'GCash' : 'RCBC'}
                  </h3>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">Scan to send support</span>
                </div>
                
                <button 
                  onClick={() => setExpandedQr(null)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
             </div>
             
             {/* QR Image - Minimal padding/border */}
             <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 w-full">
               <img 
                 src={expandedQr === 'gcash' ? '/gcash.jpg' : '/rcbc.jpg'} 
                 alt="Enlarged QR" 
                 className="w-full h-auto object-contain block" // block removes bottom gap
               />
             </div>

             {/* Action Buttons */}
             <div className="grid grid-cols-2 gap-2 mt-3">
               <button 
                 onClick={() => handleDownload(expandedQr)}
                 className="flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-sm"
               >
                 <Download size={16} /> Save QR
               </button>
               <button 
                 onClick={() => setExpandedQr(null)}
                 className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
               >
                 Close
               </button>
             </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const FeedbackModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; isOnline: boolean }> = ({ isOpen, onClose, user, isOnline }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'suggestion' | 'bug' | 'other'>('suggestion');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!isOnline) {
      alert("Please connect to the internet to send feedback.");
      return;
    }
    if(!message.trim()) return;
    setSending(true);
    try {
      const feedbackData = {
        userId: user.id,
        userName: user.firstName + ' ' + user.lastName,
        message,
        type,
        date: new Date().toISOString()
      };
      await uploadFeedback(feedbackData, user.id);
      setMessage('');
      onClose();
      alert("Feedback sent! Thank you.");
    } catch (error) {
      console.error(error);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Feedback">
       <div className="space-y-4">
          
          {/* Offline Warning */}
          {!isOnline && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-xl flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
               <WifiOff size={18} />
               <span>You must be online to submit feedback.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Type</label>
            <div className="flex gap-2">
               {['suggestion', 'bug', 'other'].map(t => (
                 <button key={t} onClick={() => setType(t as any)} className={`px-3 py-1.5 rounded-lg border capitalize text-sm ${type === t ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>
                   {t}
                 </button>
               ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Message</label>
            <textarea 
              className="w-full p-3 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white h-32" 
              placeholder="Tell us what you think..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={sending || !isOnline}
            className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Submit Feedback'}
          </button>
       </div>
    </Modal>
  );
};

/* --- MAIN APP WRAPPER --- */
const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [isDark, setIsDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize Theme and Background on Mount
  useEffect(() => {
    const prefTheme = state.currentUser?.preferences.theme;
    
    // Check Dark Mode
    if (prefTheme === 'dark' || (!state.currentUser && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Update Body Background Class and Dark Mode whenever dependencies change
  useEffect(() => {
    // Apply Dark Mode Class
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply Background Class
    const bgKey = state.currentUser?.preferences.background || 'default';
    // @ts-ignore
    const bgClass = APP_BACKGROUNDS[bgKey]?.className || APP_BACKGROUNDS.default.className;
    
    document.body.className = `transition-colors duration-500 text-slate-900 dark:text-slate-100 ${bgClass}`;

  }, [isDark, state.currentUser?.preferences.background]);

  // Sync State to Storage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Clock & Online Status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Toggle Theme Light/Dark
  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (state.currentUser) {
      updateUserPrefs({ theme: newMode ? 'dark' : 'light' });
    }
  };

  const updateUserPrefs = (newPrefs: Partial<User['preferences']>) => {
    if (!state.currentUser) return;
    setState(prev => ({
      ...prev,
      currentUser: { 
        ...prev.currentUser!, 
        preferences: { ...prev.currentUser!.preferences, ...newPrefs }
      }
    }));
  };

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, currentUser: user }));
    if(user.preferences.theme === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  };
  
  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    document.body.className = `transition-colors duration-500 text-slate-900 dark:text-slate-100 ${APP_BACKGROUNDS.default.className}`;
  };

  const t = (key: string): string => {
    const lang = state.currentUser?.preferences.language || 'en';
    // @ts-ignore
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en'][key] || key;
  };

  const currentColorTheme = state.currentUser?.preferences.colorTheme || 'blue';

  return (
    <HashRouter>
      <BackgroundEffects themeKey={state.currentUser?.preferences.background || 'default'} />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={!state.currentUser ? <AuthPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes */}
        <Route element={state.currentUser ? 
            <Layout 
              user={state.currentUser} 
              onLogout={handleLogout} 
              toggleTheme={toggleTheme} 
              isDark={isDark} 
            /> : <Navigate to="/auth" />}
        >
          <Route path="/dashboard" element={
            <>
              {/* Header Controls */}
              <div className="absolute top-4 right-4 z-50 md:right-8 flex items-center gap-3">
                 <div className="hidden md:flex flex-col items-end text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-400'}`}></div>
                      <span className={isOnline ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                         {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                       {format(currentTime, 'EEE, MMM dd • h:mm a')}
                    </span>
                 </div>

                 <div className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/50 dark:bg-slate-800/50 shadow border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`} />
                 </div>

                 {/* Storage Button */}
                 <button 
                    onClick={() => setShowStorage(true)} 
                    className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition backdrop-blur-sm"
                    title="Storage Manager"
                 >
                    <HardDrive size={20} />
                 </button>

                 {/* Donate / Support Button */}
                 <button 
                    onClick={() => setShowDonate(true)} 
                    className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-700 transition backdrop-blur-sm group"
                    title="Support Development"
                 >
                    <Heart size={20} className="fill-current group-hover:scale-110 transition-transform" />
                 </button>

                 {/* Feedback Button */}
                 <button onClick={() => setShowFeedback(true)} className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition backdrop-blur-sm">
                    <MessageSquare size={20} />
                 </button>

                 {/* Settings Button */}
                 <button onClick={() => setShowSettings(true)} className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-full shadow border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition backdrop-blur-sm">
                    <Settings size={20} />
                 </button>
              </div>

              <Dashboard 
                user={state.currentUser!} 
                cards={state.cards} 
                updateCards={(cards) => setState(p => ({...p, cards}))}
                reminders={state.reminders}
                updateReminders={(reminders) => setState(p => ({...p, reminders}))}
                transactions={state.transactions}
                links={state.links}
                habits={state.habits}
                updateHabits={(habits) => setState(p => ({...p, habits}))}
                adminSettings={state.adminSettings}
                colorTheme={currentColorTheme}
                t={t}
              />
            </>
          } />
          <Route path="/vault" element={
            <Vault links={state.links} setLinks={(links) => setState(p => ({...p, links}))} colorTheme={currentColorTheme} t={t} />
          } />
          <Route path="/budget" element={
            <Budget 
              transactions={state.transactions} 
              setTransactions={(t) => setState(p => ({...p, transactions: t}))}
              currency={state.currentUser?.preferences.currency || 'PHP'}
              updateCurrency={(c) => updateUserPrefs({ currency: c as User['preferences']['currency'] })}
              colorTheme={currentColorTheme}
              t={t}
            />
          } />
          <Route path="/tools" element={<AITools />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            state.currentUser?.isAdmin ? 
            <Admin settings={state.adminSettings} updateSettings={(s) => setState(p => ({...p, adminSettings: s}))} /> 
            : <Navigate to="/dashboard" />
          } />
          <Route path="/guide" element={
             state.currentUser?.isAdmin ? <Guide /> : <Navigate to="/dashboard" />
          } />
        </Route>
      </Routes>

      {/* Settings Modal */}
      {state.currentUser && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={t('settings')}>
           <div className="space-y-6">
             {/* Theme Color */}
             <div>
               <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <Palette size={16} /> {t('theme')}
               </label>
               <div className="flex gap-3">
                 {['blue', 'purple', 'green', 'orange'].map(color => (
                   <button 
                     key={color}
                     onClick={() => updateUserPrefs({ colorTheme: color as any })}
                     className={`w-8 h-8 rounded-full bg-${color}-500 ${state.currentUser?.preferences.colorTheme === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                   />
                 ))}
               </div>
             </div>

             {/* Background Selection */}
             <div>
               <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <Image size={16} /> {t('background')}
               </label>
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {Object.entries(APP_BACKGROUNDS).map(([key, bg]) => (
                   <button 
                     key={key}
                     // @ts-ignore
                     onClick={() => updateUserPrefs({ background: key })}
                     className={`relative h-16 rounded-lg overflow-hidden border transition-all ${state.currentUser?.preferences.background === key ? `border-${currentColorTheme}-500 ring-2 ring-${currentColorTheme}-200` : 'border-slate-200 dark:border-slate-700'}`}
                   >
                     <div className={`absolute inset-0 ${bg.className}`}></div>
                     <span className="absolute bottom-1 left-2 text-xs font-bold text-slate-800 dark:text-white bg-white/40 dark:bg-black/40 px-1 rounded backdrop-blur-sm">
                       {bg.label}
                     </span>
                   </button>
                 ))}
               </div>
             </div>

             {/* Language */}
             <div>
               <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                 <Globe size={16} /> {t('language')}
               </label>
               <select 
                  className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  value={state.currentUser.preferences.language}
                  onChange={(e) => updateUserPrefs({ language: e.target.value as any })}
               >
                 <option value="en">English</option>
                 <option value="fil">Tagalog / Filipino</option>
                 <option value="ceb">Cebuano / Bisaya</option>
               </select>
             </div>
           </div>
        </Modal>
      )}

      {/* Donation/Support Modal - UPDATED with isOnline prop */}
      {state.currentUser && (
        <DonateModal 
          isOpen={showDonate} 
          onClose={() => setShowDonate(false)} 
          settings={state.adminSettings} 
          isOnline={isOnline}
        />
      )}

      {/* Feedback Modal */}
      {state.currentUser && (
        <FeedbackModal 
          isOpen={showFeedback} 
          onClose={() => setShowFeedback(false)} 
          user={state.currentUser} 
          isOnline={isOnline}
        />
      )}

      {/* Storage Manager Modal */}
      <Modal isOpen={showStorage} onClose={() => setShowStorage(false)} title="Local Storage Inspector">
         <StorageManager />
      </Modal>
    </HashRouter>
  );
};

export default App;
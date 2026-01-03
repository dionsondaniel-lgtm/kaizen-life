import React, { useState, useEffect } from 'react';
import { WifiOff, Lock, User as UserIcon, Mail } from 'lucide-react';
import { User } from '../types';
import { formatPascalCase } from '../services/storage';
// Ensure checkUserExists is exported from your service to avoid full download
import { uploadUserBackup, checkUserExists } from '../services/supabase'; 
import Modal from '../components/Modal';

interface AuthPageProps {
  onLogin: (u: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', password: '' });
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Helper: Format filename to "dionsondaniel_gmail_com"
  const getFormattedFilename = (email: string) => {
    return email.toLowerCase().replace(/[@.]/g, '_');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && isOffline) {
      alert("You must be online to create a new account.");
      return;
    }

    // --- LOGIN LOGIC (Guest / Admin) ---
    if (isLogin) {
      // 1. ADMIN CHECK
      if(formData.email === 'admin@kaizen.com') {
         if (formData.password !== '2025') {
            alert("Invalid admin password.");
            return;
         }
         onLogin({
           id: 'admin', firstName: 'Admin', lastName: 'User', email: formData.email, isAdmin: true, 
           preferences: { theme: 'light', colorTheme: 'blue', currency: 'PHP', language: 'en', background: 'default' }
         });
         return;
      }

      // 2. GUEST USER (Local Only - Do not upload to Supabase)
      // Note: Real authentication would verify the password here. 
      // For this logic, we allow entry locally as requested.
      onLogin({
        id: 'user-1',
        firstName: 'Guest',
        lastName: 'User',
        email: formData.email,
        isAdmin: false,
        preferences: { theme: 'light', colorTheme: 'blue', currency: 'PHP', language: 'en', background: 'default' }
      });

    } else {
      // --- CREATE ACCOUNT LOGIC ---
      
      // 1. Validate Password (4 digits)
      if (!/^\d{4}$/.test(formData.password)) {
        alert("Password must be a 4-digit number.");
        return;
      }

      setIsSubmitting(true);
      try {
        const filenameKey = getFormattedFilename(formData.email);

        // 2. Check existence WITHOUT downloading the full file
        // We use checkUserExists to see if the filename is already taken
        const alreadyExists = await checkUserExists(filenameKey);
        
        if (alreadyExists) {
          alert("You already have an account. Please sign in.");
          setIsLogin(true); // Switch to login view
          setFormData(prev => ({ ...prev, password: '' }));
          setIsSubmitting(false);
          return;
        }

        // 3. Prepare User Object
        const newUser: User = {
          id: Date.now().toString(),
          firstName: formatPascalCase(formData.firstName),
          lastName: formatPascalCase(formData.lastName),
          email: formData.email,
          isAdmin: false,
          preferences: { theme: 'light', colorTheme: 'blue', currency: 'PHP', language: 'en', background: 'default' }
        };
        
        // 4. Construct JSON Content (Include Password)
        // Format: {"currentUser": { ...newUser, password: "..." }, ...}
        const backupContent = { 
          currentUser: {
            ...newUser,
            password: formData.password 
          }, 
          cards: [], 
          links: [], 
          transactions: [], 
          reminders: [] 
        };

        const initialBlob = new Blob([JSON.stringify(backupContent)], { type: 'application/json' });
        // Although the ID is the key, we create a file object if needed by the upload function
        const initialFile = new File([initialBlob], `${filenameKey}.json`, { type: 'application/json' });

        try {
           // Upload with the specific filename format "dionsondaniel_gmail_com"
           await uploadUserBackup(initialFile, filenameKey);
        } catch (err) {
           console.warn("Cloud backup failed during signup:", err);
           // Proceeding to login even if upload fails (Local First philosophy)
        }

        onLogin(newUser);
      } catch (error) {
        console.error("Signup error:", error);
        alert("An error occurred during sign up.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative z-10">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-scale-in">
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          {isLogin ? 'Welcome Back' : 'Join Kaizen'}
        </h2>
        <p className="text-center text-slate-500 mb-6">Continuous improvement starts here.</p>
        
        {!isLogin && isOffline && (
           <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
             <WifiOff size={16} /> You must be online to sign up.
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input 
                  required placeholder="First Name" 
                  className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
              </div>
              <div className="relative">
                <input 
                  required placeholder="Last Name" 
                  className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div className="relative">
            <input 
              required type="email" placeholder="Email Address" 
              className="w-full p-3 pl-10 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
          </div>

          <div className="relative">
            <input 
              required 
              type="password" 
              placeholder={isLogin ? "Password" : "Create 4-digit PIN"}
              inputMode={!isLogin ? "numeric" : "text"}
              maxLength={!isLogin ? 4 : undefined}
              className="w-full p-3 pl-10 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
          </div>

          <button 
            disabled={(!isLogin && isOffline) || isSubmitting}
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/30"
          >
            {isSubmitting ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { 
              setIsLogin(!isLogin); 
              setFormData({ email: '', firstName: '', lastName: '', password: '' }); 
            }} 
            className="text-brand-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
        
        <div className="mt-6 text-xs text-center text-slate-400 space-x-2">
          <span>By continuing, you agree to our</span>
          <button onClick={() => setModalType('terms')} className="underline hover:text-brand-500">Terms</button>
          <span>and</span>
          <button onClick={() => setModalType('privacy')} className="underline hover:text-brand-500">Privacy</button>
        </div>
      </div>

      <Modal isOpen={modalType === 'terms'} onClose={() => setModalType(null)} title="Terms of Service">
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">1. Local-First Architecture</h4>
            <p>Kaizen Life operates on a "Local-First" basis. All your personal data is stored locally. Cloud backups are optional.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'privacy'} onClose={() => setModalType(null)} title="Privacy Policy">
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">1. Data Storage</h4>
            <p>We do not track your daily activities or financial data. Everything stays on your device.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AuthPage;
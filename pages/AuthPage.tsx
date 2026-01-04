import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WifiOff, Lock, User as UserIcon, Mail, HelpCircle, Wifi, ArrowLeft } from 'lucide-react';
import { User } from '../types';
import { formatPascalCase } from '../services/storage';
// Ensure checkUserExists is exported from your service
import { uploadUserBackup, checkUserExists } from '../services/supabase'; 
import Modal from '../components/Modal';

interface AuthPageProps {
  onLogin: (u: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', password: '' });
  
  // Modal States
  const [modalType, setModalType] = useState<'terms' | 'privacy' | 'recovery' | null>(null);
  const [recoveryData, setRecoveryData] = useState({ email: '', firstName: '', lastName: '' });

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

  // Helper: Format filename/key
  const getFormattedKey = (email: string) => {
    return `kaizen_auth_${email.toLowerCase().replace(/[@.]/g, '_')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // --- LOGIN LOGIC (Works Offline) ---
    if (isLogin) {
      // 1. ADMIN CHECK (Bypass Local Storage)
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

      // 2. LOCAL USER CHECK (Local Storage Only)
      const localKey = getFormattedKey(formData.email);
      const storedDataString = localStorage.getItem(localKey);

      if (!storedDataString) {
        if (isOffline) {
          alert("No local account found. You need internet to Sign Up first.");
        } else {
          alert("Account not found on this device. Please Sign Up.");
        }
        return;
      }

      try {
        const storedData = JSON.parse(storedDataString);
        
        // Verify Password against Local Storage
        if (storedData.password === formData.password) {
          // Success: Log in using the stored user object
          const { password, ...userObject } = storedData;
          onLogin(userObject);
        } else {
          alert("Incorrect Password.");
        }
      } catch (err) {
        console.error("Local auth error", err);
        alert("Error reading local account data.");
      }

    } else {
      // --- SIGN UP LOGIC (Requires Internet) ---
      
      if (isOffline) {
        alert("You must be online to create a new account.");
        return;
      }

      // 1. Validate Password (4 digits)
      if (!/^\d{4}$/.test(formData.password)) {
        alert("Password must be a 4-digit number.");
        return;
      }

      setIsSubmitting(true);
      try {
        const fileKey = formData.email.toLowerCase().replace(/[@.]/g, '_'); // Key for Supabase
        const localKey = getFormattedKey(formData.email); // Key for Local Storage

        // 2. Check existence in Supabase
        const alreadyExists = await checkUserExists(fileKey);
        if (alreadyExists) {
          alert("This email is already registered in the cloud. Please sign in.");
          setIsLogin(true);
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
        
        // 4. Construct JSON Content
        const backupContent = { 
          currentUser: { ...newUser, password: formData.password }, 
          cards: [], links: [], transactions: [], reminders: [] 
        };

        // 5. Upload to Supabase (One-time backup)
        const initialBlob = new Blob([JSON.stringify(backupContent)], { type: 'application/json' });
        const initialFile = new File([initialBlob], `${fileKey}.json`, { type: 'application/json' });

        try {
           await uploadUserBackup(initialFile, fileKey);
        } catch (err) {
           console.warn("Cloud backup failed during signup:", err);
        }

        // 6. SAVE TO LOCAL STORAGE
        localStorage.setItem(localKey, JSON.stringify({
          ...newUser,
          password: formData.password
        }));

        onLogin(newUser);
      } catch (error) {
        console.error("Signup error:", error);
        alert("An error occurred during sign up.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // --- PASSWORD RECOVERY LOGIC ---
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const localKey = getFormattedKey(recoveryData.email);
    const storedDataString = localStorage.getItem(localKey);

    if (!storedDataString) {
      alert("No account found locally with this email.");
      return;
    }

    try {
      const storedData = JSON.parse(storedDataString);
      
      const inputFirst = recoveryData.firstName.trim().toLowerCase();
      const inputLast = recoveryData.lastName.trim().toLowerCase();
      const storedFirst = storedData.firstName.toLowerCase();
      const storedLast = storedData.lastName.toLowerCase();

      if (inputFirst === storedFirst && inputLast === storedLast) {
        alert(`Verification Successful!\n\nYour Password is: ${storedData.password}`);
        setModalType(null);
        setIsLogin(true);
        setFormData({ ...formData, email: recoveryData.email, password: storedData.password });
      } else {
        alert("Identity verification failed. Name does not match records.");
      }
    } catch (err) {
      alert("Error reading local data.");
    }
  };

  const openRecoveryModal = () => {
    setRecoveryData({ 
      email: formData.email, 
      firstName: '', 
      lastName: '' 
    });
    setModalType('recovery');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 relative z-10">
      
      {/* --- NEW: Back to Home Link --- */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors flex items-center gap-2 font-medium z-20"
      >
        <ArrowLeft size={20} />
        <span className="hidden sm:inline">Back to Home</span>
      </Link>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-scale-in relative">
        <h2 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
          {isLogin ? 'Welcome Back' : 'Join Kaizen'}
        </h2>
        <p className="text-center text-slate-500 mb-6">Continuous improvement starts here.</p>
        
        {/* Offline Status Indicator */}
        {isOffline ? (
           <div className={`border px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2 ${isLogin ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
             <WifiOff size={16} /> 
             {isLogin 
               ? "Offline Mode: Logging in using local data." 
               : "You must be online to sign up."}
           </div>
        ) : (
          <div className="flex justify-center mb-4">
             <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
               <Wifi size={12} /> Online
             </span>
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
              className="w-full p-3 pl-10 pr-10 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
            
            {/* Forgot Password Icon */}
            {isLogin && (
              <button 
                type="button"
                onClick={openRecoveryModal}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-brand-500 transition-colors"
                title="Forgot Password?"
              >
                <HelpCircle size={18} />
              </button>
            )}
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

      {/* --- MODALS --- */}
      
      {/* Recovery Modal */}
      <Modal isOpen={modalType === 'recovery'} onClose={() => setModalType(null)} title="Recover Password">
        <form onSubmit={handleRecoverySubmit} className="space-y-4 mt-2">
          <p className="text-sm text-slate-500 mb-4">
             {isOffline 
               ? "Offline Mode: Verifying against local data." 
               : "Verify your identity using your locally saved details to reveal your password."}
          </p>
          
          <div className="space-y-3">
            <input 
              required type="email" placeholder="Email Address"
              className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              value={recoveryData.email}
              onChange={e => setRecoveryData({...recoveryData, email: e.target.value})}
            />
            <input 
              required placeholder="First Name"
              className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              value={recoveryData.firstName}
              onChange={e => setRecoveryData({...recoveryData, firstName: e.target.value})}
            />
            <input 
              required placeholder="Last Name"
              className="w-full p-3 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              value={recoveryData.lastName}
              onChange={e => setRecoveryData({...recoveryData, lastName: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 mt-4"
          >
            Verify & Reveal
          </button>
        </form>
      </Modal>

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
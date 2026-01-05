import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, Wallet, Link as LinkIcon, Heart, Scan,
  Clock, CheckCircle2, Circle, DollarSign, Settings, Download, Share, Smartphone, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { User, QuickCard, Reminder, Transaction, LinkItem, Habit } from '../types';
import { getCurrencySymbol } from '../services/storage';
import { HabitTracker } from '../components/HabitTracker';
import Modal from '../components/Modal';

interface DashboardProps {
  user: User;
  cards: QuickCard[];
  updateCards: (cards: QuickCard[]) => void;
  reminders: Reminder[];
  updateReminders: (reminders: Reminder[]) => void;
  transactions: Transaction[];
  links: LinkItem[];
  habits: Habit[];
  updateHabits: (habits: Habit[]) => void;
  adminSettings: any;
  colorTheme: string;
  t: (key: string) => string;
}

// Internal component to handle individual card state (image loading)
const QuickAccessCard: React.FC<{ card: QuickCard; isEditing: boolean; onRemove: (id: string) => void }> = ({ card, isEditing, onRemove }) => {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${card.url}&sz=128`;

  return (
    <div className="relative group">
      <a
        href={card.url}
        target="_blank"
        rel="noreferrer"
        className={`block aspect-square rounded-3xl ${card.color} shadow-lg hover:shadow-2xl hover:shadow-${card.color.replace('bg-', '')}/40 transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-105 flex flex-col items-center justify-center relative overflow-hidden`}
      >
        {/* Glossy Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-2 w-full px-2">
          {/* Container for Icon or Letter */}
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl shadow-md bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
            {!imgError ? (
              <img
                src={faviconUrl}
                alt={card.title}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className={`text-2xl font-black text-${card.color.split('-')[1]}-600 uppercase select-none`}>
                {card.title.charAt(0)}
              </span>
            )}
          </div>

          <div className="text-[10px] md:text-xs font-bold text-white truncate w-full text-center px-2 py-0.5 bg-black/20 rounded-full backdrop-blur-sm">
            {card.title}
          </div>
        </div>

        {/* External Link Indicator */}
        <ExternalLink size={12} className="absolute top-3 right-3 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>

      {isEditing && (
        <button
          onClick={() => onRemove(card.id)}
          className="absolute -top-2 -right-2 z-20 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 animate-bounce-small"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({
  user, cards, updateCards, reminders, updateReminders,
  transactions, links, habits, updateHabits, adminSettings, colorTheme, t
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', url: '', color: `bg-${colorTheme}-500` });
  const [newReminder, setNewReminder] = useState('');
  const [modalType, setModalType] = useState<'terms' | 'privacy' | 'support' | 'qr_gcash' | 'qr_rcbc' | 'install' | null>(null);

  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500',
    'bg-orange-500', 'bg-teal-500', 'bg-slate-700', 'bg-indigo-600'
  ];

  const currencySymbol = getCurrencySymbol(user.preferences.currency);

  const balance = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  }, [transactions]);

  const recentLinks = useMemo(() => links.slice(0, 3), [links]);

  const handleAddCard = () => {
    if (!newCard.title || !newCard.url) return;
    const card: QuickCard = { ...newCard, id: Date.now().toString() };
    updateCards([...cards, card]);
    setNewCard({ title: '', url: '', color: `bg-${colorTheme}-500` });
    setIsEditing(false);
  };

  const removeCard = (id: string) => {
    updateCards(cards.filter(c => c.id !== id));
  };

  const addReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    const item: Reminder = {
      id: Date.now().toString(),
      title: newReminder,
      date: new Date().toISOString(),
      completed: false
    };
    updateReminders([item, ...reminders]);
    setNewReminder('');
  };

  const toggleReminder = (id: string) => {
    updateReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id: string) => {
    updateReminders(reminders.filter(r => r.id !== id));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  // Helper to get favicon
  const getFavicon = (url: string) => `https://www.google.com/s2/favicons?domain=${url}&sz=128`;

  const tickerText = (
    <div className="flex items-center gap-4 px-4 text-sm md:text-base font-bold tracking-wide">
      <span className="animate-pulse text-yellow-300">Support the Developer</span>
      <span className="opacity-80 font-normal">— Optional donations keep Kaizen free for everyone!</span>
      <span className="flex items-center gap-1 text-pink-300"><Heart size={16} className="fill-pink-300 animate-bounce" /> GCash & RCBC available</span>
      <span className="mx-8 opacity-30">|</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative min-h-[85vh]">
      <header className="flex justify-between items-start relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {getGreeting()}, {user.firstName}!
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Ready to improve today? #Kaizen</p>
        </div>
      </header>

      {/* Hero Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        <div className={`col-span-1 p-6 rounded-2xl bg-gradient-to-br from-${colorTheme}-500 to-${colorTheme}-700 text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-shadow duration-300`}>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Wallet size={18} />
              <span className="text-sm font-medium">{t('totalBalance')}</span>
            </div>
            <h2 className="text-3xl font-bold">{currencySymbol}{balance.toLocaleString()}</h2>
            <div className="mt-4 flex gap-2">
              <Link to="/budget" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition backdrop-blur-sm font-medium border border-white/10">View Budget</Link>
            </div>
          </div>
          <DollarSign className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
        </div>

        <div className="col-span-1 md:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <LinkIcon size={18} className={`text-${colorTheme}-500`} /> Recent Saves
            </h3>
            <Link to="/vault" className={`text-xs text-${colorTheme}-600 font-medium hover:underline`}>View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentLinks.length > 0 ? recentLinks.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition group border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                <img src={getFavicon(l.url)} alt="" className="w-8 h-8 rounded-lg bg-white p-0.5 shadow-sm" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-400 mb-0.5">{l.category}</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate text-sm">{l.title || 'Untitled'}</span>
                </div>
              </a>
            )) : (
              <div className="col-span-3 text-center text-sm text-slate-400 py-2">No links saved yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Atomic Habits Section */}
      <section className="relative z-10">
        <HabitTracker habits={habits} onUpdateHabits={updateHabits} colorTheme={colorTheme} />
      </section>

      {/* Quick Access Grid */}
      <section className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{t('quickAccess')}</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-sm text-${colorTheme}-600 font-medium hover:underline bg-${colorTheme}-50 dark:bg-${colorTheme}-900/20 px-3 py-1 rounded-full transition`}
          >
            {isEditing ? t('done') : t('customize')}
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {cards.map((card) => (
            <QuickAccessCard
              key={card.id}
              card={card}
              isEditing={isEditing}
              onRemove={removeCard}
            />
          ))}

          {isEditing && (
            <div className="col-span-1 md:col-span-2 aspect-[2/1] md:aspect-auto rounded-3xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4">
              <div className="w-full space-y-2">
                <input
                  className="w-full text-xs p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500"
                  placeholder="App Name"
                  value={newCard.title}
                  onChange={e => setNewCard({ ...newCard, title: e.target.value })}
                />
                <input
                  className="w-full text-xs p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 dark:text-white focus:ring-1 focus:ring-blue-500"
                  placeholder="https://..."
                  value={newCard.url}
                  onChange={e => setNewCard({ ...newCard, url: e.target.value })}
                />
                <div className="flex gap-1 justify-center py-1 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewCard({ ...newCard, color: c })}
                      className={`w-4 h-4 rounded-full ${c} ${newCard.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    />
                  ))}
                </div>
                <button onClick={handleAddCard} className={`w-full bg-${colorTheme}-500 text-white rounded-lg p-1.5 text-xs font-bold shadow hover:bg-${colorTheme}-600 transition`}>Add Shortcut</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reminders Section */}
      <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Clock className={`text-${colorTheme}-500`} />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{t('dailyReminders')}</h2>
        </div>

        <form onSubmit={addReminder} className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder={t('addTask')}
            className={`flex-1 p-3 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-${colorTheme}-500 outline-none transition-all`}
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
          />
          <button type="submit" className={`bg-${colorTheme}-600 text-white px-4 rounded-xl hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/20 transition-all active:scale-95`}>
            <Plus />
          </button>
        </form>

        <div className="space-y-2">
          {reminders.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No tasks yet. Stay productive!</p>}
          {reminders.map(r => (
            <div key={r.id} className="flex items-center gap-3 group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <button onClick={() => toggleReminder(r.id)} className={`transition-colors transform active:scale-90 ${r.completed ? 'text-green-500' : `text-slate-300 hover:text-${colorTheme}-500`}`}>
                {r.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
              </button>
              <span className={`flex-1 text-slate-700 dark:text-slate-300 transition-all ${r.completed ? 'line-through text-slate-400' : ''}`}>
                {r.title}
              </span>
              <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Support Ticker - Modern Gradient */}
      {(adminSettings.gcashQr || adminSettings.rcbcQr) && (
        <div
          className="fixed bottom-0 left-0 right-0 md:left-64 z-30 bg-gradient-to-r from-violet-900 via-indigo-900 to-blue-900 text-white py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] cursor-pointer hover:brightness-110 transition-all border-t border-white/10 backdrop-blur-xl"
          onClick={() => setModalType('support')}
        >
          <div className="overflow-hidden flex">
            <div className="animate-marquee whitespace-nowrap flex items-center">
              {tickerText}
              {tickerText}
              {tickerText}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-slate-400 mt-12 pb-16 relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
        <div className="space-x-4">
          <button onClick={() => setModalType('terms')} className="hover:text-slate-600 dark:hover:text-slate-200 hover:underline">{t('terms')}</button>
          <span>•</span>
          <button onClick={() => setModalType('privacy')} className="hover:text-slate-600 dark:hover:text-slate-200 hover:underline">{t('privacy')}</button>
        </div>
        <button
          onClick={() => setModalType('install')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          <Download size={14} /> Install App
        </button>
      </footer>

      {/* Modals */}
      <Modal isOpen={modalType === 'support'} onClose={() => setModalType(null)} title="Support the Developer">
        <div className="space-y-6 text-center py-4">
          <p className="text-slate-600 dark:text-slate-300">{adminSettings.donationMessage}</p>
          <div className="grid grid-cols-2 gap-4">
            {adminSettings.gcashQr && (
              <button onClick={() => setModalType('qr_gcash')} className="flex flex-col items-center justify-center p-6 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition shadow-lg transform hover:scale-105">
                <Scan size={32} className="mb-2" />
                <span className="font-bold">GCash</span>
              </button>
            )}
            {adminSettings.rcbcQr && (
              <button onClick={() => setModalType('qr_rcbc')} className="flex flex-col items-center justify-center p-6 bg-yellow-500 text-white rounded-2xl hover:bg-yellow-600 transition shadow-lg transform hover:scale-105">
                <Scan size={32} className="mb-2" />
                <span className="font-bold">RCBC</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-4">Thank you for your generosity! Your support helps keep this app free.</p>
        </div>
      </Modal>

      {/* QR Modals */}
      <Modal isOpen={modalType === 'qr_gcash'} onClose={() => setModalType('support')} title="Scan GCash QR">
        <div className="flex flex-col items-center justify-center p-4">
          <img src={adminSettings.gcashQr} alt="GCash QR" className="w-full max-w-sm rounded-xl shadow-lg border-4 border-blue-500" />
          <p className="mt-4 font-bold text-lg text-slate-800 dark:text-white">GCash</p>
          <button onClick={() => setModalType('support')} className="mt-6 text-slate-500 hover:underline">Back to Options</button>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'qr_rcbc'} onClose={() => setModalType('support')} title="Scan RCBC QR">
        <div className="flex flex-col items-center justify-center p-4">
          <img src={adminSettings.rcbcQr} alt="RCBC QR" className="w-full max-w-sm rounded-xl shadow-lg border-4 border-yellow-500" />
          <p className="mt-4 font-bold text-lg text-slate-800 dark:text-white">RCBC</p>
          <button onClick={() => setModalType('support')} className="mt-6 text-slate-500 hover:underline">Back to Options</button>
        </div>
      </Modal>

      {/* Install App Modal */}
      <Modal isOpen={modalType === 'install'} onClose={() => setModalType(null)} title="Install Kaizen Life">
        <div className="space-y-6 p-2">
          <div className="flex flex-col items-center text-center">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4 text-blue-600">
              <Smartphone size={32} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Add Kaizen to your home screen for quick access and full-screen experience.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold mb-2 flex items-center gap-2 dark:text-white"><Share size={16} /> iOS (iPhone/iPad)</h4>
            <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Tap the <strong>Share</strong> button in Safari's menu bar.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold mb-2 flex items-center gap-2 dark:text-white"><Settings size={16} /> Android (Chrome)</h4>
            <ol className="list-decimal pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>Tap the <strong>Three Dots</strong> menu in the browser.</li>
              <li>Tap <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
              <li>Confirm by tapping <strong>Add</strong>.</li>
            </ol>
          </div>
        </div>
      </Modal>

      {/* Legal Modals */}
      <Modal isOpen={modalType === 'terms'} onClose={() => setModalType(null)} title={t('terms')}>
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <p><strong>Effective Date:</strong> January 4, 2026</p>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">1. Local-First Architecture</h4>
            <p>Kaizen Life operates on a "Local-First" basis. All your personal data (budget, links, habits) is stored on your device's local storage. You are solely responsible for your data.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">2. AI Features</h4>
            <p>This app uses Google Gemini AI. By using the AI Tools, you acknowledge that your prompts are sent to Google for processing. Do not share sensitive personal information (PII) in AI chats.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">3. Donations & Usage</h4>
            <p>This application is free to use. Donations via QR codes are completely voluntary and non-refundable gifts to support the developer. No features are paywalled.</p>
          </div>
        </div>
      </Modal>

      <Modal isOpen={modalType === 'privacy'} onClose={() => setModalType(null)} title={t('privacy')}>
        <div className="space-y-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">1. Data Storage</h4>
            <p>We do not track your daily activities. Your financial records and habits live in your browser's <code>localStorage</code>. Clearing your browser cache will erase your data.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">2. Third-Party Services</h4>
            <p>We use Supabase solely for anonymous user counting and feedback form submissions. We use Google Gemini for AI responses. Please review Google's Privacy Policy regarding AI interactions.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
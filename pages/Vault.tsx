import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, X, WifiOff, Smartphone, Globe, Grid, MessageCircle, Music, MapPin, Camera, DollarSign, Phone } from 'lucide-react';
import { LinkItem } from '../types';
import Modal from '../components/Modal';

interface VaultProps {
  links: LinkItem[];
  setLinks: (l: LinkItem[]) => void;
  colorTheme: string;
  t: (k: string) => string;
}

// --- PRE-DEFINED LIST OF POPULAR APP SCHEMES ---
// Browsers cannot scan installed apps, so we provide a library of known schemes.
const PRESET_APPS = [
  { name: 'Facebook', scheme: 'fb://', category: 'Social', icon: <Smartphone /> },
  { name: 'Instagram', scheme: 'instagram://', category: 'Social', icon: <Camera /> },
  { name: 'Messenger', scheme: 'fb-messenger://', category: 'Social', icon: <MessageCircle /> },
  { name: 'Twitter / X', scheme: 'twitter://', category: 'Social', icon: <Smartphone /> },
  { name: 'TikTok', scheme: 'tiktok://', category: 'Social', icon: <Smartphone /> },
  { name: 'YouTube', scheme: 'vnd.youtube://', category: 'Media', icon: <Smartphone /> },
  { name: 'Spotify', scheme: 'spotify://', category: 'Media', icon: <Music /> },
  { name: 'Netflix', scheme: 'nflx://', category: 'Media', icon: <Smartphone /> },
  { name: 'GCash', scheme: 'gcash://', category: 'Finance', icon: <DollarSign /> },
  { name: 'Maya', scheme: 'maya://', category: 'Finance', icon: <DollarSign /> },
  { name: 'BPI Mobile', scheme: 'bpi://', category: 'Finance', icon: <DollarSign /> },
  { name: 'UnionBank', scheme: 'unionbank://', category: 'Finance', icon: <DollarSign /> },
  { name: 'Grab', scheme: 'grab://', category: 'Transport', icon: <MapPin /> },
  { name: 'Google Maps', scheme: 'comgooglemaps://', category: 'Utility', icon: <MapPin /> },
  { name: 'Waze', scheme: 'waze://', category: 'Transport', icon: <MapPin /> },
  { name: 'Viber', scheme: 'viber://', category: 'Social', icon: <Phone /> },
  { name: 'WhatsApp', scheme: 'whatsapp://', category: 'Social', icon: <MessageCircle /> },
  { name: 'Telegram', scheme: 'tg://', category: 'Social', icon: <MessageCircle /> },
  { name: 'Phone Call', scheme: 'tel:', category: 'Utility', icon: <Phone /> },
  { name: 'SMS', scheme: 'sms:', category: 'Utility', icon: <MessageCircle /> },
  { name: 'Email', scheme: 'mailto:', category: 'Utility', icon: <MessageCircle /> },
];

const Vault: React.FC<VaultProps> = ({ links, setLinks, colorTheme, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState(false); // Toggle for App Library
  
  const [formData, setFormData] = useState({ 
    title: '', 
    url: '', 
    category: 'General', 
    tags: '', 
    type: 'web' as 'web' | 'app' 
  });
  
  const [editMode, setEditMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFavicon = (url: string, type?: string) => {
    if (type === 'app') return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
    }
  };

  const handleSave = () => {
    if(!formData.title || !formData.url) return;
    const newLink: LinkItem = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url,
      category: formData.category,
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
      isFavorite: false,
      createdAt: Date.now(),
      // @ts-ignore
      type: formData.type 
    };
    setLinks([newLink, ...links]);
    setIsModalOpen(false);
    setFormData({ title: '', url: '', category: 'General', tags: '', type: 'web' });
  };

  const deleteLink = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Remove this shortcut?')) {
       setLinks(links.filter(l => l.id !== id));
    }
  };

  const handleAppSelect = (app: typeof PRESET_APPS[0]) => {
    setFormData({
      ...formData,
      title: app.name,
      url: app.scheme,
      category: app.category,
      type: 'app'
    });
    setShowAppPicker(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
           {t('linkVault')}
           <span className="text-xs font-normal px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500">{links.length} Apps</span>
        </h1>
        <div className="flex gap-2">
           <button 
             onClick={() => setEditMode(!editMode)} 
             className={`px-3 py-2 text-sm font-bold rounded-lg transition ${editMode ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
           >
             {editMode ? 'Done' : 'Manage'}
           </button>
           
           <button 
             onClick={() => isOnline ? setIsModalOpen(true) : alert("You must be online to add new apps.")} 
             disabled={!isOnline}
             className={`flex items-center gap-2 px-4 py-2 bg-${colorTheme}-600 text-white rounded-lg font-bold hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
           >
             <Plus size={18} /> Add App
           </button>
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
           <div className="p-1.5 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
              <WifiOff size={16} />
           </div>
           <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-300">Offline Mode Active</p>
              <p className="text-[10px] text-red-600 dark:text-red-400">Adding new apps is disabled to prevent broken links.</p>
           </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search your apps..." 
          className="w-full pl-10 pr-4 py-3 rounded-2xl border bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 outline-none shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-y-8 gap-x-4">
        {filteredLinks.map(link => {
          // @ts-ignore
          const isAppType = link.type === 'app';
          
          return (
            <div key={link.id} className="flex flex-col items-center group relative">
               <a 
                 href={link.url} 
                 target={isAppType ? "_self" : "_blank"} // Apps open in self to trigger deep link
                 rel="noreferrer"
                 className={`flex flex-col items-center w-full transition-transform duration-200 ${editMode ? 'animate-shake pointer-events-none' : 'hover:scale-105'}`}
               >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-[1.2rem] shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2.5 overflow-hidden relative group-hover:shadow-xl transition-shadow">
                      {isAppType ? (
                         <Smartphone className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <img 
                          src={getFavicon(link.url, 'web')} 
                          alt={link.title}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => { 
                             e.currentTarget.style.display='none'; 
                             e.currentTarget.parentElement?.classList.add('fallback-active');
                          }}
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <span className={`absolute text-2xl font-bold text-slate-300 select-none -z-10 flex items-center justify-center w-full h-full`}>
                        {link.title[0].toUpperCase()}
                      </span>
                  </div>
                  <span className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center line-clamp-1 w-full px-1">
                    {link.title}
                  </span>
               </a>

               {(editMode) && (
                  <button 
                    onClick={(e) => deleteLink(e, link.id)}
                    className="absolute -top-1 -right-1 sm:right-2 bg-slate-200 dark:bg-slate-700 text-slate-500 p-1.5 rounded-full shadow-md hover:bg-red-500 hover:text-white transition-colors z-20"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
               )}
            </div>
          );
        })}
        
        <button 
          onClick={() => isOnline ? setIsModalOpen(true) : null}
          disabled={!isOnline}
          className={`flex flex-col items-center group transition-opacity ${!isOnline ? 'opacity-30 cursor-not-allowed' : 'opacity-60 hover:opacity-100'}`}
        >
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800/50 rounded-[1.2rem] border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
               {isOnline ? <Plus size={24} /> : <WifiOff size={24} />}
           </div>
           <span className="mt-2 text-xs sm:text-sm font-medium text-slate-400">
             {isOnline ? 'Add App' : 'Offline'}
           </span>
        </button>
      </div>

      {/* --- ADD MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowAppPicker(false); }} title="Add Shortcut">
        {showAppPicker ? (
          // --- APP PICKER VIEW ---
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
             <div className="flex items-center gap-2 mb-2">
               <button onClick={() => setShowAppPicker(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1">
                 ← Back
               </button>
               <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select an App</h3>
             </div>
             
             <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                {PRESET_APPS.map((app, idx) => (
                   <button 
                     key={idx}
                     onClick={() => handleAppSelect(app)}
                     className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
                   >
                     <div className="text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                       {app.icon}
                     </div>
                     <span className="text-[10px] font-medium text-center text-slate-700 dark:text-slate-300">{app.name}</span>
                   </button>
                ))}
             </div>
          </div>
        ) : (
          // --- STANDARD FORM VIEW ---
          <div className="space-y-4">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <button 
                 onClick={() => setFormData({...formData, type: 'web'})}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.type === 'web' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  <Globe size={16} /> Website
               </button>
               <button 
                 onClick={() => setFormData({...formData, type: 'app'})}
                 className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.type === 'app' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}
               >
                  <Smartphone size={16} /> Mobile App
               </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
              <input 
                placeholder="e.g. Facebook, Gmail"
                className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                 {formData.type === 'web' ? 'Website URL' : 'App URI / Deep Link'}
              </label>
              <div className="relative">
                <input 
                  placeholder={formData.type === 'web' ? "https://..." : "e.g. spotify://, twitter://"} 
                  className="w-full p-3 pr-10 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} 
                />
                
                {/* BROWSE APPS BUTTON (Only for App Type) */}
                {formData.type === 'app' && (
                   <button 
                     onClick={() => setShowAppPicker(true)}
                     className="absolute right-2 top-2 p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                     title="Browse App Library"
                   >
                      <Grid size={16} />
                   </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Category</label>
                  <input 
                    placeholder="Social..." 
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Tags</label>
                  <input 
                    placeholder="Optional" 
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} 
                  />
               </div>
            </div>
            <button onClick={handleSave} className={`w-full py-3.5 bg-${colorTheme}-600 text-white font-bold rounded-xl hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30 mt-2`}>
              Add to Home Screen
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vault;
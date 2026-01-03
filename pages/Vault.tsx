import React, { useState } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import { LinkItem } from '../types';
import Modal from '../components/Modal';

interface VaultProps {
  links: LinkItem[];
  setLinks: (l: LinkItem[]) => void;
  colorTheme: string;
  t: (k: string) => string;
}

const Vault: React.FC<VaultProps> = ({ links, setLinks, colorTheme, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', url: '', category: 'General', tags: '' });
  const [editMode, setEditMode] = useState(false);
  
  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFavicon = (url: string) => `https://www.google.com/s2/favicons?domain=${url}&sz=128`;

  const handleSave = () => {
    if(!formData.title || !formData.url) return;
    const newLink: LinkItem = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url,
      category: formData.category,
      tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
      isFavorite: false,
      createdAt: Date.now()
    };
    setLinks([newLink, ...links]);
    setIsModalOpen(false);
    setFormData({ title: '', url: '', category: 'General', tags: '' });
  };

  const deleteLink = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Remove this app shortcut?')) {
       setLinks(links.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10 pb-20">
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
           <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-2 px-4 py-2 bg-${colorTheme}-600 text-white rounded-lg font-bold hover:bg-${colorTheme}-700 shadow-lg shadow-${colorTheme}-500/30`}>
             <Plus size={18} /> Add App
           </button>
        </div>
      </div>

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

      {/* App Grid Layout */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-y-8 gap-x-4">
        {filteredLinks.map(link => (
          <div key={link.id} className="flex flex-col items-center group relative">
             <a 
               href={link.url} 
               target="_blank" 
               rel="noreferrer"
               className={`flex flex-col items-center w-full transition-transform duration-200 ${editMode ? 'animate-shake pointer-events-none' : 'hover:scale-105'}`}
             >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-[1.2rem] shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2.5 overflow-hidden relative group-hover:shadow-xl transition-shadow">
                    <img 
                      src={getFavicon(link.url)} 
                      alt={link.title}
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => { e.currentTarget.style.display='none'; }}
                    />
                    <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    {/* Fallback Text if Image Fails */}
                    <span className="absolute text-2xl font-bold text-slate-300 select-none -z-10">{link.title[0]}</span>
                </div>
                <span className="mt-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 text-center line-clamp-1 w-full px-1">
                  {link.title}
                </span>
             </a>

             {/* Delete Badge (Visible in Edit Mode or Hover) */}
             {(editMode) && (
                <button 
                  onClick={(e) => deleteLink(e, link.id)}
                  className="absolute -top-1 -right-1 sm:right-2 bg-slate-200 dark:bg-slate-700 text-slate-500 p-1.5 rounded-full shadow-md hover:bg-red-500 hover:text-white transition-colors z-20"
                >
                  <X size={12} strokeWidth={3} />
                </button>
             )}
          </div>
        ))}
        
        {/* Add Button in Grid */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center group opacity-60 hover:opacity-100 transition-opacity"
        >
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-slate-800/50 rounded-[1.2rem] border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400">
               <Plus size={24} />
           </div>
           <span className="mt-2 text-xs sm:text-sm font-medium text-slate-400">Add App</span>
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add App Shortcut">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
            <input 
              placeholder="e.g. Facebook, Gmail" 
              className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">URL</label>
            <input 
              placeholder="https://..." 
              className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Category</label>
                <input 
                  placeholder="Social, Work..." 
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
      </Modal>
    </div>
  );
};

export default Vault;
import React, { useState, useEffect } from 'react';
import { Database, HardDrive, RefreshCw, FileJson, Copy, Check, Activity, ShieldCheck, AlertTriangle, Cpu, Trash2, Calendar, Lock, Info, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface StorageItem {
  key: string;
  size: number;
  value: string;
  valid: boolean;
  date: string | null;
  source: string;
  type: string;
  safety: 'critical' | 'caution' | 'safe';
  summary: string;
}

export const StorageManager: React.FC = () => {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'Optimal' | 'Warning' | 'Critical'>('Optimal');
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);

  // Approx 5MB limit for LocalStorage
  const MAX_LIMIT = 5 * 1024 * 1024; 

  const identifySource = (key: string): string => {
    if (key.includes('kaizen')) return 'Kaizen Core';
    if (key.includes('supabase')) return 'Supabase Auth';
    if (key.includes('vite')) return 'Vite Dev';
    if (key.includes('google')) return 'Google Services';
    if (key.includes('firebase')) return 'Firebase';
    return 'External / System';
  };

  const evaluateSafety = (key: string): 'critical' | 'caution' | 'safe' => {
      // The main app DB - Deleting this wipes user data
      if (key === 'kaizen_app_db_v1') return 'critical';
      
      // Auth tokens - Deleting logs user out, but data might persist on server (if using backend)
      // or just inconveniences the user.
      if (key.includes('supabase') || key.includes('auth') || key.includes('token') || key.includes('user')) return 'caution';
      
      // Usually safe to delete cache, temp files, or unknown keys
      return 'safe';
  };

  const extractDate = (obj: any): string | null => {
    try {
        const candidates = [obj.date, obj.createdAt, obj.updatedAt, obj.timestamp, obj.lastModified];
        for (const c of candidates) {
            if (c) {
                const d = new Date(c);
                if (!isNaN(d.getTime())) return format(d, 'MMM dd, yyyy HH:mm');
            }
        }
        if (obj.transactions && Array.isArray(obj.transactions) && obj.transactions.length > 0) {
             const lastTx = obj.transactions[0]; 
             if(lastTx && lastTx.date) return format(new Date(lastTx.date), 'MMM dd, yyyy');
        }
    } catch (e) {
        return null;
    }
    return null;
  };

  const generateSummary = (parsed: any, value: string): string => {
      if (parsed && typeof parsed === 'object') {
          const keys = Object.keys(parsed);
          if (keys.length > 0) {
              // If it's the main db, show helpful sections
              if (keys.includes('currentUser')) {
                  const user = parsed.currentUser ? `${parsed.currentUser.firstName} ${parsed.currentUser.lastName}` : 'Guest';
                  const txCount = parsed.transactions?.length || 0;
                  return `User: ${user} • Tx: ${txCount} • Links: ${parsed.links?.length || 0}`;
              }
              // Generic Object
              const preview = keys.slice(0, 4).join(', ');
              return `Contains: ${preview}${keys.length > 4 ? ', ...' : ''}`;
          }
          return 'Empty Object {}';
      }
      // String
      return value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
  };

  const scanStorage = () => {
    let total = 0;
    const storageItems: StorageItem[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        total += size;
        
        let isValid = true;
        let parsed = null;
        let date = null;

        try {
            parsed = JSON.parse(value);
            date = extractDate(parsed);
        } catch (e) {
            isValid = false;
        }

        storageItems.push({ 
            key, 
            size, 
            value, 
            valid: isValid,
            date: date,
            source: identifySource(key),
            type: isValid ? 'JSON Object' : 'String',
            safety: evaluateSafety(key),
            summary: generateSummary(parsed, value)
        });
      }
    }
    
    setTotalSize(total);
    // Sort: Critical first, then by size
    setItems(storageItems.sort((a, b) => {
        if (a.safety === 'critical' && b.safety !== 'critical') return -1;
        if (b.safety === 'critical' && a.safety !== 'critical') return 1;
        return b.size - a.size;
    }));

    const usage = (total / MAX_LIMIT);
    if (usage > 0.9) setHealthStatus('Critical');
    else if (usage > 0.7) setHealthStatus('Warning');
    else setHealthStatus('Optimal');
  };

  useEffect(() => {
    scanStorage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = Math.min((totalSize / MAX_LIMIT) * 100, 100);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    if (deleteCandidate) {
        localStorage.removeItem(deleteCandidate);
        setDeleteCandidate(null);
        scanStorage();
    }
  };

  return (
    <div className="space-y-6 relative">
       {/* Visual Header / Health Dashboard */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quota Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
             <div className="flex justify-between items-start relative z-10">
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage Capacity</span>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{usagePercent.toFixed(1)}%</h3>
                   <p className="text-xs text-slate-500 mt-1">{formatBytes(totalSize)} used of 5 MB</p>
                </div>
                <div className={`p-3 rounded-xl ${usagePercent > 90 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                   <HardDrive size={24} />
                </div>
             </div>
             <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 mt-4 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${usagePercent}%`}}></div>
             </div>
          </div>

          {/* Health Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
             <div className="flex justify-between items-start relative z-10">
                <div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health</span>
                   <h3 className={`text-2xl font-black mt-1 ${healthStatus === 'Optimal' ? 'text-emerald-500' : healthStatus === 'Warning' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {healthStatus}
                   </h3>
                   <p className="text-xs text-slate-500 mt-1">
                      {items.every(i => i.valid) ? 'All data integrity checks passed.' : 'Corrupted/Non-JSON data detected.'}
                   </p>
                </div>
                <div className={`p-3 rounded-xl ${healthStatus === 'Optimal' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                   <Activity size={24} />
                </div>
             </div>
             <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" /> Secure Local Environment
             </div>
          </div>
       </div>

       {/* Data List */}
       <div className="space-y-3">
          <div className="flex justify-between items-end px-2 pb-2 border-b border-slate-100 dark:border-slate-800">
             <div>
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <Database size={16} className="text-slate-400"/> Data Clusters
                </h4>
             </div>
             <button onClick={scanStorage} className="text-xs flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-full transition-colors">
                <RefreshCw size={12} /> Refresh
             </button>
          </div>

          <div className="space-y-3">
             {items.map((item) => {
                const isCritical = item.safety === 'critical';
                const isCaution = item.safety === 'caution';
                
                let borderColor = 'border-slate-200 dark:border-slate-700';
                let bgStyle = 'bg-white dark:bg-slate-900';
                
                if (isCritical) {
                    borderColor = 'border-brand-500 dark:border-brand-500 shadow-md shadow-brand-500/10';
                    bgStyle = 'bg-brand-50/50 dark:bg-brand-900/10';
                }

                return (
                <div key={item.key} className={`group border ${borderColor} rounded-xl ${bgStyle} overflow-hidden transition-all hover:shadow-md`}>
                   <div className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setExpandedKey(expandedKey === item.key ? null : item.key)}>
                      
                      <div className="flex items-center gap-4 min-w-0">
                         {/* Icon based on Validity */}
                         <div className={`shrink-0 p-3 rounded-xl ${isCritical ? 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300' : (item.valid ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-red-100 text-red-500')}`}>
                            {isCritical ? <Database size={24} /> : (item.valid ? <FileJson size={20} /> : <AlertTriangle size={20} />)}
                         </div>
                         
                         <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                <p className={`font-bold text-sm truncate ${isCritical ? 'text-brand-700 dark:text-brand-300 text-base' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {item.key}
                                </p>
                                
                                {/* Safety Badge */}
                                {isCritical && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                        <Lock size={10} /> Core System
                                    </span>
                                )}
                                {item.safety === 'safe' && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <CheckCircle2 size={10} /> Safe to delete
                                    </span>
                                )}
                            </div>
                            
                            {/* Summary Content */}
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mb-1.5 opacity-90">
                                {item.summary}
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                <span className="font-bold">{formatBytes(item.size)}</span>
                                <span className="flex items-center gap-1"><Cpu size={10} /> {item.type}</span>
                                {item.date && (
                                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                        <Calendar size={10} /> {item.date}
                                    </span>
                                )}
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteCandidate(item.key); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete File"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>
                   
                   {expandedKey === item.key && (
                      <div className="bg-slate-50 dark:bg-black/40 border-t border-slate-100 dark:border-slate-800 p-4 animate-slide-up">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payload Preview</span>
                            <button onClick={() => handleCopy(item.value)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors">
                               {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? 'Copied' : 'Copy'}
                            </button>
                         </div>
                         <div className="max-h-60 overflow-y-auto custom-scrollbar rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                            <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-all">
                               {item.value}
                            </pre>
                         </div>
                      </div>
                   )}
                </div>
             )})}
          </div>
       </div>

       {/* Delete Confirmation Overlay */}
       {deleteCandidate && (
           <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl">
               <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900 p-6 animate-scale-in">
                   <div className="flex flex-col items-center text-center space-y-4">
                       <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
                           <AlertTriangle size={32} />
                       </div>
                       <div>
                           <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Data?</h4>
                           <p className="text-sm text-slate-500 mt-1 mb-2">
                               You are about to remove <span className="font-mono text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded">{deleteCandidate}</span>.
                           </p>
                           
                           {deleteCandidate === 'kaizen_app_db_v1' ? (
                               <div className="text-xs bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg text-red-600 dark:text-red-300 text-left">
                                   <strong>CRITICAL WARNING:</strong> This is the main application database. Deleting this will <u>permanently erase</u> your Budget, Habits, Links, and User Profile. You will be logged out and the app will reset.
                               </div>
                           ) : (
                               <p className="text-xs text-slate-400">
                                   This action cannot be undone. Ensure you do not need this data.
                               </p>
                           )}
                       </div>
                       <div className="flex gap-3 w-full">
                           <button 
                               onClick={() => setDeleteCandidate(null)}
                               className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition"
                           >
                               Cancel
                           </button>
                           <button 
                               onClick={handleDelete}
                               className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 transition"
                           >
                               Confirm Delete
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};
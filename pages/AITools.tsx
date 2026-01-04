import React, { useState, useEffect } from 'react';
import { Zap, Wifi, WifiOff, Activity, AlertTriangle, CheckCircle, X } from 'lucide-react';

const AITools: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Diagnostic State
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [activeModel, setActiveModel] = useState<string>('Detecting...');
  const [diagStatus, setDiagStatus] = useState<'checking' | 'error' | 'success'>('checking');
  const [diagMsg, setDiagMsg] = useState('Checking API connection...');

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    // Run Check
    checkApiConnection();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // 1. DIAGNOSTIC & MODEL SELECTOR
  const checkApiConnection = async () => {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        setDiagStatus('error');
        setDiagMsg("Missing API Key in .env file");
        return;
    }

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await res.json();

        if (data.models) {
            const names = data.models.map((m: any) => m.name.replace('models/', ''));
            setAvailableModels(names);
            setDiagStatus('success');
            setDiagMsg(`Online! Found ${names.length} models.`);

            // Priority Logic: Check specifically for Flash or Pro models
            const preferred = names.find((n: string) => n.includes('gemini-2.5-flash')) ||
                              names.find((n: string) => n.includes('gemini-1.5-flash')) ||
                              names.find((n: string) => n.includes('gemini-pro'));

            // Fallback: Any valid Gemini model that isn't embedding/vision
            const fallback = names.find((n: string) => n.includes('gemini') && !n.includes('embedding') && !n.includes('vision'));

            const selected = preferred || fallback || 'gemini-1.5-flash';
            setActiveModel(selected);

        } else {
            setDiagStatus('error');
            setDiagMsg("API Error: No models found.");
        }
    } catch (e: any) {
        setDiagStatus('error');
        setDiagMsg(`Connection Failed: ${e.message}`);
    }
  };

  // 2. GENERATE FUNCTION
  const handleGenerate = async () => {
    if (!prompt.trim() || !isOnline) return;
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    setLoading(true);
    setResponse('');
    
    try {
      console.log(`Generating with ${activeModel}...`);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || res.statusText);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setResponse(text || "⚠️ Empty response from AI.");

    } catch (error: any) {
      console.error(error);
      setResponse(`⚠️ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative z-10">
       <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
             <Zap size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Assistant</h1>
          <p className="text-slate-500 text-sm font-mono">Using Model: {activeModel}</p>
       </div>

       {/* STATUS BAR */}
       <div className={`text-xs p-3 rounded-lg border flex justify-between items-center ${diagStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <div className="flex items-center gap-2">
             <Activity size={14} /> 
             <span>{diagMsg}</span>
          </div>
          {diagStatus === 'success' && <span className="font-bold opacity-75 hidden sm:inline">Active: {activeModel}</span>}
       </div>

       {!isOnline && (
         <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-3">
            <WifiOff size={20} className="text-red-600" />
            <span className="text-sm font-bold text-red-700 dark:text-red-300">Offline Mode Active</span>
         </div>
       )}

       {/* MAIN INPUT CARD */}
       <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-opacity ${!isOnline || diagStatus === 'error' ? 'opacity-50 grayscale' : ''}`}>
          
          {/* Relative container for the input and the clear button */}
          <div className="relative">
            <textarea 
                className="w-full p-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none transition-all"
                rows={4}
                placeholder={diagStatus === 'error' ? "Checking connection..." : "Ask me anything..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={!isOnline || diagStatus === 'error'}
            />
            
            {/* NEW: Clear Button (Only shows when text exists) */}
            {prompt.length > 0 && (
                <button 
                    onClick={() => setPrompt('')}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-red-500 transition-all animate-in zoom-in duration-200"
                    title="Clear text"
                >
                    <X size={16} />
                </button>
            )}
          </div>

          <div className="mt-4 flex justify-between items-center">
             <div className="flex items-center gap-2 text-xs text-slate-400">
               {diagStatus === 'success' ? <CheckCircle size={14} className="text-green-500"/> : <AlertTriangle size={14} className="text-amber-500"/>}
               <span>{diagStatus === 'success' ? 'System Ready' : 'Initializing...'}</span>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt || !isOnline || diagStatus === 'error'}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
             >
                {loading ? 'Thinking...' : <><Zap size={18}/> Generate</>}
             </button>
          </div>
       </div>

       {response && (
         <div className="p-6 rounded-2xl shadow-sm border bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Gemini Response</h3>
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
               <p className="whitespace-pre-wrap leading-relaxed font-medium">{response}</p>
            </div>
         </div>
       )}
    </div>
  );
};

export default AITools;
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Zap, Wifi, WifiOff, AlertCircle } from 'lucide-react';

const AITools: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 1. Online Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 2. Monitor Network Status
  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim() || !isOnline) return;
    setLoading(true);
    setResponse('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp', // Updated to a stable model name if needed, or keep 'gemini-3-flash-preview' if you have access
        contents: prompt,
      });
      setResponse(result.text || 'No response generated.');
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("Error generating content. Please check your internet connection or API key.");
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
          <p className="text-slate-500">Powered by Gemini AI</p>
       </div>

       {/* Offline Notification Banner */}
       {!isOnline && (
         <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
               <WifiOff size={20} />
            </div>
            <div>
               <h3 className="text-sm font-bold text-red-700 dark:text-red-300">You are currently offline</h3>
               <p className="text-xs text-red-600 dark:text-red-400">AI features require an active internet connection.</p>
            </div>
         </div>
       )}

       <div className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-opacity ${!isOnline ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          <textarea 
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none disabled:cursor-not-allowed"
            rows={4}
            placeholder={isOnline ? "Ask me anything..." : "Connect to the internet to start typing..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!isOnline}
          />
          <div className="mt-4 flex justify-between items-center">
             <div className="flex items-center gap-2 text-xs text-slate-400">
               {isOnline ? (
                  <><Wifi size={14} className="text-green-500"/> <span>Online & Ready</span></>
               ) : (
                  <><WifiOff size={14} /> <span>Offline</span></>
               )}
             </div>

             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt || !isOnline}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
                {loading ? 'Thinking...' : <><Zap size={18}/> {isOnline ? 'Generate' : 'Offline'}</>}
             </button>
          </div>
       </div>

       {response && (
         <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Gemini Response</h3>
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
               <p className="whitespace-pre-wrap leading-relaxed">{response}</p>
            </div>
         </div>
       )}
    </div>
  );
};

export default AITools;
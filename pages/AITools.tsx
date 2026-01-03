import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Zap } from 'lucide-react';

const AITools: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setResponse(result.text || 'No response generated.');
    } catch (error) {
      console.error("AI Error:", error);
      setResponse("Error generating content. Please check your API key configuration.");
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
          <p className="text-slate-500">Powered by Gemini 3 Flash</p>
       </div>

       <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <textarea 
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white resize-none"
            rows={4}
            placeholder="Ask me anything..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-4 flex justify-end">
             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
                {loading ? 'Thinking...' : <><Zap size={18}/> Generate</>}
             </button>
          </div>
       </div>

       {response && (
         <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 animate-scale-in">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Gemini Response</h3>
            <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
               <p className="whitespace-pre-wrap">{response}</p>
            </div>
         </div>
       )}
    </div>
  );
};

export default AITools;
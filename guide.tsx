import React from 'react';
import { Download, Code, Globe, Smartphone, Server, Database, Shield, Terminal, Command } from 'lucide-react';

const Guide: React.FC = () => {
  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getWordContent = () => {
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Kaizen App Dev Guide</title></head>
      <body>
        <h1>Kaizen App Developer Manual</h1>
        <p><strong>Version:</strong> 2.1 (Full Feature)</p>
        
        <h2>1. VS Code Quick Start</h2>
        <p>Run these commands in your terminal:</p>
        <pre>
npm install
npm run dev
        </pre>

        <h2>2. Architecture Overview</h2>
        <p><strong>Frontend:</strong> React 19, Vite, Tailwind CSS, Lucide React, Recharts.</p>
        <p><strong>AI:</strong> Google Gemini 3 Flash.</p>
      </body>
      </html>
    `;
  };

  const getPPTContent = () => {
    return `
      <html>
      <head><style>
        .slide { border: 1px solid #ccc; padding: 40px; margin: 20px; page-break-after: always; height: 600px; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; }
        h1 { color: #0284c7; }
        li { margin-bottom: 10px; font-size: 24px; }
      </style></head>
      <body>
        <div class="slide">
          <h1>Kaizen Life: Dev Setup</h1>
          <ul>
            <li>Run 'npm install'</li>
            <li>Run 'npm run dev'</li>
            <li>Open localhost:5173</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Developer Handoff Guide</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Comprehensive documentation for maintaining, deploying, and extending Kaizen Life.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => downloadFile('Kaizen_Dev_Manual.doc', getWordContent(), 'application/msword')}
            className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
          >
            <Download size={20} /> Download Technical Manual
          </button>
          <button 
             onClick={() => downloadFile('Kaizen_Tech_Deck.html', getPPTContent(), 'text/html')}
            className="flex items-center justify-center gap-2 p-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-500/20"
          >
            <Download size={20} /> Download Slide Deck
          </button>
        </div>

        <div className="space-y-6">
          <Section icon={<Terminal />} title="1. VS Code Quick Start (Bash)">
             <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Follow these commands in your Visual Studio Code integrated terminal (Ctrl+`) to get up and running immediately after download.
             </p>
             <div className="bg-slate-950 rounded-xl p-5 font-mono text-sm shadow-inner border border-slate-800 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                   <Terminal size={48} className="text-white" />
                </div>
                <div className="flex gap-2 opacity-50 mb-4 border-b border-slate-800 pb-2">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4 relative z-10">
                    <div className="group/line">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold select-none">➜</span>
                            <span className="text-purple-400 font-bold select-none">~</span>
                            <span className="text-white">npm install</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 pl-6 select-none border-l-2 border-slate-800 ml-1">
                            # Installs React, Tailwind, and all project dependencies
                        </div>
                    </div>

                    <div className="group/line">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold select-none">➜</span>
                            <span className="text-purple-400 font-bold select-none">~</span>
                            <span className="text-white">cp .env.example .env</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 pl-6 select-none border-l-2 border-slate-800 ml-1">
                            # (Optional) Create environment config for API Keys
                        </div>
                    </div>

                    <div className="group/line">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold select-none">➜</span>
                            <span className="text-purple-400 font-bold select-none">~</span>
                            <span className="text-white">npm run dev</span>
                        </div>
                        <div className="text-slate-500 text-xs mt-1 pl-6 select-none border-l-2 border-slate-800 ml-1">
                            # Starts local development server at <span className="text-blue-400 underline cursor-pointer">http://localhost:5173</span>
                        </div>
                    </div>
                </div>
             </div>
          </Section>

          <Section icon={<Code />} title="2. Project Structure">
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
              <li>Ensure <strong>Node.js 18+</strong> is installed.</li>
              <li><strong>/src:</strong> Main application source code.</li>
              <li><strong>/src/services:</strong> API and Storage logic.</li>
              <li><strong>/src/components:</strong> Reusable UI components.</li>
            </ul>
          </Section>

          <Section icon={<Database />} title="3. Backend Integration (Supabase)">
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
              <li>Create a Supabase project.</li>
              <li>Enable <strong>Storage</strong> and create two public buckets: <code>kaizenusers</code> and <code>kaizenfeedback</code>.</li>
              <li>Set policy to allow public <code>INSERT</code>/<code>SELECT</code>.</li>
              <li>The app uses these buckets as a NoSQL store for admin reporting.</li>
            </ul>
          </Section>

          <Section icon={<Smartphone />} title="4. Mobile Export (Capacitor)">
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
              <li>This project is pre-configured with Capacitor.</li>
              <li>Build React app: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-brand-600">npm run build</code></li>
              <li>Sync assets: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-brand-600">npx cap sync</code></li>
              <li>Open Android Studio: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-brand-600">npx cap open android</code></li>
            </ul>
          </Section>

          <Section icon={<Shield />} title="5. Legal & Privacy">
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400 text-sm">
              <li>The app is "Local-First". User financial data is stored in <code>localStorage</code>.</li>
              <li>AI prompts are sent to Google. Ensure the Terms of Service modal is up to date regarding AI usage.</li>
              <li>Donations are strictly voluntary via QR codes managed in the Admin panel.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="border-l-4 border-brand-500 pl-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-r-xl">
    <h3 className="flex items-center gap-2 font-semibold text-lg text-slate-900 dark:text-white mb-2">
      <span className="text-brand-500">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

export default Guide;
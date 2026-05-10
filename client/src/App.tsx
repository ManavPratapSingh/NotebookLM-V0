import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { UploadProgress, type UploadState } from './components/UploadProgress';
import gsap from 'gsap';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<string[]>([]);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animation
    const ctx = gsap.context(() => {
      gsap.fromTo('.entrance-anim',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  const handleFileUpload = (filename: string) => {
    setDocuments(prev => [...prev, filename]);
  };

  const handleDismissUpload = useCallback(() => {
    setUploadState(null);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
      {/* Background Mesh */}
      <div className="bg-mesh" />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          documents={documents}
          onUpload={handleFileUpload}
          onUploadProgress={setUploadState}
        />
        
        <main ref={mainRef} className="flex-1 flex flex-col relative">
          {/* Header/Logo Area */}
          <header className="p-8 entrance-anim">
            <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-sm rotate-45" />
              </div>
              NotebookLM <span className="text-white/40 font-light italic">v0</span>
            </div>
          </header>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden entrance-anim">
            <ChatArea messages={messages} setMessages={setMessages} />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-white/20 text-xs border-t border-white/5 backdrop-blur-sm entrance-anim relative z-10">
        © 2026 Antigravity Systems • Powered by Gemini & LangChain
      </footer>

      {/* Upload Progress Toast */}
      <UploadProgress upload={uploadState} onDismiss={handleDismissUpload} />
    </div>
  );
};

export default App;

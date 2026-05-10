import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import axios from 'axios';

interface ChatAreaProps {
  messages: { role: 'user' | 'assistant'; content: string }[];
  setMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'assistant'; content: string }[]>>;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/rag/query', {
        userQuery: userMessage
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Query failed:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 gap-8 relative">
      {/* Message Container */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pr-4 pb-24 mask-fade-out"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
            <div className="w-16 h-16 rounded-3xl glass-card flex items-center justify-center animate-pulse">
              <Sparkles size={32} />
            </div>
            <p className="max-w-xs text-sm">Upload a PDF and ask anything to get started with your spatial assistant.</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[70%] p-4 rounded-2xl glass-card ${
                msg.role === 'user' ? 'bg-white/5 border-blue-500/10' : 'bg-white/10'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl glass-card flex gap-1">
              <div className="w-2 h-2 bg-purple-500/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-purple-500/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-purple-500/40 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-12 left-8 right-12">
        <div className="glass-card p-2 rounded-2xl flex items-center gap-2 focus-within:border-white/20 transition-all shadow-2xl">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your document anything..."
            className="flex-1 bg-transparent border-none focus:outline-none px-4 py-2 text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

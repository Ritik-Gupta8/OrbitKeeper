import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { askCopilot } from '../lib/api.js';

const STARTER_PROMPTS = [
  "What should I revise for tomorrow's interview?",
  "Which application has the highest match score?",
  "What skills am I missing most across my applications?",
  "Summarize my current application pipeline",
  "Which companies should I focus on this week?",
  "What's my interview preparation status?",
];

export default function CopilotChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your OrbitKeeper AI 🤖\n\nI have access to all your applications, match scores, skill gaps, and interview notes. Ask me anything about your career journey.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await askCopilot(q);
      setMessages(m => [...m, { role: 'assistant', content: res.data.data.answer }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full max-w-2xl mx-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="ok-animate-blob absolute -top-32 right-10 w-[28rem] h-[28rem] rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="ok-animate-blob absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full bg-purple-600/15 blur-3xl" style={{ animationDelay: '6s' }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800 ok-animate-fade-up">
        <div className="w-9 h-9 rounded-xl bg-zinc-800/50 flex items-center justify-center overflow-hidden ok-animate-float">
          <img src="/favicon.png" alt="OrbitKeeper Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-base font-bold">
            <span className="ok-gradient-text">AI Career Copilot</span>
          </h1>
          <p className="text-xs text-zinc-500">Powered by Gemini · Has access to your career data</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ok-animate-fade-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-zinc-800'
            }`}>
              {msg.role === 'user'
                ? <User size={13} className="text-white" />
                : <Bot size={13} className="text-indigo-400" />
              }
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-sm'
                : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 ok-animate-fade-up">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
              <Bot size={13} className="text-indigo-400" />
            </div>
            <div className="bg-zinc-800 rounded-xl rounded-tl-sm px-4 py-3">
              <Loader2 size={14} className="animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length === 1 && (
        <div className="pb-4 ok-animate-fade-up ok-delay-2">
          <p className="text-xs text-zinc-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => send(p)}
                className="text-xs glass hover:border-indigo-700/50 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-full transition-all active:scale-95"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-zinc-800">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about your applications, skills, or interview prep..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
        >
          <Send size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}

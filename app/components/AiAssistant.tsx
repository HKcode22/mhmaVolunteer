'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, AlertCircle } from 'lucide-react';
import { knowledgeBase } from '@/app/lib/assistant-knowledge';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

type WorkerStatus = 'unloaded' | 'loading' | 'ready' | 'error';

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your MHMA assistant — powered by Transformers.js ML running directly in your browser. Ask me anything about the dashboard." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('unloaded');
  const [workerError, setWorkerError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingResolveRef = useRef<((value: string | null) => void) | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const worker = new Worker('/ai-worker.js');
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, status, error, bestMatch } = event.data;

      if (type === 'init-status') {
        if (status === 'loading') {
          setWorkerStatus('loading');
        } else if (status === 'ready') {
          setWorkerStatus('ready');
          setLoading(false);
        } else if (status === 'error') {
          setWorkerStatus('error');
          setWorkerError(error);
          setLoading(false);
        }
      } else if (type === 'result') {
        setLoading(false);
        if (pendingResolveRef.current) {
          if (bestMatch) {
            pendingResolveRef.current(bestMatch.item.a);
          } else {
            pendingResolveRef.current(null);
          }
          pendingResolveRef.current = null;
        }
      } else if (type === 'error') {
        setLoading(false);
        setWorkerError(error);
        if (pendingResolveRef.current) {
          pendingResolveRef.current(null);
          pendingResolveRef.current = null;
        }
      }
    };

    worker.postMessage({ type: 'init', data: { knowledgeBase } });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const askQuestion = useCallback((query: string): Promise<string | null> => {
    return new Promise((resolve) => {
      pendingResolveRef.current = resolve;
      const role = user?.role || undefined;
      workerRef.current?.postMessage({
        type: 'query',
        data: { query, role, currentPage: pathname },
      });
    });
  }, [user?.role, pathname]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading || workerStatus !== 'ready') return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    const answer = await askQuestion(q);

    if (answer) {
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } else {
      const roleLabel = user?.role === 'admin' ? 'admin' : user?.role === 'board' ? 'board member' : 'member';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn't find a specific answer to that. As a ${roleLabel}, try asking about available dashboard features or how to manage content. You can also rephrase your question.`,
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    'How do I create an event?',
    'How do I approve enrollments?',
    'How do I manage pledges?',
  ];

  const botDisabled = workerStatus === 'error';

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-mhma-forest text-white rounded-full shadow-lg hover:bg-mhma-forest-mid transition-all hover:scale-110 flex items-center justify-center"
        aria-label="AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-mhma-forest text-white px-4 py-3 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-bold text-sm">MHMA Assistant</p>
              <p className="text-[10px] text-white/70">
                {workerStatus === 'loading' && 'Loading ML model...'}
                {workerStatus === 'ready' && 'Transformers.js ML · Offline'}
                {workerStatus === 'error' && 'Model unavailable'}
                {workerStatus === 'unloaded' && 'Initializing...'}
              </p>
            </div>
            {workerStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-white/70" />}
          </div>

          {workerStatus === 'loading' && (
            <div className="px-4 py-6 text-center text-sm text-gray-500 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-mhma-gold" />
              <p>Downloading ML model (~23MB)...</p>
              <p className="text-xs text-gray-400">Cached after first load for instant use.</p>
            </div>
          )}

          {workerStatus === 'error' && (
            <div className="px-4 py-4 text-center text-sm text-red-500 space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto" />
              <p>Could not load the ML model.</p>
              <p className="text-xs text-gray-400">{workerError || 'Check your internet connection and try refreshing.'}</p>
            </div>
          )}

          {workerStatus === 'ready' && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-mhma-forest text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Computing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && user && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-medium">
                    Context: {user.role} · {pathname}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-mhma-forest hover:text-white transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 p-3 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about dashboard features..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none"
                  disabled={loading || botDisabled}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim() || botDisabled}
                  className="w-9 h-9 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-mid transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

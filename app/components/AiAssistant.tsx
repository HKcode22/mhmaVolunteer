'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, AlertCircle, RefreshCw, Navigation } from 'lucide-react';
import { knowledgeBase } from '@/app/lib/assistant-knowledge';
import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  navHint?: string;
}

type WorkerStatus = 'unloaded' | 'loading' | 'ready' | 'error' | 'unsupported';

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 1);
}

function keywordMatch(query: string, role?: string, page?: string): { answer: string | null; navHint?: string } {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return { answer: null };
  const stopWords = new Set(['the','a','an','is','are','was','were','be','been','have','has','had',
    'do','does','did','will','would','can','could','may','might','shall','should','to','of','in',
    'for','on','with','at','by','from','as','into','through','during','before','after','above',
    'below','between','out','off','over','under','again','further','then','once','here','there',
    'when','where','why','how','all','each','every','both','few','more','most','other','some',
    'such','no','nor','not','only','own','same','so','than','too','very','just','about','up',
    'and','but','or','if','because','what','which','who','whom','this','that','these','those',
    'it','its','my','your','his','her','our','their']);
  const qFiltered = qTokens.filter((w) => !stopWords.has(w));
  if (qFiltered.length === 0) return { answer: null };

  let bestScore = 0;
  let bestItem = null;
  for (const item of knowledgeBase) {
    // Skip if user's role is denied
    if (item.denyRoles && role && item.denyRoles.includes(role as any)) continue;
    const kw = [...item.keywords, ...tokenize(item.q)];
    const kTokens = Array.from(new Set(kw.map((k) => k.toLowerCase())));
    let matches = 0;
    for (const qWord of qFiltered) {
      if (kTokens.some((kt) => kt.includes(qWord) || qWord.includes(kt))) matches++;
    }
    let score = matches / Math.max(kTokens.length, qFiltered.length) * 2;
    if (role && item.roles?.includes(role as any)) score += 0.15;
    if (page && item.pages?.includes(page)) score += 0.1;
    score = Math.min(score, 1);
    if (score > 0.2 && score > bestScore) { bestScore = score; bestItem = item; }
  }
  if (!bestItem) return { answer: null };
  return { answer: bestItem.a, navHint: bestItem.pages?.[0] };
}

export default function AiAssistant() {
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your MHMA assistant. Ask me anything about the dashboard." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [navHint, setNavHint] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('unloaded');
  const [workerError, setWorkerError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [width, setWidth] = useState(360);
  const [height, setHeight] = useState(500);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingResolveRef = useRef<((value: string | null) => void) | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, w: 360, h: 500 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      const worker = new Worker('/ai-worker.js');
      workerRef.current = worker;

      const timeout = setTimeout(() => {
        if (workerRef.current && workerStatus !== 'ready' && workerStatus !== 'error') {
          worker.terminate();
          workerRef.current = null;
          setWorkerStatus('error');
          setWorkerError('Model load timed out.');
          setUsingFallback(true);
        }
      }, 60000);
      initTimeoutRef.current = timeout;

      worker.onmessage = (event) => {
        const { type, status, error, bestMatch } = event.data;

        if (type === 'init-status') {
          if (status === 'loading') {
            setWorkerStatus('loading');
          } else if (status === 'ready') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('ready');
            setLoading(false);
          } else if (status === 'error') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('error');
            setWorkerError(error || 'Unknown error');
            setUsingFallback(true);
            setLoading(false);
          }
        } else if (type === 'result') {
          setLoading(false);
          if (pendingResolveRef.current) {
            const answer = bestMatch ? bestMatch.item.a : null;
            setNavHint(bestMatch && bestMatch.item.pages?.[0] ? bestMatch.item.pages[0] : null);
            pendingResolveRef.current(answer);
            pendingResolveRef.current = null;
          }
        } else if (type === 'error') {
          setLoading(false);
          if (pendingResolveRef.current) {
            pendingResolveRef.current(null);
            pendingResolveRef.current = null;
          }
        }
      };

      worker.onerror = (err) => {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        setWorkerStatus('error');
        setWorkerError(err.message || 'Worker failed');
        setUsingFallback(true);
        setLoading(false);
      };

      worker.postMessage({ type: 'init', data: { knowledgeBase } });
    } catch (err: any) {
      setWorkerStatus('unsupported');
      setWorkerError('Web Workers not supported.');
      setUsingFallback(true);
    }

    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    };
  }, []);

  const handleClose = useCallback(() => { openRef.current = false; setOpen(false); }, []);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !(e.target as HTMLElement)?.closest?.('[aria-label="AI Assistant"]')) {
        openRef.current = false;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (!navHint) return;
    const path = navHint;
    const links = document.querySelectorAll<HTMLAnchorElement>(`a[href="${path}"]`);
    links.forEach((el) => {
      el.classList.add('ai-nav-glow');
    });
    return () => {
      links.forEach((el) => el.classList.remove('ai-nav-glow'));
    };
  }, [navHint]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = true;
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: width, h: height };
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const newW = Math.max(260, Math.min(800, resizeStartRef.current.w + (ev.clientX - resizeStartRef.current.x)));
      const newH = Math.max(300, Math.min(800, resizeStartRef.current.h + (ev.clientY - resizeStartRef.current.y)));
      setWidth(newW);
      setHeight(newH);
    };
    const onMouseUp = () => { resizingRef.current = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [width, height]);

  const askQuestion = useCallback(async (query: string): Promise<string | null> => {
    const role = user?.role;
    if (workerStatus === 'loading' || usingFallback || workerStatus === 'error' || workerStatus === 'unsupported') {
      const result = keywordMatch(query, role, pathname);
      setNavHint(result.navHint || null);
      return result.answer;
    }
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (pendingResolveRef.current === resolve) {
          pendingResolveRef.current = null;
          const result = keywordMatch(query, role, pathname);
          setNavHint(result.navHint || null);
          resolve(result.answer);
        }
      }, 10000);
      pendingResolveRef.current = (val: string | null) => {
        clearTimeout(timeout);
        resolve(val);
      };
      workerRef.current?.postMessage({
        type: 'query',
        data: { query, role, currentPage: pathname },
      });
    });
  }, [usingFallback, workerStatus, user?.role, pathname]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setNavHint(null);

    const answer = await askQuestion(q);

    if (answer) {
      setMessages((prev) => [...prev, { role: 'assistant', text: answer, navHint: navHint || undefined }]);
    } else {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `I couldn't find a specific answer to that. Try asking about: creating events, approving RSVPs, managing programs, handling donations, or other dashboard features.`,
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = [
    'How do I create an event?',
    'How do I approve enrollments?',
    'How do I manage pledges?',
  ];

  const botDisabled = workerStatus === 'error' || workerStatus === 'unsupported';

  const retryWorker = useCallback(() => {
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    setWorkerStatus('unloaded');
    setWorkerError('');
    setUsingFallback(false);
    setLoading(false);
    try {
      const worker = new Worker('/ai-worker.js');
      workerRef.current = worker;
      const timeout = setTimeout(() => {
        if (workerRef.current && workerStatus !== 'ready' && workerStatus !== 'error') {
          worker.terminate();
          workerRef.current = null;
          setWorkerStatus('error');
          setWorkerError('Model load timed out.');
          setUsingFallback(true);
        }
      }, 60000);
      initTimeoutRef.current = timeout;
      worker.onmessage = (event) => {
        const { type, status, error, bestMatch } = event.data;
        if (type === 'init-status') {
          if (status === 'loading') setWorkerStatus('loading');
          else if (status === 'ready') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('ready');
            setLoading(false);
          } else if (status === 'error') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('error');
            setWorkerError(error || 'Unknown error');
            setUsingFallback(true);
            setLoading(false);
          }
        } else if (type === 'result') {
          setLoading(false);
          if (pendingResolveRef.current) {
            const answer = bestMatch ? bestMatch.item.a : null;
            setNavHint(bestMatch && bestMatch.item.pages?.[0] ? bestMatch.item.pages[0] : null);
            pendingResolveRef.current(answer);
            pendingResolveRef.current = null;
          }
        } else if (type === 'error') {
          setLoading(false);
          if (pendingResolveRef.current) {
            pendingResolveRef.current(null);
            pendingResolveRef.current = null;
          }
        }
      };

      worker.onerror = (err) => {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        setWorkerStatus('error');
        setWorkerError(err.message || 'Worker failed');
        setUsingFallback(true);
        setLoading(false);
      };
      worker.postMessage({ type: 'init', data: { knowledgeBase } });
    } catch (err: any) {
      setWorkerStatus('unsupported');
      setWorkerError('Web Workers not supported.');
      setUsingFallback(true);
    }
  }, [workerStatus]);

  return (
    <>
      <button
        onClick={() => { const next = !openRef.current; openRef.current = next; setOpen(next); }}
        style={{ zIndex: 9999 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-mhma-forest text-white rounded-full shadow-lg hover:bg-mhma-forest-mid transition-all hover:scale-110 flex items-center justify-center"
        aria-label="AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" />
          <div ref={panelRef}
            style={{ width: `${width}px`, height: `${height}px` }}
            className="fixed bottom-24 right-6 z-50 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative">
            <div className="bg-mhma-forest text-white px-4 py-3 flex items-center gap-2 shrink-0">
              <Bot className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-bold text-sm">MHMA Assistant</p>
                <p className="text-[10px] text-white/70">
                  {workerStatus === 'loading' && 'Downloading ML model (~23MB)...'}
                  {workerStatus === 'ready' && 'Transformers.js ML · Offline'}
                  {(workerStatus === 'error' || workerStatus === 'unsupported') && 'Keyword matching · Offline'}
                  {workerStatus === 'unloaded' && 'Initializing...'}
                </p>
              </div>
              {workerStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-white/70" />}
              {botDisabled && <button onClick={retryWorker} title="Retry ML model" className="text-white/70 hover:text-white ml-1"><RefreshCw className="w-3.5 h-3.5" /></button>}
              <button onClick={handleClose} className="text-white/70 hover:text-white ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-mhma-forest text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      {msg.text}
                      {msg.navHint && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-semibold uppercase text-mhma-gold">
                          <Navigation className="w-3 h-3" /> Go to {msg.navHint.split('/').pop() || msg.navHint}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide font-medium">Try asking:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => setInput(s)}
                        className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-mhma-forest hover:text-white transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 p-3 flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Ask about dashboard features..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none"
                  disabled={loading} />
                <button onClick={handleSend} disabled={loading || !input.trim()}
                  className="w-9 h-9 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-mid transition-colors flex items-center justify-center disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
          <div onMouseDown={handleResizeStart} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
            <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-400 absolute bottom-0.5 right-0.5"><path d="M10 0v10H0" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
          </div>
          </div>
        </>
      )}
    </>
  );
}

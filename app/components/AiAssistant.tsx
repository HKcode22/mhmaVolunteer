'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, AlertCircle, RefreshCw, Navigation, GripVertical } from 'lucide-react';
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

function ngrams(tokens: string[], n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    result.push(tokens.slice(i, i + n).join(' '));
  }
  return result;
}

const stopWords = new Set(['the','a','an','is','are','was','were','be','been','have','has','had',
  'do','does','did','will','would','can','could','may','might','shall','should','to','of','in',
  'for','on','with','at','by','from','as','into','through','during','before','after','above',
  'below','between','out','off','over','under','again','further','then','once','here','there',
  'when','where','why','how','all','each','every','both','few','more','most','other','some',
  'such','no','nor','not','only','own','same','so','than','too','very','just','about','up',
  'and','but','or','if','because','what','which','who','whom','this','that','these','those',
  'it','its','my','your','his','her','our','their']);

function getTokens(text: string): string[] {
  return tokenize(text).filter((w) => !stopWords.has(w));
}

function matchTokens(qFiltered: string[], kTokens: string[]): number {
  let matched = 0;
  for (const qWord of qFiltered) {
    const hit = kTokens.some((kt) => {
      if (qWord === kt) return true;
      if (qWord.length >= 4 && kt.length >= 4) {
        return kt.includes(qWord) || qWord.includes(kt);
      }
      if (qWord.length >= 3 && kt.length >= 3 && (kt.startsWith(qWord) || qWord.startsWith(kt))) return true;
      return false;
    });
    if (hit) matched++;
  }
  return matched;
}

// Precompute rarity weights for knowledge base keywords
const kwRarity = new Map<string, number>();
const totalItems = knowledgeBase.length;
for (const item of knowledgeBase) {
  const kw = [...item.keywords, ...tokenize(item.q)].map((k) => k.toLowerCase());
  const uniqueKws = Array.from(new Set(kw));
  for (const k of uniqueKws) {
    kwRarity.set(k, (kwRarity.get(k) || 0) + 1);
  }
}

function keywordMatch(
  query: string,
  role?: string,
  page?: string,
  lastQuery?: string,
  lastTopic?: { q: string; a: string; keywords: string[]; pages?: string[]; roles?: string[]; denyRoles?: string[] } | null,
): { answer: string | null; navHint?: string; suggestions?: string[] } {
  const qFiltered = getTokens(query);
  if (qFiltered.length === 0) return { answer: null };

  let bestScore = 0;
  let bestItem: typeof knowledgeBase[number] | null = null;
  const scored: { score: number; item: typeof knowledgeBase[number] }[] = [];

  function scoreItem(item: typeof knowledgeBase[number], tokens: string[]): { score: number; matched: number } {
    const kw = [...item.keywords, ...tokenize(item.q)];
    const kTokens = Array.from(new Set(kw.map((k) => k.toLowerCase())));
    if (kTokens.length === 0) return { score: 0, matched: 0 };
    const matched = matchTokens(tokens, kTokens);
    if (matched === 0) return { score: 0, matched: 0 };
    let score = matched / Math.max(kTokens.length, tokens.length);
    if (role && item.roles?.includes(role as any)) score += 0.12;
    if (page && item.pages?.includes(page)) score += 0.08;
    if (lastTopic && item === lastTopic) score += 0.1;
    return { score, matched };
  }

  // First pass: match against current query
  for (const item of knowledgeBase) {
    if (item.denyRoles && role && item.denyRoles.includes(role as any)) continue;
    const { score, matched } = scoreItem(item, qFiltered);
    if (matched > 0) {
      scored.push({ score, item });
      if (score > 0.15 && score > bestScore) { bestScore = score; bestItem = item; }
    }
  }

  // Second pass: if no good match, merge with last query tokens
  if (!bestItem && lastQuery) {
    const lastTokens = getTokens(lastQuery);
    const merged = Array.from(new Set([...lastTokens, ...qFiltered]));
    for (const item of knowledgeBase) {
      if (item.denyRoles && role && item.denyRoles.includes(role as any)) continue;
      const { score, matched } = scoreItem(item, merged);
      if (matched > 0) {
        scored.push({ score, item });
        if (score > 0.12 && score > bestScore) { bestScore = score; bestItem = item; }
      }
    }
  }

  if (!bestItem) {
    scored.sort((a, b) => b.score - a.score);
    const topSuggestions = scored.slice(0, 3).map((s) => s.item.q);
    return { answer: null, suggestions: topSuggestions.length > 0 ? topSuggestions : undefined };
  }

  return { answer: bestItem.a, navHint: bestItem.pages?.[0] };
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your MHMA assistant. Ask me anything about the dashboard." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [navHint, setNavHint] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('unsupported');
  const [workerError, setWorkerError] = useState('');
  const [usingFallback, setUsingFallback] = useState(true);
  const [width, setWidth] = useState(360);
  const [height, setHeight] = useState(500);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const widthRef = useRef(360);
  const heightRef = useRef(500);
  const posXRef = useRef(0);
  const posYRef = useRef(0);
  const lastQueryRef = useRef('');
  const lastNavHintRef = useRef('');
  const topicRef = useRef<{ q: string; a: string; keywords: string[]; pages?: string[]; roles?: string[]; denyRoles?: string[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingResolveRef = useRef<((value: string | null) => void) | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const resizeRef = useRef({ resizing: false, edge: '', startX: 0, startY: 0, startW: 360, startH: 500, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { heightRef.current = height; }, [height]);
  useEffect(() => { posXRef.current = posX; }, [posX]);
  useEffect(() => { posYRef.current = posY; }, [posY]);

  useEffect(() => {
    localStorage.setItem('mhma_ai_open', open.toString());
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

  useEffect(() => {
    const saved = localStorage.getItem('mhma_ai_open');
    if (saved === 'true') setOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('mhma_ai_open', open.toString());
  }, [open]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    resizeRef.current.resizing = false;
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: posXRef.current, startPosY: posYRef.current };
    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      setPosX(dragRef.current.startPosX + (ev.clientX - dragRef.current.startX));
      setPosY(dragRef.current.startPosY + (ev.clientY - dragRef.current.startY));
    };
    const onMouseUp = () => { dragRef.current.dragging = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const handleResizeStart = useCallback((edge: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current.dragging = false;
    const startW = widthRef.current;
    const startH = heightRef.current;
    const startPosX = posXRef.current;
    const startPosY = posYRef.current;
    resizeRef.current = { resizing: true, edge, startX: e.clientX, startY: e.clientY, startW, startH, startPosX, startPosY };
    const onMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current.resizing) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      const newW = Math.max(260, Math.min(800, resizeRef.current.startW + dx));
      const newH = Math.max(300, Math.min(800, resizeRef.current.startH + dy));
      widthRef.current = newW;
      heightRef.current = newH;
      setWidth(newW);
      setHeight(newH);
    };
    const onMouseUp = () => { resizeRef.current.resizing = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  const askQuestion = useCallback(async (query: string): Promise<{ answer: string | null; suggestions?: string[] }> => {
    const role = user?.role;
    const result = keywordMatch(query, role, pathname, lastQueryRef.current, topicRef.current);
    setNavHint(result.navHint || null);
    lastQueryRef.current = query;
    lastNavHintRef.current = result.navHint || '';
    if (result.answer) {
      const found = knowledgeBase.find((k) => k.a === result.answer);
      if (found) topicRef.current = found;
    }
    return { answer: result.answer, suggestions: result.suggestions };
  }, [user?.role, pathname]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    setNavHint(null);

    const { answer, suggestions } = await askQuestion(q);

    if (answer) {
      setMessages((prev) => [...prev, { role: 'assistant', text: answer, navHint: lastNavHintRef.current || undefined }]);
    } else if (suggestions && suggestions.length > 0) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `I couldn't find a specific answer. You might want to try asking about one of these:\n• ${suggestions.join('\n• ')}`,
      }]);
    } else {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `I couldn't find a specific answer to that. Try asking about: creating events, approving RSVPs, managing programs, handling donations, pledges, members, construction, analytics, notifications, or dashboard features.`,
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = [
    'How do I create an event?',
    'How do I approve enrollments?',
    'How do I manage pledges?',
  ];

  /* ─── Transformers.js Worker (disabled for now, uncomment to re-enable) ───
  useEffect(() => {
    try {
      const worker = new Worker('/ai-worker.js');
      workerRef.current = worker;
      const timeout = setTimeout(() => {
        if (workerRef.current) {
          worker.terminate();
          workerRef.current = null;
          setWorkerStatus('error');
          setWorkerError('Model load timed out.');
        }
      }, 20000);
      initTimeoutRef.current = timeout;
      worker.onmessage = (event) => {
        const { type, status, error, bestMatch } = event.data;
        if (type === 'init-status') {
          if (status === 'loading') setWorkerStatus('loading');
          else if (status === 'ready') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('ready');
            setUsingFallback(false);
          } else if (status === 'error') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('error');
            setWorkerError(error || 'Unknown error');
          }
        } else if (type === 'result') {
          if (pendingResolveRef.current) {
            const answer = bestMatch ? bestMatch.item.a : null;
            setNavHint(bestMatch && bestMatch.item.pages?.[0] ? bestMatch.item.pages[0] : null);
            pendingResolveRef.current(answer);
            pendingResolveRef.current = null;
          }
        } else if (type === 'error') {
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
      };
      worker.postMessage({ type: 'init', data: { knowledgeBase } });
    } catch (err: any) {
      setWorkerStatus('unsupported');
      setWorkerError('Web Workers not supported.');
    }
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    };
  }, []);
  ─────────────────────────────────────────── */

  return (
    <>
      <button
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        style={{ zIndex: 9999 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-mhma-forest text-white rounded-full shadow-lg hover:bg-mhma-forest-mid transition-all hover:scale-110 flex items-center justify-center"
        aria-label="AI Assistant"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      <div ref={panelRef}
        style={{
          display: open ? 'flex' : 'none',
          width: width ? `${width}px` : '360px',
          height: minimized ? 'auto' : height ? `${height}px` : '500px',
          transform: posX || posY ? `translate(${posX}px, ${posY}px)` : undefined,
        }}
        className="fixed bottom-24 right-6 z-50 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        onWheel={(e) => e.stopPropagation()}>
        {/* Bottom-right corner resize handle */}
        <div onMouseDown={handleResizeStart('se')} className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute bottom-0.5 right-0.5 text-gray-400"><path d="M20 20L12 20L20 12Z" fill="currentColor"/><path d="M20 20L16 20L20 16Z" fill="currentColor"/></svg>
        </div>
        <div className="bg-mhma-forest text-white px-4 py-3 flex items-center gap-2 shrink-0">
          <div onMouseDown={handleDragStart} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded transition-colors" title="Drag to move"><GripVertical className="w-4 h-4 text-white/60" /></div>
          <Bot className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">MHMA Assistant</p>
            <p className="text-[10px] text-white/70 truncate">
              Fallback • Active
            </p>
          </div>
          <button onClick={() => setMinimized((p) => !p)} className="text-white/70 hover:text-white ml-1 shrink-0">
            <span className="text-lg leading-none block w-4 h-4 text-center">{minimized ? '+' : '−'}</span>
          </button>
          <button onClick={handleClose} className="text-white/70 hover:text-white ml-1 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!minimized && (
        <>
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

        {messages.length === 1 && suggestions && suggestions.length > 0 && (
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

        <div className="border-t border-gray-200 p-3 flex gap-2 items-end">
          <textarea value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} placeholder="Ask about dashboard features..."
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-mhma-gold outline-none resize-none max-h-32"
            disabled={loading}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 128) + 'px';
            }} />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="w-9 h-9 bg-mhma-forest text-white rounded-xl hover:bg-mhma-forest-mid transition-colors flex items-center justify-center disabled:opacity-50 shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        </>
        )}
      </div>
    </>
  );
}

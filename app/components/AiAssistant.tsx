'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, AlertCircle, RefreshCw, Navigation, GripVertical } from 'lucide-react';
import { knowledgeBase } from '@/app/lib/assistant-knowledge';
// import { fetchLiveData, formatLiveContext, clearLiveCache } from '@/app/lib/live-knowledge';
// import { fetchKnowledgeDocs, KnowledgeDoc } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

type WorkerStatus = 'unloaded' | 'loading' | 'ready' | 'error' | 'unsupported';

interface Retrievable {
  question: string;
  answer: string;
  keywords: string[];
  roleAccess?: string[];
  denyRoles?: string[];
}

/* ─── RAG Retriever: keyword + fuzzy search over any doc array ─── */
function charOverlap(a: string, b: string): number {
  let ai = 0, bi = 0, matches = 0;
  while (ai < a.length && bi < b.length) {
    if (a[ai] === b[bi]) { matches++; ai++; bi++; }
    else if (a.length - ai > b.length - bi) ai++;
    else bi++;
  }
  return matches / Math.max(a.length, b.length);
}

function wordMatchesQuery(word: string, queryWord: string): boolean {
  if (word.includes(queryWord) || queryWord.includes(word)) return true;
  if (word.startsWith(queryWord) || queryWord.startsWith(word)) return true;
  if (word.length < 3 || queryWord.length < 3) return false;
  return charOverlap(word, queryWord) >= 0.65;
}

function retrieveFromDocs(docs: Retrievable[], query: string, role?: string): string {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 1);
  if (q.length === 0) return '';

  const scored: { doc: Retrievable; score: number; matched: number }[] = [];

  for (const doc of docs) {
    if (doc.denyRoles && role && doc.denyRoles.includes(role)) continue;

    const searchWords = [...doc.keywords, doc.question.toLowerCase()]
      .join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 1);

    let matched = 0;
    for (const queryWord of q) {
      if (searchWords.some(sw => wordMatchesQuery(sw, queryWord))) matched++;
    }
    if (matched === 0) continue;

    let score = matched / Math.max(q.length, 1);
    if (role && doc.roleAccess?.includes(role)) score += 0.15;

    // Require a meaningful match: score >= 0.3 and at least 2 words matched
    // (or 1 word matched if the query has only 1-2 words and score is high enough)
    const minMatch = q.length <= 2 ? 1 : 2;
    if (matched < minMatch) continue;

    scored.push({ doc, score, matched });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((s) => s.doc.question + '\n' + s.doc.answer).join('\n---\n');
}

function retrieve(query: string, role?: string): string {
  return retrieveFromDocs(
    knowledgeBase.map(k => ({ question: k.q, answer: k.a, keywords: k.keywords, roleAccess: k.roles, denyRoles: k.denyRoles })),
    query,
    role
  );
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your MHMA assistant. Ask me anything about the dashboard." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingMapRef = useRef<Map<string, (value: string | null) => void>>(new Map());
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workerReadyRef = useRef(false);
  const usingFallbackRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
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
    const saved = localStorage.getItem('mhma_ai_open');
    if (saved === 'true') setOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('mhma_ai_open', open.toString());
  }, [open]);

  // [DEPRECATED] Firestore-based knowledge docs — using static assistant-knowledge.ts only
  // useEffect(() => {
  //   fetchKnowledgeDocs(200).then(docs => {
  //     setFirestoreDocs(docs);
  //     firestoreDocsRef.current = docs;
  //   }).catch(() => {});
  // }, []);

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

/* ─── RAG Pipeline: retrieve context → send to AI model ─── */

const GREETING_WORDS = ['hi', 'hello', 'hey', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'whats up', 'what\'s up'];
const IDENTITY_WORDS = ['who are you', 'who r u', 'what are you', 'what r u', 'tell me about yourself', 'your name', 'what is your name'];
const NONSENSE_WORDS = ['kutti', 'eat paper', 'grow branches', 'poop', 'poopoo', 'peepee', 'butt', 'fart'];
const MATH_PATTERN = /^[\d\s\+\-\*\/\(\)]+$/;

function isGreeting(q: string): boolean {
  const lower = q.toLowerCase().trim();
  if (GREETING_WORDS.includes(lower)) return true;
  if (lower.length <= 3 && GREETING_WORDS.some(g => g.startsWith(lower))) return true;
  return false;
}

function isIdentity(q: string): boolean {
  const lower = q.toLowerCase().trim();
  return IDENTITY_WORDS.some(w => lower.includes(w));
}

function isNonsense(q: string): boolean {
  const lower = q.toLowerCase().trim();
  return NONSENSE_WORDS.some(w => lower.includes(w));
}

function isMath(q: string): boolean {
  const cleaned = q.replace(/\s/g, '');
  if (MATH_PATTERN.test(cleaned) && cleaned.length >= 3) return true;
  const lower = q.toLowerCase().trim();
  if (/^(what is|whats|what's|calculate|how much is)\s/.test(lower) && /[\d]/.test(lower)) return true;
  return false;
}

function countQuestions(q: string): number {
  const matches = q.match(/[?]/g);
  return matches ? matches.length : 0;
}

const cannedResponse = (query: string): string | null => {
  if (isIdentity(query)) {
    return "I'm the MHMA Assistant — a local AI that answers questions about the MHMA website and dashboard. I can help with navigating pages, managing events, programs, donations, and more. Try asking 'How do I create an event?'";
  }
  if (isGreeting(query)) {
    return "Hi there! I'm the MHMA Assistant. I can help you with the dashboard, events, programs, donations, and navigating the website. What would you like to know?";
  }
  if (isMath(query)) {
    return "I'm designed to answer questions about the MHMA website and dashboard, not math problems. Try asking 'How do I create an event?' or 'Show me the programs page'.";
  }
  if (isNonsense(query)) {
    return "I can't help with that. I'm an assistant for the MHMA website. Try asking about events, programs, or dashboard features.";
  }
  if (countQuestions(query) >= 4) {
    return "That's a lot of questions! Could you ask them one at a time so I can give you a clear answer for each?";
  }
  return null;
};

  const askQuestion = useCallback(async (query: string): Promise<{ answer: string | null }> => {
    const workerReady = workerReadyRef.current && !!workerRef.current;

    // Check for canned responses first (greetings, nonsense, math, etc.)
    const canned = cannedResponse(query);
    if (canned) {
      return { answer: canned };
    }

    if (workerReady && usingFallbackRef.current === false) {
      // Retrieve context from static knowledge base only
      const role = user?.role;
      const context = retrieve(query, role);

      if (!context) {
        return { answer: "I don't have information about that. Try asking about events, programs, or dashboard features." };
      }

      // Send query + context to the AI worker
      const qid = Math.random().toString(36).slice(2, 8);
      const aiPromise = new Promise<string | null>((resolve) => {
        pendingMapRef.current.set(qid, resolve);
        workerRef.current?.postMessage({ type: 'query', data: { query, context, id: qid } });
      });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => {
        if (pendingMapRef.current.has(qid)) {
          pendingMapRef.current.delete(qid);
          resolve(null);
        }
      }, 60000));
      const aiAnswer = await Promise.race([aiPromise, timeoutPromise]);
      if (aiAnswer) {
        return { answer: aiAnswer };
      }
    }
    return { answer: null };
  }, [user?.role]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    const { answer } = await askQuestion(q);

    if (answer) {
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }]);
    } else {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: `I'm having trouble answering that right now. Try rephrasing your question.`,
      }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = [
    'How do I create an event?',
    'How do I approve enrollments?',
    'How do I manage pledges?',
  ];

  /* ─── SmolLM2 Worker ─── */
  useEffect(() => {
    try {
      const worker = new Worker('/ai-worker.js', { type: 'module' });
      workerRef.current = worker;
      const timeout = setTimeout(() => {
        if (workerRef.current) {
          worker.terminate();
          workerRef.current = null;
          setWorkerStatus('error');
          setWorkerError('Model load timed out.');
        }
      }, 60000);
      initTimeoutRef.current = timeout;
      worker.onmessage = (event) => {
        const { type, status, error, answer, id } = event.data;
        if (type === 'status') {
          if (status === 'loading') setWorkerStatus('loading');
          else if (status === 'ready') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            workerReadyRef.current = true;
            usingFallbackRef.current = false;
            setWorkerStatus('ready');
            setUsingFallback(false);
          } else if (status === 'error') {
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            setWorkerStatus('error');
            setWorkerError(error || 'Unknown error');
          }
        } else if (type === 'result') {
          const resolve = id ? pendingMapRef.current.get(id) : null;
          console.log('[Assistant] onmessage result id=' + id + ' found=' + !!resolve + ' answer:', answer?.slice(0, 60));
          if (resolve) {
            resolve(answer || null);
            pendingMapRef.current.delete(id!);
          } else {
            console.log('[Assistant] ORPHANED result id=' + id);
          }
        }
      };
      worker.onerror = (err) => {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        setWorkerStatus('error');
        setWorkerError(err.message || 'Worker failed');
      };
    } catch (err: any) {
      setWorkerStatus('unsupported');
      setWorkerError('Web Workers not supported.');
    }
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    };
  }, []);

  return (
    <>
      <button
        onClick={() => { setOpen((prev) => !prev); }}
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
        <div onMouseDown={handleResizeStart('se')} className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20">
          <svg viewBox="0 0 24 24" className="w-4 h-4 absolute bottom-0.5 right-0.5 text-gray-400"><path d="M20 20L12 20L20 12Z" fill="currentColor"/><path d="M20 20L16 20L20 16Z" fill="currentColor"/></svg>
        </div>
        <div className="bg-mhma-forest text-white px-4 py-3 flex items-center gap-2 shrink-0">
          <div onMouseDown={handleDragStart} className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded transition-colors" title="Drag to move"><GripVertical className="w-4 h-4 text-white/60" /></div>
          <Bot className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">MHMA Assistant</p>
            <p className="text-[10px] text-white/70 truncate">
              {workerStatus === 'ready' ? 'AI • Ready' : workerStatus === 'loading' ? 'Initializing micro-AI (~90MB)...' : workerStatus === 'error' ? 'AI unavailable' : 'Fallback • Active'}
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
          <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
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

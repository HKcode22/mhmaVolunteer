'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, Bot, GripVertical } from 'lucide-react';
import { knowledgeBase, QAItem } from '@/app/lib/assistant-knowledge';
import { useAuth } from '@/lib/auth-context';
import { usePageData } from '@/lib/page-data-context';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface Retrievable {
  question: string;
  answer: string;
  keywords: string[];
  roleAccess?: string[];
  denyRoles?: string[];
}

/* ─── Stop words: common English words that don't carry topic meaning ─── */
const STOP_WORDS = new Set([
  'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whom', 'whose',
  'are', 'is', 'am', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'doing', 'done',
  'have', 'has', 'had', 'having',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'down', 'into', 'onto',
  'and', 'or', 'but', 'if', 'so', 'as', 'than', 'then', 'else',
  'no', 'not', 'nor', 'neither', 'either', 'both',
  'isnt', 'arent', 'wasnt', 'werent', 'dont', 'doesnt', 'didnt', 'cant', 'couldnt', 'wont', 'wouldnt', 'shouldnt', 'havent', 'hasnt', 'hadnt',
  'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t', 'don\'t', 'doesn\'t', 'didn\'t', 'can\'t', 'couldn\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t', 'haven\'t', 'hasn\'t', 'hadn\'t',
  'its', 'itself', 'themselves', 'yourself', 'myself',
  'about', 'above', 'after', 'again', 'all', 'am', 'any', 'because', 'before',
  'between', 'each', 'few', 'here', 'just', 'like', 'more', 'most', 'much',
  'only', 'other', 'out', 'over', 'same', 'some', 'such', 'there', 'through',
  'too', 'under', 'very', 'while', 'still',
]);

/* ─── Canned responses for off-topic queries ─── */
const IDENTITY_WORDS = ['who are you', 'who r u', 'who are u', 'what are you', 'what r u', 'what are u', 'tell me about yourself', 'your name', 'what is your name', 'what\'s your name', 'who am i speaking to'];
const WHERE_WORDS = ['where are you', 'where r u', 'where are u', 'where is your office', 'where is your location', 'where r u located', 'where is the ai'];
const MATH_PATTERN = /^[\d\s\+\-\*\/\(\)]+$/;

function cannedResponse(query: string, user?: { displayName?: string | null; role?: string } | null): string | null {
  const lower = query.toLowerCase().trim();
  if (WHERE_WORDS.some(w => lower.includes(w))) {
    console.log('[AI] Canned match: where_am_i');
    return "I'm in your browser! I'm running inside this webpage as a local AI. I don't have a physical location.";
  }
  if (IDENTITY_WORDS.some(w => lower.includes(w))) {
    console.log('[AI] Canned match: identity');
    return "I'm the MHMA Assistant — I answer questions about the MHMA website and dashboard. I can help with navigating pages, managing events, programs, donations, and more. Try asking 'How do I create an event?'";
  }
  if (lower.includes('do you know who i am') || lower.includes('do u know who i am') || lower.includes('d u know who i am')) {
    console.log('[AI] Canned match: do_u_know_who_i_am');
    if (user?.displayName) {
      return `I can see you're logged in as ${user.displayName}, but I don't store personal information. You can check your profile by clicking PROFILE in the top nav.`;
    }
    return "I don't know who you are — I don't have access to that information. If you're logged in, click PROFILE in the top navigation bar to see your account details.";
  }
  if (lower.includes('am i a member') || lower.includes('am i a board member') || lower.includes('what is my role') || lower.includes('whats my role') || lower.includes("what's my role")) {
    console.log('[AI] Canned match: check_role');
    if (user?.role === 'board_member' || user?.role === 'administrator') {
      return `You're logged in as a board member. You can access the Dashboard by clicking DASHBOARD in the top nav. There you can manage events, programs, members, and more.`;
    }
    if (user?.role === 'member') {
      return `You're logged in as a regular member. You can browse events, enroll in programs, RSVP, donate, and manage your profile. Board-specific features like the Dashboard are not available to regular members.`;
    }
    return "I can't determine your role. If you're logged in, check your profile by clicking PROFILE in the top navigation bar. Your role will be shown there.";
  }
  if (lower.includes('where do i click') || lower.includes('where do i go') || lower.includes('where to click') || lower.includes('i cant find') || lower.includes("i can't find") || lower.includes('dont see it') || lower.includes("don't see it") || lower.includes("can't see it") || lower.includes('cant see it') || lower.includes('where is the button') || lower.includes('where is button') || lower.includes('where is the link') || lower.includes('take my mouse')) {
    console.log('[AI] Canned match: navigation_help');
    return "The navigation menu is at the very top of the page. Look for the dark green bar with white text. 'DASHBOARD' is on the right side (board members only). Other links include 'PROGRAMS', 'EVENTS', 'NEWS', 'CONTACT', and 'DONATE'. If you're on a phone, tap the hamburger menu (☰) icon to see all options.";
  }
  if (['hi', 'hello', 'hey', 'yo', 'sup', 'howdy', 'greetings', 'whats up', "what's up", 'good morning', 'good afternoon', 'good evening'].includes(lower)) {
    console.log('[AI] Canned match: greeting');
    return "Hi there! I'm the MHMA Assistant. I can help you with the dashboard, events, programs, donations, and navigating the website. What would you like to know?";
  }
  if (['what', 'huh', 'ok', 'okay', 'test test', 'test'].includes(lower)) {
    console.log('[AI] Canned match: short_ok');
    return "I can help with MHMA website questions. Try 'How do I create an event?' or 'Go to the programs page'.";
  }
  if (lower.includes('kutti') || lower.includes('eat paper') || lower.includes('grow branches') || lower.includes('poop') || lower.includes('fart') || lower.includes('butt') || lower.includes('peepee') || lower.includes('sex') || lower.includes('kutta') || lower.includes('billy')) {
    console.log('[AI] Canned match: nonsense');
    return "I can't help with that. I'm an assistant for the MHMA website. Try asking about events, programs, or dashboard features.";
  }
  if (lower.includes('dont understand') || lower.includes("don't understand") || lower.includes('not helping') || lower.includes('not understanding') || lower.includes('not making sense')) {
    console.log('[AI] Canned match: confusion');
    return "Let me try again. I can answer questions about the MHMA website. Try: 'How do I create an event?' or 'Show me the programs page'.";
  }
  if ((lower.startsWith('what is ') || lower.startsWith('whats ') || lower.startsWith("what's ")) && /[\d]/.test(lower)) {
    console.log('[AI] Canned match: what_is_number');
    return "I'm designed to answer questions about the MHMA website and dashboard, not math problems. Try asking 'How do I create an event?' or 'Show me the programs page'.";
  }
  const cleaned = query.replace(/\s/g, '');
  if (MATH_PATTERN.test(cleaned) && cleaned.length >= 3) {
    console.log('[AI] Canned match: math');
    return "I'm designed to answer questions about the MHMA website and dashboard, not math problems. Try asking 'How do I create an event?' or 'Show me the programs page'.";
  }
  if (lower.startsWith('what happens') || lower.startsWith('tell me about') && !lower.includes('dashboard') && !lower.includes('event') && !lower.includes('program') && !lower.includes('mhma')) {
    console.log('[AI] Canned match: off_topic_tell_me');
    return "I only know about the MHMA website and dashboard. Try asking about events, programs, or navigation.";
  }
  if (lower.includes('able to give') || lower.includes('another answer') || lower.includes('different answer') || lower.includes('give me another')) {
    console.log('[AI] Canned match: another_answer');
    return "I can only answer based on what I know. Try rephrasing your question or asking something specific like 'How do I create an event?' or 'How do I get to the dashboard?'";
  }
  if ((query.match(/[?]/g) || []).length >= 4) {
    console.log('[AI] Canned match: too_many_questions');
    return "That's a lot of questions! Could you ask them one at a time so I can give you a clear answer for each?";
  }
  return null;
}

/* ─── RAG Retriever: keyword match with stop word filtering ─── */
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

function retrieveFromDocs(docs: Retrievable[], query: string, role?: string): { context: string; score: number } {
  const raw = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 1);
  // Remove stop words — only keep meaningful words
  const q = raw.filter(w => !STOP_WORDS.has(w));
  console.log('[AI] retrieveFromDocs: query="' + query + '" raw=' + raw.length + ' meaningful=' + q.join(',') + ' role=' + (role || 'none'));
  if (q.length === 0) {
    console.log('[AI] retrieveFromDocs: all words were stop words, returning 0');
    return { context: '', score: 0 };
  }

  const scored: { doc: Retrievable; score: number; matchedMeaningful: number }[] = [];

  for (const doc of docs) {
    if (doc.denyRoles && role && doc.denyRoles.includes(role)) continue;

    const searchWords = [...doc.keywords, doc.question.toLowerCase()]
      .join(' ').toLowerCase().split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));

    let matched = 0;
    for (const queryWord of q) {
      if (searchWords.some(sw => wordMatchesQuery(sw, queryWord))) matched++;
    }
    if (matched === 0) continue;

    // Score = proportion of meaningful query words that matched
    let score = matched / Math.max(q.length, 1);
    if (role && doc.roleAccess?.includes(role)) score += 0.15;

    // Require at least 1 meaningful word matched for short queries, 2 for longer ones
    const minMatch = q.length <= 1 ? 1 : 2;
    if (matched < minMatch) continue;

    scored.push({ doc, score, matchedMeaningful: matched });
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    console.log('[AI] retrieveFromDocs: no entries matched, returning 0');
    return { context: '', score: 0 };
  }

  const topScore = scored[0].score;
  console.log('[AI] retrieveFromDocs: top_score=' + topScore.toFixed(3) + ' matches=' + scored.length + ' top_q="' + scored[0].doc.question + '"');
  const context = scored.slice(0, 2).map((s) => s.doc.question + '\n' + s.doc.answer).join('\n---\n');
  return { context, score: topScore };
}

function retrieve(query: string, role?: string): string {
  return retrieveFromDocs(
    knowledgeBase.map(k => ({ question: k.q, answer: k.a, keywords: k.keywords, roleAccess: k.roles, denyRoles: k.denyRoles })),
    query,
    role
  ).context;
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your MHMA assistant. Ask me anything about the dashboard." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { data: pageData } = usePageData();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const resizeRef = useRef({ resizing: false, edge: '', startX: 0, startY: 0, startW: 360, startH: 500, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { if (pageData.events || pageData.programs) console.log('[AI] Page data updated:', Object.keys(pageData)); }, [pageData]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { heightRef.current = height; }, [height]);
  useEffect(() => { posXRef.current = posX; }, [posX]);
  useEffect(() => { posYRef.current = posY; }, [posY]);

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

  /* ─── RAG Pipeline ─── */
  const askQuestion = useCallback(async (query: string): Promise<{ answer: string | null }> => {
    console.log('[AI] === New query ===', query, '| Role:', user?.role, '| User:', user?.displayName || '(not logged in)');

    // 1. Check canned responses first (pass user for identity-aware answers)
    const canned = cannedResponse(query, user);
    if (canned) {
      console.log('[AI] => Canned response:', canned.slice(0, 80) + '...');
      return { answer: canned };
    }

    // 1b. User-aware "who am i" — overrides KB with actual user data
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery === 'who am i' || lowerQuery === 'whoami' || lowerQuery === "who am i?") {
      if (user?.displayName) {
        const roleLabel = user.role === 'board_member' || user.role === 'administrator' ? 'board member' : 'member';
        console.log('[AI] => User-aware whoami: name=', user.displayName, 'role=', roleLabel);
        return { answer: `You are ${user.displayName}. You're logged in as a ${roleLabel}.${user.email ? ` Email: ${user.email}.` : ''} Click PROFILE in the top navigation bar to view or edit your profile.` };
      }
      if (user) {
        const roleLabel = user.role === 'board_member' || user.role === 'administrator' ? 'board member' : 'member';
        console.log('[AI] => User-aware whoami: no name, role=', roleLabel);
        return { answer: `You're logged in as a ${roleLabel}. Click PROFILE in the top navigation bar to view your account details.` };
      }
      console.log('[AI] => User-aware whoami: not logged in');
      return { answer: "You're not logged in. Click 'Member Login' in the top navigation bar to sign in." };
    }

    // 2. Retrieve context with score
    const role = user?.role;
    const { context, score } = retrieveFromDocs(
      knowledgeBase.map(k => ({ question: k.q, answer: k.a, keywords: k.keywords, roleAccess: k.roles, denyRoles: k.denyRoles })),
      query,
      role
    );
    console.log('[AI] RAG score:', score, '| Context length:', context.length, '| Role:', role);

    // 3. No context found
    if (!context) {
      console.log('[AI] => No context — returning I-dont-know');
      return { answer: "I don't have information about that. Try asking about events, programs, or dashboard features." };
    }

    // 4. High-confidence match (score >= 0.6): return raw KB answer directly
    //    KB entries are already written as complete answers — no AI needed
    if (score >= 0.6) {
      console.log('[AI] => High confidence, returning raw KB answer');
      const answerStart = context.indexOf('\n') + 1;
      if (answerStart > 0 && answerStart < context.length) {
        return { answer: context.slice(answerStart).replace(/^---\s*\n/, '') };
      }
      return { answer: context };
    }

    // 5. Medium-confidence match: try AI model to synthesize
    const workerReady = workerReadyRef.current && !!workerRef.current;
    console.log('[AI] => Medium confidence, worker ready:', workerReady);
    if (workerReady) {
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
        console.log('[AI] => AI model returned answer');
        return { answer: aiAnswer };
      }
      console.log('[AI] => AI model timed out or returned null');
    }

    // 6. Fallback: return raw answer anyway (better than nothing)
    console.log('[AI] => Falling back to raw context answer');
    const answerStart = context.indexOf('\n') + 1;
    if (answerStart > 0 && answerStart < context.length) {
      return { answer: context.slice(answerStart).replace(/^---\s*\n/, '') };
    }
    return { answer: context };
  }, [user]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    console.log('[AI] === handleSend === input="' + q + '" loading=' + loading + ' user=' + (user?.displayName || 'anon'));
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
    if (!loading && inputRef.current) inputRef.current.focus();
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = [
    'How do I create an event?',
    'How do I approve enrollments?',
    'How do I manage pledges?',
  ];

  /* ─── SmolLM2 Worker (for medium-confidence queries) ─── */
  useEffect(() => {
    console.log('[AI] Initializing SmolLM2 worker...');
    try {
      const worker = new Worker('/ai-worker.js', { type: 'module' });
      workerRef.current = worker;
      const timeout = setTimeout(() => {
        if (workerRef.current) {
          console.log('[AI] Worker init timeout (60s) — terminating');
          worker.terminate();
          workerRef.current = null;
        }
      }, 60000);
      initTimeoutRef.current = timeout;
      worker.onmessage = (event) => {
        const { type, status, answer, id } = event.data;
        if (type === 'status') {
          if (status === 'ready') {
            console.log('[AI] Worker ready');
            if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
            workerReadyRef.current = true;
          }
        } else if (type === 'result') {
          const resolve = id ? pendingMapRef.current.get(id) : null;
          if (resolve) {
            resolve(answer || null);
            pendingMapRef.current.delete(id!);
          }
        }
      };
      worker.onerror = (err) => {
        console.log('[AI] Worker error:', err.message);
      };
    } catch (e) {
      console.log('[AI] Worker creation failed:', e);
    }
    return () => {
      console.log('[AI] Cleaning up worker');
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

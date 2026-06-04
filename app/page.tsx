"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Heart, Users, MapPin, ChevronRight, BookText, Edit3 } from "lucide-react";
import { fetchEvents, fetchPrograms, fetchMasjidUpdates, fetchNews } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Navigation from "@/app/components/Navigation";
import NewsletterSignup from "@/app/components/NewsletterSignup";
import EventCalendar from "@/app/components/EventCalendar";
import { formatCompactAmount, formatCount } from "@/lib/stats-utils";
import StatCard from "@/app/components/StatCard";

/* ── Quran Verse (commented out per board request) ──
interface QuranVerse {
  text: string;
  translation: string;
  reference: string;
  arabic?: string;
}

const EXCLUSION_CATEGORIES = {
  historicalNarratives: [
    'when you were', 'remember when', 'and when', 'and recall', 'and [recall]',
    'indeed, we sent', 'we sent down', 'we revealed', 'we sent to', 'we gave him',
    'we saved', 'we destroyed', 'we punished', 'we took', 'we have sent',
    'as we sent down', 'as we revealed', 'when they entered', 'when they left',
    'when they fled', 'when they returned', 'when they fought', 'when they won',
    'when they lost', 'when they built', 'when they destroyed', 'when they worshipped',
    'when they prayed', 'when they disobeyed', 'when they believed', 'when they disbelieved',
    'when they denied', 'when they mocked', 'when they turned away', 'when they repented',
    'the day when', 'the night when', 'the time when', 'the story of', 'the account of',
    'the tale of', 'the incident when', 'the event when', 'the battle of', 'the siege of',
    'the conquest of', 'in days of old', 'in ancient times', 'in bygone eras',
    'in former times', 'in past generations', 'in times of ignorance', 'before the coming',
    'centuries ago', 'ages past', 'years ago', 'the day of battle', 'the day of war',
    'the day of judgement', 'the day when hearts', 'the hour of doom', 'the last hour',
    'the final hour', 'the end times', 'the latter days', 'the former days',
    'the first generation', 'the last generation', 'the age of ignorance', 'the time of ignorance',
    'when the earthquake', 'when the flood', 'when the storm', 'when the fire',
    'when the plague', 'when the drought', 'when the famine', 'when he drowned',
    'when he died', 'when he was killed', 'when he was slain', 'when he was crucified',
    'when they were destroyed', 'when they perished', 'when they were drowned',
    'when they were burned', 'when it was revealed', 'when it was sent down',
    'when this was said', 'when that was done'
  ],
  historicalPeopleGroups: [
    'people of lut', 'people of noah', 'people of ad', 'people of thamud',
    'people of pharaoh', 'people of abraham', 'people of moses', 'people of aaron',
    'people of lot', 'people of israel', 'children of israel', 'tribe of',
    'kingdom of', 'pharaoh', 'firon', 'nation of', 'family of', 'house of',
    'clan of', 'descendants of', 'followers of', 'companions of', 'believers among the',
    'unbelievers among the', 'rejecters among', 'pharaoh and his people',
    'the people of the town', 'dwellers of', 'inhabitants of the city',
    'companions of the cave', 'companions of the elephant', 'people of the ditch',
    'dwellers of the wood', 'fellowship of the cave', 'the cave', 'the ditch', 'the elephant'
  ],
  historicalProphets: [
    'prophet muhammad', 'prophet moses', 'prophet abraham', 'prophet noah',
    'prophet lot', 'prophet adam', 'prophet isaac', 'prophet jacob', 'prophet joseph',
    'prophet job', 'prophet jonah', 'prophet john', 'prophet jesus', 'prophet zachariah',
    'prophet elijah', 'prophet enoch', 'prophet idris', 'prophet saleh', 'prophet hud',
    'prophet shuayb', 'messenger muhammad', 'messenger of allah', 'abraham prayed',
    'moses said', 'noah said', 'lot said', 'jesus said', 'muhammad said'
  ],
  legalMatters: [
    'cut off', 'stoning', 'lash', 'lashing', 'flogging', 'punishment', 'penalty',
    'retribution', 'legal retribution', 'testimony', 'witnesses', 'four witnesses',
    'bring witnesses', 'produce witnesses', 'oath', 'vow', 'court', 'judge', 'justice',
    'legal', 'lawful', 'unlawful', 'inheritance law', 'divorce law', 'waiting period',
    'bring four witnesses', 'produce four witnesses', 'four witnesses testify',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'testimony of witnesses', 'oath of allah', 'vow to allah', 'court of law',
    'legal retribution', 'legal punishment', 'an eye for an eye', 'tooth for tooth',
    'life for life', 'blood money for', 'prescribed punishments', 'hadd punishments',
    'legal testimony', 'giving testimony', 'bear witness', 'witness bearing'
  ],
  warfareConflict: [
    'fight in the way', 'fight them', 'kill them', 'slay them', 'wherever you find',
    'wage war', 'against them', 'battle', 'sword', 'weapon', 'attack', 'strike', 'smite',
    'destroy', 'fighting in the cause', 'do not flee', 'battlefield', 'defend yourselves',
    'strike the necks', 'cut off hands', 'crucify them', 'capture them', 'lay siege',
    'besiege', 'ambush', 'raid', 'conquer', 'victory over', 'defeat of', 'casualties of',
    'prisoner of', 'war booty', 'fight them in', 'fight the way', 'kill them wherever',
    'slay them wherever', 'when you meet', 'when you encounter', 'strike their necks',
    'wage war against', 'battle of the', 'sword of allah', 'weapon of war',
    'strike the necks'
  ],
  privateMatters: [
    'sexual intercourse', 'fornicator', 'fornication', 'adultery', 'accuse their wives',
    'accuse chaste women', 'unmarried woman', 'unmarried man', 'found guilty',
    'approach', 'private parts', 'menstruation', 'menstruating', 'menstruate',
    'breast', 'naked', 'nude', 'marriage', 'divorce', 'wife', 'husband', 'virgin',
    'chastity', 'unlawful sexual', 'accuse chaste', 'bring four', 'private parts',
    'when women menstruate', 'during menstruation', 'breast feeding', 'found guilty'
  ],
  theologicalDebates: [
    'disbelievers', 'polytheists', 'hypocrites', 'unbelievers', 'infidels', 'idolaters',
    'disbelief', 'blasphemy', 'apostasy', 'people of the book', 'those who disbelieve',
    'those who reject', 'those who deny', 'mischief in the land', 'corruption on earth',
    'disbelievers will', 'hypocrites will', 'polytheists will', 'those who disbelieve',
    'those who reject', 'those who deny', 'infidels will', 'idolaters will',
    'blasphemy against', 'apostasy from islam', 'disbelief in allah', 'hypocrisy in faith'
  ],
  ritualProcedures: [
    'wash your faces', 'wash your hands', 'wipe your heads', 'wash your feet',
    'perform ablution', 'ritual washing', 'specific manner of prayer'
  ],
  dietaryDetails: [
    'forbidden to you', 'lawful for you', 'may eat', 'may not eat', 'carrion',
    'blood', 'pig flesh', 'slaughtered in name'
  ],
  financialRegulations: [
    'interest', 'usury', 'riba', 'business transaction', 'charitable obligation',
    'mandatory charity', 'zakat calculation'
  ]
};

// Build dynamic exclusion combinations with concatenation patterns
// This creates more comprehensive pattern matching for historical narratives
const buildExclusionCombinations = () => {
  const combinations: string[] = [
    // People groups - historical narratives
    'people of abraham', 'people of lot', 'people of noah', 'people of moses',
    'people of pharaoh', 'people of ad', 'people of thamud', 'people of madyan',
    'children of israel', 'pharaoh and his people', 'the people of the town',
    'dwellers of the town', 'inhabitants of the city', 'companions of the cave',
    'companions of the elephant', 'people of the ditch', 'dwellers of the wood',
    'fellowship of the cave', 'the cave', 'the ditch', 'the elephant',

    // Divine action patterns (historical)
    'when you were', 'and when the', 'and recall the', 'and [recall] the',
    'indeed we sent', 'we sent to', 'we sent down to', 'we revealed to',
    'we gave moses', 'we gave them', 'we saved them', 'we destroyed them',
    'we punished them', 'we took the', 'as we sent', 'as we revealed',

    // Legal/Warfare patterns
    'bring four witnesses', 'produce four witnesses', 'four witnesses testify',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'testimony of witnesses', 'oath of allah', 'vow to allah', 'court of law',
    'legal retribution', 'legal punishment', 'fight them in', 'fight the way',
    'kill them wherever', 'slay them wherever', 'when you meet', 'when you encounter',
    'strike their necks', 'strike the necks', 'wage war', 'wage war against',
    'battle of the', 'sword of allah', 'weapon of war',

    // Private matters
    'sexual intercourse', 'unlawful sexual', 'accuse chaste', 'bring four',
    'unmarried woman', 'unmarried man', 'private parts', 'when women menstruate',
    'during menstruation', 'breast feeding', 'found guilty',

    // Theological debates
    'people of the book', 'the people of the book', 'disbelievers will',
    'hypocrites will', 'polytheists will', 'those who disbelieve', 'those who reject',
    'those who deny', 'infidels will', 'idolaters will', 'mischief in the land',
    'corruption on earth',

    // Retribution patterns
    'an eye for an eye', 'tooth for tooth', 'life for life', 'blood money for',
    'prescribed punishments', 'hadd punishments', 'legal testimony', 'giving testimony',
    'bear witness', 'witness bearing',

    // Time/historical references
    'in days of old', 'in ancient times', 'in bygone eras', 'in former times',
    'in past generations', 'in times of ignorance', 'before the coming',
    'the day of battle', 'the day of war', 'the day of judgement', 'the day when hearts',
    'the hour of doom', 'the last hour', 'the final hour', 'the end times',
    'the latter days', 'the former days', 'the first generation', 'the last generation',
    'the age of ignorance', 'the time of ignorance',

    // Event-based historical patterns
    'when the earthquake', 'when the flood', 'when the storm', 'when the fire',
    'when the plague', 'when the drought', 'when the famine', 'when he drowned',
    'when he died', 'when he was killed', 'when he was slain', 'when he was crucified',
    'when they were destroyed', 'when they perished', 'when they were drowned',
    'when they were burned', 'when it was revealed', 'when it was sent down',
    'when this was said', 'when that was done',

    // Prophet story patterns (historical narratives about prophets)
    'then we sent', 'sent after them', 'moses and aaron', 'to pharaoh',
    'then the fish', 'the fish swallowed', 'while he was', 'he was blameworthy',
    'jonah was', 'yunus was', 'swallowed him',

    // Story/plan narrative patterns
    'and they planned', 'they planned a plan', 'we planned a plan',
    'while they perceived not', 'while they perceived', 'they perceived not',

    // Paradise descriptions that may be confusing out of context
    'no headache', 'they will have therefrom', 'nor will they be intoxicated',
    'will they be intoxicated', 'rivers of wine', 'rivers of milk',
    'rivers of honey', 'pure spouses', 'chaste spouses', 'couches',
    'green cushions', 'beautiful carpets', 'will be married', 'virgin',
    'beautiful of', 'large eyes', 'like pearls', 'is the male for you',
    'for him the female', 'maidens with', 'maidens of', 'youths of',
    'immortal youths', 'cups will be', 'circulated among them',

    // Out-of-context descriptions
    'is the male', 'the male for you', 'for him the female', 'allah gives you',
    'favors you above', 'above the worlds',

    // Historical incident patterns
    'when they came', 'when they said', 'when he said', 'when she said',
    'when they asked', 'when they came to', 'when he came to',
    'when she came to', 'when the messenger', 'when the prophet',

    // Group action patterns (historical)
    'they said to them', 'they said to him', 'they said to her',
    'he said to them', 'she said to them',

    // Location/setting based historical markers
    'in the city', 'in the town', 'in the village', 'at the sea',
    'in the desert', 'in the valley', 'on the mountain', 'in egypt',

    // Narrative transition markers
    'so when', 'and when', 'then when', 'therefore when',

    // Outcome/result patterns (historical endings)
    'so he was', 'so they were', 'thus he was', 'thus they were',
    'and he became', 'and they became', 'he remained', 'they remained',

    // Divine intervention in history
    'so we saved', 'so we rescued', 'thus we saved', 'therefore we saved',
    'so we destroyed', 'thus we destroyed', 'therefore we destroyed',

    // Animal/creation story patterns
    'the fish swallowed', 'the whale swallowed', 'the cow was',
    'the bird was', 'the ant said',

    // Dialogue markers in stories
    'answered him', 'replied to him', 'responded to him',
    'answered them', 'replied to them', 'responded to them',

    // Question/answer patterns in narratives
    'have you not', 'did you not', 'do you not see', 'do you not know',
    'did he not', 'did she not', 'did they not',

    // Challenge/dispute patterns
    'they disputed', 'they argued', 'they disagreed', 'the argument',
    'the dispute', 'the disagreement',

    // Prophethood narrative patterns
    'we appointed him', 'we chose him', 'we selected him',
    'we made him', 'we established him', 'we strengthened him',

    // Migration/journey narratives
    'when he migrated', 'when they migrated', 'when he left',
    'when they left', 'when he departed', 'when they departed',

    // Battle/war narratives (extended)
    'the day of', 'on the day', 'during the battle',
    'in the war', 'at the time of', 'the year of',

    // Victory/defeat narratives
    'defeated them', 'conquered them', 'overcame them',
    'was given victory', 'were given victory', 'triumph over',

    // Covenant/agreement narratives
    'they broke', 'he broke', 'they violated', 'he violated',
    'the covenant', 'the pledge', 'the promise',

    // Rejection/disbelief narratives (historical context)
    'they rejected', 'he rejected', 'they denied', 'he denied',
    'they refused', 'he refused',
  ];

  // Add dynamic patterns for prophets with actions (these indicate historical stories)
  const prophets = ['muhammad', 'moses', 'abraham', 'noah', 'lot', 'adam', 'isaac', 'jacob',
                    'joseph', 'job', 'jonah', 'john', 'jesus', 'zachariah', 'elijah',
                    'enoch', 'idris', 'saleh', 'hud', 'shuayb', 'yunus'];

  const historicalActions = ['came to', 'went to', 'entered', 'left', 'arrived at',
                             'departed from', 'traveled to', 'journeyed to', 'said to',
                             'spoke to', 'called out to', 'prayed to', 'asked for',
                             'requested from', 'begged', 'pleaded with', 'argued with',
                             'disputed with', 'fought against', 'battled', 'struggled with'];

  // Generate prophet + action combinations (historical narratives)
  for (const prophet of prophets) {
    for (const action of historicalActions) {
      combinations.push(`${prophet} ${action}`);
    }
  }

  // Add patterns for unclear/out-of-context descriptions
  const unclearPatterns = [
    'will be given to drink', 'will drink from', 'they will recline',
    'they will be adorned', 'they will be married', 'they will approach',
    'the fruits of', 'the shade of', 'the branches of', 'the clusters of',
    'springs of', 'fountains of', 'gardens beneath which', 'rivers flow beneath',
    'dwellers of paradise', 'companions of the fire', 'inhabitants of the fire',
    'the bed of', 'the pillow of', 'the covering of', 'the garment of',
    'the ornament of', 'the bracelet of', 'the crown of', 'the pearl of',
    'the coral of', 'the silk of', 'the brocade of', 'the velvet of',
  ];

  combinations.push(...unclearPatterns);

  return combinations;
};

const EXCLUSION_COMBINATIONS = buildExclusionCombinations();
── End commented-out Quran verse code ── */

interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
}

export default function HomePage() {
  const { user, isBoardMember } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroVideo, setHeroVideo] = useState<string | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  const toEmbedUrl = (url: string): string => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
      if (u.hostname.includes("youtube.com")) {
        if (u.pathname === "/watch" && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch {}
    return url;
  };
  const [masjidUpdates, setMasjidUpdates] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [aboutStats, setAboutStats] = useState<any>(null);

  // Fetch prayer times from AlAdhan API
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('/api/prayer-times', { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.prayerTimes && data.prayerTimes.length > 0) {
            setPrayerTimes(data.prayerTimes);
          } else {
            setFallbackTimes();
          }
        } else {
          setFallbackTimes();
        }
      } catch (error) {
        console.warn("Prayer times fetch failed, using fallback");
        setFallbackTimes();
      } finally {
        setPrayerTimesLoading(false);
      }
    };
    
    const setFallbackTimes = () => {
      setPrayerTimes([
        { name: "Fajr", arabicName: "الفجر", time: "4:48 AM" },
        { name: "Sunrise", arabicName: "الشروق", time: "6:12 AM" },
        { name: "Dhuhr", arabicName: "الظهر", time: "1:00 PM" },
        { name: "Asr", arabicName: "العصر", time: "5:56 PM" },
        { name: "Maghrib", arabicName: "المغرب", time: "7:58 PM" },
        { name: "Isha", arabicName: "العشاء", time: "9:19 PM" },
      ]);
    };
    
    fetchPrayerTimes();
  }, []);

  // Calculate which prayer is next
  const getNextPrayerIndex = () => {
    if (prayerTimes.length === 0) return 0;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (let i = 0; i < prayerTimes.length; i++) {
      const timeStr = prayerTimes[i].time;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hours !== 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        const prayerMinutes = hours * 60 + minutes;
        if (prayerMinutes > currentMinutes) return i;
      }
    }
    return 0; // After Isha, next is Fajr
  };

useEffect(() => {
  const loadData = async () => {
    try {
      const [eventsData, programs, masjidData, statsData, newsData] = await Promise.allSettled([
        fetchEvents(3),
        fetchPrograms(3),
        fetchMasjidUpdates(1),
        fetch("/api/about-stats").then(r => r.json()),
        fetchNews(3),
      ]);

      const events = eventsData.status === "fulfilled" ? eventsData.value : [];
      const prog = programs.status === "fulfilled" ? programs.value : [];
      const masjid = masjidData.status === "fulfilled" ? masjidData.value : [];
      const stats = statsData.status === "fulfilled" ? statsData.value : null;
      const newsArr = newsData.status === "fulfilled" ? newsData.value : [];

      setEvents(events);
      setPrograms(prog);
      setNews(newsArr);
      setAboutStats(stats);

      // Compute raised from actual donation data via API
      const constructionTotal = stats?.raisedForMasjid || 0;
      const defaultGoal = 1500000;
      const latest = masjid[0] ? { ...masjid[0], goal: masjid[0].goal || defaultGoal, raised: constructionTotal > 0 ? Math.max(constructionTotal, masjid[0].raised || 0) : (masjid[0].raised || 0) } : { goal: defaultGoal, raised: constructionTotal };
      setMasjidUpdates([latest]);

      // Use masjid construction heroType to decide what to show
      let selectedImage: string | null = null;
      let selectedVideo: string | null = null;
      if (masjid.length > 0) {
        const m = masjid[0];
        if (m.heroType === "video" && m.video) {
          selectedVideo = toEmbedUrl(m.video);
        } else if (m.heroType === "image" && m.image) {
          selectedImage = m.image;
        } else if (m.heroType === "none") {
          // show neither
        } else if (m.image) {
          selectedImage = m.image;
        }
      }
      if (!selectedImage && !selectedVideo) {
        const eventWithPoster = events.find((e: any) => e.poster && e.poster.startsWith('data:'));
        if (eventWithPoster && eventWithPoster.poster) {
          selectedImage = eventWithPoster.poster;
        }
      }
      setHeroImage(selectedImage);
      setHeroVideo(selectedVideo);
    } catch (error) {
      console.error("Failed to load homepage data:", error);
    } finally {
      setHeroLoading(false);
    }
  };
  loadData();
}, []);

  const displayEvents = events.length > 0 ? events.slice(0, 3) : [];

  const formatTime = (t?: string) => {
    if (!t) return "";
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      const [h, m] = t.split(":");
      const hour = parseInt(h, 10);
      return `${hour % 12 || 12}:${m}${hour >= 12 ? "pm" : "am"}`;
    }
    return t;
  };

  return (
    <div className="min-h-screen font-sans">
      <Navigation currentPage="home" />

      {/* Hero Section */}
      <section className="pt-32 md:pt-36 pb-12 md:pb-16 bg-gradient-to-br from-mhma-forest via-mhma-forest-mid to-mhma-forest-light text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-mhma-gold/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-mhma-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-mhma-gold/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center lg:items-start">
            <div className="px-4 lg:pl-4 xl:pl-8 lg:pr-8 xl:pr-12 lg:w-3/5 text-center lg:text-left">
              <div className="flex items-center gap-2 justify-center lg:justify-start mb-4">
                <span className="w-6 h-px bg-mhma-gold"></span>
                <span className="text-xs sm:text-sm tracking-[.18em] uppercase text-mhma-gold font-medium">Mountain House Muslim Association</span>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-arabic mb-2" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold mb-3 uppercase tracking-wide leading-tight">
                <span className="whitespace-nowrap">welcome to <span className="text-mhma-gold italic">MHMA</span></span>
                {user?.displayName ? <><br /><span className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-normal normal-case mt-1 inline-block">{user.displayName}</span></> : '!'}
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-mhma-sage/90 mb-6 max-w-3xl mx-auto lg:mx-0 font-light leading-relaxed">
                Serving the Muslim Community in Mountain House since 2010
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <Link href="/events" className="mhma-btn-gold">
                  Explore Events
                </Link>
                <Link href="/programs" className="mhma-btn-gold">
                  Explore Programs
                </Link>
                <Link href="/masjid-construction" className="mhma-btn-gold">
                  MASJID CONSTRUCTION
                </Link>
                <Link href="/news" className="mhma-btn-gold">
                  Newsletter
                </Link>
              </div>
            </div>

            {/* Masjid illustration on right */}
            <div className="lg:w-2/5 flex justify-center lg:justify-end lg:pr-4 xl:pr-8">
              {heroLoading ? (
                <div className="w-full max-w-3xl aspect-[4/3] rounded-2xl bg-white/5 animate-pulse"></div>
              ) : heroVideo ? (
                <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-mhma-gold/20">
                  <iframe src={heroVideo} className="w-full h-full" allowFullScreen title="MHMA Campaign Video"></iframe>
                </div>
              ) : heroImage ? (
                <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border-2 border-mhma-gold/20">
                  <img src={heroImage} alt="Masjid Construction" className="w-full h-full object-cover" />
                </div>
              ) : (
                <svg viewBox="0 0 400 320" className="w-full max-w-3xl drop-shadow-2xl" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1a365d"/>
                      <stop offset="100%" stopColor="#2d6a4f"/>
                    </linearGradient>
                    <linearGradient id="moon" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fffbeb"/>
                      <stop offset="100%" stopColor="#fbbf24"/>
                    </linearGradient>
                    <linearGradient id="dome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c9a227"/>
                      <stop offset="100%" stopColor="#a17a1f"/>
                    </linearGradient>
                    <radialGradient id="glow" cx="0.5" cy="0.3" r="0.4">
                      <stop offset="0%" stopColor="rgba(251,191,36,0.15)"/>
                      <stop offset="100%" stopColor="rgba(251,191,36,0)"/>
                    </radialGradient>
                  </defs>
                  <rect width="400" height="320" fill="url(#sky)" rx="16"/>
                  <rect width="400" height="320" fill="url(#glow)" rx="16"/>
                  <circle cx="50" cy="40" r="1.5" fill="white" opacity="0.8"/>
                  <circle cx="120" cy="25" r="1" fill="white" opacity="0.6"/>
                  <circle cx="300" cy="35" r="1.5" fill="white" opacity="0.7"/>
                  <circle cx="350" cy="60" r="1" fill="white" opacity="0.5"/>
                  <circle cx="80" cy="70" r="1" fill="white" opacity="0.4"/>
                  <circle cx="320" cy="50" r="18" fill="url(#moon)" opacity="0.9"/>
                  <circle cx="310" cy="45" r="14" fill="#1a365d" opacity="0.8"/>
                  <rect x="0" y="270" width="400" height="50" fill="#1a3a2a"/>
                  <rect x="120" y="180" width="160" height="90" fill="#2d5a3d" rx="2"/>
                  <rect x="95" y="120" width="14" height="150" fill="#3a7a4d" rx="2"/>
                  <rect x="291" y="120" width="14" height="150" fill="#3a7a4d" rx="2"/>
                  <polygon points="102,120 95,105 109,105" fill="#c9a227"/>
                  <polygon points="298,120 291,105 305,105" fill="#c9a227"/>
                  <circle cx="102" cy="100" r="4" fill="#c9a227"/>
                  <circle cx="105" cy="98" r="3.5" fill="#1a365d"/>
                  <circle cx="298" cy="100" r="4" fill="#c9a227"/>
                  <circle cx="301" cy="98" r="3.5" fill="#1a365d"/>
                  <ellipse cx="200" cy="180" rx="65" ry="45" fill="url(#dome)"/>
                  <circle cx="210" cy="132" r="5" fill="#c9a227"/>
                  <circle cx="213" cy="130" r="4" fill="#1a365d"/>
                  <rect x="165" y="180" width="70" height="90" fill="#1a3a2a" rx="2"/>
                  <rect x="175" y="180" width="50" height="90" fill="#2d5a3d" rx="1"/>
                  <rect x="185" y="200" width="30" height="70" fill="#c9a227" rx="2"/>
                  <rect x="189" y="200" width="22" height="70" fill="#a17a1f" rx="1"/>
                  <rect x="130" y="195" width="16" height="20" fill="#c9a227" rx="8" opacity="0.7"/>
                  <rect x="254" y="195" width="16" height="20" fill="#c9a227" rx="8" opacity="0.7"/>
                  <rect x="97" y="140" width="10" height="14" fill="#c9a227" rx="5" opacity="0.5"/>
                  <rect x="293" y="140" width="10" height="14" fill="#c9a227" rx="5" opacity="0.5"/>
                  <rect x="120" y="265" width="160" height="5" fill="#c9a227" opacity="0.6"/>
                  <ellipse cx="135" cy="190" rx="15" ry="10" fill="#3a7a4d"/>
                  <ellipse cx="265" cy="190" rx="15" ry="10" fill="#3a7a4d"/>
                </svg>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* Fundraising Progress Bar */}
      <section className="bg-mhma-cream py-6 md:py-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          {masjidUpdates.length > 0 && masjidUpdates[0].goal > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="shrink-0 text-center md:text-left">
                <p className="text-sm font-bold text-mhma-forest uppercase tracking-wider">Masjid Fund</p>
              </div>
              <div className="flex-1 w-full space-y-1">
                <div className="w-full bg-white rounded-full h-5 overflow-hidden shadow-inner border border-gray-200">
                  <div className="bg-mhma-gold h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((masjidUpdates[0].raised / masjidUpdates[0].goal) * 100, 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>${(masjidUpdates[0].raised || 0).toLocaleString()} raised</span>
                  <span>{Math.min(Math.round((masjidUpdates[0].raised / masjidUpdates[0].goal) * 100), 100)}%</span>
                  <span>Goal: ${masjidUpdates[0].goal.toLocaleString()}</span>
                </div>
              </div>
              <div className="shrink-0">
                <Link href="/pledge" className="mhma-btn-gold inline-flex items-center">
                  Pledge Today
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm font-bold text-mhma-forest uppercase tracking-wider">Masjid Fund</p>
                <p className="text-xs text-gray-500 mt-1">Campaign data coming soon</p>
              </div>
              <Link href="/pledge" className="mhma-btn-gold inline-flex items-center">
                Pledge Today
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Golden Prayer Times Bar */}
      <section className="bg-mhma-gold py-6 md:py-8 border-y-2 border-mhma-forest/10">
        <div className="max-w-6xl mx-auto px-4">
          {prayerTimesLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-pulse text-mhma-forest text-sm">Loading prayer times...</div>
            </div>
          ) : prayerTimes.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left shrink-0">
                <h3 className="text-mhma-forest font-bold text-base uppercase tracking-wider mb-1">Prayer Times</h3>
                <p className="text-mhma-forest/80 text-sm">Mountain House, CA</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 flex-1">
                {prayerTimes.map((prayer, index) => {
                  const nextIdx = getNextPrayerIndex();
                  const isNext = index === nextIdx;
                  return (
                    <div key={prayer.name} className={`text-center px-2 md:px-3 ${isNext ? 'bg-mhma-forest/10 rounded-lg px-3 py-1' : ''}`}>
                      <p className="text-mhma-forest/80 text-[10px] md:text-xs uppercase tracking-wider">{prayer.name}</p>
                      <p className="text-mhma-forest font-bold text-sm md:text-lg">{prayer.time}</p>
                      {isNext && <p className="text-mhma-forest/60 text-[9px] md:text-[10px] hidden md:block">Next</p>}
                    </div>
                  );
                })}
              </div>
              <Link href="/prayer-times" className="text-mhma-forest font-semibold text-sm hover:text-amber-100 transition-colors flex items-center gap-1 shrink-0">
                Full Schedule <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-center text-mhma-forest text-sm">
              Prayer times unavailable. <Link href="/prayer-times" className="underline">View full schedule</Link>
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-mhma-cream">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
                About <span className="text-mhma-gold">MHMA</span>
              </h2>
              <p className="text-mhma-gold font-medium text-sm uppercase tracking-wider mb-4">
                Serving Our Community with Transparency
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Mountain House Muslim Association (MHMA) has been a cornerstone of faith and community for years. We serve the spiritual, educational, and social needs of Muslims in Mountain House and the surrounding Bay Area.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our masjid is a home for every Muslim — a center of worship, learning, and brotherhood. We welcome all and work to strengthen the bonds between our community and our neighbors.
              </p>
              <Link href="/about" className="inline-flex items-center text-mhma-gold font-semibold hover:translate-x-1 transition-transform">
                Learn More About Us <ChevronRight className="ml-1 w-5 h-5" />
              </Link>
            </div>
            <div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard value={aboutStats?.yearsServing ? `${aboutStats.yearsServing}+` : "—"} label="Years" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.numberOfFamilies ? `${aboutStats.numberOfFamilies}+` : "—"} label="Families" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.programsCount ? `${formatCount(aboutStats.programsCount)}` : "—"} label="Programs" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.youthInPrograms ? `${formatCount(aboutStats.youthInPrograms)}` : "—"} label="Youth in Programs" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.raisedForMasjid ? formatCompactAmount(aboutStats.raisedForMasjid) : "—"} label="Raised for Masjid" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.donorCount ? formatCount(aboutStats.donorCount) : "—"} label="Donors" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.eventsCount ? formatCount(aboutStats.eventsCount) : "—"} label="Events Held" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.usersCount ? formatCount(aboutStats.usersCount) : "—"} label="Members" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.raisedForPrograms ? formatCompactAmount(aboutStats.raisedForPrograms) : "—"} label="Raised for Programs" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.rsvpCount ? formatCount(aboutStats.rsvpCount) : "—"} label="Event RSVPs" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.subscriberCount ? formatCount(aboutStats.subscriberCount) : "—"} label="Subscribers" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.contactCount ? formatCount(aboutStats.contactCount) : "—"} label="Contact Submissions" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.pledgeCount ? formatCount(aboutStats.pledgeCount) : "—"} label="Pledges" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.volunteerCount ? formatCount(aboutStats.volunteerCount) : "—"} label="Volunteers" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.totalDonationCount ? formatCount(aboutStats.totalDonationCount) : "—"} label="Total Donations" color="bg-mhma-forest-mid" />
              <StatCard value={aboutStats?.raisedForZakat ? formatCompactAmount(aboutStats.raisedForZakat) : "—"} label="Raised for Zakat" color="bg-mhma-forest" />
              <StatCard value={aboutStats?.raisedForGeneral ? formatCompactAmount(aboutStats.raisedForGeneral) : "—"} label="Raised for General" color="bg-mhma-forest-mid" />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 text-center uppercase tracking-wide">
            Our <span className="text-mhma-gold">Programs</span> & Classes
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Comprehensive Islamic education for children, youth, and adults — fostering faith and knowledge at every stage of life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(() => {
              const validPrograms = programs.filter((p: any) => p.title && p.slug);
              const fallbacks = [
                { title: "Quran Maktab", description: "Foundational Quran recitation for children with Tajweed instruction.", slug: "maktab-program" },
                { title: "Hifz Program", description: "Structured memorization of the Holy Quran guided by qualified teachers.", slug: "quran-hifz-program" },
                { title: "Arabic Language", description: "Conversational and classical Arabic for all levels.", slug: "arabic-academy" }
              ];
              const programsToShow = validPrograms.length >= 3 ? validPrograms.slice(0, 3) : (
                validPrograms.length > 0 ? [...validPrograms, ...fallbacks].slice(0, 3) : fallbacks
              );

              return programsToShow.map((program: any, i: number) => {
                const title = program.title || "Program";
                const desc = program.description || "Learn more about this program";
                const slug = program.slug || title.toLowerCase().replace(/\s+/g, "-");
                const icon =
                  title.toLowerCase().includes("quran") || title.toLowerCase().includes("maktab") ? "📖" :
                  title.toLowerCase().includes("hifz") ? "🌟" :
                  title.toLowerCase().includes("arabic") || title.toLowerCase().includes("urdu") ? "🔤" :
                  title.toLowerCase().includes("ladi") || title.toLowerCase().includes("sister") || title.toLowerCase().includes("wish") ? "🌸" :
                  title.toLowerCase().includes("youth") || title.toLowerCase().includes("sport") || title.toLowerCase().includes("scout") ? "⚽" :
                  title.toLowerCase().includes("3d") || title.toLowerCase().includes("print") ? "🖨️" : "🏫";

                return (
                  <Link key={program.id || i} href={`/programs/${slug}`} className="bg-mhma-forest p-6 rounded-xl border border-mhma-forest hover:border-mhma-gold hover:shadow-xl transition-all group relative block">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
                    <h3 className="font-bold text-white mb-2 group-hover:text-mhma-gold">{title}</h3>
                    <p className="text-mhma-sage text-sm line-clamp-2">{desc}</p>
                    {isBoardMember && (
                      <Link href={`/dashboard/programs/edit?id=${program.id}`} onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 bg-white/20 rounded hover:bg-mhma-gold transition-colors" title="Edit program">
                        <Edit3 className="w-3.5 h-3.5 text-white/70 hover:text-white" />
                      </Link>
                    )}
                  </Link>
                );
              });
            })()}
          </div>
          <div className="text-center">
            <Link href="/programs" className="inline-flex items-center px-6 py-2.5 bg-mhma-forest text-white font-semibold rounded-lg hover:bg-mhma-forest-mid hover:scale-105 transition-all shadow-lg">
              Explore Programs <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-16 bg-mhma-cream border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
            Latest <span className="text-mhma-gold">News</span>
          </h2>
          {news.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {news.map((n: any) => {
                  const cd = n.createdAt;
                  const dateStr = cd ? (cd.toDate ? cd.toDate().toLocaleDateString() : typeof cd === "string" ? new Date(cd).toLocaleDateString() : "") : "";
                  return (
                    <Link key={n.id} href={`/news/${n.slug}`}
                      className="bg-white p-6 rounded-xl border border-gray-100 hover:border-mhma-gold hover:shadow-xl transition-all group relative block">
                      {n.image && <img src={n.image} alt={n.title} className="w-full h-40 object-cover rounded-lg mb-3" />}
                      <p className="text-xs text-gray-400 mb-1">{dateStr}{n.authorName ? ` · By ${n.authorName}` : ""}</p>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-mhma-gold transition-colors">{n.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2">{n.excerpt}</p>
                    </Link>
                  );
                })}
              </div>
              <div className="text-center">
                <Link href="/news" className="inline-flex items-center text-mhma-gold font-semibold hover:text-amber-600">
                  View All News <ChevronRight className="ml-1 w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-400 py-8">No news articles yet.</p>
          )}
        </div>
      </section>

      {/* Today's Prayer Times - FIXED LINK */}
      <section id="prayer-times" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
            Prayer <span className="text-mhma-gold">Times</span>
          </h2>
          
          {/* Jumu'ah box */}
          <div className="bg-mhma-cream border-2 border-mhma-gold/30 rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Jumu'ah</h3>
                <p className="text-mhma-gold font-bold text-lg">2:15 PM</p>
                <p className="text-gray-500 text-sm">Khutbah begins at 1:45 PM</p>
              </div>

            </div>
          </div>

          {/* Prayer times iframe */}
          <div className="flex justify-center">
            <iframe 
              src="https://ummahsoft.org/salahtime/masjid-embed/prayer_widet.php?masjid_id=53487" 
              width="100%" 
              height="380" 
              frameBorder="0" 
              scrolling="no"
              className="max-w-[480px] rounded-lg shadow-lg"
            ></iframe>
          </div>
          
          <div className="text-center mt-6">
            <Link href="/prayer-times" className="inline-flex items-center text-mhma-gold font-semibold hover:text-amber-600 hover:underline">
              View Full Monthly Schedule <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Masjid Construction Progress */}
      {/* Upcoming Events - FIXED to show REAL data */}
      <section className="py-16 bg-mhma-cream border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
            Upcoming <span className="text-mhma-gold">Events</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.map((event: any, i: number) => {
              const eventDate = event.date || "";
              const day = eventDate ? eventDate.split("-").pop() || "??" : "??";
              const month = eventDate
                ? new Date(eventDate + "T12:00:00").toLocaleDateString("en-US", { month: "short" })
                : "MAY";
              return (
                <div key={event.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-mhma-gold transition-all group relative">
                  <div className="w-full bg-mhma-forest flex flex-col items-center justify-center text-white py-2">
                    <span className="text-xl font-bold">{day}</span>
                    <span className="text-xs uppercase">{month}</span>
                    {isBoardMember && (
                      <Link href={`/dashboard/events/edit?id=${event.id}`} className="absolute top-1 right-1 p-1.5 bg-black/20 rounded hover:bg-mhma-gold transition-colors" title="Edit event">
                        <Edit3 className="w-3 h-3 text-mhma-gold" />
                      </Link>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-mhma-gold text-sm">{event.title || "Untitled"}</h3>
                    <div className="flex items-center text-gray-500 text-xs space-x-2 mb-2">
                      {event.time && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {formatTime(event.time)}
                        </span>
                      )}
                      <span className="flex items-center truncate">
                        <MapPin className="w-3 h-3 mr-1" /> {event.location || "MHMA"}
                      </span>
                    </div>
                    <Link
                      href={`/rsvp?eventId=${event.id}`}
                      className="inline-block w-full text-center px-3 py-1.5 bg-mhma-gold text-white text-xs font-semibold rounded hover:bg-mhma-gold-light transition-colors"
                    >
                      RSVP
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link href="/events" className="inline-flex items-center text-mhma-gold font-semibold hover:text-amber-600">
              View All Events <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>

          {events.length > 0 && (
            <div className="mt-12">
              <EventCalendar events={events} />
            </div>
          )}
        </div>
      </section>

      {/* ── Community Archive / Journal (commented out per board request) ──
      <section className="py-16 bg-mhma-forest text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2 uppercase tracking-wide">Community Archive</h2>
            <p className="text-gray-400">Reflections and updates from our community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {journalEntries.length > 0 ? journalEntries.slice(0, 3).map((entry: any) => (
              <Link key={entry.id} href="/journal" className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-mhma-gold transition-all relative block">
                <p className="text-mhma-gold text-xs font-bold mb-3 uppercase tracking-wider">Journal Entry</p>
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{entry.title?.rendered}</h3>
                <span className="text-gray-500 text-sm">Read More →</span>
                {isBoardMember && entry.id && entry.id.length > 5 && (
                  <Link href={`/dashboard/journal/edit?id=${entry.id}`} onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 p-1.5 bg-white/10 rounded hover:bg-mhma-gold transition-colors" title="Edit entry">
                    <Edit3 className="w-3.5 h-3.5 text-mhma-gold hover:text-white" />
                  </Link>
                )}
              </Link>
            )) : [
              { title: "Board Meeting Minutes - April 2026" },
              { title: "Community Iftar 2026" },
              { title: "Eid Preparation Committee" }
            ].map((e, i) => (
              <Link key={i} href="/journal" className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-mhma-gold transition-all relative block">
                <p className="text-mhma-gold text-xs font-bold mb-3 uppercase tracking-wider">Journal Entry</p>
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{e.title}</h3>
                <span className="text-gray-500 text-sm">Read More →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      ── End commented-out journal section ── */}

      {/* Donate Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Support Your <span className="text-mhma-gold">Masjid</span>
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Your generosity keeps our doors open and our programs running. Every contribution — small or large — makes a meaningful difference.
          </p>
          <Link href="/donate" className="inline-flex items-center px-8 py-3 bg-mhma-gold text-mhma-forest font-bold rounded-lg hover:bg-mhma-gold-light hover:scale-105 transition-all shadow-lg">
            Donate Now
          </Link>
          <p className="text-gray-400 text-xs mt-4">Secure · Tax-Deductible · Barakah Multiplied</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mhma-cream py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
              <Image 
                src="https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp" 
                alt="MHMA Logo" 
                width={180} 
                height={40} 
                className="mx-auto md:mx-0 mb-4 opacity-70"
              />
              <p className="text-gray-400 text-xs uppercase tracking-wider">© 2026 Mountain House Muslim Association</p>
              <p className="text-gray-400 text-[10px] mt-1">MHMA is a 501(c)(3) tax-exempt organization. EIN: 99-XXXXXXX</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Stay Updated</h4>
              <p className="text-gray-600 text-xs mb-3">Get MHMA news and event updates.</p>
              <NewsletterSignup variant="footer" source="footer" />
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Contact Us</h4>
              <p className="text-gray-600 text-sm">📧 mhma@mhma.us</p>
              <p className="text-gray-600 text-sm">📞 (209) 555-0123</p>
              <p className="text-gray-600 text-sm">📍 245 E. Byron St, Mountain House, CA 95391</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Quick Links</h4>
              <div className="flex flex-col gap-1 text-sm">
                <Link href="/donate" className="text-mhma-gold hover:underline">Donate</Link>
                <Link href="/programs" className="text-mhma-gold hover:underline">Programs</Link>
                <Link href="/events" className="text-mhma-gold hover:underline">Events</Link>
                <Link href="/contact" className="text-mhma-gold hover:underline">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}




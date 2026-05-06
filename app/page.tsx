"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, Heart, Users, MapPin, ChevronRight, BookText } from "lucide-react";
import { fetchEvents, fetchPrograms, fetchJournalEntries } from "@/lib/wordpress";
import Navigation from "@/components/Navigation";

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

const fetchQuranVerse = async (): Promise<QuranVerse> => {
  try {
    const response = await fetch('/quran-included.json');
    if (!response.ok) throw new Error('Failed to load Quran data');
    const data = await response.json();

    const allVerses: any[] = [];
    (data.suras || []).forEach((sura: any) => {
      (sura.verses || []).forEach((verse: any) => {
        allVerses.push({
          text: verse.english,
          translation: verse.english,
          reference: `[Quran, ${sura.number}:${verse.aya}]`,
          arabic: verse.arabic
        });
      });
    });

    if (allVerses.length === 0) throw new Error('No verses available');

    const index = Math.floor(Math.random() * allVerses.length);
    return allVerses[index];
  } catch (error) {
    return {
      text: "And hold fast by the covenant of Allah all together and be not disunited",
      translation: "And hold fast by the covenant of Allah all together and be not disunited",
      reference: "[Quran, 3:103]",
      arabic: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا"
    };
  }
};

interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
}

export default function HomePage() {
  const [dailyVerse, setDailyVerse] = useState<QuranVerse | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [wpEvents, setWpEvents] = useState<any[]>([]);
  const [wpPrograms, setWpPrograms] = useState<any[]>([]);
  const [wpJournalEntries, setWpJournalEntries] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    const storedFirstName = localStorage.getItem("first_name");
    if (token && storedFirstName) {
      setIsLoggedIn(true);
      setUsername(storedFirstName);
    }
  }, []);

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
        { name: "Dhuhr", arabicName: "الظهر", time: "1:00 PM" },
        { name: "Asr", arabicName: "العصر", time: "5:56 PM" },
        { name: "Maghrib", arabicName: "المغرب", time: "7:58 PM" },
        { name: "Isha", arabicName: "العشاء", time: "9:19 PM" },
      ]);
    };
    
    fetchPrayerTimes();
  }, []);

useEffect(() => {
  // Load Quran verse IMMEDIATELY (fast, from static JSON)
  // Use ref to prevent double-fetch in React StrictMode
  const hasLoaded = { current: false };
  
  if (!hasLoaded.current) {
    hasLoaded.current = true;
    const loadVerse = async () => {
      try {
        console.log("Loading Quran verse...");
        const verse = await fetchQuranVerse();
        setDailyVerse(verse);
        console.log("Quran verse loaded:", verse.reference);
      } catch (error) {
        console.error("Verse loading error:", error);
      } finally {
        setVerseLoading(false);
      }
    };
    loadVerse();
  }
}, []);

useEffect(() => {
  // Load WordPress data SEQUENTIALLY to prevent Oracle backend crash
  const loadData = async () => {
    try {
      // Fetch one at a time to avoid overwhelming Oracle
      const events = await fetchEvents(277);
      setWpEvents(events);

      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      const programs = await fetchPrograms(70);
      setWpPrograms(programs);

      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

      const journalEntries = await fetchJournalEntries(199);
      setWpJournalEntries(journalEntries);
    } catch (error) {
      console.error("Data fetching error:", error);
    }
  };
  loadData();
}, []);

  // Removed duplicate useEffect - verse already loaded above, WordPress data loaded in separate useEffect

  // Use real events from WordPress
  const displayEvents = wpEvents.length > 0 ? wpEvents.slice(0, 6) : [];

  return (
    <div className="min-h-screen font-sans">
      <Navigation currentPage="home" />

      {/* Hero Section with Beautiful Gradient */}
      <section className="pt-32 md:pt-36 pb-12 md:pb-16 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <p className="text-xl md:text-2xl lg:text-3xl font-arabic mb-2" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-amber-400 mb-3 font-semibold">Est. 2010 · Mountain House, California</p>
          {/* Arabic greeting temporarily commented out per meeting request
          <div className="mb-6">
            <p className="text-lg md:text-xl lg:text-2xl text-amber-300 font-arabic inline" dir="rtl">اَلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ</p>
            <span className="text-amber-300 mx-3 hidden md:inline">·</span>
            <p className="text-sm md:text-base text-amber-300/70 font-light inline md:inline">(May the peace, mercy, and blessings of Allah [The God] be upon you)</p>
          </div>
          */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold mb-3 uppercase tracking-wide leading-tight">
            Welcome to <span className="text-amber-400">MHMA</span>{isLoggedIn && username ? `, ${username}!` : '!'}
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-200 mb-2 max-w-3xl mx-auto font-light tracking-[0.15em] uppercase">
            Serving the Muslim Community
          </p>

          {/* Quran Verse Box - Beautiful translucent */}
          <div className="max-w-5xl mx-auto mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
            {verseLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-14 w-3/4 bg-white/20 mx-auto rounded"></div>
                <div className="h-6 w-full bg-white/20 rounded"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {dailyVerse?.arabic && (
                  <p className="text-2xl md:text-3xl lg:text-4xl text-amber-300 leading-relaxed text-right font-arabic" dir="rtl">
                    {dailyVerse.arabic}
                  </p>
                )}
                <p className="text-lg md:text-xl lg:text-2xl text-gray-100 italic font-light leading-relaxed">
                  "{dailyVerse?.translation}"
                </p>
                <p className="text-amber-400 font-bold text-sm md:text-base tracking-widest uppercase">{dailyVerse?.reference}</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/events" className="px-8 py-3.5 bg-amber-500 text-teal-900 font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-amber-400 hover:scale-105 transition-all shadow-lg">
              Explore Events
            </Link>
            <Link href="/contact#directions" className="px-8 py-3.5 border-2 border-white/50 text-white font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-white hover:text-teal-900 transition-all">
              Get Directions
            </Link>
          </div>
        </div>
      </section>

      {/* Golden Prayer Times Bar */}
      <section className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-6 md:py-8 border-y-2 border-amber-600">
        <div className="max-w-6xl mx-auto px-4">
          {prayerTimesLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-pulse text-teal-900 text-sm">Loading prayer times...</div>
            </div>
          ) : prayerTimes.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left shrink-0">
                <h3 className="text-teal-900 font-bold text-base uppercase tracking-wider mb-1">Today's Prayers</h3>
                <p className="text-teal-800/80 text-sm">Mountain House, CA</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 md:gap-8 flex-1">
                {prayerTimes.slice(0, 5).map((prayer, index) => (
                  <div key={prayer.name} className="text-center px-3 md:px-4">
                    <p className="text-teal-800/80 text-xs uppercase tracking-wider">{prayer.name}</p>
                    <p className="text-teal-900 font-bold text-lg md:text-xl">{prayer.time}</p>
                    {index === 0 && <p className="text-teal-800/60 text-[10px] hidden md:block">Next</p>}
                  </div>
                ))}
              </div>
              <Link href="/prayer-times" className="text-teal-900 font-semibold text-sm hover:text-amber-100 transition-colors flex items-center gap-1 shrink-0">
                Full Schedule <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="text-center text-teal-900 text-sm">
              Prayer times unavailable. <Link href="/prayer-times" className="underline">View full schedule</Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/prayer-times" className="block text-center p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🕌</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-amber-600">Prayer Times</h3>
              <p className="text-xs text-gray-500 mt-1">DailySalah times</p>
            </Link>
            <Link href="/programs" className="block text-center p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📚</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-amber-600">Programs</h3>
              <p className="text-xs text-gray-500 mt-1">Quran, Arabic, Hifz</p>
            </Link>
            <Link href="/donate" className="block text-center p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💛</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-amber-600">Donate</h3>
              <p className="text-xs text-gray-500 mt-1">Support the masjid</p>
            </Link>
            <Link href="/contact" className="block text-center p-4 bg-white rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-lg transition-all group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">📞</div>
              <h3 className="font-semibold text-gray-800 group-hover:text-amber-600">Contact</h3>
              <p className="text-xs text-gray-500 mt-1">Get in touch</p>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 uppercase tracking-wide">
                About <span className="text-amber-600">MHMA</span>
              </h2>
              <p className="text-amber-600 font-medium text-sm uppercase tracking-wider mb-4">
                Serving Our Community with Transparency
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                The Mountain House Muslim Association (MHMA) has been a cornerstone of faith and community for over 15 years. We serve the spiritual, educational, and social needs of Muslims in Mountain House and the surrounding Bay Area.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our masjid is a home for every Muslim — a center of worship, learning, and brotherhood. We welcome all and work to strengthen the bonds between our community and our neighbors.
              </p>
              <Link href="/about" className="inline-flex items-center text-amber-600 font-semibold hover:translate-x-1 transition-transform">
                Learn More About Us <ChevronRight className="ml-1 w-5 h-5" />
              </Link>
            </div>
            <div className="lg:w-1/2 grid grid-cols-3 gap-4">
              {[
                { val: '15+', label: 'Years', color: 'bg-teal-800' },
                { val: '500+', label: 'Families', color: 'bg-teal-700' },
                { val: '10+', label: 'Programs', color: 'bg-teal-800' }
              ].map((stat, i) => (
                <div key={i} className={`${stat.color} rounded-xl p-5 text-center text-white shadow-lg`}>
                  <p className="text-2xl font-bold text-amber-400 mb-1 font-serif">{stat.val}</p>
                  <p className="text-gray-300 text-xs uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 text-center uppercase tracking-wide">
            Our <span className="text-amber-600">Programs</span> & Classes
          </h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Comprehensive Islamic education for children, youth, and adults — fostering faith and knowledge at every stage of life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(() => {
              // Filter programs to only show those with valid data
              const validPrograms = wpPrograms.filter((p: any) =>
                p.title?.rendered &&
                p.slug &&
                (p.acf?.program_title || p.acf?.program_description || p.title.rendered.length > 0)
              );

              // Show only 3 most recent programs
              const programsToShow = validPrograms.length > 0 ? validPrograms.slice(0, 3) : [
                { title: "Quran Maktab", desc: "Foundational Quran recitation for children with Tajweed instruction.", slug: "quran-maktab", icon: "📖" },
                { title: "Hifz Program", desc: "Structured memorization of the Holy Quran guided by qualified teachers.", slug: "hifz-program", icon: "🌟" },
                { title: "Arabic Language", desc: "Conversational and classical Arabic for all levels.", slug: "arabic-academy", icon: "🔤" }
              ];

              return programsToShow.map((program: any, i: number) => {
                const title = program.title?.rendered || program.title;
                const desc = program.acf?.program_description || program.desc || 'Learn more about this program';
                const slug = program.slug || program.title?.toLowerCase().replace(/\s+/g, '-');
                const icon = program.icon || (
                  title?.toLowerCase().includes('quran') ? '📖' :
                  title?.toLowerCase().includes('hifz') ? '🌟' :
                  title?.toLowerCase().includes('arabic') ? '🔤' :
                  title?.toLowerCase().includes('sister') ? '🌸' :
                  title?.toLowerCase().includes('youth') ? '⚽' : '🏫'
                );

                return (
                  <Link key={program.id || i} href={`/programs/${slug}`} className="bg-white p-6 rounded-xl border border-gray-100 hover:border-amber-400 hover:shadow-xl transition-all group">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-amber-600">{title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{desc}</p>
                  </Link>
                );
              });
            })()}
          </div>
          <div className="text-center">
            <Link href="/programs" className="inline-flex items-center px-6 py-2.5 bg-teal-800 text-white font-semibold rounded-lg hover:bg-teal-700 hover:scale-105 transition-all shadow-lg">
              View All Programs <ChevronRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Today's Prayer Times - FIXED LINK */}
      <section id="prayer-times" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
            Today's <span className="text-amber-600">Prayer Times</span>
          </h2>
          
          {/* Jumu'ah box ABOVE - like netjoints */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900">Jumu'ah — 1st Session</h3>
                <p className="text-amber-600 font-bold text-lg">1:00 PM</p>
                <p className="text-gray-500 text-sm">Khutbah begins at 12:45 PM</p>
              </div>
              <div className="border-t md:border-l border-amber-300 my-2 md:my-0"></div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Jumu'ah — 2nd Session</h3>
                <p className="text-amber-600 font-bold text-lg">2:00 PM</p>
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
            <Link href="/prayer-times" className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700 hover:underline">
              View Full Monthly Schedule <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events - FIXED to show REAL data */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
            Upcoming <span className="text-amber-600">Events</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEvents.slice(0, 6).map((event: any, i: number) => (
              <div key={event.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-amber-300 transition-all group">
                <div className="w-full bg-teal-800 flex flex-col items-center justify-center text-white py-2">
                  <span className="text-xl font-bold">
                    {event.acf?.event_date ? new Date(event.acf.event_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).getDate() : '??'}
                  </span>
                  <span className="text-xs uppercase">
                    {event.acf?.event_date ? new Date(event.acf.event_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')).toLocaleDateString('en-US', { month: 'short' }) : 'MAY'}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-amber-600 text-sm">{event.title?.rendered}</h3>
                  <div className="flex items-center text-gray-500 text-xs space-x-2 mb-2">
                    {event.acf?.event_time && (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> {event.acf.event_time}
                      </span>
                    )}
                    <span className="flex items-center truncate">
                      <MapPin className="w-3 h-3 mr-1" /> {event.acf?.event_location || 'MHMA'}
                    </span>
                  </div>
                  {event.acf?.event_rsvp_link && (
                    <a
                      href={event.acf.event_rsvp_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full text-center px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600 transition-colors"
                    >
                      RSVP
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/events" className="inline-flex items-center text-amber-600 font-semibold hover:text-amber-700">
              View All Events <ChevronRight className="ml-1 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Community Archive */}
      <section className="py-16 bg-teal-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2 uppercase tracking-wide">Community Archive</h2>
            <p className="text-gray-400">Reflections and updates from our community.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {wpJournalEntries.length > 0 ? wpJournalEntries.slice(0, 3).map((entry: any) => (
              <Link key={entry.id} href="/journal" className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400 transition-all">
                <p className="text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">Journal Entry</p>
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{entry.title?.rendered}</h3>
                <span className="text-gray-500 text-sm">Read More →</span>
              </Link>
            )) : [
              { title: "Board Meeting Minutes - April 2026" },
              { title: "Community Iftar 2026" },
              { title: "Eid Preparation Committee" }
            ].map((e, i) => (
              <Link key={i} href="/journal" className="bg-white/5 p-6 rounded-xl border border-white/10 hover:bg-white/10 hover:border-amber-400 transition-all">
                <p className="text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">Journal Entry</p>
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{e.title}</h3>
                <span className="text-gray-500 text-sm">Read More →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Donate Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 uppercase tracking-wide">
            Support Your <span className="text-amber-600">Masjid</span>
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Your generosity keeps our doors open and our programs running. Every contribution — small or large — makes a meaningful difference.
          </p>
          <Link href="/donate" className="inline-flex items-center px-8 py-3 bg-amber-500 text-teal-900 font-bold rounded-lg hover:bg-amber-400 hover:scale-105 transition-all shadow-lg">
            Donate Now
          </Link>
          <p className="text-gray-400 text-xs mt-4">Secure · Tax-Deductible · Barakah Multiplied</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 border-t border-gray-200">
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
                <Link href="/donate" className="text-amber-600 hover:underline">Donate</Link>
                <Link href="/programs" className="text-amber-600 hover:underline">Programs</Link>
                <Link href="/events" className="text-amber-600 hover:underline">Events</Link>
                <Link href="/contact" className="text-amber-600 hover:underline">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
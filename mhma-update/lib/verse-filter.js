// =====================================================
// Verse Filtering for Random Quran Verse Display
// =====================================================
//
// This module filters verses to ensure appropriate content
// for a community website, excluding verses that require
// historical context or are inappropriate for general display.
//
// Uses phrase pattern matching and combination patterns
// to identify context and prioritize reminders.
// =====================================================

// Phrases that indicate historical context or specific legal rulings
const EXCLUSION_PHRASES = [
  // Historical narratives requiring context
  "when you were",
  "remember when",
  "and when",
  "and recall",
  "and [recall]",
  "indeed, we sent",
  "we sent down",
  "we revealed",
  "we sent to",
  "we gave him",
  "we saved",
  "we destroyed",
  "we punished",
  "we took",
  "has been revealed",
  "was revealed",
  "revealed to",
  "preferred the life of the world",
  "preferred the life of this world",
  "have they a share of dominion",
  "speck on a date seed",
  "gourd vine",
  "laden ship",
  "ran away to",
  "so leave them",
  "day the caller",
  
  // SPECIFIC PEOPLE/HISTORICAL REFERENCES
  "people of lut",
  "people of noah",
  "people of ad",
  "people of thamud", 
  "people of pharaoh",
  "people of abraham",
  "people of lot",
  "people of moses",
  "people of aaron",
  "children of israel",
  "tribe of",
  "kingdom of",
  "prophet muhammad",
  "prophet moses",
  "prophet abraham",
  "prophet noah",
  "prophet lot",
  "prophet adam",
  "prophet jesus",
  "prophet john",
  
  // SPECIFIC HISTORICAL EVENTS
  "when they entered",
  "when they left",
  "when they fled",
  "when they returned",
  "when they fought",
  "when they won",
  "when they lost",
  "when they built",
  "when they destroyed",
  "when they worshipped",
  "when they prayed",
  "when they disobeyed",
  "when they believed",
  "when they disbelieved",
  "the day when",
  "on the day",
  "that day",
  "the day of",

  // Legal punishments and judicial matters
  "cut off",
  "stoning",
  "lash",
  "lashing",
  "flogging",
  "punishment",
  "penalty",
  "retribution",
  "testimony",
  "witnesses",
  "oath",
  "vow",
  "court",
  "judge",
  "justice",
  "menstruation",
  "menstruating",
  "menstruate",
  "divorce",
  "inheritance",
  "bequest",
  "amputate",
  "contract a debt",
  "debt",
  
  // War and conflict requiring context
  "fight in the way",
  "fight them",
  "kill them",
  "slay them",
  "wherever you find",
  "wage war",
  "against them",
  "battle",
  "sword",
  "weapon",
  "attack",
  "strike",
  "smite",
  "destroy",
  
  // Private matters requiring maturity
  "sexual intercourse",
  "fornicator",
  "fornication",
  "adultery",
  "accuse their wives",
  "accuse chaste women",
  "four witnesses",
  "unmarried woman",
  "unmarried man",
  "found guilty",
  "approach",
  "private parts",
  "breast",
  "naked",
  "nude",
  "marriage",
  "wife",
  "husband",
  "virgin",
  "chastity",
  "zina",
  "homosexual",
  "homosexuality",
  "sodomy",
  "lesbian",
  
  // Complex theological discussions
  "people of the book",
  "disbelievers",
  "polytheists",
  "hypocrites",
  "unbelievers",
  "infidels",
  "idolaters",
  "disbelief",
  "blasphemy",
  "apostasy",
  // Additional narrative/dialogue exclusions
  "we said to",
  "said to them",
  "said to him",
  "said to her",
  "and [mention]",
  "mention, o muhammad",
  "[mention] when",
  "when we said",
  "when i said",
  "when he said",
  "when she said",
  "when they said",
  "he said to",
  "they said to",
  "she said to",
  "answered him",
  "replied to him",
  "told them",
  "told him",
  "narrate",
  "recount",
  "mention to them",
  "mention to him",
  "sabbath",
  "apes",
  "despised",
  "we gave to",
  "we sent to",
  "we revealed to",
  "when he went",
  "when he left",
  "when he entered",
  "when he fled",
  "when he ran",
  "when he came",
  "when they came",
  "when he returned",
  "when they returned",
  // More narrative patterns
  "he was",
  "they were",
  "she was",
  "you were",
  "we were",
  "i was",
  "you had",
  "they had",
  "he had",
  "she had",
  "then ",
  "then he",
  "then they",
  "then when",
  "so when",
  "so he",
  "so they",
  "so we",
  "but when",
  "and when",
  "while ",
  "because ",
  "indeed when",
  "when lo",
  "behold when",
  "that when",
];

// COMBINATION PATTERNS - More specific to avoid filtering reminders
const EXCLUSION_COMBINATIONS = [
  // Historical context combinations
  ["people", "of", "abraham"],
  ["people", "of", "lot"], 
  ["people", "of", "noah"],
  ["people", "of", "moses"],
  ["people", "of", "pharaoh"],
  ["people", "of", "aad"],
  ["people", "of", "thamud"],
  ["people", "of", "madyan"],
  ["children", "of", "israel"],
  ["tribe", "of"],
  ["when", "you", "were"],
  ["and", "when", "the"],
  ["and", "recall", "the"],
  ["and", "[recall]", "the"],
  ["indeed", "we", "sent"],
  ["we", "sent", "to"],
  ["we", "sent", "down"],
  ["we", "revealed", "to"],
  ["we", "gave", "him"],
  ["we", "gave", "moses"],
  ["we", "gave", "the"],
  ["we", "saved", "them"],
  ["we", "destroyed", "them"],
  ["we", "punished", "them"],
  ["we", "took", "the"],
  ["when", "they", "entered"],
  ["when", "they", "left"],
  ["when", "they", "fled"],
  ["when", "they", "returned"],
  ["when", "they", "fought"],
  ["when", "they", "built"],
  ["when", "they", "destroyed"],
  ["when", "they", "worshipped"],
  ["when", "they", "disobeyed"],
  ["when", "they", "believed"],
  ["when", "they", "disbelieved"],
  ["prophet", "muhammad"],
  ["prophet", "moses"],
  ["prophet", "abraham"],
  ["prophet", "noah"],
  ["prophet", "lot"],
  ["prophet", "adam"],
  ["prophet", "jesus"],
  ["prophet", "john"],
  ["gourd", "vine"],
  ["laden", "ship"],
  ["ran", "away", "to"],
  ["fish", "swallowed"],
  ["so", "leave", "them"],
  ["day", "the", "caller"],
  ["preferred", "the", "life", "of", "the", "world"],
  ["have", "they", "a", "share", "of", "dominion"],
  ["speck", "on", "a", "date", "seed"],
  
  // Legal context combinations
  ["cut", "off", "the"],
  ["cut", "off", "his"],
  ["cut", "off", "her"],
  ["lash", "them", "with"],
  ["flog", "them", "with"],
  ["bring", "four", "witnesses"],
  ["produce", "four", "witnesses"],
  ["the", "punishment", "for"],
  ["the", "penalty", "for"],
  ["the", "retribution", "for"],
  ["testimony", "of", "witnesses"],
  ["oath", "of", "allah"],
  ["vow", "to", "allah"],
  ["court", "of", "law"],
  ["justice", "for", "the"],
  
  // War context combinations
  ["fight", "them", "in"],
  ["fight", "in", "the", "way"],
  ["kill", "them", "wherever"],
  ["kill", "the", "polytheists"],
  ["slay", "them", "wherever"],
  ["when", "you", "meet"],
  ["strike", "their", "necks"],
  ["strike", "the", "necks"],
  ["wage", "war", "against"],
  ["battle", "of", "the"],
  ["sword", "of", "allah"],
  ["weapon", "of", "war"],
  ["attack", "the", "enemy"],
  ["destroy", "the", "enemy"],
  
  // Private matters combinations
  ["sexual", "intercourse"],
  ["unlawful", "sexual", "intercourse"],
  ["accuse", "their", "wives"],
  ["accuse", "chaste", "women"],
  ["found", "guilty", "of"],
  ["private", "parts"],
  ["approach", "prayer", "while"],
  ["when", "women", "menstruate"],
  ["during", "menstruation"],
  ["marriage", "contract"],
  ["divorce", "proceedings"],
  ["breast", "feeding"],
  ["naked", "bodies"],
  ["nude", "bodies"],
  ["virgin", "woman"],
  ["virgin", "man"],
  ["chastity", "and", "modesty"],
  
  // Theological combinations (only exclude if no inclusion phrase)
  ["people", "of", "the", "book"],
  ["those", "who", "disbelieve"],
  ["those", "who", "disbelieved"],
  ["those", "who", "commit", "disbelief"],
  ["those", "who", "commit", "apostasy"],
  ["blasphemy", "against", "allah"],
  ["apostasy", "from", "islam"],
  ["disbelief", "in", "allah"],
  ["hypocrisy", "in", "faith"],
];

// Phrases that indicate universal reminders (always include if no exclusions)
const INCLUSION_PHRASES = [
  // Allah's attributes
  "indeed, allah is",
  "allah is",
  "indeed, allah",
  "with allah",
  "from allah",
  "to allah",
  "allah knows",
  "allah sees",
  "allah hears",
  "lord of the worlds",
  "most merciful",
  "most compassionate",
  "forgiving",
  "merciful",
  
  // Hereafter reminders
  "paradise",
  "hellfire",
  "hell",
  "the fire",
  "the hereafter",
  "the day of judgment",
  "the last day",
  "the day of resurrection",
  "the garden",
  
  // Moral guidance
  "fear allah",
  "be mindful of",
  "remember allah",
  "be grateful",
  "give thanks",
  "be patient",
  "be steadfast",
  "do good",
  "evil deeds",
  "good deeds",
  "righteous",
  "faith",
  "believe",
  
  // Universal truths
  "indeed, we created",
  "we created",
  "mankind",
  "human beings",
  "all of creation",
  "signs",
  "reflect",
  "understand",
  
  // Prayer and worship
  "establish prayer",
  "pray",
  "worship",
  "prostrate",
  "bow down",
  "glorify",
  "praise",
  
  // Character and conduct
  "be just",
  "be fair",
  "be kind",
  "be merciful",
  "compassion",
  "charity",
  "give charity",
  "spend in the way",
  "parents",
  "truth",
  "honesty",
  "i am near",
  "he is allah",
  "allah, the eternal refuge",
  "my servants",
  "zakat",
  "zakah",
];

/**
 * Check if a verse should be excluded from random display
 * @param {string} text - The verse text (English translation)
 * @returns {boolean} - True if verse should be excluded
 */
function shouldExcludeVerse(text) {
  const lowerText = text.toLowerCase();
  
  // 1. Check for individual exclusion phrases
  for (const phrase of EXCLUSION_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  
  // 2. Check for combination patterns (all words in the array must be present in order)
  for (const combination of EXCLUSION_COMBINATIONS) {
    let lastIndex = -1;
    let allFound = true;
    
    for (const word of combination) {
      const index = lowerText.indexOf(word.toLowerCase(), lastIndex + 1);
      if (index === -1) {
        allFound = false;
        break;
      }
      lastIndex = index;
    }
    
    if (allFound) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a verse is definitely appropriate (universal reminder)
 * @param {string} text - The verse text (English translation)
 * @returns {boolean} - True if verse is definitely appropriate
 */
function isInclusionVerse(text) {
  const lowerText = text.toLowerCase();
  
  // Check for inclusion phrases
  for (const phrase of INCLUSION_PHRASES) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter verses to get only appropriate ones for random display
 * @param {Array} verses - Array of verse objects
 * @returns {Array} - Filtered array of appropriate verses
 */
function filterVerses(verses) {
  const filtered = [];
  
  for (const verse of verses) {
    const text = verse.english || verse.text || '';
    if (!text) continue;
    
    const excluded = shouldExcludeVerse(text);
    const included = isInclusionVerse(text);
    
    // Skip if excluded, UNLESS it's also explicitly marked as an inclusion verse
    // (Inclusion phrases act as an override for general exclusions like "And when")
    if (excluded && !included) {
      continue;
    }
    
    filtered.push(verse);
  }
  
  return filtered;
}

/**
 * Get a random appropriate verse
 * @param {Array} verses - Array of verse objects
 * @param {number} maxAttempts - Maximum attempts to find a verse
 * @returns {Object|null} - Random appropriate verse or null if not found
 */
function getRandomAppropriateVerse(verses, maxAttempts = 10) {
  const filteredVerses = filterVerses(verses);
  
  if (filteredVerses.length === 0) {
    console.warn('No appropriate verses found after filtering');
    return null;
  }
  
  // Pick a random verse from filtered list
  const randomIndex = Math.floor(Math.random() * filteredVerses.length);
  return filteredVerses[randomIndex];
}

/**
 * Get a random verse with fallback (tries multiple times if needed)
 * @param {Array} verses - Array of verse objects
 * @returns {Object} - Random verse (with fallback if needed)
 */
function getRandomVerseWithFallback(verses) {
  const verse = getRandomAppropriateVerse(verses);
  
  // If no appropriate verse found, use a safe fallback
  if (!verse) {
    console.warn('Using fallback verse due to filtering');
    return {
      sura: 3,
      aya: 103,
      arabic: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
      english: "And hold fast by the covenant of Allah all together and be not disunited",
      text: "And hold fast by the covenant of Allah all together and be not disunited",
      translation: "And hold fast by the covenant of Allah all together and be not disunited",
      reference: "[Quran, 3:103]"
    };
  }
  
  return verse;
}

module.exports = {
  shouldExcludeVerse,
  isInclusionVerse,
  filterVerses,
  getRandomAppropriateVerse,
  getRandomVerseWithFallback,
  EXCLUSION_PHRASES,
  INCLUSION_PHRASES,
  EXCLUSION_COMBINATIONS
};


// =====================================================
// Get Complete Verse Statistics
// =====================================================
//
// This script provides detailed statistics about which verses
// can show up on the homepage and which are excluded.
//
// Run with: node get-verse-statistics.js
// =====================================================

const fs = require('fs');
const path = require('path');

// Copy the exact filtering function from the homepage
function filterVerses(verses) {
  const EXCLUSION_PHRASES = [
    // Historical narratives requiring context - MORE SPECIFIC
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
    "menstruation",
    "menstruating",
    "menstruate",
    "breast",
    "naked",
    "nude",
    "marriage",
    "divorce",
    "wife",
    "husband",
    "virgin",
    "chastity",
    
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
  ];

// COMBINATION PATTERNS - More specific to avoid filtering reminders
const EXCLUSION_COMBINATIONS = [
  // Historical context combinations
  "people of" + " " + "abraham",
  "people of" + " " + "lot", 
  "people of" + " " + "noah",
  "people of" + " " + "moses",
  "people of" + " " + "pharaoh",
  "people of" + " " + "aad",
  "people of" + " " + "thamud",
  "people of" + " " + "madyan",
  "children of" + " " + "israel",
  "tribe of" + " " + "a",
  "when" + " " + "you" + " " + "were",
  "and" + " " + "when" + " " + "the",
  "and" + " " + "recall" + " " + "the",
  "and" + " " + "[recall]" + " " + "the",
  "indeed" + " " + "we" + " " + "sent",
  "we" + " " + "sent" + " " + "to",
  "we" + " " + "sent" + " " + "down",
  "we" + " " + "revealed" + " " + "to",
  "we" + " " + "gave" + " " + "him",
  "we" + " " + "gave" + " " + "moses",
  "we" + " " + "gave" + " " + "the",
  "we" + " " + "saved" + " " + "them",
  "we" + " " + "destroyed" + " " + "them",
  "we" + " " + "punished" + " " + "them",
  "we" + " " + "took" + " " + "the",
  "when" + " " + "they" + " " + "entered",
  "when" + " " + "they" + " " + "left",
  "when" + " " + "they" + " " + "fled",
  "when" + " " + "they" + " " + "returned",
  "when" + " " + "they" + " " + "fought",
  "when" + " " + "they" + " " + "built",
  "when" + " " + "they" + " " + "destroyed",
  "when" + " " + "they" + " " + "worshipped",
  "when" + " " + "they" + " " + "disobeyed",
  "when" + " " + "they" + " " + "believed",
  "when" + " " + "they" + " " + "disbelieved",
  "the" + " " + "people" + " " + "of" + " " + "noah",
  "the" + " " + "people" + " " + "of" + " " + "lot",
  "the" + " " + "people" + " " + "of" + " " + "ad",
  "the" + " " + "people" + " " + "of" + " " + "thamud",
  "prophet" + " " + "muhammad",
  "prophet" + " " + "moses",
  "prophet" + " " + "abraham",
  "prophet" + " " + "noah",
  "prophet" + " " + "lot",
  "prophet" + " " + "adam",
  "prophet" + " " + "jesus",
  "prophet" + " " + "john",
  
  // Legal context combinations
  "cut" + " " + "off" + " " + "the",
  "cut" + " " + "off" + " " + "his",
  "cut" + " " + "off" + " " + "her",
  "lash" + " " + "them" + " " + "with",
  "flog" + " " + "them" + " " + "with",
  "bring" + " " + "four" + " " + "witnesses",
  "produce" + " " + "four" + " " + "witnesses",
  "the" + " " + "punishment" + " " + "for",
  "the" + " " + "penalty" + " " + "for",
  "the" + " " + "retribution" + " " + "for",
  "testimony" + " " + "of" + " " + "witnesses",
  "oath" + " " + "of" + " " + "allah",
  "vow" + " " + "to" + " " + "allah",
  "court" + " " + "of" + " " + "law",
  "judge" + " " + " " + "between",
  "justice" + " " + "for" + " " + "the",
  
  // War context combinations
  "fight" + " " + "them" + " " + "in",
  "fight" + " " + " " + "the" + " " + "way",
  "kill" + " " + "them" + " " + "wherever",
  "kill" + " " + "the" + " " + "polytheists",
  "slay" + " " + "them" + " " + "wherever",
  "when" + " " + "you" + " " + "meet",
  "when" + " " + "you" + " " + "meet" + " " + "the",
  "strike" + " " + "their" + " " + "necks",
  "strike" + " " + " " + "the" + " " + "necks",
  "wage" + " " + "war" + " " + "against",
  "battle" + " " + " " + "of" + " " + "the",
  "sword" + " " + " " + "of" + " " + "allah",
  "weapon" + " " + " " + "of" + " " + "war",
  "attack" + " " + " " + "the" + " " + "enemy",
  "destroy" + " " + " " + "the" + " " + "enemy",
  
  // Private matters combinations
  "sexual" + " " + "intercourse",
  "unlawful" + " " + "sexual" + " " + "intercourse",
  "accuse" + " " + "their" + " " + "wives",
  "accuse" + " " + "chaste" + " " + "women",
  "four" + " " + "witnesses",
  "bring" + " " + "four" + " " + "witnesses",
  "unmarried" + " " + "woman",
  "unmarried" + " " + "man",
  "found" + " " + "guilty" + " " + "of",
  "private" + " " + "parts",
  "approach" + " " + "prayer" + " " + "while",
  "when" + " " + "women" + " " + "menstruate",
  "during" + " " + "menstruation",
  "marriage" + " " + "contract",
  "divorce" + " " + "proceedings",
  "breast" + " " + "feeding",
  "virgin" + " " + "woman",
  "virgin" + " " + "man",
  "chastity" + " " + "and" + " " + "modesty",
  
  // Theological combinations
  "people" + " " + "of" + " " + "the" + " " + "book",
  "the" + " " + "people" + " " + "of" + " " + "the" + " " + "book",
  "the" + " " + "disbelievers" + " " + "will",
  "the" + " " + "hypocrites" + " " + "will",
  "the" + " " + "polytheists" + " " + "will",
  "those" + " " + "who" + " " + "disbelieve",
  "those" + " " + "who" + " " + "disbelieved",
  "those" + " " + "who" + " " + "commit" + " " + "disbelief",
  "those" + " " + "who" + " " + "commit" + " " + "apostasy",
  "infidels" + " " + " " + "will" + " " + "be",
  "idolaters" + " " + " " + "will" + " " + "be",
  "blasphemy" + " " + "against" + " " + "allah",
  "apostasy" + " " + "from" + " " + "islam",
  "disbelief" + " " + "in" + " " + "allah",
  "hypocrisy" + " " + "in" + " " + "faith",
];

  const filtered = [];
  
  for (const verse of verses) {
    const text = verse.text || verse.english || '';
    const lowerText = text.toLowerCase();
    
    // Check for exclusion phrases
    let shouldExclude = false;
    
    // First check individual phrases
    for (const phrase of EXCLUSION_PHRASES) {
      if (lowerText.includes(phrase.toLowerCase())) {
        shouldExclude = true;
        break;
      }
    }
    
    // Then check combination patterns (more specific)
    if (!shouldExclude) {
      for (const combination of EXCLUSION_COMBINATIONS) {
        if (lowerText.includes(combination.toLowerCase())) {
          shouldExclude = true;
          break;
        }
      }
    }
    
    if (!shouldExclude) {
      filtered.push(verse);
    }
  }
  
  return filtered;
}

console.log('📊 COMPLETE QURAN VERSE STATISTICS\n');

try {
  const quranDataPath = path.join(__dirname, 'Quran-Translation', 'quran-data.json');
  
  if (!fs.existsSync(quranDataPath)) {
    console.log('❌ Quran data file not found');
    process.exit(1);
  }
  
  const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
  
  // Get all verses
  const allVerses = [];
  quranData.suras.forEach(sura => {
    sura.verses.forEach(verse => {
      allVerses.push({
        text: verse.english,
        sura: sura.number,
        aya: verse.aya,
        suraName: sura.name
      });
    });
  });
  
  // Apply filtering
  const filteredVerses = filterVerses(allVerses);
  const excludedVerses = allVerses.filter(v => !filteredVerses.includes(v));
  
  console.log('🎯 OVERALL STATISTICS');
  console.log('=' .repeat(60));
  console.log(`Total verses in Quran: ${allVerses.length}`);
  console.log(`Verses that CAN show up: ${filteredVerses.length}`);
  console.log(`Verses that ARE EXCLUDED: ${excludedVerses.length}`);
  console.log(`Retention rate: ${((filteredVerses.length / allVerses.length) * 100).toFixed(1)}%`);
  console.log(`Exclusion rate: ${((excludedVerses.length / allVerses.length) * 100).toFixed(1)}%`);
  
  // Statistics by sura
  console.log('\n📊 STATISTICS BY SURA');
  console.log('=' .repeat(60));
  
  const suraStats = [];
  for (const sura of quranData.suras) {
    const suraVerses = sura.verses.map(v => ({
      text: v.english,
      sura: sura.number,
      aya: v.aya
    }));
    
    const filteredSuraVerses = filterVerses(suraVerses);
    const retainedCount = filteredSuraVerses.length;
    const excludedCount = suraVerses.length - retainedCount;
    const retentionRate = ((retainedCount / suraVerses.length) * 100).toFixed(1);
    
    suraStats.push({
      number: sura.number,
      name: sura.name,
      total: suraVerses.length,
      retained: retainedCount,
      excluded: excludedCount,
      rate: parseFloat(retentionRate)
    });
  }
  
  // Sort by retention rate (lowest first)
  suraStats.sort((a, b) => a.rate - b.rate);
  
  console.log('\n📉 SURAS WITH LOWEST RETENTION (most excluded):');
  console.log('Sura | Name | Total | Retained | Excluded | Rate');
  console.log('-' .repeat(70));
  
  for (const sura of suraStats.slice(0, 15)) {
    console.log(`${sura.number.toString().padStart(4)} | ${(sura.name || `Surah ${sura.number}`).padEnd(20)} | ${sura.total.toString().padStart(5)} | ${sura.retained.toString().padStart(8)} | ${sura.excluded.toString().padStart(8)} | ${sura.rate}%`);
  }
  
  console.log('\n📈 SURAS WITH HIGHEST RETENTION (least excluded):');
  console.log('Sura | Name | Total | Retained | Excluded | Rate');
  console.log('-' .repeat(70));
  
  for (const sura of suraStats.slice(-10).reverse()) {
    console.log(`${sura.number.toString().padStart(4)} | ${(sura.name || `Surah ${sura.number}`).padEnd(20)} | ${sura.total.toString().padStart(5)} | ${sura.retained.toString().padStart(8)} | ${sura.excluded.toString().padStart(8)} | ${sura.rate}%`);
  }
  
  // Check for suras with zero verses
  const zeroVerseSuras = suraStats.filter(s => s.retained === 0);
  if (zeroVerseSuras.length > 0) {
    console.log('\n❌ SURAS WITH ZERO VERSES (completely excluded):');
    for (const sura of zeroVerseSuras) {
      console.log(`   Surah ${sura.number}: ${sura.name} (${sura.total} verses total)`);
    }
  } else {
    console.log('\n✅ NO SURAS ARE COMPLETELY EXCLUDED');
  }
  
  // Examples of verses that can show up
  console.log('\n📝 EXAMPLES OF VERSES THAT CAN SHOW UP:');
  for (let i = 0; i < Math.min(15, filteredVerses.length); i++) {
    const verse = filteredVerses[i];
    console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
  }
  
  // Examples of excluded verses
  console.log('\n📝 EXAMPLES OF EXCLUDED VERSES:');
  for (let i = 0; i < Math.min(15, excludedVerses.length); i++) {
    const verse = excludedVerses[i];
    console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ ${filteredVerses.length} verses can appear on your homepage`);
  console.log(`❌ ${excludedVerses.length} verses are excluded`);
  console.log(`📊 ${(filteredVerses.length / allVerses.length * 100).toFixed(1)}% of verses are available`);
  console.log(`🎲 Each page refresh shows one of ${filteredVerses.length} appropriate verses`);
  
  console.log('\n🎉 Statistics completed!');
  
} catch (error) {
  console.error('Error:', error.message);
}

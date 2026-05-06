// =====================================================
// Test Refined Filtering with Combination Patterns
// =====================================================
//
// This script tests the refined filtering system that uses both
// individual phrases and combination patterns to better distinguish
// between historical context and spiritual reminders.
//
// Run with: node test-refined-filtering.js
// =====================================================

const fs = require('fs');
const path = require('path');

// Import the refined filtering function
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
  "children of" + " " + "israel",
  "tribe of" + " " + "a",
  "when" + " " + "you" + " " + "were",
  "and" + " " + "when" + " " + "the",
  "and" + " " + "recall" + " " + "the",
  "indeed" + " " + "we" + " " + "sent",
  "we" + " " + "sent" + " " + "to",
  "we" + " " + "gave" + " " + "him",
  "we" + " " + "saved" + " " + "them",
  "we" + " " + "destroyed" + " " + "them",
  
  // Legal context combinations
  "cut" + " " + "off" + " " + "the",
  "lash" + " " + "them" + " " + "with",
  "bring" + " " + "four" + " " + "witnesses",
  "the" + " " + "punishment" + " " + "for",
  "the" + " " + "penalty" + " " + "for",
  
  // War context combinations
  "fight" + " " + "them" + " " + "in",
  "kill" + " " + "them" + " " + "wherever",
  "when" + " " + "you" + " " + "meet",
  "strike" + " " + "their" + " " + "necks",
  
  // Private matters combinations
  "sexual" + " " + "intercourse",
  "accuse" + " " + "their" + " " + "wives",
  "accuse" + " " + "chaste" + " " + "women",
  "four" + " " + "witnesses",
  "unmarried" + " " + "woman",
  "unmarried" + " " + "man",
  "found" + " " + "guilty" + " " + "of",
  
  // Theological combinations
  "people" + " " + "of" + " " + "the" + " " + "book",
  "the" + " " + "disbelievers" + " " + "will",
  "the" + " " + "hypocrites" + " " + "will",
  "those" + " " + "who" + " " + "disbelieve",
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

console.log('🧪 TESTING REFINED FILTERING WITH COMBINATION PATTERNS\n');

// Test specific cases the user mentioned
const specificTestCases = [
  {
    text: "And the people of Abraham and the people of Lot",
    expected: "exclude",
    reason: "Historical context requiring understanding"
  },
  {
    text: "And the people of Noah were saved",
    expected: "exclude", 
    reason: "Historical narrative"
  },
  {
    text: "And when you were in the wilderness",
    expected: "exclude",
    reason: "Historical context"
  },
  {
    text: "Indeed, We sent Noah to his people",
    expected: "exclude",
    reason: "Prophet story"
  },
  {
    text: "We gave Moses the Torah",
    expected: "exclude",
    reason: "Historical revelation"
  },
  {
    text: "And the people of the book will say",
    expected: "exclude",
    reason: "Theological discussion"
  },
  {
    text: "When they entered the city",
    expected: "exclude",
    reason: "Historical event"
  },
  {
    text: "We destroyed them for their sins",
    expected: "exclude",
    reason: "Historical punishment"
  }
];

// Test reminder verses that should be included
const reminderTestCases = [
  {
    text: "Indeed, Allah is with those who fear Him",
    expected: "include",
    reason: "Universal spiritual reminder"
  },
  {
    text: "And fear Allah much",
    expected: "include",
    reason: "Moral guidance"
  },
  {
    text: "Establish prayer and give zakah",
    expected: "include",
    reason: "Worship instruction"
  },
  {
    text: "Paradise is for those who are mindful",
    expected: "include",
    reason: "Hereafter reminder"
  },
  {
    text: "Be grateful to Allah",
    expected: "include",
    reason: "Character development"
  },
  {
    text: "Allah is Forgiving and Merciful",
    expected: "include",
    reason: "Allah's attributes"
  },
  {
    text: "The patient will be rewarded",
    expected: "include",
    reason: "Encouragement"
  },
  {
    text: "Remember Allah often",
    expected: "include",
    reason: "Spiritual reminder"
  }
];

console.log('📋 TESTING SPECIFIC HISTORICAL CONTEXT CASES');
console.log('=' .repeat(80));

let specificTestsPassed = 0;
for (const test of specificTestCases) {
  const result = filterVerses([{text: test.text}]);
  const passed = (test.expected === "exclude" && result.length === 0);
  
  if (passed) specificTestsPassed++;
  
  console.log(`${passed ? '✅' : '❌'} ${test.expected.toUpperCase()}: "${test.text}"`);
  if (!passed) {
    console.log(`   Reason: ${test.reason}`);
    console.log(`   Result: ${result.length === 0 ? 'EXCLUDED' : 'INCLUDED'}`);
  }
}

console.log(`\nSpecific historical tests: ${specificTestsPassed}/${specificTestCases.length} passed`);

console.log('\n📋 TESTING REMINDER VERSES (should be included)');
console.log('=' .repeat(80));

let reminderTestsPassed = 0;
for (const test of reminderTestCases) {
  const result = filterVerses([{text: test.text}]);
  const passed = (test.expected === "include" && result.length === 1);
  
  if (passed) reminderTestsPassed++;
  
  console.log(`${passed ? '✅' : '❌'} ${test.expected.toUpperCase()}: "${test.text}"`);
  if (!passed) {
    console.log(`   Reason: ${test.reason}`);
    console.log(`   Result: ${result.length === 0 ? 'EXCLUDED' : 'INCLUDED'}`);
  }
}

console.log(`\nReminder tests: ${reminderTestsPassed}/${reminderTestCases.length} passed`);

// Test with actual Quran data
console.log('\n📖 TESTING WITH ACTUAL QURAN DATA');
console.log('=' .repeat(80));

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
  
  console.log(`Total verses: ${allVerses.length}`);
  
  // Apply refined filtering
  const startTime = Date.now();
  const filteredVerses = filterVerses(allVerses);
  const endTime = Date.now();
  
  const excludedVerses = allVerses.filter(v => !filteredVerses.includes(v));
  
  console.log(`Filtering time: ${endTime - startTime}ms`);
  console.log(`Verses retained: ${filteredVerses.length}`);
  console.log(`Verses excluded: ${excludedVerses.length}`);
  console.log(`Retention rate: ${((filteredVerses.length / allVerses.length) * 100).toFixed(1)}%`);
  
  // Check for the specific verse the user mentioned
  const userVerse = excludedVerses.find(v => 
    v.text.includes("people of Abraham") || v.text.includes("people of Lot")
  );
  
  if (userVerse) {
    console.log(`\n✅ SUCCESS: Found and excluded the verse you mentioned:`);
    console.log(`   [${userVerse.sura}:${userVerse.aya}] ${userVerse.text}`);
  } else {
    console.log(`\n❌ Could not find the specific verse mentioned`);
  }
  
  // Check sura coverage
  const suraStats = {};
  for (const sura of quranData.suras) {
    const suraVerses = sura.verses.map(v => ({
      text: v.english,
      sura: sura.number,
      aya: v.aya
    }));
    
    const filteredSuraVerses = filterVerses(suraVerses);
    const retainedCount = filteredSuraVerses.length;
    
    suraStats[sura.number] = {
      name: sura.name,
      total: suraVerses.length,
      retained: retainedCount,
      excluded: suraVerses.length - retainedCount,
      rate: ((retainedCount / suraVerses.length) * 100).toFixed(1)
    };
  }
  
  const surasWithZeroVerses = Object.entries(suraStats)
    .filter(([num, stats]) => stats.retained === 0)
    .length;
  
  console.log(`\n📊 SURA COVERAGE:`);
  console.log(`Suras with zero verses: ${surasWithZeroVerses}`);
  
  if (surasWithZeroVerses === 0) {
    console.log('✅ All 114 suras have verses after filtering');
  } else {
    console.log('❌ Some suras are completely excluded');
  }
  
  // Show examples of newly excluded verses (historical context)
  console.log('\n📝 EXAMPLES OF EXCLUDED HISTORICAL CONTEXT VERSES:');
  const historicalExclusions = excludedVerses.filter(v => 
    v.text.toLowerCase().includes('people of') ||
    v.text.toLowerCase().includes('when you were') ||
    v.text.toLowerCase().includes('indeed, we sent') ||
    v.text.toLowerCase().includes('we gave')
  ).slice(0, 10);
  
  for (const verse of historicalExclusions) {
    console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
  }
  
  // Show examples of retained reminder verses
  console.log('\n📝 EXAMPLES OF RETAINED REMINDER VERSES:');
  for (let i = 0; i < Math.min(10, filteredVerses.length); i++) {
    const verse = filteredVerses[i];
    console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

// Final summary
console.log('\n' + '=' .repeat(80));
console.log('🎯 REFINED FILTERING TEST SUMMARY');
console.log('=' .repeat(80));

const totalTests = specificTestCases.length + reminderTestCases.length;
const totalPassed = specificTestsPassed + reminderTestsPassed;

console.log(`Specific historical tests: ${specificTestsPassed}/${specificTestCases.length} passed`);
console.log(`Reminder tests: ${reminderTestsPassed}/${reminderTestCases.length} passed`);
console.log(`Overall: ${totalPassed}/${totalTests} passed`);

if (totalPassed === totalTests) {
  console.log('\n✅ All tests passed! Refined filtering is working correctly.');
} else {
  console.log(`\n❌ ${totalTests - totalPassed} tests failed. Review needed.`);
}

console.log('\n🎉 Refined filtering test completed!');

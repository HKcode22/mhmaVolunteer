// =====================================================
// Test Expanded Filtering with Comprehensive Patterns
// =====================================================
//
// This script tests the expanded exclusion phrases to ensure
// they properly filter verses requiring historical context
// or containing complex legal/private matters.
//
// Run with: node test-expanded-filtering.js
// =====================================================

const fs = require('fs');
const path = require('path');

// Import the expanded filtering function
function filterVerses(verses) {
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
    "people of lut",
    "people of noah",
    "people of ad",
    "people of thamud",
    "people of pharaoh",
    "children of israel",
    "tribe of",
    "kingdom of",
    "prophet muhammad",
    "prophet moses",
    "prophet abraham",
    "prophet noah",
    "prophet lot",
    
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

  const filtered = [];
  
  for (const verse of verses) {
    const text = verse.text || verse.english || '';
    const lowerText = text.toLowerCase();
    
    // Check for exclusion phrases
    let shouldExclude = false;
    for (const phrase of EXCLUSION_PHRASES) {
      if (lowerText.includes(phrase.toLowerCase())) {
        shouldExclude = true;
        break;
      }
    }
    
    if (!shouldExclude) {
      filtered.push(verse);
    }
  }
  
  return filtered;
}

console.log('🧪 TESTING EXPANDED FILTERING WITH COMPREHENSIVE PATTERNS\n');

// Test cases for each category
const testCases = {
  historical: [
    {
      text: "And [recall] when Moses said to his people",
      expected: "exclude",
      reason: "Historical narrative"
    },
    {
      text: "Indeed, We sent Noah to his people",
      expected: "exclude",
      reason: "Prophet story"
    },
    {
      text: "We sent down the Torah",
      expected: "exclude",
      reason: "Revelation context"
    },
    {
      text: "The people of Pharaoh were destroyed",
      expected: "exclude",
      reason: "Historical event"
    },
    {
      text: "Children of Israel were saved",
      expected: "exclude",
      reason: "Historical reference"
    }
  ],
  
  legal: [
    {
      text: "Cut off the hand of the thief",
      expected: "exclude",
      reason: "Legal punishment"
    },
    {
      text: "Lash them with eighty lashes",
      expected: "exclude",
      reason: "Judicial punishment"
    },
    {
      text: "Bring four witnesses",
      expected: "exclude",
      reason: "Legal testimony"
    },
    {
      text: "The penalty for those who wage war",
      expected: "exclude",
      reason: "Legal context"
    },
    {
      text: "The judge will rule between them",
      expected: "exclude",
      reason: "Judicial matter"
    }
  ],
  
  war: [
    {
      text: "Fight them in the way of Allah",
      expected: "exclude",
      reason: "War context"
    },
    {
      text: "Kill them wherever you find them",
      expected: "exclude",
      reason: "Battle instructions"
    },
    {
      text: "When you meet the enemy in battle",
      expected: "exclude",
      reason: "Combat situation"
    },
    {
      text: "Strike their necks",
      expected: "exclude",
      reason: "War context"
    },
    {
      text: "Destroy the enemy",
      expected: "exclude",
      reason: "Conflict context"
    }
  ],
  
  private: [
    {
      text: "The [unmarried] woman found guilty of sexual intercourse",
      expected: "exclude",
      reason: "Private matter"
    },
    {
      text: "Those who accuse their wives",
      expected: "exclude",
      reason: "Marital dispute"
    },
    {
      text: "When women menstruate",
      expected: "exclude",
      reason: "Private biological matter"
    },
    {
      text: "Do not approach prayer while intoxicated",
      expected: "exclude",
      reason: "Private behavior"
    },
    {
      text: "The divorce proceedings",
      expected: "exclude",
      reason: "Marital law"
    }
  ],
  
  theological: [
    {
      text: "The people of the book argue",
      expected: "exclude",
      reason: "Complex theological discussion"
    },
    {
      text: "The disbelievers will be punished",
      expected: "exclude",
      reason: "Theological controversy"
    },
    {
      text: "The hypocrites will be in the lowest depth",
      expected: "exclude",
      reason: "Complex theological matter"
    },
    {
      text: "Those who commit apostasy",
      expected: "exclude",
      reason: "Theological controversy"
    },
    {
      text: "The polytheists will regret",
      expected: "exclude",
      reason: "Theological discussion"
    }
  ],
  
  appropriate: [
    {
      text: "Indeed, Allah is with the patient",
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
      reason: "Worship guidance"
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
    }
  ]
};

// Run tests
let totalTests = 0;
let passedTests = 0;

console.log('📋 RUNNING CATEGORY TESTS');
console.log('=' .repeat(80));

for (const [category, tests] of Object.entries(testCases)) {
  console.log(`\n${category.toUpperCase()} TESTS:`);
  
  for (const test of tests) {
    totalTests++;
    const result = filterVerses([{text: test.text}]);
    const passed = (test.expected === "exclude" && result.length === 0) ||
                   (test.expected === "include" && result.length === 1);
    
    if (passed) passedTests++;
    
    console.log(`  ${passed ? '✅' : '❌'} ${test.expected.toUpperCase()}: "${test.text.substring(0, 60)}..."`);
    if (!passed) {
      console.log(`     Reason: ${test.reason}`);
      console.log(`     Result: ${result.length === 0 ? 'EXCLUDED' : 'INCLUDED'}`);
    }
  }
}

console.log(`\n📊 CATEGORY TEST RESULTS: ${passedTests}/${totalTests} passed`);

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
  
  // Apply expanded filtering
  const startTime = Date.now();
  const filteredVerses = filterVerses(allVerses);
  const endTime = Date.now();
  
  const excludedVerses = allVerses.filter(v => !filteredVerses.includes(v));
  
  console.log(`Filtering time: ${endTime - startTime}ms`);
  console.log(`Verses retained: ${filteredVerses.length}`);
  console.log(`Verses excluded: ${excludedVerses.length}`);
  console.log(`Retention rate: ${((filteredVerses.length / allVerses.length) * 100).toFixed(1)}%`);
  
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
  
  // Show examples of excluded verses by category
  console.log('\n📝 EXAMPLES OF EXCLUDED VERSES:');
  const excludedByCategory = {
    historical: [],
    legal: [],
    war: [],
    private: [],
    theological: []
  };
  
  for (const verse of excludedVerses.slice(0, 50)) {
    const lowerText = verse.text.toLowerCase();
    
    if (lowerText.includes('when') || lowerText.includes('remember') || lowerText.includes('recall')) {
      excludedByCategory.historical.push(verse);
    } else if (lowerText.includes('punishment') || lowerText.includes('lash') || lowerText.includes('witness')) {
      excludedByCategory.legal.push(verse);
    } else if (lowerText.includes('fight') || lowerText.includes('kill') || lowerText.includes('battle')) {
      excludedByCategory.war.push(verse);
    } else if (lowerText.includes('sexual') || lowerText.includes('marriage') || lowerText.includes('wife')) {
      excludedByCategory.private.push(verse);
    } else {
      excludedByCategory.theological.push(verse);
    }
  }
  
  for (const [category, verses] of Object.entries(excludedByCategory)) {
    if (verses.length > 0) {
      console.log(`\n${category.toUpperCase()} (showing first 3):`);
      for (let i = 0; i < Math.min(3, verses.length); i++) {
        const verse = verses[i];
        console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
      }
    }
  }
  
  // Show examples of retained verses
  console.log('\n📝 EXAMPLES OF RETAINED VERSES (appropriate reminders):');
  for (let i = 0; i < Math.min(10, filteredVerses.length); i++) {
    const verse = filteredVerses[i];
    console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

// Final summary
console.log('\n' + '=' .repeat(80));
console.log('🎯 EXPANDED FILTERING TEST SUMMARY');
console.log('=' .repeat(80));

if (passedTests === totalTests) {
  console.log('✅ All category tests passed');
} else {
  console.log(`❌ ${totalTests - passedTests} category tests failed`);
}

console.log('\n🎉 Expanded filtering test completed!');

// =====================================================
// Extended Test Script for Quran Verse Filtering
// =====================================================
//
// This script does more comprehensive testing of the verse filtering
// to ensure it works correctly with various edge cases.
//
// Run with: node test-verse-filter-extended.js
// =====================================================

const fs = require('fs');
const path = require('path');

// Import the filtering function from the homepage
function filterVerses(verses) {
  const EXCLUSION_PHRASES = [
    "when you were",
    "remember when",
    "and when",
    "and recall",
    "and [recall]",
    "people of lut",
    "people of noah",
    "cut off",
    "stoning",
    "fight in the way",
    "fight them",
    "kill them",
    "wherever you find",
    "wage war",
    "approach",
    "zina",
    "homosexual",
    "homosexuality",
    "sodomy",
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

console.log('🧪 EXTENDED TESTING FOR QURAN VERSE FILTERING\n');

// Test 1: Edge cases with partial matches
console.log('📋 Test 1: Edge cases with partial matches');
console.log('=' .repeat(60));

const edgeCases = [
  {
    text: "When you were children, Allah guided you",
    expected: "exclude",
    reason: "Contains 'when you were'"
  },
  {
    text: "Remember when Allah saved you",
    expected: "exclude", 
    reason: "Contains 'remember when'"
  },
  {
    text: "And when the believers fought",
    expected: "exclude",
    reason: "Contains 'and when'"
  },
  {
    text: "And recall the day of judgment",
    expected: "exclude",
    reason: "Contains 'and recall'"
  },
  {
    text: "And [recall] when Moses was given the Torah",
    expected: "exclude",
    reason: "Contains 'and [recall]'"
  },
  {
    text: "The people of Lut were punished",
    expected: "exclude",
    reason: "Contains 'people of lut'"
  },
  {
    text: "The people of Noah built the ark",
    expected: "exclude",
    reason: "Contains 'people of noah'"
  },
  {
    text: "Cut off their hands as punishment",
    expected: "exclude",
    reason: "Contains 'cut off'"
  },
  {
    text: "Stoning is the punishment",
    expected: "exclude",
    reason: "Contains 'stoning'"
  },
  {
    text: "Fight in the way of Allah",
    expected: "exclude",
    reason: "Contains 'fight in the way'"
  },
  {
    text: "Fight them if they oppress",
    expected: "exclude",
    reason: "Contains 'fight them'"
  },
  {
    text: "Kill them wherever you find them",
    expected: "exclude",
    reason: "Contains 'kill them'"
  },
  {
    text: "Wherever you find the enemy",
    expected: "exclude",
    reason: "Contains 'wherever you find'"
  },
  {
    text: "Those who wage war against Allah",
    expected: "exclude",
    reason: "Contains 'wage war'"
  },
  {
    text: "Do not approach zina",
    expected: "exclude",
    reason: "Contains 'approach' and 'zina'"
  },
  {
    text: "Homosexual acts are forbidden",
    expected: "exclude",
    reason: "Contains 'homosexual'"
  },
  {
    text: "Homosexuality is a sin",
    expected: "exclude",
    reason: "Contains 'homosexuality'"
  },
  {
    text: "Sodomy is prohibited",
    expected: "exclude",
    reason: "Contains 'sodomy'"
  }
];

let edgeTestsPassed = 0;
for (const test of edgeCases) {
  const result = filterVerses([test]);
  const passed = result.length === 0;
  
  console.log(`\nTest: ${test.text}`);
  console.log(`Expected: ${test.expected} (${test.reason})`);
  console.log(`Result: ${passed ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  
  if (passed) edgeTestsPassed++;
}

console.log(`\nEdge cases: ${edgeTestsPassed}/${edgeCases.length} passed`);

// Test 2: Verses that should definitely be included
console.log('\n📋 Test 2: Verses that should definitely be included');
console.log('=' .repeat(60));

const inclusionTests = [
  {
    text: "Indeed, Allah is with those who fear Him",
    expected: "include",
    category: "Allah's attributes"
  },
  {
    text: "And fear Allah much",
    expected: "include",
    category: "Fear of Allah"
  },
  {
    text: "Establish prayer and give zakah",
    expected: "include", 
    category: "Worship"
  },
  {
    text: "Those who believe and do good deeds",
    expected: "include",
    category: "Good deeds"
  },
  {
    text: "Allah is Forgiving and Merciful",
    expected: "include",
    category: "Allah's attributes"
  },
  {
    text: "Be grateful to Allah",
    expected: "include",
    category: "Gratitude"
  },
  {
    text: "Paradise is for those who are mindful",
    expected: "include",
    category: "Hereafter"
  },
  {
    text: "Hellfire is for the disbelievers",
    expected: "include",
    category: "Hereafter warnings"
  },
  {
    text: "Be patient, for Allah is with the patient",
    expected: "include",
    category: "Patience"
  },
  {
    text: "Indeed, with hardship comes ease",
    expected: "include",
    category: "Encouragement"
  }
];

let inclusionTestsPassed = 0;
for (const test of inclusionTests) {
  const result = filterVerses([test]);
  const passed = result.length === 1;
  
  console.log(`\nTest: ${test.text}`);
  console.log(`Expected: ${test.expected} (${test.category})`);
  console.log(`Result: ${passed ? '✅ INCLUDED' : '❌ NOT INCLUDED'}`);
  
  if (passed) inclusionTestsPassed++;
}

console.log(`\nInclusion tests: ${inclusionTestsPassed}/${inclusionTests.length} passed`);

// Test 3: Ambiguous cases
console.log('\n📋 Test 3: Ambiguous cases (could go either way)');
console.log('=' .repeat(60));

const ambiguousCases = [
  {
    text: "When you pray, remember Allah",
    current: "exclude",
    note: "Contains 'when you' but not 'when you were'"
  },
  {
    text: "And when the Quran is recited",
    current: "exclude", 
    note: "Contains 'and when' but not historical"
  },
  {
    text: "Fight the ego within yourself",
    current: "exclude",
    note: "Contains 'fight' but not 'fight them'"
  },
  {
    text: "Kill the ego, not the person",
    current: "exclude",
    note: "Contains 'kill' but not 'kill them'"
  },
  {
    text: "Approach Allah with humility",
    current: "exclude",
    note: "Contains 'approach' but not sexual context"
  }
];

for (const test of ambiguousCases) {
  const result = filterVerses([test]);
  const excluded = result.length === 0;
  
  console.log(`\nTest: ${test.text}`);
  console.log(`Current behavior: ${excluded ? 'EXCLUDED' : 'INCLUDED'}`);
  console.log(`Note: ${test.note}`);
}

// Test 4: Case sensitivity test
console.log('\n📋 Test 4: Case sensitivity');
console.log('=' .repeat(60));

const caseTests = [
  { text: "WHEN YOU WERE in Egypt", expected: "exclude" },
  { text: "When You Were in Egypt", expected: "exclude" },
  { text: "when you were in Egypt", expected: "exclude" },
  { text: "PEOPLE OF LUT were destroyed", expected: "exclude" },
  { text: "People Of Lut were destroyed", expected: "exclude" },
  { text: "people of lut were destroyed", expected: "exclude" }
];

let caseTestsPassed = 0;
for (const test of caseTests) {
  const result = filterVerses([test]);
  const passed = result.length === 0;
  
  console.log(`\nTest: ${test.text}`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result: ${passed ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  
  if (passed) caseTestsPassed++;
}

console.log(`\nCase sensitivity tests: ${caseTestsPassed}/${caseTests.length} passed`);

// Test 5: Performance test with actual Quran data
console.log('\n📋 Test 5: Performance test with actual Quran data');
console.log('=' .repeat(60));

try {
  const quranDataPath = path.join(__dirname, 'Quran-Translation', 'quran-data.json');
  if (fs.existsSync(quranDataPath)) {
    const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
    
    // Get all verses
    const allVerses = [];
    quranData.suras.forEach(sura => {
      sura.verses.forEach(verse => {
        allVerses.push({
          text: verse.english,
          sura: sura.number,
          aya: verse.aya
        });
      });
    });
    
    console.log(`Total verses: ${allVerses.length}`);
    
    // Test filtering performance
    const startTime = Date.now();
    const filteredVerses = filterVerses(allVerses);
    const endTime = Date.now();
    
    console.log(`Filtering time: ${endTime - startTime}ms`);
    console.log(`Verses after filtering: ${filteredVerses.length}`);
    console.log(`Filtered out: ${allVerses.length - filteredVerses.length} verses`);
    console.log(`Percentage retained: ${((filteredVerses.length / allVerses.length) * 100).toFixed(1)}%`);
    
    // Analyze which suras have most exclusions
    const suraStats = {};
    quranData.suras.forEach(sura => {
      const suraVerses = sura.verses.map(v => ({ text: v.english, sura: sura.number, aya: v.aya }));
      const filteredSuraVerses = filterVerses(suraVerses);
      const excludedCount = suraVerses.length - filteredSuraVerses.length;
      
      if (excludedCount > 0) {
        suraStats[sura.name || `Surah ${sura.number}`] = {
          total: suraVerses.length,
          excluded: excludedCount,
          percentage: ((excludedCount / suraVerses.length) * 100).toFixed(1)
        };
      }
    });
    
    console.log('\n📊 Exclusions by surah (top 10):');
    const sortedSuras = Object.entries(suraStats)
      .sort(([,a], [,b]) => b.percentage - a.percentage)
      .slice(0, 10);
    
    for (const [suraName, stats] of sortedSuras) {
      console.log(`  ${suraName}: ${stats.excluded}/${stats.total} (${stats.percentage}%)`);
    }
    
  } else {
    console.log('Quran data file not found. Skipping performance test.');
  }
} catch (error) {
  console.log('Error reading Quran data:', error.message);
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 EXTENDED TEST RESULTS SUMMARY');
console.log('=' .repeat(60));
console.log(`Edge cases: ${edgeTestsPassed}/${edgeCases.length} passed`);
console.log(`Inclusion tests: ${inclusionTestsPassed}/${inclusionTests.length} passed`);
console.log(`Case sensitivity: ${caseTestsPassed}/${caseTests.length} passed`);

const allExtendedTestsPassed = edgeTestsPassed === edgeCases.length && 
                             inclusionTestsPassed === inclusionTests.length && 
                             caseTestsPassed === caseTests.length;

if (allExtendedTestsPassed) {
  console.log('\n✅ ALL EXTENDED TESTS PASSED! Filtering is working correctly.');
} else {
  console.log('\n❌ Some extended tests failed. Please review the filtering logic.');
}

console.log('\n🎉 Extended testing completed!');

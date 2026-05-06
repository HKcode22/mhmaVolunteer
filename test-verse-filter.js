// =====================================================
// Test Script for Quran Verse Filtering
// =====================================================
//
// This script tests the verse filtering logic to ensure
// it correctly excludes inappropriate verses and includes
// appropriate ones for the community website.
//
// Run with: node test-verse-filter.js
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

// Test verses that SHOULD be excluded
const testExcludedVerses = [
  {
    text: "And [recall] when Moses said to his people",
    sura: 2,
    aya: 50,
    expected: "exclude"
  },
  {
    text: "The punishment for those who wage war against Allah",
    sura: 5,
    aya: 33,
    expected: "exclude"
  },
  {
    text: "And [recall] when We saved you from the people of Pharaoh",
    sura: 2,
    aya: 49,
    expected: "exclude"
  },
  {
    text: "Cut off the hand of the thief",
    sura: 5,
    aya: 38,
    expected: "exclude"
  },
  {
    text: "The people of Lut were destroyed",
    sura: 7,
    aya: 80,
    expected: "exclude"
  },
  {
    text: "Kill them wherever you find them",
    sura: 2,
    aya: 191,
    expected: "exclude"
  },
  {
    text: "Do not approach unlawful sexual intercourse",
    sura: 17,
    aya: 32,
    expected: "exclude"
  }
];

// Test verses that SHOULD be included
const testIncludedVerses = [
  {
    text: "Indeed, Allah is with the patient",
    sura: 2,
    aya: 153,
    expected: "include"
  },
  {
    text: "And fear Allah",
    sura: 2,
    aya: 194,
    expected: "include"
  },
  {
    text: "Establish prayer and give zakah",
    sura: 2,
    aya: 43,
    expected: "include"
  },
  {
    text: "Indeed, those who believe and do good deeds",
    sura: 2,
    aya: 277,
    expected: "include"
  },
  {
    text: "And Allah is Forgiving and Merciful",
    sura: 2,
    aya: 173,
    expected: "include"
  },
  {
    text: "Be grateful to Allah",
    sura: 2,
    aya: 152,
    expected: "include"
  },
  {
    text: "Paradise for those who are mindful of Allah",
    sura: 3,
    aya: 15,
    expected: "include"
  }
];

console.log('🧪 Testing Quran Verse Filtering\n');

// Test exclusion cases
console.log('📋 Testing verses that SHOULD be excluded:');
console.log('=' .repeat(60));

let excludedTestsPassed = 0;
let excludedTestsTotal = testExcludedVerses.length;

for (const test of testExcludedVerses) {
  const result = filterVerses([test]);
  const passed = result.length === 0;
  
  console.log(`\nTest: ${test.text.substring(0, 50)}...`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result: ${passed ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  
  if (passed) {
    excludedTestsPassed++;
  }
}

// Test inclusion cases
console.log('\n📋 Testing verses that SHOULD be included:');
console.log('=' .repeat(60));

let includedTestsPassed = 0;
let includedTestsTotal = testIncludedVerses.length;

for (const test of testIncludedVerses) {
  const result = filterVerses([test]);
  const passed = result.length === 1;
  
  console.log(`\nTest: ${test.text.substring(0, 50)}...`);
  console.log(`Expected: ${test.expected}`);
  console.log(`Result: ${passed ? '✅ INCLUDED' : '❌ NOT INCLUDED'}`);
  
  if (passed) {
    includedTestsPassed++;
  }
}

// Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 TEST RESULTS SUMMARY');
console.log('=' .repeat(60));
console.log(`Exclusion tests: ${excludedTestsPassed}/${excludedTestsTotal} passed`);
console.log(`Inclusion tests: ${includedTestsPassed}/${includedTestsTotal} passed`);
console.log(`Total: ${excludedTestsPassed + includedTestsPassed}/${excludedTestsTotal + includedTestsTotal} passed`);

const allTestsPassed = excludedTestsPassed === excludedTestsTotal && includedTestsPassed === includedTestsTotal;

if (allTestsPassed) {
  console.log('\n✅ ALL TESTS PASSED! Filtering is working correctly.');
} else {
  console.log('\n❌ Some tests failed. Please review the filtering logic.');
}

// Test with actual Quran data if available
console.log('\n' + '=' .repeat(60));
console.log('📖 Testing with actual Quran data (if available)');
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
    
    console.log(`Total verses in Quran: ${allVerses.length}`);
    
    // Apply filtering
    const filteredVerses = filterVerses(allVerses);
    console.log(`Verses after filtering: ${filteredVerses.length}`);
    console.log(`Filtered out: ${allVerses.length - filteredVerses.length} verses`);
    
    // Show some examples of filtered verses
    console.log('\n📝 Sample verses that passed filtering:');
    for (let i = 0; i < Math.min(5, filteredVerses.length); i++) {
      const verse = filteredVerses[i];
      console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
    }
    
    // Find some examples of excluded verses
    const excludedExamples = [];
    for (const verse of allVerses) {
      const filtered = filterVerses([verse]);
      if (filtered.length === 0) {
        excludedExamples.push(verse);
        if (excludedExamples.length >= 3) break;
      }
    }
    
    if (excludedExamples.length > 0) {
      console.log('\n📝 Sample verses that were excluded:');
      for (const verse of excludedExamples) {
        console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
      }
    }
    
  } else {
    console.log('Quran data file not found. Skipping real data test.');
  }
} catch (error) {
  console.log('Error reading Quran data:', error.message);
}

console.log('\n🎉 Test completed!');

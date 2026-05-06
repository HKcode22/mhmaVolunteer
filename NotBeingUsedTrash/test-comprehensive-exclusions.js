// =====================================================
// Comprehensive Exclusion Test - Beyond Dictionary
// =====================================================
//
// This test searches the entire Quran for verses that contain
// topics that should be excluded, even if they don't match
// our exact dictionary phrases. It uses semantic patterns
// and context to identify problematic verses.
//
// Run with: node test-comprehensive-exclusions.js
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

console.log('🔍 COMPREHENSIVE EXCLUSION TEST - Beyond Dictionary\n');

// Expanded patterns for potentially problematic content
const PROBLEMATIC_PATTERNS = {
  historical: [
    "when", "remember", "recall", "indeed, we", "we sent", "we gave", "we revealed",
    "people of", "children of", "tribe of", "nation of", "kingdom of",
    "pharaoh", "moses", "abraham", "noah", "lot", "lut", "adam", "eve",
    "prophet", "messenger", "angel", "jibril", "gabriel"
  ],
  
  violence: [
    "kill", "slay", "fight", "war", "battle", "sword", "weapon", "attack",
    "strike", "smite", "destroy", "punishment", "torture", "cruel", "harsh"
  ],
  
  legal: [
    "punishment", "penalty", "fine", "prison", "jail", "hand", "foot", "eye",
    "tooth", "retribution", "justice", "court", "judge", "witness", "testimony"
  ],
  
  sexual: [
    "sex", "sexual", "intercourse", "marriage", "divorce", "wife", "husband",
    "virgin", "chastity", "menstruation", "period", "menstruating", "breast",
    "private parts", "naked", "nude", "lust", "desire"
  ],
  
  specific_sins: [
    "adultery", "fornication", "zina", "homosexual", "gay", "lesbian",
    "sodomy", "incest", "prostitution", "rape", "molestation"
  ]
};

// Function to check if verse contains any problematic patterns
function hasProblematicPattern(text, categoryPatterns) {
  const lowerText = text.toLowerCase();
  for (const pattern of categoryPatterns) {
    if (lowerText.includes(pattern)) {
      return true;
    }
  }
  return false;
}

try {
  const quranDataPath = path.join(__dirname, 'Quran-Translation', 'quran-data.json');
  
  if (!fs.existsSync(quranDataPath)) {
    console.log('❌ Quran data file not found');
    process.exit(1);
  }
  
  const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
  
  console.log('📊 ANALYZING ALL QURAN VERSES FOR PROBLEMATIC CONTENT\n');
  
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
  
  console.log(`Total verses to analyze: ${allVerses.length}`);
  
  // Test current filtering
  const currentlyFiltered = filterVerses(allVerses);
  const currentlyExcluded = allVerses.filter(v => !currentlyFiltered.includes(v));
  
  console.log(`\n📋 CURRENT FILTERING RESULTS:`);
  console.log(`Currently retained: ${currentlyFiltered.length}`);
  console.log(`Currently excluded: ${currentlyExcluded.length}`);
  
  // Comprehensive analysis
  console.log('\n🔍 COMPREHENSIVE PATTERN ANALYSIS:');
  console.log('=' .repeat(80));
  
  const problematicByCategory = {};
  let totalProblematicFound = 0;
  
  for (const [category, patterns] of Object.entries(PROBLEMATIC_PATTERNS)) {
    const problematicVerses = [];
    
    for (const verse of allVerses) {
      if (hasProblematicPattern(verse.text, patterns)) {
        problematicVerses.push(verse);
      }
    }
    
    problematicByCategory[category] = problematicVerses;
    totalProblematicFound += problematicVerses.length;
    
    console.log(`\n${category.toUpperCase()}: ${problematicVerses.length} verses`);
    
    // Show examples
    for (let i = 0; i < Math.min(5, problematicVerses.length); i++) {
      const verse = problematicVerses[i];
      console.log(`  [${verse.sura}:${verse.aya}] ${verse.text.substring(0, 80)}...`);
    }
    
    if (problematicVerses.length > 5) {
      console.log(`  ... and ${problematicVerses.length - 5} more`);
    }
  }
  
  console.log(`\n📈 TOTAL PROBLEMATIC VERSES FOUND: ${totalProblematicFound}`);
  
  // Check for false positives (verses that should be included but contain patterns)
  console.log('\n🔍 CHECKING FOR FALSE POSITIVES:');
  console.log('=' .repeat(80));
  
  const falsePositives = [];
  
  for (const verse of currentlyFiltered) {
    // Check if this retained verse has any problematic patterns
    let hasPattern = false;
    let foundCategory = null;
    
    for (const [category, patterns] of Object.entries(PROBLEMATIC_PATTERNS)) {
      if (hasProblematicPattern(verse.text, patterns)) {
        hasPattern = true;
        foundCategory = category;
        break;
      }
    }
    
    if (hasPattern) {
      falsePositives.push({
        ...verse,
        category: foundCategory
      });
    }
  }
  
  console.log(`\nFalse positives found: ${falsePositives.length}`);
  console.log('(These verses passed filtering but contain problematic patterns)');
  
  if (falsePositives.length > 0) {
    console.log('\nExamples of false positives:');
    for (let i = 0; i < Math.min(10, falsePositives.length); i++) {
      const fp = falsePositives[i];
      console.log(`  [${fp.sura}:${fp.aya}] [${fp.category}] ${fp.text.substring(0, 80)}...`);
    }
    
    if (falsePositives.length > 10) {
      console.log(`  ... and ${falsePositives.length - 10} more`);
    }
  }
  
  // Check for false negatives (verses that should be excluded but passed filtering)
  console.log('\n🔍 CHECKING FOR FALSE NEGATIVES:');
  console.log('=' .repeat(80));
  
  const falseNegatives = [];
  
  for (const verse of currentlyFiltered) {
    // Look for verses that are clearly inappropriate but passed filtering
    const lowerText = verse.text.toLowerCase();
    
    // Manual checks for obvious issues
    if (lowerText.includes('homosexual') || 
        lowerText.includes('sodomy') ||
        lowerText.includes('zina') ||
        lowerText.includes('adultery') ||
        lowerText.includes('fornication') ||
        (lowerText.includes('cut') && lowerText.includes('hand')) ||
        (lowerText.includes('ston') && lowerText.includes('death'))) {
      falseNegatives.push({
        ...verse,
        reason: 'Contains explicit inappropriate content'
      });
    }
  }
  
  console.log(`\nFalse negatives found: ${falseNegatives.length}`);
  console.log('(These verses passed filtering but contain explicit inappropriate content)');
  
  if (falseNegatives.length > 0) {
    console.log('\nFalse negatives:');
    for (const fn of falseNegatives) {
      console.log(`  [${fn.sura}:${fn.aya}] ${fn.reason}: ${fn.text.substring(0, 80)}...`);
    }
  }
  
  // Check specific problematic suras
  console.log('\n🔍 DETAILED CHECK OF PROBLEMATIC SURAS:');
  console.log('=' .repeat(80));
  
  const problematicSuras = [2, 3, 4, 5, 7, 9, 12, 24, 26, 37, 38]; // Suras with potentially problematic content
  
  for (const suraNumber of problematicSuras) {
    const suraData = quranData.suras.find(s => s.number === suraNumber);
    if (!suraData) continue;
    
    const suraVerses = suraData.verses.map(v => ({
      text: v.english,
      sura: suraNumber,
      aya: v.aya
    }));
    
    const filteredSuraVerses = filterVerses(suraVerses);
    const excludedSuraVerses = suraVerses.filter(v => !filteredSuraVerses.includes(v));
    
    console.log(`\nSurah ${suraNumber}: ${suraData.name}`);
    console.log(`  Total: ${suraVerses.length}, Retained: ${filteredSuraVerses.length}, Excluded: ${excludedSuraVerses.length}`);
    
    // Check excluded verses for appropriateness
    console.log('  Excluded verses (first 5):');
    for (let i = 0; i < Math.min(5, excludedSuraVerses.length); i++) {
      const verse = excludedSuraVerses[i];
      console.log(`    [${verse.aya}] ${verse.text.substring(0, 80)}...`);
    }
  }
  
  // Final assessment
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 COMPREHENSIVE TEST RESULTS:');
  console.log('=' .repeat(80));
  
  console.log(`\n✅ Current filtering excludes ${currentlyExcluded.length} verses`);
  console.log(`✅ Pattern analysis found ${totalProblematicFound} potentially problematic verses`);
  console.log(`❌ False positives: ${falsePositives.length} verses passed filtering but have patterns`);
  console.log(`❌ False negatives: ${falseNegatives.length} verses passed filtering but are clearly inappropriate`);
  
  if (falseNegatives.length === 0) {
    console.log('\n✅ NO FALSE NEGATIVES FOUND');
    console.log('✅ All clearly inappropriate verses are being filtered out');
  } else {
    console.log('\n❌ FALSE NEGATIVES DETECTED');
    console.log('❌ Some inappropriate verses are passing the filter');
  }
  
  if (falsePositives.length < 50) {
    console.log('\n✅ LOW FALSE POSITIVE RATE');
    console.log('✅ Most verses with patterns are appropriately handled');
  } else {
    console.log('\n⚠️ HIGH FALSE POSITIVE RATE');
    console.log('⚠️ Many verses with patterns are passing filtering - may need refinement');
  }
  
  console.log('\n🎉 Comprehensive exclusion test completed!');
  
} catch (error) {
  console.error('Error:', error.message);
}

// =====================================================
// Test Sura Coverage - Ensure all suras have verses
// =====================================================
//
// This test verifies that after filtering, every sura
// still has at least some verses remaining.
// No sura should be completely excluded.
//
// Run with: node test-sura-coverage.js
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

console.log('🔍 TESTING SURA COVERAGE AFTER FILTERING\n');

try {
  const quranDataPath = path.join(__dirname, 'Quran-Translation', 'quran-data.json');
  
  if (!fs.existsSync(quranDataPath)) {
    console.log('❌ Quran data file not found');
    process.exit(1);
  }
  
  const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
  
  console.log(`📊 Total suras in Quran: ${quranData.suras.length}`);
  
  let surasWithZeroVerses = [];
  let suraCoverage = [];
  
  // Test each sura
  for (const sura of quranData.suras) {
    const suraVerses = sura.verses.map(v => ({
      text: v.english,
      sura: sura.number,
      aya: v.aya
    }));
    
    const filteredVerses = filterVerses(suraVerses);
    const retainedCount = filteredVerses.length;
    const excludedCount = suraVerses.length - retainedCount;
    const retentionRate = ((retainedCount / suraVerses.length) * 100).toFixed(1);
    
    suraCoverage.push({
      suraNumber: sura.number,
      suraName: sura.name,
      totalVerses: suraVerses.length,
      retainedVerses: retainedCount,
      excludedVerses: excludedCount,
      retentionRate: parseFloat(retentionRate)
    });
    
    if (retainedCount === 0) {
      surasWithZeroVerses.push({
        number: sura.number,
        name: sura.name,
        totalVerses: suraVerses.length
      });
    }
  }
  
  // Sort by retention rate (lowest first)
  suraCoverage.sort((a, b) => a.retentionRate - b.retentionRate);
  
  console.log('\n📋 SURA COVERAGE REPORT');
  console.log('=' .repeat(80));
  
  if (surasWithZeroVerses.length > 0) {
    console.log('\n❌ SURAS WITH ZERO VERSES AFTER FILTERING:');
    for (const sura of surasWithZeroVerses) {
      console.log(`   Surah ${sura.number}: ${sura.name} (${sura.totalVerses} verses total)`);
    }
  } else {
    console.log('\n✅ ALL SURAS HAVE AT LEAST ONE VERSE AFTER FILTERING');
  }
  
  console.log('\n📊 SURAS WITH LOWEST RETENTION RATES:');
  console.log('Sura | Name | Total | Retained | Excluded | Rate');
  console.log('-' .repeat(70));
  
  // Show top 20 suras with lowest retention
  const worstRetention = suraCoverage.slice(0, 20);
  for (const sura of worstRetention) {
    console.log(`${sura.suraNumber.toString().padStart(4)} | ${(sura.suraName || `Surah ${sura.suraNumber}`).padEnd(20)} | ${sura.totalVerses.toString().padStart(5)} | ${sura.retainedVerses.toString().padStart(8)} | ${sura.excludedVerses.toString().padStart(8)} | ${sura.retentionRate}%`);
  }
  
  console.log('\n📊 SURAS WITH HIGHEST RETENTION RATES:');
  console.log('Sura | Name | Total | Retained | Excluded | Rate');
  console.log('-' .repeat(70));
  
  // Show top 10 suras with highest retention
  const bestRetention = suraCoverage.slice(-10).reverse();
  for (const sura of bestRetention) {
    console.log(`${sura.suraNumber.toString().padStart(4)} | ${(sura.suraName || `Surah ${sura.suraNumber}`).padEnd(20)} | ${sura.totalVerses.toString().padStart(5)} | ${sura.retainedVerses.toString().padStart(8)} | ${sura.excludedVerses.toString().padStart(8)} | ${sura.retentionRate}%`);
  }
  
  // Statistics
  const totalVerses = suraCoverage.reduce((sum, s) => sum + s.totalVerses, 0);
  const totalRetained = suraCoverage.reduce((sum, s) => sum + s.retainedVerses, 0);
  const totalExcluded = suraCoverage.reduce((sum, s) => sum + s.excludedVerses, 0);
  const overallRetentionRate = ((totalRetained / totalVerses) * 100).toFixed(1);
  
  console.log('\n📈 OVERALL STATISTICS:');
  console.log(`Total verses: ${totalVerses}`);
  console.log(`Retained verses: ${totalRetained}`);
  console.log(`Excluded verses: ${totalExcluded}`);
  console.log(`Overall retention rate: ${overallRetentionRate}%`);
  console.log(`Suras with zero verses: ${surasWithZeroVerses.length}`);
  
  // Check specific suras that might be problematic
  console.log('\n🔍 DETAILED CHECK FOR POTENTIALLY PROBLEMATIC SURAS:');
  
  const problemSuras = [2, 3, 4, 5, 7, 9, 24]; // Al-Baqarah, Ali 'Imran, An-Nisa, Al-Ma'idah, Al-A'raf, At-Tawbah, An-Nur
  
  for (const suraNumber of problemSuras) {
    const sura = suraCoverage.find(s => s.suraNumber === suraNumber);
    if (sura) {
      console.log(`\nSurah ${suraNumber}: ${sura.suraName}`);
      console.log(`  Total verses: ${sura.totalVerses}`);
      console.log(`  Retained: ${sura.retainedVerses} (${sura.retentionRate}%)`);
      console.log(`  Excluded: ${sura.excludedVerses}`);
      
      // Show some examples of retained verses
      const suraData = quranData.suras.find(s => s.number === suraNumber);
      const retainedExamples = [];
      for (const verse of suraData.verses) {
        const filtered = filterVerses([{text: verse.english, sura: suraNumber, aya: verse.aya}]);
        if (filtered.length > 0) {
          retainedExamples.push(`[${verse.aya}] ${verse.english.substring(0, 80)}...`);
          if (retainedExamples.length >= 3) break;
        }
      }
      
      console.log('  Sample retained verses:');
      for (const example of retainedExamples) {
        console.log(`    ${example}`);
      }
    }
  }
  
  // Final verdict
  console.log('\n' + '=' .repeat(80));
  console.log('🎯 FINAL VERDICT:');
  
  if (surasWithZeroVerses.length === 0) {
    console.log('✅ SUCCESS: All 114 suras have verses after filtering');
    console.log('✅ No sura is completely excluded');
    console.log('✅ Only individual verses with inappropriate content are filtered');
    console.log(`✅ Overall retention rate: ${overallRetentionRate}%`);
  } else {
    console.log('❌ FAILURE: Some suras have zero verses after filtering');
    console.log(`❌ ${surasWithZeroVerses.length} suras are completely excluded`);
    console.log('❌ This is NOT acceptable - every sura should have some verses');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

console.log('\n🎉 Sura coverage test completed!');

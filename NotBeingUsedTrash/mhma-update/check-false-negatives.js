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

console.log('🔍 CHECKING FALSE NEGATIVES\n');

try {
  const quranDataPath = path.join(__dirname, 'Quran-Translation', 'quran-data.json');
  const quranData = JSON.parse(fs.readFileSync(quranDataPath, 'utf8'));
  
  // Check Surah 24 specifically
  const sura24 = quranData.suras.find(s => s.number === 24);
  const sura24Verses = sura24.verses.map(v => ({
    text: v.english,
    sura: 24,
    aya: v.aya
  }));
  
  console.log('Surah 24 (An-Nur) verses 2-6:');
  for (let i = 1; i <= 6; i++) {
    const verse = sura24Verses.find(v => v.aya === i);
    if (verse) {
      const filtered = filterVerses([verse]);
      const passed = filtered.length > 0;
      console.log(`\n[24:${i}] ${passed ? '❌ PASSED' : '✅ EXCLUDED'}`);
      console.log(`Text: ${verse.text}`);
      
      // Check why it passed/failed
      const lowerText = verse.text.toLowerCase();
      for (const phrase of [
        "sexual intercourse",
        "fornicator", 
        "fornication",
        "adultery",
        "accuse their wives",
        "accuse chaste women",
        "four witnesses",
        "unmarried woman",
        "unmarried man",
        "found guilty"
      ]) {
        if (lowerText.includes(phrase)) {
          console.log(`Contains: "${phrase}"`);
        }
      }
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
}

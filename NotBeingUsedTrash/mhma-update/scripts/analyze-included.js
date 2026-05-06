const fs = require('fs');
const path = require('path');

// Load included verses
const data = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'public', 'quran-data-included.json'), 'utf8'
));

// Suspicious patterns that might indicate out-of-context
const suspiciousPatterns = [
  'when', 'said', 'replied', 'answered', 'told', 'narrate', 'mention',
  'recount', 'recall', 'sent to', 'revealed to', 'gave him', 'saved them',
  'destroyed them', 'punished them', 'fought', 'fled', 'entered', 'left',
  'returned', 'built', 'worshipped', 'disobeyed', 'believed', 'disbelieved',
  'people of', 'children of', 'pharaoh', 'lot', 'noah', 'lut', 'ad', 'thamud',
  'moses', 'jesus', 'abraham', 'adam', 'jonah', 'yusuf', 'joseph',
  'battle', 'siege', 'conquest', 'war', 'fight', 'kill', 'slay', 'strike',
  'sword', 'weapon', 'attack', 'destroy', 'ambush', 'raid', 'conquer',
  'divorce', 'marriage', 'wife', 'husband', 'private parts', 'menstruation',
  'breast', 'naked', 'nude', 'virgin', 'sexual', 'fornication', 'adultery',
  'cut off', 'lash', 'flog', 'punishment', 'penalty', 'retribution',
  'testimony', 'witness', 'oath', 'vow', 'court', 'judge', 'justice',
  'inheritance', 'bequest', 'debt', 'zakat', 'charity', 'sadaqah', 'halal', 'haram',
  'pilgrimage', 'hajj', 'umrah', 'fasting', 'ramadan', 'prayer', 'salat',
  'messenger', 'rasul', 'nabi', 'prophet', 'revelation', 'scripture', 'torah', 'injeel',
  'paradise', 'hell', 'hellfire', 'garden', 'fire', 'hereafter', 'judgment', 'resurrection',
  'believers', 'disbelievers', 'unbelievers', 'hypocrites', 'polytheists', 'idolaters'
];

// But we want to allow some: paradise, hell, etc. So we need a whitelist of good patterns.
const goodPatterns = [
  'paradise', 'hell', 'hellfire', 'garden', 'fire', 'hereafter', 'judgment',
  'resurrection', 'believers', 'disbelievers', 'unbelievers', 'hypocrites', 'polytheists', 'idolaters',
  'zakat', 'charity', 'sadaqah', 'halal', 'haram', 'prayer', 'salat',
  'fasting', 'ramadan', 'pilgrimage', 'hajj', 'umrah',
  'messenger', 'rasul', 'nabi', 'prophet', 'revelation', 'scripture', 'torah', 'injeel'
];

// We'll check each verse for suspicious patterns that are NOT in goodPatterns.
const allVerses = [];
data.suras.forEach(sura => {
  sura.verses.forEach(verse => {
    allVerses.push({
      sura: sura.number,
      aya: verse.aya,
      english: verse.english
    });
  });
});

console.log(`Total included verses: ${allVerses.length}`);

// Find verses that contain suspicious patterns but maybe not good ones.
const problematic = [];
allVerses.forEach(v => {
  const text = v.english.toLowerCase();
  let isProblematic = false;
  let matchedPatterns = [];
  for (const pattern of suspiciousPatterns) {
    if (text.includes(pattern) && !goodPatterns.includes(pattern)) {
      // Check if it's a known good phrase like "believe" (but that's in goodPatterns? Actually "believe" is not in goodPatterns, but we might want to allow it.
      // We'll skip patterns that are part of inclusion phrases? Hard.
      // We'll just collect.
      matchedPatterns.push(pattern);
      isProblematic = true;
    }
  }
  if (isProblematic) {
    problematic.push({
      ref: `${v.sura}:${v.aya}`,
      text: v.english.substring(0, 100),
      patterns: matchedPatterns.slice(0, 5)
    });
  }
});

console.log(`Potentially problematic verses: ${problematic.length}`);

// Show first 20
problematic.slice(0, 20).forEach(v => {
  console.log(`${v.ref}: ${v.text}... | Patterns: ${v.patterns.join(', ')}`);
});

// Also check for verses that contain "when" but not "when my servants"
const whenVerses = allVerses.filter(v => {
  const text = v.english.toLowerCase();
  return text.includes('when') && !text.includes('when my servants');
});
console.log(`\nVerses containing "when" (excluding "when my servants"): ${whenVerses.length}`);
whenVerses.slice(0, 10).forEach(v => {
  console.log(`${v.sura}:${v.aya}: ${v.english.substring(0, 120)}...`);
});

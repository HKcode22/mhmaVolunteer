#!/usr/bin/env node

/**
 * Quran Verse Filtering Test Script
 * Run this to see how many verses pass/fail the filter
 * Usage: node test-quran-filter.js
 */

const fs = require('fs');
const path = require('path');

// Load quran data
const quranPath = path.join(__dirname, 'public', 'quran-data.json');

if (!fs.existsSync(quranPath)) {
  console.error('Error: quran-data.json not found at', quranPath);
  console.log('Please ensure the Quran data file exists in the public folder.');
  process.exit(1);
}

const quranData = JSON.parse(fs.readFileSync(quranPath, 'utf8'));

// Exclusion categories (same as in page.tsx)
const EXCLUSION_CATEGORIES = {
  historicalNarratives: [
    'when you were', 'remember when', 'and when', 'and recall', 'and [recall]',
    'indeed, we sent', 'we sent down', 'we revealed', 'we sent to', 'we gave him',
    'we saved', 'we destroyed', 'we punished', 'we took', 'we have sent',
    'as we sent down', 'as we revealed', 'when they entered', 'when they left',
    'when they fled', 'when they returned', 'when they fought', 'when they won',
    'when they lost', 'when they built', 'when they destroyed', 'when they worshipped',
    'when they prayed', 'when they disobeyed', 'when they believed', 'when they disbelieved',
    'when they denied', 'when they mocked', 'when they turned away', 'when they repented',
    'the day when', 'the night when', 'the time when', 'the story of', 'the account of',
    'the tale of', 'the incident when', 'the event when', 'the battle of', 'the siege of',
    'the conquest of', 'in days of old', 'in ancient times', 'in bygone eras',
    'in former times', 'in past generations', 'in times of ignorance', 'before the coming',
    'centuries ago', 'ages past', 'years ago', 'the day of battle', 'the day of war',
    'the day of judgement', 'the day when hearts', 'the hour of doom', 'the last hour',
    'the final hour', 'the end times', 'the latter days', 'the former days',
    'the first generation', 'the last generation', 'the age of ignorance', 'the time of ignorance',
    'when the earthquake', 'when the flood', 'when the storm', 'when the fire',
    'when the plague', 'when the drought', 'when the famine', 'when he drowned',
    'when he died', 'when he was killed', 'when he was slain', 'when he was crucified',
    'when they were destroyed', 'when they perished', 'when they were drowned',
    'when they were burned', 'when it was revealed', 'when it was sent down',
    'when this was said', 'when that was done'
  ],
  historicalPeopleGroups: [
    'people of lut', 'people of noah', 'people of ad', 'people of thamud',
    'people of pharaoh', 'people of abraham', 'people of moses', 'people of aaron',
    'people of lot', 'people of israel', 'children of israel', 'tribe of',
    'kingdom of', 'pharaoh', 'firon', 'nation of', 'family of', 'house of',
    'clan of', 'descendants of', 'followers of', 'companions of', 'believers among the',
    'unbelievers among the', 'rejecters among', 'pharaoh and his people',
    'the people of the town', 'dwellers of', 'inhabitants of the city',
    'companions of the cave', 'companions of the elephant', 'people of the ditch',
    'dwellers of the wood', 'fellowship of the cave', 'the cave', 'the ditch', 'the elephant'
  ],
  historicalProphets: [
    'prophet muhammad', 'prophet moses', 'prophet abraham', 'prophet noah',
    'prophet lot', 'prophet adam', 'prophet isaac', 'prophet jacob', 'prophet joseph',
    'prophet job', 'prophet jonah', 'prophet john', 'prophet jesus', 'prophet zachariah',
    'prophet elijah', 'prophet enoch', 'prophet idris', 'prophet saleh', 'prophet hud',
    'prophet shuayb', 'messenger muhammad', 'messenger of allah', 'abraham prayed',
    'moses said', 'noah said', 'lot said', 'jesus said', 'muhammad said'
  ],
  legalMatters: [
    'cut off', 'stoning', 'lash', 'lashing', 'flogging', 'punishment', 'penalty',
    'retribution', 'legal retribution', 'testimony', 'witnesses', 'four witnesses',
    'bring witnesses', 'produce witnesses', 'oath', 'vow', 'court', 'judge', 'justice',
    'legal', 'lawful', 'unlawful', 'inheritance law', 'divorce law', 'waiting period',
    'bring four witnesses', 'produce four witnesses', 'four witnesses testify',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'testimony of witnesses', 'oath of allah', 'vow to allah', 'court of law',
    'legal retribution', 'legal punishment', 'an eye for an eye', 'tooth for tooth',
    'life for life', 'blood money for', 'prescribed punishments', 'hadd punishments',
    'legal testimony', 'giving testimony', 'bear witness', 'witness bearing'
  ],
  warfareConflict: [
    'fight in the way', 'fight them', 'kill them', 'slay them', 'wherever you find',
    'wage war', 'against them', 'battle', 'sword', 'weapon', 'attack', 'strike', 'smite',
    'destroy', 'fighting in the cause', 'do not flee', 'battlefield', 'defend yourselves',
    'strike the necks', 'cut off hands', 'crucify them', 'capture them', 'lay siege',
    'besiege', 'ambush', 'raid', 'conquer', 'victory over', 'defeat of', 'casualties of',
    'prisoner of', 'war booty', 'fight them in', 'fight the way', 'kill them wherever',
    'slay them wherever', 'when you meet', 'when you encounter', 'strike their necks',
    'wage war against', 'battle of the', 'sword of allah', 'weapon of war',
    'strike the necks'
  ],
  privateMatters: [
    'sexual intercourse', 'fornicator', 'fornication', 'adultery', 'accuse their wives',
    'accuse chaste women', 'unmarried woman', 'unmarried man', 'found guilty',
    'approach', 'private parts', 'menstruation', 'menstruating', 'menstruate',
    'breast', 'naked', 'nude', 'marriage', 'divorce', 'wife', 'husband', 'virgin',
    'chastity', 'unlawful sexual', 'accuse chaste', 'bring four', 'private parts',
    'when women menstruate', 'during menstruation', 'breast feeding', 'found guilty'
  ],
  theologicalDebates: [
    'disbelievers', 'polytheists', 'hypocrites', 'unbelievers', 'infidels', 'idolaters',
    'disbelief', 'blasphemy', 'apostasy', 'people of the book', 'those who disbelieve',
    'those who reject', 'those who deny', 'mischief in the land', 'corruption on earth',
    'disbelievers will', 'hypocrites will', 'polytheists will', 'those who disbelieve',
    'those who reject', 'those who deny', 'infidels will', 'idolaters will',
    'blasphemy against', 'apostasy from islam', 'disbelief in allah', 'hypocrisy in faith'
  ],
  ritualProcedures: [
    'wash your faces', 'wash your hands', 'wipe your heads', 'wash your feet',
    'perform ablution', 'ritual washing', 'specific manner of prayer'
  ],
  dietaryDetails: [
    'forbidden to you', 'lawful for you', 'may eat', 'may not eat', 'carrion',
    'blood', 'pig flesh', 'slaughtered in name'
  ],
  financialRegulations: [
    'interest', 'usury', 'riba', 'business transaction', 'charitable obligation',
    'mandatory charity', 'zakat calculation'
  ]
};

// Build exclusion combinations
const buildExclusionCombinations = () => {
  const combinations = [
    'people of abraham', 'people of lot', 'people of noah', 'people of moses',
    'people of pharaoh', 'people of ad', 'people of thamud', 'people of madyan',
    'children of israel', 'pharaoh and his people', 'the people of the town',
    'dwellers of the town', 'inhabitants of the city', 'companions of the cave',
    'companions of the elephant', 'people of the ditch', 'dwellers of the wood',
    'fellowship of the cave', 'the cave', 'the ditch', 'the elephant',
    'when you were', 'and when the', 'and recall the', 'and [recall] the',
    'indeed we sent', 'we sent to', 'we sent down to', 'we revealed to',
    'we gave moses', 'we gave them', 'we saved them', 'we destroyed them',
    'we punished them', 'we took the', 'as we sent', 'as we revealed',
    'bring four witnesses', 'produce four witnesses', 'four witnesses testify',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'testimony of witnesses', 'oath of allah', 'vow to allah', 'court of law',
    'legal retribution', 'legal punishment', 'fight them in', 'fight the way',
    'kill them wherever', 'slay them wherever', 'when you meet', 'when you encounter',
    'strike their necks', 'strike the necks', 'wage war', 'wage war against',
    'battle of the', 'sword of allah', 'weapon of war', 'sexual intercourse',
    'unlawful sexual', 'accuse chaste', 'bring four', 'unmarried woman',
    'unmarried man', 'private parts', 'when women menstruate', 'during menstruation',
    'breast feeding', 'found guilty', 'people of the book', 'the people of the book',
    'disbelievers will', 'hypocrites will', 'polytheists will', 'those who disbelieve',
    'those who reject', 'those who deny', 'infidels will', 'idolaters will',
    'mischief in the land', 'corruption on earth', 'an eye for an eye', 'tooth for tooth',
    'life for life', 'blood money for', 'prescribed punishments', 'hadd punishments',
    'legal testimony', 'giving testimony', 'bear witness', 'witness bearing',
    'in days of old', 'in ancient times', 'in bygone eras', 'in former times',
    'in past generations', 'in times of ignorance', 'before the coming',
    'the day of battle', 'the day of war', 'the day of judgement', 'the day when hearts',
    'the hour of doom', 'the last hour', 'the final hour', 'the end times',
    'the latter days', 'the former days', 'the first generation', 'the last generation',
    'the age of ignorance', 'the time of ignorance', 'when the earthquake',
    'when the flood', 'when the storm', 'when the fire', 'when the plague',
    'when the drought', 'when the famine', 'when he drowned', 'when he died',
    'when he was killed', 'when he was slain', 'when he was crucified',
    'when they were destroyed', 'when they perished', 'when they were drowned',
    'when they were burned', 'when it was revealed', 'when it was sent down',
    'when this was said', 'when that was done',
    'then we sent', 'sent after them', 'moses and aaron', 'to pharaoh',
    'then the fish', 'the fish swallowed', 'while he was', 'he was blameworthy',
    'jonah was', 'yunus was', 'swallowed him',
    'and they planned', 'they planned a plan', 'we planned a plan',
    'while they perceived not', 'while they perceived', 'they perceived not',
    'no headache', 'they will have therefrom', 'nor will they be intoxicated',
    'will they be intoxicated', 'rivers of wine', 'rivers of milk',
    'rivers of honey', 'pure spouses', 'chaste spouses', 'couches',
    'green cushions', 'beautiful carpets', 'will be married', 'virgin',
    'beautiful of', 'large eyes', 'like pearls', 'is the male for you',
    'for him the female', 'maidens with', 'maidens of', 'youths of',
    'immortal youths', 'cups will be', 'circulated among them',
    'is the male', 'the male for you', 'for him the female', 'allah gives you',
    'favors you above', 'above the worlds',
    'when they came', 'when they said', 'when he said', 'when she said',
    'when they asked', 'when they came to', 'when he came to',
    'when she came to', 'when the messenger', 'when the prophet',
    'they said to them', 'they said to him', 'they said to her',
    'he said to them', 'she said to them',
    'in the city', 'in the town', 'in the village', 'at the sea',
    'in the desert', 'in the valley', 'on the mountain', 'in egypt',
    'so when', 'and when', 'then when', 'therefore when',
    'so he was', 'so they were', 'thus he was', 'thus they were',
    'and he became', 'and they became', 'he remained', 'they remained',
    'so we saved', 'so we rescued', 'thus we saved', 'therefore we saved',
    'so we destroyed', 'thus we destroyed', 'therefore we destroyed',
    'the fish swallowed', 'the whale swallowed', 'the cow was',
    'the bird was', 'the ant said',
    'answered him', 'replied to him', 'responded to him',
    'answered them', 'replied to them', 'responded to them',
    'have you not', 'did you not', 'do you not see', 'do you not know',
    'did he not', 'did she not', 'did they not',
    'they disputed', 'they argued', 'they disagreed', 'the argument',
    'the dispute', 'the disagreement',
    'we appointed him', 'we chose him', 'we selected him',
    'we made him', 'we established him', 'we strengthened him',
    'when he migrated', 'when they migrated', 'when he left',
    'when they left', 'when he departed', 'when they departed',
    'the day of', 'on the day', 'during the battle',
    'in the war', 'at the time of', 'the year of',
    'defeated them', 'conquered them', 'overcame them',
    'was given victory', 'were given victory', 'triumph over',
    'they broke', 'he broke', 'they violated', 'he violated',
    'the covenant', 'the pledge', 'the promise',
    'they rejected', 'he rejected', 'they denied', 'he denied',
    'they refused', 'he refused',
  ];

  const prophets = ['muhammad', 'moses', 'abraham', 'noah', 'lot', 'adam', 'isaac', 'jacob',
                    'joseph', 'job', 'jonah', 'john', 'jesus', 'zachariah', 'elijah',
                    'enoch', 'idris', 'saleh', 'hud', 'shuayb', 'yunus'];

  const historicalActions = ['came to', 'went to', 'entered', 'left', 'arrived at',
                             'departed from', 'traveled to', 'journeyed to', 'said to',
                             'spoke to', 'called out to', 'prayed to', 'asked for',
                             'requested from', 'begged', 'pleaded with', 'argued with',
                             'disputed with', 'fought against', 'battled', 'struggled with'];

  for (const prophet of prophets) {
    for (const action of historicalActions) {
      combinations.push(`${prophet} ${action}`);
    }
  }

  const unclearPatterns = [
    'will be given to drink', 'will drink from', 'they will recline',
    'they will be adorned', 'they will be married', 'they will approach',
    'the fruits of', 'the shade of', 'the branches of', 'the clusters of',
    'springs of', 'fountains of', 'gardens beneath which', 'rivers flow beneath',
    'dwellers of paradise', 'companions of the fire', 'inhabitants of the fire',
    'the bed of', 'the pillow of', 'the covering of', 'the garment of',
    'the ornament of', 'the bracelet of', 'the crown of', 'the pearl of',
    'the coral of', 'the silk of', 'the brocade of', 'the velvet of',
  ];

  combinations.push(...unclearPatterns);

  return combinations;
};

const EXCLUSION_COMBINATIONS = buildExclusionCombinations();

// Process all verses
const allVerses = [];
let verseCount = 0;

for (const sura of quranData.suras) {
  for (const verse of sura.verses) {
    verseCount++;
    allVerses.push({
      text: verse.english,
      translation: verse.english,
      reference: `[Quran, ${sura.number}:${verse.aya}]`,
      arabic: verse.arabic
    });
  }
}

// Statistics
const stats = {
  total: allVerses.length,
  passed: 0,
  excluded: 0,
  excludedByCategory: {},
  excludedByCombo: 0,
  tooShort: 0,
  tooLong: 0,
  sampleExcluded: [],
  samplePassed: []
};

const filtered = allVerses.filter((verse) => {
  const english = (verse.translation || "").toLowerCase();

  // Length check
  if (english.length < 30) {
    stats.tooShort++;
    stats.excluded++;
    if (stats.sampleExcluded.length < 5 && english.length > 10) {
      stats.sampleExcluded.push({ verse, reason: `Too short (${english.length} chars)` });
    }
    return false;
  }
  if (english.length > 280) {
    stats.tooLong++;
    stats.excluded++;
    if (stats.sampleExcluded.length < 5) {
      stats.sampleExcluded.push({ verse, reason: `Too long (${english.length} chars)` });
    }
    return false;
  }

  // Check categories
  for (const cat in EXCLUSION_CATEGORIES) {
    for (const kw of EXCLUSION_CATEGORIES[cat]) {
      if (english.includes(kw)) {
        stats.excludedByCategory[cat] = (stats.excludedByCategory[cat] || 0) + 1;
        stats.excluded++;
        if (stats.sampleExcluded.length < 5) {
          stats.sampleExcluded.push({ verse, reason: `Category: ${cat} - "${kw}"` });
        }
        return false;
      }
    }
  }

  // Check combinations
  for (const combo of EXCLUSION_COMBINATIONS) {
    if (english.includes(combo)) {
      stats.excludedByCombo++;
      stats.excluded++;
      if (stats.sampleExcluded.length < 5) {
        stats.sampleExcluded.push({ verse, reason: `Combination: "${combo}"` });
      }
      return false;
    }
  }

  stats.passed++;
  if (stats.samplePassed.length < 5) {
    stats.samplePassed.push(verse);
  }
  return true;
});

// Print results
console.log('\n' + '='.repeat(60));
console.log('     QURAN VERSE FILTERING STATISTICS');
console.log('='.repeat(60));
console.log(`\nTotal verses in Quran:     ${stats.total.toLocaleString()}`);
console.log(`Verses passing filter:     ${stats.passed.toLocaleString()} (${((stats.passed/stats.total)*100).toFixed(1)}%)`);
console.log(`Verses excluded:           ${stats.excluded.toLocaleString()} (${((stats.excluded/stats.total)*100).toFixed(1)}%)`);
console.log('\n' + '-'.repeat(60));
console.log('EXCLUSION BREAKDOWN:');
console.log('-'.repeat(60));
console.log(`  Too short (<30 chars):   ${stats.tooShort.toLocaleString()}`);
console.log(`  Too long (>280 chars):   ${stats.tooLong.toLocaleString()}`);
console.log(`  By combination matches:  ${stats.excludedByCombo.toLocaleString()}`);
console.log('\nExcluded by category:');
for (const [cat, count] of Object.entries(stats.excludedByCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

console.log('\n' + '-'.repeat(60));
console.log('SAMPLE EXCLUDED VERSES:');
console.log('-'.repeat(60));
for (const { verse, reason } of stats.sampleExcluded) {
  console.log(`\n${verse.reference}`);
  console.log(`Reason: ${reason}`);
  console.log(`Text: "${verse.translation.substring(0, 100)}${verse.translation.length > 100 ? '...' : ''}"`);
}

console.log('\n' + '-'.repeat(60));
console.log('SAMPLE PASSED VERSES (these will show on the website):');
console.log('-'.repeat(60));
for (const verse of stats.samplePassed) {
  console.log(`\n${verse.reference}`);
  console.log(`Arabic: ${verse.arabic ? verse.arabic.substring(0, 50) + '...' : 'N/A'}`);
  console.log(`English: "${verse.translation}"`);
}

console.log('\n' + '='.repeat(60));
console.log(`Available verses for display: ${filtered.length}`);
console.log('='.repeat(60) + '\n');

const fs = require('fs');
const path = require('path');

// Load the Quran data
const quranData = require(path.join(__dirname, '..', 'public', 'quran-data.json'));

// ALL original exclusion categories - keeping them all + adding more
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
    'when this was said', 'when that was done', 'your ancient', 'your forefather',
    'their forefathers', 'their fathers', 'the sperm', 'semen', 'discharge',
    'sexual relation', 'intercourse', 'lie with', 'crawling', 'creeping'
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
    'prophet job', 'prophet john', 'prophet zachariah', 'prophet elijah',
    'prophet enoch', 'prophet idris', 'prophet saleh', 'prophet hud',
    'prophet shuayb', 'messenger muhammad', 'messenger of allah', 'abraham prayed',
    'moses said', 'noah said', 'lot said', 'jesus said', 'muhammad said',
    'isaac was', 'jacob was', 'joseph was', 'moses was', 'noah was'
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
    'legal testimony', 'giving testimony', 'bear witness', 'witness bearing',
    'adultery', 'fornication', 'whip', 'strike'
  ],
  warfareConflict: [
    'fight in the way', 'fight them', 'kill them', 'slay them', 'wherever you find',
    'wage war', 'against them', 'battle', 'sword', 'weapon', 'attack', 'strike', 'smite',
    'destroy', 'fighting in the cause', 'do not flee', 'battlefield', 'defend yourselves',
    'strike the necks', 'cut off hands', 'crucify them', 'capture them', 'lay siege',
    'besiege', 'ambush', 'raid', 'conquer', 'victory over', 'defeat of', 'casualties of',
    'war booty', 'fight them in', 'fight the way', 'kill them wherever',
    'slay them wherever', 'when you meet', 'when you encounter', 'strike their necks',
    'wage war against', 'battle of the', 'sword of allah', 'weapon of war',
    'kill', 'slain', 'killed', 'massacre', 'slaughter'
  ],
  privateMatters: [
    'sexual intercourse', 'fornicator', 'fornication', 'adultery', 'accuse their wives',
    'accuse chaste women', 'unmarried woman', 'unmarried man', 'found guilty',
    'approach', 'private parts', 'menstruation', 'menstruating', 'menstruate',
    'breast', 'naked', 'nude', 'marriage', 'divorce', 'wife', 'husband', 'virgin',
    'chastity', 'unlawful sexual', 'accuse chaste', 'bring four', 'private parts',
    'when women menstruate', 'during menstruation', 'breast feeding', 'found guilty',
    'their wives', 'your wives', 'his wives', 'the wives',
    'right hands possess', 'those their right', 'pronounce thihar'
  ],
  theologicalDebates: [
    'disbelievers', 'polytheists', 'hypocrites', 'unbelievers', 'infidels', 'idolaters',
    'disbelief', 'blasphemy', 'apostasy', 'people of the book', 'those who disbelieve',
    'those who reject', 'those who deny', 'mischief in the land', 'corruption on earth',
    'disbelievers will', 'hypocrites will', 'polytheists will', 'those who disbelieve',
    'those who reject', 'those who deny', 'infidels will', 'idolaters will'
  ]
};

// Build combinations
const buildExclusionCombinations = () => {
  const combinations = [
    'people of abraham', 'people of lot', 'people of noah', 'people of moses',
    'people of pharaoh', 'people of ad', 'people of thamud', 'people of madyan',
    'children of israel', 'pharaoh and his people', 'the people of the town',
    'dwellers of the town', 'inhabitants of the city', 'companions of the cave',
    'companions of the elephant', 'people of the ditch', 'dwellers of the wood',
    'fellowship of the cave', 'the cave', 'the ditch', 'the elephant',
    'bring four witnesses', 'produce four witnesses', 'four witnesses testify',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'fight them in', 'fight the way', 'kill them wherever', 'slay them wherever',
    'when you meet', 'when you encounter', 'strike their necks', 'strike the necks',
    'wage war', 'wage war against', 'battle of the', 'sword of allah',
    'sexual intercourse', 'unlawful sexual', 'accuse chaste', 'bring four',
    'unmarried woman', 'unmarried man', 'private parts', 'when women menstruate',
    'people of the book', 'the people of the book', 'disbelievers will',
    'hypocrites will', 'polytheists will', 'those who disbelieve', 'those who reject',
    'an eye for an eye', 'tooth for tooth', 'life for life', 'blood money for',
    'in days of old', 'in ancient times', 'in bygone eras', 'in former times',
    'in past generations', 'in times of ignorance', 'before the coming',
    'the day of battle', 'the day of war', 'the day of judgement',
    'when the earthquake', 'when the flood', 'when the storm', 'when the fire',
    'when the plague', 'when the drought', 'when the famine', 'when he drowned',
    'then we sent', 'sent after them', 'moses and aaron', 'to pharaoh',
    'then the fish', 'the fish swallowed', 'while he was', 'jonah was',
    'they planned a plan', 'we planned a plan', 'while they perceived not',
    'no headache', 'they will have therefrom', 'rivers of wine', 'rivers of milk',
    'rivers of honey', 'pure spouses', 'chaste spouses', 'couches',
    'green cushions', 'beautiful carpets', 'will be married', 'virgin',
    'when they came', 'when they said', 'when he said', 'when she said',
    'they said to them', 'they said to him', 'he said to them',
    'in the city', 'in the town', 'in the village', 'at the sea',
    'so when', 'and when', 'then when', 'therefore when',
    'so he was', 'so they were', 'thus he was', 'thus they were',
    'so we saved', 'so we rescued', 'thus we saved', 'therefore we saved',
    'so we destroyed', 'thus we destroyed', 'therefore we destroyed',
    'the fish swallowed', 'the whale swallowed',
    'answered him', 'replied to him', 'responded to him',
    'have you not', 'did you not', 'do you not see', 'do you not know',
    'they disputed', 'they argued', 'they disagreed',
    'we appointed him', 'we chose him', 'we selected him', 'we made him',
    'when he migrated', 'when they migrated', 'when he left',
    'the day of', 'on the day', 'during the battle',
    'defeated them', 'conquered them', 'was given victory',
    'they broke', 'he broke', 'the covenant', 'the pledge',
    'they rejected', 'he rejected', 'they denied', 'he denied'
  ];
  
  // Add MORE combinations to be even stricter
  const moreCombinations = [
    // Remove verses about specific people and historical contexts
    'your fathers', 'their fathers', 'your loins', 'upon you',
    'prophet muhammad came', 'prophet muhammad went', 'prophet moses went',
    'grant us from among our wives', 'from their wives',
    // Remove verses that could be confusing out of context
    'believe in allah', 'believe in god', 'believe in him', 'believes in',
    'righteous', 'pious', 'righteous deeds', 'good deeds',
    'evil deed', 'sin', 'sins', 'forbidden', 'impermissible',
    'lawful', 'permissible', 'halal', 'haram',
    'testimony', 'witness', 'oath', 'swear', 'vow',
    'inheritance', 'will', 'bequest', 'legacy',
    'zakat', 'charity', 'sadaqah', 'donation',
    'pilgrimage', 'hajj', 'umrah',
    'fasting', 'ramadan', ' Ramadan',
    'pray to', 'prayer to', 'worship to',
    'messenger', 'rasul', 'nabi',
    'revelation', 'revealed', 'revelation to',
    'scripture', 'torah', 'injeel', 'psalm',
    'heaven', 'paradise', 'jannah',
    'hell', 'hellfire', 'jahannam',
    'judgement day', 'day of resurrection', 'last day'
  ];
  
  return [...combinations, ...moreCombinations];
};

const EXCLUSION_COMBINATIONS = buildExclusionCombinations();

// Collect all verses but keep original structure
const included = [];
let excludedCount = 0;

quranData.suras.forEach((sura) => {
  const includedVerses = [];
  
  sura.verses.forEach((verse) => {
    const verseText = verse.english || '';
    const english = verseText.toLowerCase();
    
    // Length check
    if (english.length < 30 || english.length > 280) {
      excludedCount++;
      return;
    }
    
    // Check categories
    let shouldExclude = false;
    for (const cat in EXCLUSION_CATEGORIES) {
      for (const kw of EXCLUSION_CATEGORIES[cat]) {
        if (english.includes(kw)) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) break;
    }
    
    if (shouldExclude) {
      excludedCount++;
      return;
    }
    
    // Check combinations
    for (const combo of EXCLUSION_COMBINATIONS) {
      if (english.includes(combo)) {
        excludedCount++;
        return;
      }
    }
    
    includedVerses.push(verse);
  });
  
  // Only add sura if it has included verses
  if (includedVerses.length > 0) {
    included.push({
      number: sura.number,
      sura: sura.name,  // Changed from "name" to "sura"
      verses: includedVerses
    });
  }
});

// Calculate totals
const totalOriginal = quranData.suras.reduce((sum, s) => sum + s.verses.length, 0);
const totalIncluded = included.reduce((sum, s) => sum + s.verses.length, 0);

console.log('=== Quran Filtering Results ===');
console.log('Original verses:', totalOriginal);
console.log('Included verses:', totalIncluded);
console.log('Excluded verses:', excludedCount);
console.log('Total check:', totalIncluded + excludedCount);

// Save included verses with original structure
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'quran-data-included.json'),
  JSON.stringify({ suras: included }, null, 2)
);

console.log('Created: public/quran-data-included.json');

// Also save excluded count for reference
fs.writeFileSync(
  path.join(__dirname, '..', 'public', 'quran-data-excluded.json'),
  JSON.stringify({ count: excludedCount }, null, 2)
);

console.log('Done!');
const fs = require('fs');
const path = require('path');

// Load the Quran data
const quranData = require(path.join(__dirname, '..', 'public', 'quran-data.json'));

// ALL original exclusion categories - fixed to NOT exclude reminder phrases
const EXCLUSION_CATEGORIES = {
  historicalNarratives: [
    'when you were', 'remember when', 'and when', 'and recall', 'and [recall]',
    'indeed, we sent', 'we sent down', 'we revealed', 'we sent to', 'we gave him',
    'we saved', 'we destroyed', 'we punished', 'we took', 'we have sent',
    'as we sent down', 'as we revealed', 'when they entered', 'when they left',
    'when they fled', 'when they returned', 'when they fought', 'when they won',
    'when they lost', 'when they built', 'when they destroyed', 'when they worshipped',
    'when they prayed', 'when they disobeyed', 'when they denied', 'when they mocked',
    'when they turned away', 'when they repented', 'the story of', 'the account of',
    'the tale of', 'the incident when', 'the event when', 'the battle of', 'the siege of',
    'the conquest of', 'in days of old', 'in ancient times', 'in bygone eras',
    'in former times', 'in past generations', 'in times of ignorance', 'before the coming',
    'centuries ago', 'ages past', 'years ago', 'the day of battle', 'the day of war',
    'the hour of doom', 'the final hour', 'the end times', 'the latter days',
    'the former days', 'the first generation', 'the last generation', 'the age of ignorance',
    'when the earthquake', 'when the flood', 'when the storm', 'when the fire',
    'when the plague', 'when the drought', 'when the famine', 'when he drowned',
    'when he died', 'when he was killed', 'when he was slain', 'when he was crucified',
    'when they were destroyed', 'when they perished', 'when they were drowned',
    'when they were burned', 'when it was revealed', 'when it was sent down',
    'when this was said', 'when that was done', 'your ancient', 'your forefather',
    'their forefathers', 'their fathers', 'the sperm', 'semen', 'discharge',
    'sexual relation', 'intercourse', 'lie with', 'crawling', 'creeping',
    // Added specific story phrases that are out of context
    'gourd vine', 'laden ship', 'ran away to', 'the fish swallowed', 'companions of the cave',
    'people of lot', 'people of lut', 'story of lot', 'story of noah', 'story of jonah',
    'so leave them', 'leave them o muhammad', 'day the caller',
    'preferred the life of the world', 'preferred the life of this world',
    'have they a share of dominion', 'give the people', 'speck on a date seed'
  ],
  historicalPeopleGroups: [
    'people of lut', 'people of noah', 'people of ad', 'people of thamud',
    'people of pharaoh', 'people of aaron', 'people of lot', 'people of israel',
    'children of israel', 'tribe of', 'kingdom of', 'pharaoh', 'firon', 'nation of',
    'family of', 'house of', 'clan of', 'descendants of', 'followers of',
    'pharaoh and his people', 'dwellers of', 'inhabitants of the city',
    'people of the ditch', 'dwellers of the wood', 'the cave', 'the ditch', 'the elephant'
  ],
  historicalProphets: [
    // Only exclude specific story references about prophets, NOT reminders about who they were
    'moses said to', 'noah said to', 'lot said to', 'muhammad said to',
    'abraham prayed to', 'jesus said to', 'jonah went', 'youns fled',
    'when moses went', 'when abraham went', 'when noah built', 'when lot left'
  ],
  legalMatters: [
    'cut off', 'stoning', 'lash', 'lashing', 'flogging', 'punishment', 'penalty',
    'retribution', 'legal retribution', 'testimony', 'witnesses', 'four witnesses',
    'bring witnesses', 'produce witnesses', 'oath', 'vow', 'court', 'judge', 'justice',
    'inheritance law', 'divorce law', 'waiting period',
    'cut off the hand', 'cut off his hand', 'cut off her hand', 'lash them with',
    'flog them with', 'the punishment for', 'the penalty for', 'the retribution for',
    'an eye for an eye', 'tooth for tooth', 'life for life', 'blood money for',
    'prescribed punishments', 'hadd punishments', 'whip', 'strike',
    'adultery', 'fornication', 'menstruation', 'menstruating', 'menstruate',
    'marriage', 'divorce', 'wife', 'husband', 'private parts', 'breast',
    'right hands possess', 'pronounce thihar'
  ],
  warfareConflict: [
    'fight in the way', 'fight them', 'kill them', 'slay them', 'wherever you find',
    'wage war', 'against them', 'battle', 'sword', 'weapon', 'attack', 'strike', 'smite',
    'destroy', 'fighting in the cause', 'do not flee', 'battlefield', 'defend yourselves',
    'strike the necks', 'cut off hands', 'crucify them', 'capture them', 'lay siege',
    'besiege', 'ambush', 'raid', 'conquer', 'victory over', 'defeat of', 'casualties of',
    'war booty', 'fight them in', 'kill them wherever', 'slay them wherever',
    'when you meet', 'strike their necks', 'wage war against', 'battle of the',
    'sword of allah', 'weapon of war', 'kill', 'slain', 'killed', 'massacre', 'slaughter'
  ],
  privateMatters: [
    'sexual intercourse', 'fornicator', 'fornication', 'adultery', 'accuse their wives',
    'accuse chaste women', 'unmarried woman', 'unmarried man', 'found guilty',
    'approach', 'private parts', 'menstruating', 'menstruate',
    'naked', 'nude', 'virgin', 'chastity', 'unlawful sexual', 'bring four',
    'when women menstruate', 'during menstruation', 'breast feeding', 'found guilty',
    'their wives', 'your wives', 'his wives', 'the wives'
  ],
  theologicalDebates: [
    'polytheists', 'hypocrites', 'idolaters', 'blasphemy', 'apostasy',
    'mischief in the land', 'corruption on earth', 'infidels will', 'idolaters will'
  ],
  // NEW: Specific out-of-context phrases to exclude
  outOfContextPhrases: [
    'so leave them', 'day the caller', 'gourd vine', 'laden ship', 'ran away to',
    'the fish swallowed', 'answered him', 'replied to him', 'they planned a plan',
    'we planned a plan', 'do you not see', 'did you not', 'have you not',
    'they disputed', 'they argued', 'they disagreed', 'they rejected', 'they denied',
    'he was given', 'we gave him', 'we sent him', 'we revealed to him',
    'we said to', 'said to them', 'said to him', 'said to her', 'and [mention]', 'mention, o muhammad',
    '[mention] when', 'when we said', 'when i said', 'when he said', 'when she said',
    'when they said', 'he said to', 'they said to', 'she said to', 'answered him',
    'replied to him', 'told them', 'told him', 'narrate', 'recount',
    'mention to them', 'mention to him', 'sabbath', 'apes', 'despised',
    'we gave to', 'when he went', 'when he left', 'when he entered', 'when he fled',
    'when he ran', 'when he came', 'when they came', 'when he returned', 'when they returned',
    // Additional narrative patterns
    'he was', 'they were', 'she was', 'you were', 'we were', 'i was',
    'you had', 'they had', 'he had', 'she had',
    'then ', 'then he', 'then they', 'then when', 'so when', 'so he', 'so they', 'so we', 'so i',
    'but when', 'and when', 'indeed when', 'when indeed', 'when lo', 'lo when',
    'behold when', 'when behold', 'that when', 'while ', 'because ',
    'he became', 'they became', 'she became', 'we became',
    'he turned', 'they turned', 'she turned', 'we turned',
    'he went', 'they went', 'she went', 'we went',
    'he left', 'they left', 'she left', 'we left',
    'he entered', 'they entered', 'she entered', 'we entered',
    'he fled', 'they fled', 'she fled', 'we fled',
    'he ran', 'they ran', 'she ran', 'we ran',
    'he came', 'they came', 'she came', 'we came',
    'he returned', 'they returned', 'she returned', 'we returned'
  ]
};

// Inclusion phrases - never exclude verses with these (matches verse-filter.js)
const INCLUSION_PHRASES = [
  'indeed, allah is', 'allah is', 'indeed, allah', 'with allah', 'from allah', 'to allah',
  'allah knows', 'allah sees', 'allah hears', 'lord of the worlds', 'most merciful',
  'most compassionate', 'forgiving', 'merciful', 'paradise', 'hellfire', 'hell',
  'the fire', 'the hereafter', 'the day of judgment', 'the last day', 'the day of resurrection',
  'the garden', 'fear allah', 'be mindful of', 'remember allah', 'be grateful', 'be patient',
  'be steadfast', 'do good', 'evil deeds', 'good deeds', 'righteous', 'faith', 'believe',
  'indeed, we created', 'we created', 'mankind', 'human beings', 'all of creation', 'signs',
  'reflect', 'understand', 'establish prayer', 'pray', 'worship', 'prostrate', 'bow down',
  'glorify', 'praise', 'be just', 'be fair', 'be kind', 'be merciful', 'compassion',
  'charity', 'give charity', 'spend in the way', 'parents', 'truth', 'honesty', 'zakat', 'zakah',
  'sadaqah', 'halal', 'haram', 'he is allah', 'allah, the eternal refuge', 'my servants',
  'son', 'take a son', 'partners', 'no partners', 'tawhid', 'jesus is', 'jesus said',
  'prophet jesus', 'prophet adam', 'prophet noah', 'prophet abraham', 'messenger of allah'
];

// Build exclusion combinations (only out-of-context/historical phrases)
const buildExclusionCombinations = () => {
  return [
    // Historical people/groups
    'people of lot', 'people of lut', 'people of noah', 'people of ad', 'people of thamud',
    'people of pharaoh', 'children of israel', 'pharaoh and his people', 'companions of the cave',
    'companions of the elephant', 'people of the ditch', 'the cave', 'the ditch', 'the elephant',
    // Historical narratives
    'the fish swallowed', 'gourd vine', 'laden ship', 'ran away to', 'so leave them',
    'day the caller', 'jonah was', 'youns fled', 'when he ran', 'indeed we sent down',
    'we revealed to him', 'we sent to', 'we gave him', 'we saved them', 'we destroyed them',
    'when they entered', 'when they left', 'when they fled', 'when they fought',
    // Legal matters
    'cut off the hand', 'cut off his hand', 'lash them with', 'flog them with',
    'the punishment for', 'the penalty for', 'bring four witnesses', 'four witnesses testify',
    // Warfare
    'fight them in', 'kill them wherever', 'slay them wherever', 'strike their necks',
    'wage war against', 'battle of the', 'sword of allah',
    // Private matters
    'sexual intercourse', 'unlawful sexual', 'private parts', 'when women menstruate',
    // Out of context phrases
    'answered him', 'replied to him', 'they disputed', 'they argued',
    'we appointed him', 'we chose him', 'so we saved', 'so we destroyed',
    'they broke the covenant', 'they rejected', 'they denied'
  ];
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
    // Check if verse has inclusion phrase - if yes, don't exclude
    const hasInclusion = INCLUSION_PHRASES.some(phrase => 
      english.includes(phrase.toLowerCase())
    );
    if (!hasInclusion) {
      excludedCount++;
      return;
    }
  }
}
    
    includedVerses.push(verse);
  });
  
  // Only add sura if it has included verses
  if (includedVerses.length > 0) {
    included.push({
      number: sura.number,
      name: sura.name,
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
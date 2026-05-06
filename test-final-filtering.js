// =====================================================
// Final Test Script for Quran Verse Filtering
// =====================================================
//
// This script tests the consolidated verse filtering logic
// from lib/verse-filter.js to ensure it correctly identifies
// historical context and universal reminders.
//
// Run with: node test-final-filtering.js
// =====================================================

const { filterVerses, shouldExcludeVerse, isInclusionVerse } = require('./lib/verse-filter.js');

console.log('🧪 FINAL TESTING FOR QURAN VERSE FILTERING (CONSOLIDATED LOGIC)\n');

// Test Case 1: Historical Context (Should be excluded)
console.log('📋 Test 1: Historical Context (Should be excluded)');
console.log('=' .repeat(60));

const historicalCases = [
  {
    text: "And [recall] when Moses said to his people, 'O my people, indeed you have wronged yourselves by your taking of the calf [for worship].'",
    reason: "Contains '[recall] when', 'Moses', 'people of', and 'taking of the calf' (historical narrative)"
  },
  {
    text: "And when we saved you from the people of Pharaoh, who afflicted you with the worst torment...",
    reason: "Contains 'And when', 'we saved', and 'people of Pharaoh'"
  },
  {
    text: "The people of Noah denied before them, and the companions of the well and Thamud",
    reason: "Contains 'people of Noah', 'Thamud'"
  },
  {
    text: "And when you were among them and established for them the prayer...",
    reason: "Contains 'when you were' (historical address to the Prophet)"
  },
  {
    text: "Say, 'I do not find within that which was revealed to me [anything] forbidden to one who would eat it...'",
    reason: "Contains 'was revealed to' (specific legal revelation context)"
  }
];

let historicalPassed = 0;
for (const test of historicalCases) {
  const excluded = shouldExcludeVerse(test.text);
  console.log(`\nVerse: "${test.text.substring(0, 80)}..."`);
  console.log(`Reasoning: ${test.reason}`);
  console.log(`Result: ${excluded ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  if (excluded) historicalPassed++;
}
console.log(`\nHistorical Context Results: ${historicalPassed}/${historicalCases.length} passed`);

// Test Case 2: Out of Context / Specific Legal (Should be excluded)
console.log('\n📋 Test 2: Out of Context / Specific Legal (Should be excluded)');
console.log('=' .repeat(60));

const specificLegalCases = [
  {
    text: "[As for] the thief, the male and the female, amputate their hands in recompense for what they committed...",
    reason: "Contains 'amputate' (specific legal punishment)"
  },
  {
    text: "And those who accuse chaste women and then do not produce four witnesses - lash them with eighty lashes...",
    reason: "Contains 'accuse chaste women', 'four witnesses', 'lash them' (specific legal ruling)"
  },
  {
    text: "The fornicatress and the fornicator, flog each of them with a hundred stripes...",
    reason: "Contains 'flogging/flog' (specific legal punishment)"
  },
  {
    text: "O you who have believed, when you contract a debt for a specified term, write it down...",
    reason: "Contains 'contract a debt' (specific commercial/legal guidance, long and complex)"
  }
];

let legalPassed = 0;
for (const test of specificLegalCases) {
  const excluded = shouldExcludeVerse(test.text);
  console.log(`\nVerse: "${test.text.substring(0, 80)}..."`);
  console.log(`Reasoning: ${test.reason}`);
  console.log(`Result: ${excluded ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  if (excluded) legalPassed++;
}
console.log(`\nSpecific Legal Results: ${legalPassed}/${specificLegalCases.length} passed`);

// Test Case 3: Universal Reminders (Should be included)
console.log('\n📋 Test 3: Universal Reminders (Should be included)');
console.log('=' .repeat(60));

const reminderCases = [
  {
    text: "Indeed, Allah is with those who fear Him and those who are doers of good.",
    reason: "Universal reminder of Allah's presence and reward for good"
  },
  {
    text: "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.",
    reason: "Universal encouragement for patience and good deeds"
  },
  {
    text: "O mankind, indeed We have created you from male and female and made you peoples and tribes that you may know one another.",
    reason: "Universal truth about human creation and diversity"
  },
  {
    text: "Say, 'He is Allah, [who is] One, Allah, the Eternal Refuge.'",
    reason: "Core theological reminder (Tawhid)"
  },
  {
    text: "And when My servants ask you, [O Muhammad], concerning Me - indeed I am near.",
    reason: "Universal reminder of Allah's nearness"
  }
];

let remindersPassed = 0;
for (const test of reminderCases) {
  const excluded = shouldExcludeVerse(test.text);
  const isInclusion = isInclusionVerse(test.text);
  
  console.log(`\nVerse: "${test.text.substring(0, 80)}..."`);
  console.log(`Result: ${!excluded ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
  console.log(`Identified as Reminder: ${isInclusion ? 'YES' : 'NO'}`);
  
  if (!excluded) remindersPassed++;
}
console.log(`\nUniversal Reminders Results: ${remindersPassed}/${reminderCases.length} passed`);

// Test Case 4: Combinations Test
console.log('\n📋 Test 4: Combination Patterns Test');
console.log('=' .repeat(60));

const combinationCases = [
  {
    text: "And those who disbelieve and deny Our signs - those will be companions of the Fire...",
    words: ["those", "who", "disbelieve"],
    expected: "exclude"
  },
  {
    text: "We sent to the people of Madyan their brother Shu'ayb...",
    words: ["we", "sent", "to"],
    expected: "exclude"
  },
  {
    text: "Indeed, we revealed to you as we revealed to Noah...",
    words: ["we", "revealed", "to"],
    expected: "exclude"
  }
];

let combinationPassed = 0;
for (const test of combinationCases) {
  const excluded = shouldExcludeVerse(test.text);
  console.log(`\nVerse: "${test.text.substring(0, 80)}..."`);
  console.log(`Checking combination: [${test.words.join(', ')}]`);
  console.log(`Result: ${excluded ? '✅ EXCLUDED' : '❌ NOT EXCLUDED'}`);
  if (excluded) combinationPassed++;
}
console.log(`\nCombination Pattern Results: ${combinationPassed}/${combinationCases.length} passed`);

// Final Summary
console.log('\n' + '=' .repeat(60));
console.log('📊 FINAL TEST RESULTS SUMMARY');
console.log('=' .repeat(60));
console.log(`Historical Context: ${historicalPassed}/${historicalCases.length}`);
console.log(`Specific Legal:    ${legalPassed}/${specificLegalCases.length}`);
console.log(`Universal Reminders: ${remindersPassed}/${reminderCases.length}`);
console.log(`Combinations:       ${combinationPassed}/${combinationCases.length}`);

const allTestsPassed = (historicalPassed === historicalCases.length) && 
                       (legalPassed === specificLegalCases.length) && 
                       (remindersPassed === reminderCases.length) &&
                       (combinationPassed === combinationCases.length);

if (allTestsPassed) {
  console.log('\n🎉 SUCCESS: All tests passed! The consolidated filtering logic is robust.');
} else {
  console.log('\n⚠️ WARNING: Some tests failed. Review the logic in lib/verse-filter.js.');
}

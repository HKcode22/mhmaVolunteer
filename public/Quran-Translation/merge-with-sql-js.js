const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// =====================================================
// This file demonstrates using SQL within JavaScript
// to merge the Quran data using SQL JOINs.
//
// This combines the best of both worlds:
// - SQL for efficient data merging (using indexes)
// - JavaScript for file I/O and JSON conversion
// =====================================================

// Create an in-memory SQLite database
const db = new Database(':memory:');

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('📊 Created in-memory SQLite database');

// =====================================================
// Step 1: Read and parse the SQL files
// =====================================================

function parseSqlInserts(sql, tableName) {
  const verses = [];
  const lines = sql.split('\n');
  let inInsert = false;
  let currentValues = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('INSERT INTO `' + tableName + '`')) {
      inInsert = true;
      continue;
    }

    if (inInsert) {
      if (line === ';') {
        inInsert = false;
        parseValues(currentValues, verses);
        currentValues = '';
        continue;
      }

      if (line.startsWith('--')) {
        continue;
      }

      currentValues += line;
    }
  }

  if (currentValues) {
    parseValues(currentValues, verses);
  }

  return verses;
}

function parseValues(valuesStr, verses) {
  let pos = 0;
  while (pos < valuesStr.length) {
    if (valuesStr[pos] === '(') {
      let depth = 1;
      let endPos = pos + 1;

      while (endPos < valuesStr.length && depth > 0) {
        if (valuesStr[endPos] === '(') depth++;
        if (valuesStr[endPos] === ')') depth--;
        endPos++;
      }

      const tuple = valuesStr.substring(pos + 1, endPos - 1);
      pos = endPos;

      const firstComma = tuple.indexOf(',');
      const secondComma = tuple.indexOf(',', firstComma + 1);
      const thirdComma = tuple.indexOf(',', secondComma + 1);

      if (firstComma !== -1 && secondComma !== -1 && thirdComma !== -1) {
        const index = parseInt(tuple.substring(0, firstComma).trim());
        const sura = parseInt(tuple.substring(firstComma + 1, secondComma).trim());
        const aya = parseInt(tuple.substring(secondComma + 1, thirdComma).trim());
        let text = tuple.substring(thirdComma + 1).trim();

        if (text.startsWith("'") && text.endsWith("'")) {
          text = text.substring(1, text.length - 1);
        }
        text = text.replace(/''/g, "'");

        if (!isNaN(index) && !isNaN(sura) && !isNaN(aya)) {
          verses.push({ index, sura, aya, text });
        }
      }
    } else {
      pos++;
    }
  }
}

// Read the SQL files
const arabicSql = fs.readFileSync(path.join(__dirname, 'quran-uthmani.sql'), 'utf8');
const englishSql = fs.readFileSync(path.join(__dirname, 'en-saheeh.sql'), 'utf8');

console.log('📖 Read SQL files');

// Parse the SQL files
const arabicVerses = parseSqlInserts(arabicSql, 'quran_text');
const englishVerses = parseSqlInserts(englishSql, 'en_sahih');

console.log(`✅ Parsed ${arabicVerses.length} Arabic verses`);
console.log(`✅ Parsed ${englishVerses.length} English verses`);

// =====================================================
// Step 2: Create tables in SQLite using SQL
// =====================================================

// Create Arabic table
db.exec(`
  CREATE TABLE quran_text (
    verse_index INTEGER PRIMARY KEY,
    sura INTEGER NOT NULL,
    aya INTEGER NOT NULL,
    text TEXT NOT NULL
  )
`);

console.log('📋 Created quran_text table');

// Create English table
db.exec(`
  CREATE TABLE en_sahih (
    verse_index INTEGER PRIMARY KEY,
    sura INTEGER NOT NULL,
    aya INTEGER NOT NULL,
    text TEXT NOT NULL
  )
`);

console.log('📋 Created en_sahih table');

// =====================================================
// Step 3: Insert data using prepared statements
// =====================================================

const insertArabic = db.prepare('INSERT INTO quran_text (verse_index, sura, aya, text) VALUES (?, ?, ?, ?)');
const insertEnglish = db.prepare('INSERT INTO en_sahih (verse_index, sura, aya, text) VALUES (?, ?, ?, ?)');

// Insert Arabic verses
const insertManyArabic = db.transaction((verses) => {
  for (const verse of verses) {
    insertArabic.run(verse.index, verse.sura, verse.aya, verse.text);
  }
});

insertManyArabic(arabicVerses);
console.log('💾 Inserted Arabic verses into database');

// Insert English verses
const insertManyEnglish = db.transaction((verses) => {
  for (const verse of verses) {
    insertEnglish.run(verse.index, verse.sura, verse.aya, verse.text);
  }
});

insertManyEnglish(englishVerses);
console.log('💾 Inserted English verses into database');

// =====================================================
// Step 4: MERGE USING SQL JOIN - This is the key!
// =====================================================

console.log('🔗 Merging using SQL INNER JOIN...');

// This is the SQL approach - using database indexes
const mergedRows = db.prepare(`
  SELECT
    q.sura,
    q.aya,
    q.text as arabic,
    e.text as english
  FROM quran_text q
  INNER JOIN en_sahih e ON q.verse_index = e.verse_index
  ORDER BY q.sura, q.aya
`).all();

console.log(`✅ Merged ${mergedRows.length} verses using SQL JOIN`);

// =====================================================
// Step 5: Convert to JSON format
// =====================================================

const suraNames = {
  1: "Al-Fatihah", 2: "Al-Baqarah", 3: "Ali 'Imran", 4: "An-Nisa", 5: "Al-Ma'idah",
  6: "Al-An'am", 7: "Al-A'raf", 8: "Al-Anfal", 9: "At-Tawbah", 10: "Yunus",
  11: "Hud", 12: "Yusuf", 13: "Ar-Ra'd", 14: "Ibrahim", 15: "Al-Hijr",
  16: "An-Nahl", 17: "Al-Isra", 18: "Al-Kahf", 19: "Maryam", 20: "Ta-Ha",
  21: "Al-Anbiya", 22: "Al-Hajj", 23: "Al-Mu'minun", 24: "An-Nur", 25: "Al-Furqan",
  26: "Ash-Shu'ara", 27: "An-Naml", 28: "Al-Qasas", 29: "Al-Ankabut", 30: "Ar-Rum",
  31: "Luqman", 32: "As-Sajdah", 33: "Al-Ahzab", 34: "Saba", 35: "Fatir",
  36: "Ya-Sin", 37: "As-Saffat", 38: "Sad", 39: "Az-Zumar", 40: "Ghafir",
  41: "Fussilat", 42: "Ash-Shura", 43: "Az-Zukhruf", 44: "Ad-Dukhan", 45: "Al-Jathiyah",
  46: "Al-Ahqaf", 47: "Muhammad", 48: "Al-Fath", 49: "Al-Hujurat", 50: "Qaf",
  51: "Adh-Dhariyat", 52: "At-Tur", 53: "An-Najm", 54: "Al-Qamar", 55: "Ar-Rahman",
  56: "Al-Waqi'ah", 57: "Al-Hadid", 58: "Al-Mujadila", 59: "Al-Hashr", 60: "Al-Mumtahanah",
  61: "As-Saff", 62: "Al-Jumu'ah", 63: "Al-Munafiqun", 64: "At-Taghabun", 65: "At-Talaq",
  66: "At-Tahrim", 67: "Al-Mulk", 68: "Al-Qalam", 69: "Al-Haqqah", 70: "Al-Ma'arij",
  71: "Nuh", 72: "Al-Jinn", 73: "Al-Muzzammil", 74: "Al-Muddaththir", 75: "Al-Qiyamah",
  76: "Al-Insan", 77: "Al-Mursalat", 78: "An-Naba", 79: "An-Nazi'at", 80: "Abasa",
  81: "At-Takwir", 82: "Al-Infitar", 83: "Al-Mutaffifin", 84: "Al-Inshiqaq", 85: "Al-Buruj",
  86: "At-Tariq", 87: "Al-A'la", 88: "Al-Ghashiyah", 89: "Al-Fajr", 90: "Al-Balad",
  91: "Ash-Shams", 92: "Al-Layl", 93: "Ad-Duhaa", 94: "Ash-Sharh", 95: "At-Tin",
  96: "Al-Alaq", 97: "Al-Qadr", 98: "Al-Bayyinah", 99: "Az-Zalzalah", 100: "Al-Adiyat",
  101: "Al-Qari'ah", 102: "At-Takathur", 103: "Al-Asr", 104: "Al-Humazah", 105: "Al-Fil",
  106: "Quraysh", 107: "Al-Ma'un", 108: "Al-Kawthar", 109: "Al-Kafirun", 110: "An-Nasr",
  111: "Al-Masad", 112: "Al-Ikhlas", 113: "Al-Falaq", 114: "An-Nas"
};

// Group by sura
const quranData = {};
mergedRows.forEach(row => {
  if (!quranData[row.sura]) {
    quranData[row.sura] = [];
  }
  quranData[row.sura].push({
    aya: row.aya,
    arabic: row.arabic,
    english: row.english
  });
});

// Create final JSON structure
const finalData = {
  suras: Object.keys(quranData).map(suraNum => ({
    number: parseInt(suraNum),
    name: suraNames[parseInt(suraNum)] || `Surah ${suraNum}`,
    verses: quranData[suraNum]
  }))
};

// =====================================================
// Step 6: Write to JSON file
// =====================================================

fs.writeFileSync(
  path.join(__dirname, 'quran-data-sql-merged.json'),
  JSON.stringify(finalData, null, 2),
  'utf8'
);

console.log('📝 Created quran-data-sql-merged.json');
console.log(`📊 Total suras: ${finalData.suras.length}`);
console.log(`📊 Total verses: ${mergedRows.length}`);

// =====================================================
// Step 7: Close database
// =====================================================

db.close();
console.log('🔒 Database closed');

console.log('\n✨ Done! Merged using SQL JOIN within JavaScript ✨');

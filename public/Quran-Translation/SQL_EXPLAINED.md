# SQL Structure Explanation

## What is SQL?

SQL (Structured Query Language) is used to talk to databases. Think of it like a language for storing and retrieving data in an organized way.

## The Quran SQL Files Explained

### Visual Understanding

Imagine a spreadsheet (like Excel) with rows and columns:

```
┌────────┬──────┬─────┬─────────────────────────────────┐
│ index  │ sura │ aya │ text                           │
├────────┼──────┼─────┼─────────────────────────────────┤
│   1    │  1   │  1  | بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ     │
│   2    │  1   │  2  | ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ │
│   3    │  1   │  3  | ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ          │
│   4    │  1   │  4  | مَـٰلِكِ يَوْمِ ٱلدِّينِ           │
│   5    │  1   │  5  | إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ │
└────────┴──────┴─────┴─────────────────────────────────┘
```

## Breaking Down the SQL Code

### 1. Creating the Table

```sql
CREATE TABLE `en_sahih` (
  `index` int(4) NOT NULL auto_increment,
  `sura` int(3) NOT NULL default '0',
  `aya` int(3) NOT NULL default '0',
  `text` text NOT NULL,
  PRIMARY KEY  (`index`)
) ENGINE=MyISAM DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
```

**Translation to plain English:**
- `CREATE TABLE en_sahih` - Create a new table named "en_sahih"
- `index int(4)` - A column called "index" that holds numbers (integers), up to 4 digits
- `NOT NULL` - This column cannot be empty
- `auto_increment` - Automatically assign 1, 2, 3, 4... for each new row
- `sura int(3)` - A column for sura number (1-114)
- `aya int(3)` - A column for verse number
- `text text` - A column for the actual verse text (can be long)
- `PRIMARY KEY (index)` - Make "index" the unique identifier for each row
- `CHARACTER SET utf8` - Support Arabic characters (UTF-8 encoding)

### 2. Inserting Data

```sql
INSERT INTO `en_sahih` (`index`, `sura`, `aya`, `text`) VALUES
(1, 1, 1, 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'),
(2, 1, 2, '[All] praise is [due] to Allah, Lord of the worlds -'),
(3, 1, 3, 'The Entirely Merciful, the Especially Merciful,');
```

**Translation to plain English:**
- `INSERT INTO en_sahih` - Add data to the "en_sahih" table
- `(index, sura, aya, text)` - These are the columns we're filling
- `VALUES` - Here comes the actual data
- `(1, 1, 1, 'text')` - One row of data:
  - index = 1
  - sura = 1 (Al-Fatihah)
  - aya = 1 (first verse)
  - text = the English translation

### 3. Why the Backticks (`)?

Backticks are used around table and column names to avoid conflicts with SQL keywords. For example, if you had a column named "index" (which is a SQL keyword), backticks tell SQL "this is a column name, not a command."

## The Two Files

### quran-uthmani.sql
- Contains the Arabic Quran text
- Table name: `quran_text`
- Same structure: index, sura, aya, text
- Text is in Arabic script

### en-saheeh.sql
- Contains the English translation (Saheeh International)
- Table name: `en_sahih`
- Same structure: index, sura, aya, text
- Text is in English

## Why Both Files?

They're separate because:
1. Different languages (Arabic vs English)
2. Different translations 
3. Keeps data organized
4. Allows matching by sura/aya number

## The JavaScript Parser Explained

### What My Code Does

```javascript
function parseSqlInserts(sql, tableName) {
  const verses = [];
  const lines = sql.split('\n');  // Split file into lines
```

**Step 1: Read the file line by line**

```
Line 1: INSERT INTO `en_sahih` (`index`, `sura`, `aya`, `text`) VALUES
Line 2: (1, 1, 1, 'In the name of Allah...'),
Line 3: (2, 1, 2, '[All] praise is [due] to Allah...'),
Line 4: ;
```

**Step 2: Find INSERT blocks**

```javascript
if (line.startsWith('INSERT INTO `' + tableName + '`')) {
  inInsert = true;  // We found an INSERT statement, start collecting
}
```

**Step 3: Collect the data lines**

```javascript
if (inInsert) {
  if (line === ';') {
    inInsert = false;  // End of INSERT block
    parseValues(currentValues, verses);  // Parse what we collected
  } else {
    currentValues += line;  // Add this line to our collection
  }
}
```

**Step 4: Parse each tuple (row)**

```javascript
function parseValues(valuesStr, verses) {
  // valuesStr = "(1, 1, 1, 'text'), (2, 1, 2, 'text'), ..."
  
  let pos = 0;
  while (pos < valuesStr.length) {
    if (valuesStr[pos] === '(') {  // Found start of a tuple
      // Find matching closing parenthesis
      let depth = 1;
      let endPos = pos + 1;
      
      while (endPos < valuesStr.length && depth > 0) {
        if (valuesStr[endPos] === '(') depth++;
        if (valuesStr[endPos] === ')') depth--;
        endPos++;
      }
      
      // Extract: (1, 1, 1, 'text')
      const tuple = valuesStr.substring(pos + 1, endPos - 1);
      
      // Split by commas: ["1", "1", "1", "'text'"]
      const firstComma = tuple.indexOf(',');
      const secondComma = tuple.indexOf(',', firstComma + 1);
      const thirdComma = tuple.indexOf(',', secondComma + 1);
      
      // Extract each field
      const index = parseInt(tuple.substring(0, firstComma).trim());
      const sura = parseInt(tuple.substring(firstComma + 1, secondComma).trim());
      const aya = parseInt(tuple.substring(secondComma + 1, thirdComma).trim());
      let text = tuple.substring(thirdComma + 1).trim();
      
      // Remove quotes and handle escaped quotes
      if (text.startsWith("'") && text.endsWith("'")) {
        text = text.substring(1, text.length - 1);
      }
      text = text.replace(/''/g, "'");  // '' becomes '
      
      verses.push({ index, sura, aya, text });
    }
    pos++;
  }
}
```

### Visual Example of Parsing

**Input:**
```
(1, 1, 1, 'In the name of Allah'), (2, 1, 2, 'Praise be to Allah')
```

**Parsing Process:**
1. Find `(` at position 0
2. Find matching `)` at position 28
3. Extract: `1, 1, 1, 'In the name of Allah'`
4. Split by commas:
   - Part 1: `1` → index = 1
   - Part 2: `1` → sura = 1
   - Part 3: `1` → aya = 1
   - Part 4: `'In the name of Allah'` → text = "In the name of Allah"
5. Save: `{ index: 1, sura: 1, aya: 1, text: "In the name of Allah" }`
6. Repeat for next tuple

### Why Parenthesis Matching?

Simple splitting by `),` failed because:
- Text contains commas: "In the name of Allah, the Merciful"
- Splitting by `),` would split at the comma inside the text
- Parenthesis matching ensures we only split at the right places

### Merging the Data

```javascript
// Create a map for Arabic verses
const arabicMap = new Map();
arabicVerses.forEach(verse => {
  const key = `${verse.sura}:${verse.aya}`;  // "1:1", "1:2", etc.
  arabicMap.set(key, verse.text);
});

// Match with English verses
englishVerses.forEach(verse => {
  const key = `${verse.sura}:${verse.aya}`;
  const arabic = arabicMap.get(key);  // Get Arabic text
  
  if (arabic) {
    mergedVerses.push({
      sura: verse.sura,
      aya: verse.aya,
      arabic: arabic,
      english: verse.text
    });
  }
});
```

**Visual:**
```
Arabic: { sura: 1, aya: 1, text: "بِسْمِ ٱللَّهِ" }
English: { sura: 1, aya: 1, text: "In the name of Allah" }

Key: "1:1" matches both → Merge them:
{ sura: 1, aya: 1, arabic: "بِسْمِ ٱللَّهِ", english: "In the name of Allah" }
```

## Summary

1. **SQL** stores data in tables (like spreadsheets)
2. **INSERT INTO** adds rows to the table
3. **My parser** reads the SQL file and extracts the data
4. **Parenthesis matching** handles text with commas correctly
5. **Merging** combines Arabic and English by matching sura/aya numbers

This gives you a complete Quran with both languages that your website can use!

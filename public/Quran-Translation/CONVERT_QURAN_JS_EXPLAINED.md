# convert-quran.js - Line by Line Explanation

## Complete File Breakdown

```javascript
const fs = require('fs');
```
**Line 1:** Import the file system module from Node.js. This allows us to read and write files. Think of it as a tool that lets JavaScript interact with files on your computer.

```javascript
const path = require('path');
```
**Line 2:** Import the path module. This helps handle file paths correctly across different operating systems (Windows uses `\`, Mac/Linux use `/`). It ensures the code works everywhere.

```javascript
// Read SQL files
const arabicSql = fs.readFileSync(path.join(__dirname, 'quran-uthmani.sql'), 'utf8');
```
**Line 5:** Read the Arabic Quran SQL file.
- `__dirname` = current directory where this script is located
- `path.join(__dirname, 'quran-uthmani.sql')` = creates the full path to the file
- `'utf8'` = tells JavaScript to read it as text (not binary)
- `readFileSync` = reads the entire file and stores it in the `arabicSql` variable

**Visual:**
```
arabicSql now contains:
"-- phpMyAdmin SQL Dump
-- version 2.11.4
...
INSERT INTO `quran_text` VALUES (1, 1, 1, 'بِسْمِ...'), ..."
```

```javascript
const englishSql = fs.readFileSync(path.join(__dirname, 'en-saheeh.sql'), 'utf8');
```
**Line 6:** Same as above, but reads the English translation file into `englishSql`.

```javascript
// Parse SQL INSERT statements
function parseSqlInserts(sql, tableName) {
```
**Line 9:** Define a function named `parseSqlInserts`.
- Takes two parameters:
  - `sql` = the SQL file content (the big string we just read)
  - `tableName` = the name of the table to look for (e.g., 'quran_text' or 'en_sahih')

```javascript
  const verses = [];
```
**Line 10:** Create an empty array called `verses`. This will store all the parsed verses we extract from the SQL file.

**Visual:**
```
verses = []  (empty array)
```

```javascript
  const lines = sql.split('\n');
```
**Line 11:** Split the SQL file into individual lines.
- `\n` = newline character
- `split('\n')` = cuts the string wherever there's a newline

**Visual Example:**
```
Before:
"Line 1\nLine 2\nLine 3"

After:
["Line 1", "Line 2", "Line 3"]
```

```javascript
  let inInsert = false;
```
**Line 13:** Create a variable `inInsert` set to `false`. This is a flag (switch) that tells us whether we're currently inside an INSERT block or not.

```javascript
  let currentValues = '';
```
**Line 14:** Create an empty string `currentValues`. This will accumulate (collect) all the data lines when we're inside an INSERT block.

```javascript
  for (let i = 0; i < lines.length; i++) {
```
**Line 16:** Start a loop that goes through each line of the file.
- `i = 0` = start at the first line
- `i < lines.length` = keep going until we've processed all lines
- `i++` = move to the next line after each iteration

**Visual:**
```
If lines.length = 100, this loop runs 100 times:
i = 0, 1, 2, 3, ..., 99
```

```javascript
    const line = lines[i].trim();
```
**Line 17:** Get the current line and remove extra whitespace from the beginning and end.
- `lines[i]` = get the line at position i
- `.trim()` = remove spaces, tabs, etc. from start and end

**Visual:**
```
Before: "  INSERT INTO...  "
After:  "INSERT INTO..."
```

```javascript
    // Check if this is an INSERT line
    if (line.startsWith('INSERT INTO `' + tableName + '`')) {
```
**Line 20:** Check if this line starts with "INSERT INTO `table_name`".
- `startsWith()` = checks if a string begins with specific text
- If tableName is 'quran_text', this checks for "INSERT INTO `quran_text`"

```javascript
      inInsert = true;
```
**Line 21:** Set the flag to `true`. We're now inside an INSERT block.

```javascript
      continue;
```
**Line 22:** Skip to the next iteration of the loop. Don't process this line further (it's just the INSERT header, not data).

```javascript
    }
```
**Line 23:** End of the if statement.

```javascript
    // If we're in an INSERT block
    if (inInsert) {
```
**Line 26:** Check if we're currently inside an INSERT block (if `inInsert` is `true`).

```javascript
      // End of INSERT block
      if (line === ';') {
```
**Line 28:** Check if the current line is just a semicolon. In SQL, semicolons mark the end of statements.

```javascript
        inInsert = false;
```
**Line 29:** Set the flag to `false`. We're no longer in an INSERT block.

```javascript
        // Parse the accumulated values
        parseValues(currentValues, verses);
```
**Line 31:** Call the `parseValues` function to process all the data we collected.
- Pass `currentValues` = all the data lines we collected
- Pass `verses` = the array where we want to store the results

```javascript
        currentValues = '';
```
**Line 32:** Reset `currentValues` to empty string, ready for the next INSERT block.

```javascript
        continue;
```
**Line 33:** Skip to the next line.

```javascript
      }
```
**Line 34:** End of the semicolon check.

```javascript
      // Skip comment lines
      if (line.startsWith('--')) {
```
**Line 37:** Check if the line starts with `--` (SQL comment). Comments are ignored by the database.

```javascript
        continue;
```
**Line 38:** Skip this line (don't add it to our data).

```javascript
      }
```
**Line 39:** End of comment check.

```javascript
      // Accumulate values
      currentValues += line;
```
**Line 42:** Add this line to our collection. The `+=` operator appends (adds to the end).

**Visual Example:**
```
Line 1: "(1, 1, 1, 'text'),"
Line 2: "(2, 1, 2, 'text'),"

After line 1: currentValues = "(1, 1, 1, 'text'),"
After line 2: currentValues = "(1, 1, 1, 'text'),(2, 1, 2, 'text'),"
```

```javascript
    }
```
**Line 43:** End of the `inInsert` if block.

```javascript
  }
```
**Line 44:** End of the for loop (finished processing all lines).

```javascript
  // Parse any remaining values
  if (currentValues) {
```
**Line 47:** Check if there's any data left in `currentValues` (in case the file didn't end with a semicolon).

```javascript
    parseValues(currentValues, verses);
```
**Line 48:** Parse any remaining data.

```javascript
  }
```
**Line 49:** End of the remaining values check.

```javascript
  return verses;
```
**Line 51:** Return the `verses` array with all the parsed data.

```javascript
}
```
**Line 52:** End of the `parseSqlInserts` function.

---

## The parseValues Function

```javascript
function parseValues(valuesStr, verses) {
```
**Line 54:** Define a function to parse the collected values.
- `valuesStr` = string like "(1,1,1,'text'),(2,1,2,'text'),..."
- `verses` = the array where we'll store the parsed verses

```javascript
  // Better parsing: find tuples by matching parentheses
  let pos = 0;
```
**Line 56:** Create a variable `pos` (position) set to 0. This tracks where we are in the string.

```javascript
  while (pos < valuesStr.length) {
```
**Line 57:** Start a while loop that continues as long as `pos` is less than the length of the string.

```javascript
    // Find opening parenthesis
    if (valuesStr[pos] === '(') {
```
**Line 59:** Check if the character at position `pos` is an opening parenthesis `(`.

```javascript
      let depth = 1;
```
**Line 60:** Set `depth` to 1. This tracks nesting level of parentheses (for complex cases).

```javascript
      let endPos = pos + 1;
```
**Line 61:** Set `endPos` to one position after the opening parenthesis. We'll scan from here.

```javascript
      // Find matching closing parenthesis
      while (endPos < valuesStr.length && depth > 0) {
```
**Line 64:** Start a nested while loop to find the matching closing parenthesis.
- Continue until we reach the end of the string OR depth is 0

```javascript
        if (valuesStr[endPos] === '(') depth++;
```
**Line 65:** If we find another opening parenthesis, increase depth (nested).

```javascript
        if (valuesStr[endPos] === ')') depth--;
```
**Line 66:** If we find a closing parenthesis, decrease depth.

```javascript
        endPos++;
```
**Line 67:** Move to the next character.

```javascript
      }
```
**Line 68:** End of the nested while loop (found the matching `)`).

**Visual Example:**
```
String: "(1, 1, 1, 'text'), (2, 1, 2, 'text')"

pos = 0, character = '(' → start matching
depth = 1, endPos = 1
scan: 1, ,, 1, ,, 1, ,, ', t, e, x, t, ' → depth stays 1
character = ')' → depth = 0, stop
endPos = 16 (position of the closing parenthesis)
```

```javascript
      // Extract the tuple
      const tuple = valuesStr.substring(pos + 1, endPos - 1);
```
**Line 71:** Extract the content between the parentheses.
- `pos + 1` = skip the opening parenthesis
- `endPos - 1` = skip the closing parenthesis

**Visual:**
```
valuesStr = "(1, 1, 1, 'text')"
pos = 0, endPos = 16
substring(1, 15) = "1, 1, 1, 'text'"
```

```javascript
      pos = endPos;
```
**Line 72:** Move `pos` to after the closing parenthesis, ready to find the next tuple.

```javascript
      // Parse: index, sura, aya, 'text'
      // Find the first three commas to separate numeric fields
      const firstComma = tuple.indexOf(',');
```
**Line 76:** Find the position of the first comma in the tuple.

```javascript
      const secondComma = tuple.indexOf(',', firstComma + 1);
```
**Line 77:** Find the position of the second comma, starting search after the first comma.

```javascript
      const thirdComma = tuple.indexOf(',', secondComma + 1);
```
**Line 78:** Find the position of the third comma, starting search after the second comma.

**Visual:**
```
tuple = "1, 1, 1, 'In the name of Allah'"
        0 1 2 3 4 5 6 7 8 9 ...
firstComma = 1 (position of first comma)
secondComma = 3 (position of second comma)
thirdComma = 5 (position of third comma)
```

```javascript
      if (firstComma !== -1 && secondComma !== -1 && thirdComma !== -1) {
```
**Line 80:** Check if we found all three commas (indexOf returns -1 if not found).

```javascript
        const index = parseInt(tuple.substring(0, firstComma).trim());
```
**Line 81:** Extract the index number.
- `substring(0, firstComma)` = get text from start to first comma
- `.trim()` = remove whitespace
- `parseInt()` = convert string to number

**Visual:**
```
tuple = "1, 1, 1, 'text'"
substring(0, 1) = "1"
parseInt("1") = 1
```

```javascript
        const sura = parseInt(tuple.substring(firstComma + 1, secondComma).trim());
```
**Line 82:** Extract the sura number (between first and second comma).

```javascript
        const aya = parseInt(tuple.substring(secondComma + 1, thirdComma).trim());
```
**Line 83:** Extract the aya number (between second and third comma).

```javascript
        // The text is everything after the third comma
        let text = tuple.substring(thirdComma + 1).trim();
```
**Line 85:** Extract the text (everything after the third comma).

```javascript
        // Remove surrounding quotes
        if (text.startsWith("'") && text.endsWith("'")) {
```
**Line 87:** Check if the text starts and ends with single quotes.

```javascript
          text = text.substring(1, text.length - 1);
```
**Line 88:** Remove the first and last characters (the quotes).

**Visual:**
```
text = "'In the name of Allah'"
substring(1, 21) = "In the name of Allah"
```

```javascript
        }
```
**Line 89:** End of quote removal.

```javascript
        // Handle escaped single quotes
        text = text.replace(/''/g, "'");
```
**Line 91:** Replace double single quotes with single quotes.
- In SQL, single quotes inside text are escaped by doubling them
- `''` in SQL becomes `'` in the actual text

**Visual:**
```
SQL: "Allah''s mercy"
After replace: "Allah's mercy"
```

```javascript
        if (!isNaN(index) && !isNaN(sura) && !isNaN(aya)) {
```
**Line 93:** Check if all three numbers are valid (not NaN = Not a Number).

```javascript
          verses.push({ index, sura, aya, text });
```
**Line 94:** Add the parsed verse to the `verses` array as an object.

**Visual:**
```
verses = []
After push:
verses = [
  { index: 1, sura: 1, aya: 1, text: "In the name of Allah" }
]
```

```javascript
        }
```
**Line 95:** End of validity check.

```javascript
      }
```
**Line 96:** End of comma check.

```javascript
    } else {
```
**Line 97:** If character is not `(`.

```javascript
      pos++;
```
**Line 98:** Move to next character.

```javascript
    }
```
**Line 99:** End of if/else.

```javascript
  }
```
**Line 100:** End of while loop (finished parsing all tuples).

```javascript
}
```
**Line 101:** End of `parseValues` function.

---

## Parsing Both Files

```javascript
// Parse both files
const arabicVerses = parseSqlInserts(arabicSql, 'quran_text');
```
**Line 104:** Parse the Arabic SQL file, looking for the `quran_text` table. Store result in `arabicVerses`.

```javascript
const englishVerses = parseSqlInserts(englishSql, 'en_sahih');
```
**Line 105:** Parse the English SQL file, looking for the `en_sahih` table. Store result in `englishVerses`.

```javascript
console.log(`Parsed ${arabicVerses.length} Arabic verses`);
```
**Line 107:** Print how many Arabic verses we parsed.

```javascript
console.log(`Parsed ${englishVerses.length} English verses`);
```
**Line 108:** Print how many English verses we parsed.

---

## Merging the Data

```javascript
// Merge by sura and aya
const mergedVerses = [];
```
**Line 111:** Create empty array for merged verses.

```javascript
const arabicMap = new Map();
```
**Line 112:** Create a Map (like a dictionary) for Arabic verses. Maps allow fast lookups by key.

```javascript
// Create map for Arabic verses
arabicVerses.forEach(verse => {
```
**Line 115:** Loop through each Arabic verse.

```javascript
  const key = `${verse.sura}:${verse.aya}`;
```
**Line 116:** Create a unique key combining sura and aya numbers (e.g., "1:1", "1:2").

```javascript
  arabicMap.set(key, verse.text);
```
**Line 117:** Store the Arabic text in the map using the key.

**Visual:**
```
arabicMap = {
  "1:1" → "بِسْمِ ٱللَّهِ",
  "1:2" → "ٱلْحَمْدُ لِلَّهِ",
  "1:3" → "ٱلرَّحْمَـٰنِ",
  ...
}
```

```javascript
});
```
**Line 118:** End of forEach loop.

```javascript
// Merge with English verses
englishVerses.forEach(verse => {
```
**Line 121:** Loop through each English verse.

```javascript
  const key = `${verse.sura}:${verse.aya}`;
```
**Line 122:** Create the same key (sura:aya).

```javascript
  const arabic = arabicMap.get(key);
```
**Line 123:** Look up the Arabic text using this key.

```javascript
  if (arabic) {
```
**Line 124:** Check if we found matching Arabic text.

```javascript
    mergedVerses.push({
```
**Line 125:** Add a merged object to the array.

```javascript
      sura: verse.sura,
```
**Line 126:** Copy the sura number.

```javascript
      aya: verse.aya,
```
**Line 127:** Copy the aya number.

```javascript
      arabic: arabic,
```
**Line 128:** Add the Arabic text.

```javascript
      english: verse.text
```
**Line 129:** Add the English text.

```javascript
    });
```
**Line 130:** End of object creation.

```javascript
  } else {
```
**Line 131:** If no Arabic match found.

```javascript
    console.warn(`No Arabic text found for Surah ${verse.sura}:${verse.aya}`);
```
**Line 132:** Print a warning message.

```javascript
  }
```
**Line 133:** End of if/else.

```javascript
});
```
**Line 134:** End of forEach loop.

```javascript
console.log(`Merged ${mergedVerses.length} verses`);
```
**Line 136:** Print how many verses we successfully merged.

---

## Grouping by Sura

```javascript
// Group by sura
const quranData = {};
```
**Line 139:** Create an empty object `quranData` to store the final structure.

```javascript
mergedVerses.forEach(verse => {
```
**Line 141:** Loop through each merged verse.

```javascript
  if (!quranData[verse.sura]) {
```
**Line 142:** Check if this sura number doesn't exist in our object yet.

```javascript
    quranData[verse.sura] = [];
```
**Line 143:** Create an empty array for this sura.

```javascript
  }
```
**Line 144:** End of if.

```javascript
  quranData[verse.sura].push({
```
**Line 146:** Add this verse to the sura's array.

```javascript
    aya: verse.aya,
```
**Line 147:** Store the aya number.

```javascript
    arabic: verse.arabic,
```
**Line 148:** Store the Arabic text.

```javascript
    english: verse.english
```
**Line 149:** Store the English text.

```javascript
  });
```
**Line 150:** End of object creation.

```javascript
});
```
**Line 151:** End of forEach loop.

**Visual Result:**
```javascript
quranData = {
  "1": [
    { aya: 1, arabic: "بِسْمِ", english: "In the name..." },
    { aya: 2, arabic: "ٱلْحَمْدُ", english: "Praise be..." },
    ...
  ],
  "2": [
    { aya: 1, arabic: "الم", english: "Alif, Lam, Meem" },
    ...
  ],
  ...
}
```

---

## Adding Sura Names

```javascript
// Add sura names
const suraNames = {
```
**Line 155:** Create an object mapping sura numbers to their Arabic names.

```javascript
  1: "Al-Fatihah",
  2: "Al-Baqarah",
```
**Lines 156-157:** Example entries (continues for all 114 suras).

```javascript
  114: "An-Nas"
```
**Line 268:** Last sura.

```javascript
};
```
**Line 269:** End of suraNames object.

---

## Creating Final JSON Structure

```javascript
// Create final JSON structure
const finalData = {
```
**Line 272:** Create the final data object.

```javascript
  suras: Object.keys(quranData).map(suraNum => ({
```
**Line 273:** Create a "suras" array.
- `Object.keys(quranData)` = get all sura numbers ["1", "2", "3", ...]
- `.map()` = transform each number into an object

```javascript
    number: parseInt(suraNum),
```
**Line 274:** Convert string "1" to number 1.

```javascript
    name: suraNames[parseInt(suraNum)] || `Surah ${suraNum}`,
```
**Line 275:** Get the sura name from our map, or use "Surah X" as fallback.

```javascript
    verses: quranData[suraNum]
```
**Line 276:** Add all the verses for this sura.

```javascript
  }))
```
**Line 277:** End of map function.

```javascript
};
```
**Line 278:** End of finalData object.

**Visual Final Structure:**
```javascript
finalData = {
  suras: [
    {
      number: 1,
      name: "Al-Fatihah",
      verses: [
        { aya: 1, arabic: "...", english: "..." },
        { aya: 2, arabic: "...", english: "..." },
        ...
      ]
    },
    {
      number: 2,
      name: "Al-Baqarah",
      verses: [...]
    },
    ...
  ]
}
```

---

## Writing to JSON File

```javascript
// Write to JSON file
fs.writeFileSync(
```
**Line 281:** Start writing to a file.

```javascript
  path.join(__dirname, 'quran-data.json'),
```
**Line 282:** Specify the output file path (same directory as script).

```javascript
  JSON.stringify(finalData, null, 2),
```
**Line 283:** Convert the JavaScript object to JSON string.
- `finalData` = the object to convert
- `null` = no custom replacer function
- `2` = pretty-print with 2-space indentation

```javascript
  'utf8'
```
**Line 284:** Write as UTF-8 text.

```javascript
);
```
**Line 285:** End of writeFileSync call.

```javascript
console.log('Successfully created quran-data.json');
```
**Line 287:** Print success message.

```javascript
console.log(`Total suras: ${finalData.suras.length}`);
```
**Line 288:** Print total number of suras.

```javascript
console.log(`Total verses: ${mergedVerses.length}`);
```
**Line 289:** Print total number of verses.

---

## Summary Flow

1. **Read SQL files** → Load Arabic and English text
2. **Parse SQL** → Extract INSERT statements and convert to JavaScript objects
3. **Merge data** → Match Arabic and English by sura:aya
4. **Group by sura** → Organize verses by their sura
5. **Add names** → Map sura numbers to Arabic names
6. **Create JSON** → Structure the data for easy use
7. **Write file** → Save as quran-data.json

This entire process transforms SQL database dumps into a clean JSON format that your Next.js website can easily use!

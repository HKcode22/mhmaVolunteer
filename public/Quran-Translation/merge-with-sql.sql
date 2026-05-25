-- =====================================================
-- Alternative Approach: Merging Quran Data Using SQL
-- =====================================================
--
-- This demonstrates how to merge the two SQL tables using
-- the index primary key instead of parsing with JavaScript.
--
-- This is the "proper" database approach - using SQL JOINs.
-- =====================================================

-- Step 1: Import both tables into a database
-- (You would run the original quran-uthmani.sql and en-saheeh.sql first)

-- Step 2: Create a merged table
CREATE TABLE IF NOT EXISTS `quran_merged` (
  `index` int(4) NOT NULL,
  `sura` int(3) NOT NULL,
  `aya` int(3) NOT NULL,
  `arabic` text NOT NULL,
  `english` text NOT NULL,
  PRIMARY KEY (`index`)
) ENGINE=MyISAM DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;

-- Step 3: Merge using INNER JOIN on index
-- This is much simpler than parsing - just match by primary key!
INSERT INTO `quran_merged` (`index`, `sura`, `aya`, `arabic`, `english`)
SELECT
  q.`index`,
  q.`sura`,
  q.`aya`,
  q.`text` AS arabic,
  e.`text` AS english
FROM `quran_text` q
INNER JOIN `en-sahih` e ON q.`index` = e.`index`;

-- Step 4: Verify the merge
SELECT COUNT(*) as total_verses FROM `quran_merged`;
-- Should return: 6236

-- Step 5: View a sample
SELECT * FROM `quran_merged` LIMIT 5;

-- Step 6: Export to JSON format (if needed)
-- MySQL doesn't have native JSON export, but you can use:
SELECT CONCAT(
  '{',
  '"sura": ', `sura`, ', ',
  '"aya": ', `aya`, ', ',
  '"arabic": "', REPLACE(REPLACE(`arabic`, '"', '\\"'), '\n', '\\n'), '", ',
  '"english": "', REPLACE(REPLACE(`english`, '"', '\\"'), '\n', '\\n'), '"',
  '}'
) as json_row
FROM `quran_merged`
ORDER BY `index`
LIMIT 10;

-- =====================================================
-- Why this approach is better:
-- =====================================================
--
-- 1. Uses the PRIMARY KEY (index) which is guaranteed unique
-- 2. No need to parse sura:aya combinations
-- 3. SQL INNER JOIN is optimized by the database engine
-- 4. Much faster for large datasets
-- 5. Less code - database does the heavy lifting
-- 6. More reliable - no parsing errors
--
-- =====================================================
-- Comparison with JavaScript approach:
-- =====================================================
--
-- JavaScript:
-- - Reads entire SQL file as text
-- - Parses each line character by character
-- - Extracts tuples using position/depth counting
-- - Splits by commas
-- - Handles quotes and escaping
-- - Creates maps and loops
-- - More error-prone
--
-- SQL:
-- - Database engine handles everything
-- - Uses indexes for fast lookups
-- - One simple JOIN statement
-- - Built-in data integrity
-- - Industry standard approach
--
-- =====================================================
-- When to use each approach:
-- =====================================================
--
-- Use SQL when:
-- - You have database access
-- - Working with actual database tables
-- - Need to merge large datasets
-- - Want maximum performance
--
-- Use JavaScript when:
-- - You only have SQL files (no database)
-- - Working in a web environment (like Next.js)
-- - Need to convert to JSON for frontend
-- - Don't have database server running
--
-- =====================================================

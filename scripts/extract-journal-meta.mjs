import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(resolve(__dirname, "../app/journal/[slug]/page.tsx"), "utf8");
const lines = content.split("\n");

const entries = {};
let currentSlug = null;
let braceDepth = 0;
let inEntry = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const slugMatch = line.match(/^\s*"([a-zA-Z0-9_-]+)":\s*\{$/);
  if (slugMatch) {
    currentSlug = slugMatch[1];
    entries[currentSlug] = { title: "", date: "", attendees: "" };
    inEntry = true;
    braceDepth = 1;
    continue;
  }
  if (inEntry) {
    for (const ch of line) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth <= 0) {
      inEntry = false;
      currentSlug = null;
      continue;
    }
    const titleMatch = line.match(/title:\s*"([^"]+)"/);
    if (titleMatch && currentSlug) entries[currentSlug].title = titleMatch[1];
    const dateMatch = line.match(/date:\s*"([^"]+)"/);
    if (dateMatch && currentSlug) entries[currentSlug].date = dateMatch[1];
    const attMatch = line.match(/attendees:\s*"([^"]+)"/);
    if (attMatch && currentSlug) entries[currentSlug].attendees = attMatch[1];
  }
}

writeFileSync(resolve(__dirname, "journal-meta.json"), JSON.stringify(entries, null, 2));
console.log(`Extracted ${Object.keys(entries).length} journal entries`);

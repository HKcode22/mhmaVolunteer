import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const serviceAccountPath = resolve(os.homedir(), ".keys", "mhma-firebase.json");
if (!existsSync(serviceAccountPath)) {
  console.error("Service account file not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
db.settings({ ignoreUndefinedProperties: true });

interface QAItem {
  q: string;
  a: string;
  keywords: string[];
  roles?: ("board_member" | "member" | "administrator")[];
  pages?: string[];
  denyRoles?: ("board_member" | "member" | "administrator")[];
}

interface KnowledgeDoc {
  type: "static";
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  source: string;
  roleAccess: string[];
  updatedAt: any;
}

function inferCategory(q: string, keywords: string[], pages?: string[]): string {
  const text = [q, ...keywords, ...(pages || [])].join(" ").toLowerCase();
  if (/event|rsvp|calendar|schedule/i.test(text)) return "event";
  if (/program|enroll|class|course|instructor/i.test(text)) return "program";
  if (/donat|pledge|fund|zakat|giving/i.test(text)) return "donation";
  if (/news|article|blog|journal/i.test(text)) return "news";
  if (/login|register|sign.?up|password|auth/i.test(text)) return "auth";
  if (/dash|admin|board|sidebar/i.test(text)) return "dashboard";
  if (/contact|faq|subscribe|volunteer/i.test(text)) return "faq";
  if (/route|nav|page|url/i.test(text)) return "route";
  if (/workflow|how.?to|steps|process/i.test(text)) return "workflow";
  if (/profile|setting|notification|member/i.test(text)) return "account";
  return "general";
}

function inferSource(pages?: string[]): string {
  if (!pages || pages.length === 0) return "assistant-knowledge.ts";
  return pages.join(", ");
}

function categories(entry: QAItem): string[] {
  const roles = entry.roles || ["member", "board_member", "administrator"];
  // If denyRoles is set, exclude those
  const deny = entry.denyRoles || [];
  return roles.filter(r => !deny.includes(r as any));
}

async function sync() {
  console.log("\n========== Sync Knowledge Base to Firestore ==========\n");

  const tsSource = readFileSync(resolve(ROOT, "app/lib/assistant-knowledge.ts"), "utf8");

  const arrayStart = tsSource.indexOf("knowledgeBase: QAItem[] = [");
  if (arrayStart === -1) {
    console.error("Could not find knowledgeBase array in file");
    process.exit(1);
  }
  const bracketStart = tsSource.indexOf("[", arrayStart);
  if (bracketStart === -1) {
    console.error("Could not find opening bracket");
    process.exit(1);
  }

  const trimmed = tsSource.slice(bracketStart);
  const entries: QAItem[] = [];
  let depth = 0;
  let current = "";
  for (const ch of trimmed) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "[" && depth > 0) depth++;
    if (ch === "]" && depth > 0) depth--;
    if (ch === ";" && depth === 0) break;
    current += ch;
    if (depth === 0 && current.trim().startsWith("[") && current.trim().endsWith("]")) break;
  }

  const objects: string[] = [];
  let objDepth = 0;
  let obj = "";
  for (const ch of current) {
    if (ch === "{") { objDepth++; if (objDepth === 1) { obj = "{"; continue; } }
    if (ch === "}") { objDepth--; if (objDepth === 0) { obj += "}"; objects.push(obj); obj = ""; continue; } }
    if (objDepth > 0) obj += ch;
  }

  const parsed: QAItem[] = objects.map(objStr => {
    try {
      const clean = objStr
        .replace(/\/\/.*$/gm, "")
        .replace(/'/g, '"')
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
        .replace(/,\s*([}\]])/g, "$1");
      return Function(`"use strict"; return (${clean})`)();
    } catch {
      return null;
    }
  }).filter(Boolean) as QAItem[];

  console.log(`Found ${parsed.length} entries in knowledge base`);

  const col = db.collection("ai_knowledge");
  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of parsed) {
    try {
      const existing = await col
        .where("question", "==", entry.q)
        .limit(1)
        .get();

      if (!existing.empty) {
        skipped++;
        continue;
      }

      const doc: KnowledgeDoc = {
        type: "static",
        category: inferCategory(entry.q, entry.keywords, entry.pages),
        question: entry.q,
        answer: entry.a,
        keywords: entry.keywords || [],
        source: inferSource(entry.pages),
        roleAccess: categories(entry),
        updatedAt: Timestamp.now(),
      };

      await col.add(doc);
      added++;
    } catch {
      errors++;
    }
  }

  console.log(`\nDone! Added: ${added}, Skipped (duplicates): ${skipped}, Errors: ${errors}`);
  console.log("============================================\n");
  process.exit(0);
}

sync();

const { readFileSync, writeFileSync } = require('fs');
const xml = readFileSync('/Users/hk/Downloads/mhmaV4/mhma-update.WordPress.2026-05-12.xml', 'utf8');

function stripCdata(s) {
  if (!s) return '';
  const m = s.match(/<!\[CDATA\[(.*?)\]\]>/);
  return m ? m[1] : s.trim();
}

function extractTag(text, tag) {
  const re = new RegExp(`<${tag}>(.*?)</${tag}>`);
  const m = text.match(re);
  return m ? stripCdata(m[1]) : '';
}

function extractAllMeta(itemText) {
  const metas = {};
  const metaRe = /<wp:postmeta>\s*<wp:meta_key>(.*?)<\/wp:meta_key>\s*<wp:meta_value>(.*?)<\/wp:meta_value>\s*<\/wp:postmeta>/g;
  let m;
  while ((m = metaRe.exec(itemText)) !== null) {
    const key = stripCdata(m[1]);
    const val = stripCdata(m[2]);
    if (!key.startsWith('_')) {
      metas[key] = val;
    }
  }
  return metas;
}

const items = [];
const itemPattern = /<item>([\s\S]*?)<\/item>/g;
let match;
while ((match = itemPattern.exec(xml)) !== null) {
  items.push(match[1]);
}

const allPages = [];

for (const item of items) {
  const postType = extractTag(item, 'wp:post_type');
  if (postType !== 'page') continue;

  const title = extractTag(item, 'title');
  const slug = extractTag(item, 'wp:post_name');
  const postId = parseInt(extractTag(item, 'wp:post_id'));
  const parent = parseInt(extractTag(item, 'wp:post_parent'));
  const status = extractTag(item, 'wp:status');
  const postDate = extractTag(item, 'wp:post_date');
  const contentMatch = item.match(/<content:encoded>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content:encoded>/);
  const content = contentMatch ? contentMatch[1] : '';
  const metas = extractAllMeta(item);
  const link = extractTag(item, 'link');

  allPages.push({
    id: postId,
    title,
    slug,
    link,
    parentId: parent,
    status,
    postDate,
    content,
    meta: metas
  });
}

// Classify pages into mutually exclusive categories
// Priority: enrollment > event > program > journal > other

const enrollmentPages = [];
const eventPages = [];
const programPages = [];
const journalPages = [];
const otherPages = [];

for (const p of allPages) {
  if (p.slug && p.slug.startsWith('enrollment-')) {
    enrollmentPages.push(p);
  } else if (p.parentId === 280 || p.meta.event_poster || p.meta.event_date || p.meta.event_description || p.meta.event_time) {
    eventPages.push(p);
  } else if (p.parentId === 70 || p.meta.program_title !== undefined) {
    programPages.push(p);
  } else if (p.parentId === 199 || p.meta.journal_title || p.meta.date_published || p.meta.journal_content) {
    journalPages.push(p);
  } else {
    otherPages.push(p);
  }
}

// Sort each category by id
[enrollmentPages, eventPages, programPages, journalPages, otherPages].forEach(arr =>
  arr.sort((a, b) => a.id - b.id)
);

const result = {
  totalPages: allPages.length,
  eventPages,
  programPages,
  journalPages,
  enrollmentPages,
  otherPages
};

writeFileSync(
  '/Users/hk/Downloads/mhmaV4/scripts/wp-data.json',
  JSON.stringify(result, null, 2),
  'utf8'
);

console.log(`Total pages: ${allPages.length}`);
console.log(`Event pages: ${eventPages.length}`);
console.log(`Program pages: ${programPages.length}`);
console.log(`Journal pages: ${journalPages.length}`);
console.log(`Enrollment pages: ${enrollmentPages.length}`);
console.log(`Other pages: ${otherPages.length}`);

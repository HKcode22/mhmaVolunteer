const USERNAME = 'hkcode22';
const PASSWORD = 'Khan2203';
const WP_API_URL = 'http://mhma-update.local/wp-json';

const journalEntries = [
  {
    title: "Minutes for MHMA Board of Trustees Meeting – 23-Nov-25",
    excerpt: "MHMA Board of Trustees Meeting - 23-Nov-25",
    date: "2025-11-30",
    slug: "minutes-for-mhma-board-of-trustees-meeting-23-nov-25",
  },
  {
    title: "Minutes for MHMA Full Board Meeting – 24-Nov-25",
    excerpt: "MHMA Full Board Meeting - 24-Nov-25",
    date: "2025-11-29",
    slug: "minutes-for-mhma-full-board-meeting-24-nov-25",
  },
  {
    title: "Minutes for MHMA Board of Trustees Meeting – 12-Nov-25",
    excerpt: "MHMA Board of Trustees Meeting - 12-Nov-25",
    date: "2025-11-22",
    slug: "minutes-for-mhma-board-of-trustees-meeting-12-nov-25",
  },
  {
    title: "Minutes for MHMA General Body Meeting – 15-Nov-25",
    excerpt: "MHMA General Body Meeting - 15-Nov-25",
    date: "2025-11-20",
    slug: "minutes-for-mhma-general-body-meeting-15-nov-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 26-Oct-25",
    excerpt: "MHMA Board Meeting - 26-Oct-25",
    date: "2025-11-02",
    slug: "minutes-for-mhma-board-meeting-26-oct-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 21-Sep-25",
    excerpt: "MHMA Board Meeting - 21-Sep-25",
    date: "2025-09-23",
    slug: "minutes-for-mhma-board-meeting-21-sep-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 15-Feb-25",
    excerpt: "MHMA Board Meeting - 15-Feb-25",
    date: "2025-09-06",
    slug: "minutes-for-mhma-board-meeting-15-feb-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 26-May-25",
    excerpt: "MHMA Board Meeting - 26-May-25",
    date: "2025-09-06",
    slug: "minutes-for-mhma-board-meeting-26-may-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 22-Jun-25",
    excerpt: "MHMA Board Meeting - 22-Jun-25",
    date: "2025-08-30",
    slug: "minutes-for-mhma-board-meeting-22-jun-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 24-Jul-25",
    excerpt: "MHMA Board Meeting - 24-Jul-25",
    date: "2025-08-30",
    slug: "minutes-for-mhma-board-meeting-24-jul-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 24-Aug-25",
    excerpt: "MHMA Board Meeting - 24-Aug-25",
    date: "2025-08-30",
    slug: "minutes-for-mhma-board-meeting-24-aug-25",
  },
  {
    title: "Minutes for MHMA Board Meeting – 26-Apr-25",
    excerpt: "MHMA Board Meeting - 26-Apr-25",
    date: "2025-05-24",
    slug: "minutes-for-mhma-board-meeting-26-apr-25",
  },
  {
    title: "Amazing Festivities at the Mountain House Muslim Association Eid Event",
    excerpt: "Amazing Festivities at the Mountain House Muslim Association Eid Event",
    date: "2025-04-02",
    slug: "amazing-festivities-at-the-mountain-house-muslim-association-eid-event",
  },
  {
    title: "Great Event",
    excerpt: "Great Event",
    date: "2025-04-02",
    slug: "great-event",
  },
  {
    title: "WE RESPECT THE WISDOM OF THE ELDERS",
    excerpt: "WE RESPECT THE WISDOM OF THE ELDERS",
    date: "2025-03-20",
    slug: "we-respect-the-wisdom-of-the-elders",
  },
  {
    title: "OUR YOUTH, OUR FUTURE",
    excerpt: "OUR YOUTH, OUR FUTURE",
    date: "2025-03-20",
    slug: "our-youth-our-future",
  },
  {
    title: "WE BELIEVE IN UNITY",
    excerpt: "WE BELIEVE IN UNITY",
    date: "2025-03-20",
    slug: "we-believe-in-unity",
  },
  {
    title: "WE BELIEVE IN A STRONG COHESIVE COMMUNITY",
    excerpt: "WE BELIEVE IN A STRONG COHESIVE COMMUNITY",
    date: "2025-03-20",
    slug: "we-believe-in-a-strong-cohesive-community",
  },
  {
    title: "Sunday May 25th 2025",
    excerpt: "Community, Commitment, and Connection: A Weekend of Purpose at MHMA",
    date: "2025-05-25",
    slug: "sunday-may-25th-2025",
  },
];

async function createJournalEntry(entry) {
  try {
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
    
    const response = await fetch(`${WP_API_URL}/wp/v2/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        title: entry.title,
        content: entry.excerpt,
        excerpt: entry.excerpt,
        status: 'publish',
        slug: entry.slug,
        parent: 199, // Journal page ID
        acf: {
          journal_title: entry.title,
          date_published: entry.date,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to create "${entry.title}":`, response.status, error);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Created: ${entry.title} (ID: ${data.id})`);
    return true;
  } catch (error) {
    console.error(`Error creating "${entry.title}":`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting journal entry creation...\n');
  console.log(`Creating ${journalEntries.length} journal entries\n`);

  let successCount = 0;
  let failCount = 0;

  for (const entry of journalEntries) {
    const success = await createJournalEntry(entry);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📝 Total: ${journalEntries.length}`);
}

main().catch(console.error);

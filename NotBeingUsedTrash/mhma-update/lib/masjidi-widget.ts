// Masjidi Web Widget Integration
// Uses Masjidi's official embed code - no API key needed!

export interface PrayerTimes {
  fajr: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummahBayan: string;
  jummahIqamah: string;
}

// Hardcoded fallback times (used if widget fails)
export const fallbackPrayerTimes: PrayerTimes = {
  fajr: "6:10 AM",
  zuhr: "1:30 PM",
  asr: "5:50 PM",
  maghrib: "7:39 PM",
  isha: "9:00 PM",
  jummahBayan: "1:45 PM",
  jummahIqamah: "2:10 PM",
};

// Get today's formatted date
export function getTodayDate(): string {
  const today = new Date();
  return today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Check if today is Friday
export function isFriday(): boolean {
  return new Date().getDay() === 5;
}

// Masjidi Widget URL for iframe embed
export function getMasjidiWidgetUrl(): string {
  // Masjidi provides a public widget URL for each masjid
  // This shows the prayer times table without needing API key
  return `https://ummahsoft.org/salahtime/masjid-embed/prayer_widet.php?masjid_id=53487`;
}

// Alternative: Use Masjidi's embed snippet
export function getMasjidiEmbedCode(): string {
  return `
    <iframe 
      src="https://ummahsoft.org/salahtime/masjid-embed/prayer_widet.php?masjid_id=53487&frameborder=0&width=100%25&height=400&marginwidth=0&marginheight=0&scrolling=no" 
      width="100%" 
      height="420" 
      frameborder="0"
      scrolling="no"
      style="border: none;"
    ></iframe>
  `;
}

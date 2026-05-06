import { NextRequest, NextResponse } from 'next/server';

const LATITUDE = 37.7782;
const LONGITUDE = -121.5423;

interface PrayerTime {
  name: string;
  arabicName: string;
  time: string;
}

export async function GET(request: NextRequest) {
  try {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateString = `${day}-${month}-${year}`;

    // Fetch from AlAdhan API with Hanafi school (school=1)
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${dateString}?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=2&school=1`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch prayer times' }, { status: 500 });
    }

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const timings = data.data.timings;
      const formatTime = (time24: string) => {
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      };

      const prayerTimes: PrayerTime[] = [
        { name: "Fajr", arabicName: "الفجر", time: formatTime(timings.Fajr) },
        { name: "Dhuhr", arabicName: "الظهر", time: formatTime(timings.Dhuhr) },
        { name: "Asr", arabicName: "العصر", time: formatTime(timings.Asr) },
        { name: "Maghrib", arabicName: "المغرب", time: formatTime(timings.Maghrib) },
        { name: "Isha", arabicName: "العشاء", time: formatTime(timings.Isha) },
      ];

      return NextResponse.json({
        prayerTimes,
        date: data.data.date.readable,
        hijriDate: `${data.data.date.hijri.date} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`,
        method: data.data.meta.method.name,
      });
    }

    return NextResponse.json({ error: 'Invalid response from AlAdhan' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prayer times' }, { status: 500 });
  }
}

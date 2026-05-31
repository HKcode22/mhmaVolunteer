import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mhma-update.vercel.app";

  const staticRoutes = [
    "", "/about", "/board", "/builders-club", "/bylaws",
    "/committees", "/community-commitment", "/community-transparency",
    "/contact", "/contact/faq", "/donate", "/enroll",
    "/event-scheduling-request", "/events", "/feedback",
    "/home", "/home/events", "/journal", "/login",
    "/masjid-construction", "/member", "/member/notifications",
    "/mhmapage", "/news", "/pledge", "/prayer-times",
    "/programs", "/register", "/recover", "/rsvp",
    "/serving-our-community", "/subscribe", "/volunteer", "/zakat",
    "/programs/arabic-academy", "/programs/boy-scouts",
    "/programs/family-night", "/programs/islamic-center-of-mountain-house",
    "/programs/jummah-and-salah", "/programs/ladies-meetup",
    "/programs/learn-3d-printing", "/programs/maktab-program",
    "/programs/quran-hifz-program", "/programs/urdu-academy",
    "/programs/wish", "/programs/youth-sports-league",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" as const : "monthly" as const,
    priority: route === "" ? 1 : route === "/about" || route === "/programs" || route === "/donate" ? 0.9 : 0.7,
  }));
}

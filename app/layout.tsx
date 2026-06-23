import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { PageDataProvider } from "@/lib/page-data-context";
import dynamic from "next/dynamic";

const AiAssistant = dynamic(() => import("@/app/components/AiAssistant"), { ssr: false });

const dmsans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["300", "400", "500"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = "https://mhma-update.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "MHMA | Mountain House Muslim Association",
    template: "%s | MHMA | Mountain House",
  },
  description:
    "Mountain House Muslim Association (MHMA) — serving the Muslim community in Mountain House, CA since 2010. Join us for prayers, events, and community programs.",
  keywords: [
    "MHMA", "Mountain House Muslim Association", "masjid", "mosque",
    "Mountain House CA", "Islamic center", "Muslim community",
    "Jumu'ah", "Quran", "Islamic education",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Mountain House Muslim Association",
    title: "MHMA | Mountain House Muslim Association",
    description:
      "Serving the Muslim community in Mountain House, CA since 2010. Join us for prayers, events, and community programs.",
    url: siteUrl,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MHMA | Mountain House Muslim Association",
    description:
      "Serving the Muslim community in Mountain House, CA since 2010.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Mountain House Muslim Association",
  url: siteUrl,
  logo: "https://mhma.us/wp-content/uploads/2023/12/MHMA-Site-Logo-345x70-1.webp",
  description:
    "The Mountain House Muslim Association (MHMA) serves the spiritual, educational, and social needs of Muslims in Mountain House and the surrounding Bay Area.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "250 East Main Street",
    addressLocality: "Mountain House",
    addressRegion: "CA",
    postalCode: "95391",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-408-722-1043",
    email: "board@mhma.info",
    contactType: "customer service",
  },
  sameAs: [
    "https://www.facebook.com/mhma95391",
    "https://www.instagram.com/mhma.ig/",
    "https://www.youtube.com/@MHMAYouTube",
    "https://www.linkedin.com/company/mountain-house-muslim-association/",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmsans.variable} ${cormorant.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.stripe.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} />
            <script dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
              `
            }} />
          </>
        )}
      </head>
      <body className="antialiased font-sans" style={{ color: 'var(--color-text)', backgroundColor: 'var(--color-bg)' }}>
        <PageDataProvider><AuthProvider><ThemeProvider>{children}<AiAssistant /></ThemeProvider></AuthProvider></PageDataProvider>
      </body>
    </html>
  );
}

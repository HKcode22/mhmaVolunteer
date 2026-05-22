import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

const dmsans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dmsans",
  weight: ["300", "400", "500"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Mountain House Muslim Association – Strengthening The Ties of Brotherhood",
  description: "Strengthening The Bond of brotherhood - MAKE A DIFFERENCE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmsans.variable} ${cormorant.variable}`}>
      <body className="antialiased font-sans text-[#1C2A20] bg-[#F8F4EC]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

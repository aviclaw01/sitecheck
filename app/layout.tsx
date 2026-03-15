import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sitecheck.nexprove.com"),
  title: "SiteCheck — Website Grader for Auto Dealers & Logistics",
  description:
    "Find out if your dealership or logistics website is losing customers. Free instant website audit for German auto dealers and logistics companies.",
  keywords: [
    "website audit",
    "auto dealer website",
    "KFZ Händler Website",
    "website grader",
    "SEO check",
    "mobile optimization",
    "Nexprove",
  ],
  authors: [{ name: "Nexprove", url: "https://www.nexprove.com" }],
  openGraph: {
    title: "SiteCheck — Is Your Dealership Website Losing Customers?",
    description:
      "Get a free instant website audit. See exactly how your site scores on mobile, speed, SEO, and local search — in under 60 seconds.",
    url: "https://sitecheck.nexprove.com",
    siteName: "SiteCheck by Nexprove",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SiteCheck — Website Grader for Auto Dealers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SiteCheck — Website Grader for Auto Dealers",
    description:
      "Free instant website audit for German auto dealers and logistics companies.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}

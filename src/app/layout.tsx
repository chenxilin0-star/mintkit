import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://mintkit.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "MintKit - Turn Any Niche into Sellable Digital Products with AI",
  description:
    "Enter any niche and get 5 AI-generated digital product ideas with complete PDF planners, checklists, and guides. Download and sell on Gumroad.",
  keywords: [
    "digital products",
    "AI product generator",
    "printable planner",
    "checklist maker",
    "digital download",
    "Gumroad products",
    "side hustle",
    "passive income",
    "digital publishing",
  ],
  authors: [{ name: "MintKit" }],
  creator: "MintKit",
  publisher: "MintKit",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "MintKit",
    title: "MintKit - Turn Any Niche into Sellable Digital Products with AI",
    description:
      "Enter any niche and get 5 AI-generated digital product ideas with complete PDF planners, checklists, and guides. Download and sell on Gumroad.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MintKit - AI Digital Product Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MintKit - Turn Any Niche into Sellable Digital Products with AI",
    description:
      "Enter any niche and get 5 AI-generated digital product ideas with complete PDF planners, checklists, and guides.",
    images: ["/og-image.png"],
    creator: "@mintkit",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}

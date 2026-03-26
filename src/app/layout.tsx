import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MintKit — AI Digital Product Generator",
  description: "Turn any niche into sellable digital products (planners, checklists, guides) with AI. Download PDF and sell on Gumroad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

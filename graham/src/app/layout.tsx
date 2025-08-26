import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LinkedIn Comment Research Tool",
  description: "Automate LinkedIn commenter research with AI-powered relevance scoring. Transform hours of manual profile analysis into minutes of actionable insights for B2B sales, recruitment, and networking.",
  keywords: ["LinkedIn", "B2B sales", "lead generation", "prospect research", "sales automation", "LinkedIn tools"],
  authors: [{ name: "LinkedIn Comment Research Tool" }],
  creator: "LinkedIn Comment Research Tool",
  publisher: "LinkedIn Comment Research Tool",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: "LinkedIn Comment Research Tool",
    description: "Automate LinkedIn commenter research with AI-powered relevance scoring",
    siteName: "LinkedIn Comment Research Tool",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Comment Research Tool",
    description: "Automate LinkedIn commenter research with AI-powered relevance scoring",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}

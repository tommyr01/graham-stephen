import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Impetus Global Podcast - Unlock Elite Performance",
  description: "Discover insights on leadership development, performance optimization, and the iDrive methodology through the Impetus Global podcast.",
  keywords: "leadership development, performance optimization, iDrive assessment, business transformation, team performance",
  openGraph: {
    title: "Impetus Global Podcast - Unlock Elite Performance",
    description: "Join industry leaders exploring breakthrough insights on motivation, behavior, and communication.",
    type: "website",
    url: "https://impetus.global/podcast",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Impetus Global Podcast",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impetus Global Podcast",
    description: "Unlock elite performance with science-backed insights",
    images: ["/og-image.png"],
  },
}

export default function ImpetusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="font-sans antialiased">
      {children}
    </div>
  )
}
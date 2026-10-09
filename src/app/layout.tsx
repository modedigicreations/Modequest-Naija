import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ModeQuest: Naija",
  description:
    "Live your Naija story in Lagos, Abuja, Port Harcourt, Enugu, Aba, Kaduna or Calabar — hustle, learn and level up. A free life-sim that teaches money smarts, scam awareness and coding. By Mode Digital Creations.",
  applicationName: "ModeQuest",
  appleWebApp: { capable: true, title: "ModeQuest", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  // Older iPhones still look for the legacy tag to open full-screen from the home screen.
  other: { "apple-mobile-web-app-capable": "yes" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://modequest.stream"),
  // How shared links look in WhatsApp, X, Facebook, etc.
  openGraph: {
    type: "website",
    siteName: "ModeQuest: Naija",
    title: "ModeQuest: Naija — free life-sim game",
    description: "Hustle, dodge scams, beat NEPA and grow your money in 7 Nigerian cities, from Lagos to Kaduna to Calabar. Free in your browser.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModeQuest: Naija — free life-sim game",
    description: "Hustle, dodge scams, beat NEPA and grow your money in 7 Nigerian cities. Free in your browser.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1447e6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}

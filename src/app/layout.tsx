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
    "Live your Naija story in Lagos, Abuja, Port Harcourt or Enugu — hustle, learn and level up. A free life-sim that teaches money smarts, scam awareness and coding. By Mode Digital Creations.",
  applicationName: "ModeQuest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://modequest.stream"),
  // How shared links look in WhatsApp, X, Facebook, etc.
  openGraph: {
    type: "website",
    siteName: "ModeQuest: Naija",
    title: "ModeQuest: Naija — free life-sim game",
    description: "Hustle, dodge scams, beat NEPA and grow your money in Lagos, Abuja, Port Harcourt and Enugu. Free in your browser.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "ModeQuest: Naija — free life-sim game",
    description: "Hustle, dodge scams, beat NEPA and grow your money in 4 Nigerian cities. Free in your browser.",
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

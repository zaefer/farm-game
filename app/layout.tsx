import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BanGuard from "@/components/BanGuard";
import { GameProvider } from "@/context/GameContext";
import PresenceTracker from "@/components/PresenceTracker";
import LastSeenTracker from "@/components/LastSeenTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farm Game",
  description: "A relaxing online farming game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
<body>
  <BanGuard />

  <GameProvider>
    <PresenceTracker />
    <LastSeenTracker />

    {children}
  </GameProvider>
</body>
    </html>
  );
}
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Gabarito (SIL Open Font License), subset to Latin
const gabarito = localFont({
  src: "./fonts/Gabarito.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-gabarito",
});

export const metadata: Metadata = {
  title: "Piring",
  description: "Photograph your meal, get calories, protein, carbs and fat.",
  appleWebApp: { capable: true, title: "Piring", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1712" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={gabarito.variable}>
      <body>{children}</body>
    </html>
  );
}

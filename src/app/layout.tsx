import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Staff Note · Clifford Moor Farm",
    template: "%s · Clifford Moor",
  },
  description:
    "Log extra jobs, extra walks, and notes for the office at Clifford Moor Farm Pet Hotel.",
  applicationName: "Staff Note",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "Staff Note",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1e4d38",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}

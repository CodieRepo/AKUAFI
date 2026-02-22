import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Akuafi – QR Powered Water Bottle Advertising Platform in India",
  description:
    "Turn every water bottle into a smart advertising channel. Akuafi helps brands run QR-powered bottle ads with real-time tracking and measurable ROI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}
      >
        {children}
      </body>
    </html>
  );
}

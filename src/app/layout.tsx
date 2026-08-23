import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KitSetups — Trading Intelligence",
  description:
    "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
  openGraph: {
    title: "KitSetups — Trading Intelligence",
    description:
      "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
    url: "https://kitsetups.vercel.app",
    siteName: "KitSetups",
    type: "website",
    images: [
      {
        url: "https://www.t3kit.xyz/assets/images/logo.webp",
        width: 1200,
        height: 630,
        alt: "KitSetups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KitSetups — Trading Intelligence",
    description:
      "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
    images: ["https://www.t3kit.xyz/assets/images/logo.webp"],
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><ClerkProvider>{children}</ClerkProvider></body>
    </html>
  );
}

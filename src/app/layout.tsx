import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KitSetups — Trading Intelligence",
  description: "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
  openGraph: {
    title: "KitSetups — Trading Intelligence",
    description: "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
    url: "https://kitsetups.xyz",
    siteName: "KitSetups",
    type: "website",
    images: [{ url: "https://www.t3kit.xyz/assets/images/logo.webp", width: 1200, height: 630, alt: "KitSetups" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KitSetups — Trading Intelligence",
    description: "Live market intelligence, structured trade setups, and execution plans powered by KitSetups.",
    images: ["https://www.t3kit.xyz/assets/images/logo.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#030506]">{children}</body>
    </html>
  );
}

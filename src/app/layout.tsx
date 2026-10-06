import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const script = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: "400" });
const sans = Inter({ variable: "--font-inter", subsets: ["latin"] });
const body = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Graduation Invitation",
  description: "You're invited to celebrate.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${script.variable} ${sans.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

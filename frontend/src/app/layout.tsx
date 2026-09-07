import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./components/Providers";

export const metadata: Metadata = {
  title: "CareerNex — Your Next Career Starts Here",
  description:
    "Ace your placements with CareerNex's AI-powered ATS Resume Scoring and Mock Interview practice. Get instant feedback, keyword analysis, and real interview questions powered by Google Gemini.",
  keywords: [
    "CareerNex",
    "placement portal",
    "ATS resume checker",
    "AI mock interview",
    "resume scoring",
    "interview practice",
    "Gemini AI",
  ],
  openGraph: {
    title: "CareerNex — Your Next Career Starts Here",
    description:
      "ATS Resume Scoring + AI Mock Interview practice powered by Google Gemini.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

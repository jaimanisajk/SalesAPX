import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApexSDR | Replace Your SDR Team with AI",
  description: "AI B2B outbound sales automation that prospects, writes, sends, qualifies, and books meetings automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className="h-full antialiased"
      >
        <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans">{children}</body>
      </html>
    </ClerkProvider>
  );
}

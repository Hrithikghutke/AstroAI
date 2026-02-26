import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { CreditsProvider } from "@/context/CreditsContext";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-open-sans", // optional but recommended
});

export const metadata: Metadata = {
  title: "Astro Web — AI Website Builder",
  description: "Generate professional websites in seconds with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={openSans.className}>
          <CreditsProvider>{children}</CreditsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

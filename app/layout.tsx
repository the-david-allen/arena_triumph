import type { Metadata } from "next";
import { Spectral, Spectral_SC } from "next/font/google";
import "./globals.css";

const spectral = Spectral({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spectralSC = Spectral_SC({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arena Triumph",
  description: "A responsive web application for the Arena Triumph game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spectral.className} ${spectral.variable} ${spectralSC.variable}`}>
        {children}
      </body>
    </html>
  );
}

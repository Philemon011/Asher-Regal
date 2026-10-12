import type { Metadata } from "next";
import { Poppins, Gloock } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const gloock = Gloock({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-gloock",
  display: "swap",
});

const pinkSunset = localFont({
  src: "../fonts/PinkSunset-Regular.woff2",
  weight: "400",
  style: "normal",
  variable: "--font-pinksunset",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pâtisserie",
  description: "Des gâteaux faits maison, commandés en ligne.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${gloock.variable} ${pinkSunset.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
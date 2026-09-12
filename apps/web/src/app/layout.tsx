import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Colchón — Tu caja, a futuro", template: "%s · Colchón" },
  description: "Una mirada clara a la liquidez de tu negocio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={`${manrope.variable} ${newsreader.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Al Toque Delivery | Pide tu comida favorita al instante",
  description:
    "Tu plataforma de delivery favorita en Bagua Grande, Jaén y Chachapoyas. Los mejores restaurantes locales directo a tu puerta o listos para recoger.",
  keywords: [
    "delivery",
    "Bagua",
    "Jaén",
    "Chachapoyas",
    "comida",
    "restaurantes",
    "Al Toque",
  ],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

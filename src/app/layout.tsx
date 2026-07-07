import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Tipografía de marca GV-G Consulting (UX-7b). Reemplaza a Lexend.
 * - Inter        → cuerpo / UI (voz por defecto, --font-sans).
 * - Fraunces     → títulos display de la marca (--font-display; 300-500, itálica para énfasis).
 * - JetBrains Mono → eyebrows, metadata, números tabulares y badges (--font-mono).
 * Cargadas con next/font (self-hosted, sin CDN). Ver /DESIGN.md.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GV-G Consulting — Gestión de salud",
  description: "Sistema de gestión de certificados de discapacidad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Lexend Variable — sans humanista diseñada para legibilidad de datos (self-hosted, sin CDN).
// Es la voz tipográfica del design system (UX-1). Ver /DESIGN.md.
import "@fontsource-variable/lexend";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// Geist se conserva solo como fallback de --font-geist-sans/mono (compat).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

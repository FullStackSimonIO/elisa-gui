import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elisa GUI",
  description: "A GUI for an EV charger based on EVCC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex-row min-h-screen bg-background font-sans text-foreground justify-center items-center`}
      >
        <ThemeProvider>
          
          {children}
          <Toaster richColors closeButton position="top-right" duration={4000} />
        </ThemeProvider>
      </body>
    </html>
    </SidebarProvider>
  );
}

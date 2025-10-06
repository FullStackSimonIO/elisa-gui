import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SidebarLayout from "@/components/Navigation/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { geistMono, geistSans, rubik } from "@/lib/fonts";

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
    <SidebarProvider defaultOpen={false}>
      <html lang="de" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} antialiased h-screen bg-background font-sans text-foreground`}
        >
          <ThemeProvider>
            <div className="flex h-screen w-full overflow-hidden">
              <SidebarLayout />

              <SidebarInset className="flex h-full flex-1 flex-col bg-transparent">
                <Navbar />
                <div className="flex flex-1 overflow-x-hidden overflow-y-auto">
                  {children}
                </div>
              </SidebarInset>
            </div>
            <Toaster richColors closeButton position="top-right" duration={4000} />
          </ThemeProvider>
        </body>
      </html>
    </SidebarProvider>
  );
}

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import SidebarLayout from "@/components/Navigation/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { geistMono, geistSans, rubik } from "@/lib/fonts";
import { MenuButton } from "@/components/MenuButton";

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
      <html lang="de" className="dark" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} antialiased h-screen min-h-screen bg-background font-sans text-foreground overflow-hidden `}
        >
          <ThemeProvider>
            <div className="flex h-screen min-h-screen w-full overflow-hidden">
              <SidebarLayout />

              <SidebarInset className="relative flex h-screen min-h-screen flex-1 flex-col bg-transparent overflow-hidden">
                {/* Fixed Menu Button - Top Left */}
                <MenuButton />

                {/* Ultra-wide 3840x1100 - ZERO padding for maximum space */}
                <div className="flex flex-1 h-full overflow-hidden">
                  {children}
                </div>
              </SidebarInset>
            </div>
            <Toaster 
              richColors 
              closeButton 
              position="top-right" 
              duration={4000}
              toastOptions={{
                style: {
                  fontSize: '1.5rem',
                  padding: '1.5rem 2rem',
                  minWidth: '400px',
                  minHeight: '100px',
                },
                className: 'text-4xl',
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </SidebarProvider>
  );
}

import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { QueryProvider } from "@/components/providers/query-provider";
import { ActiveThemeProvider } from "@/components/themes/active-theme";
import { ThemeProvider } from "@/components/themes/theme-provider";
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEMES,
} from "@/components/themes/theme.config";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DigitalAuto",
    template: "%s | DigitalAuto",
  },
  description: "DigitalAuto vehicle inspection and valuation platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const activeTheme = THEMES.some((t) => t.value === cookieTheme)
    ? cookieTheme!
    : DEFAULT_THEME;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme={activeTheme}
      className={`${dmSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <ActiveThemeProvider initialTheme={activeTheme}>
            <QueryProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </QueryProvider>
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

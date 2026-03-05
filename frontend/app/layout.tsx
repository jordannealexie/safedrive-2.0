import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SafeDrive",
  description: "AI-Powered Driver Monitoring and Accident Prevention System",
};

import { AuthThemeProvider } from "@/components/providers/AuthThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`}>
        <AuthThemeProvider>
          {children}
        </AuthThemeProvider>
      </body>
    </html>
  );
}

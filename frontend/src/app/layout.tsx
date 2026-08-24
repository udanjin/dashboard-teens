import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AntdProvider from "@/providers/AntdProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProvider";

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "ATeens Dashboard",
  description: "Management dashboard for ATeens",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className={`${plusJakartaSans.className} font-sans antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AntdProvider fontFamily={`var(--font-plus-jakarta), ${plusJakartaSans.style.fontFamily}, sans-serif`}>
            <AuthProvider>{children}</AuthProvider>
          </AntdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
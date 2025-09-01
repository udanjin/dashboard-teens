import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConfigProvider } from "antd";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter", // Add CSS variable
});

export const metadata: Metadata = {
  title: "ATeens Dashboard",
  description: "Welcome to ATeens Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} font-inter`}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: `var(--font-inter), ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`,
            },
            components: {
              Typography: {
                fontFamily: `var(--font-inter), ${inter.style.fontFamily}, sans-serif`,
              },
              Input: {
                fontFamily: `var(--font-inter), ${inter.style.fontFamily}, sans-serif`,
              },
              Button: {
                fontFamily: `var(--font-inter), ${inter.style.fontFamily}, sans-serif`,
              },
            },
          }}
        >
          <AuthProvider>{children}</AuthProvider>
        </ConfigProvider>
      </body>
    </html>
  );
}
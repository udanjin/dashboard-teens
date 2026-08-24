"use client";

import { useEffect, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "next-themes";

export default function AntdProvider({
  children,
  fontFamily,
}: {
  children: React.ReactNode;
  fontFamily: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  // If not mounted, return children (or default theme) to prevent hydration mismatch
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          fontFamily,
          colorPrimary: isDark ? '#FAFAFA' : '#7C3AED', 
          colorText: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111827',
          colorTextSecondary: isDark ? 'rgba(255, 255, 255, 0.45)' : '#6B7280',
          colorBgBase: isDark ? '#050505' : '#F9FAFB', 
          colorBgContainer: isDark ? '#0a0a0a' : '#FFFFFF',
          colorBgElevated: isDark ? '#0f0f0f' : '#FFFFFF',
          colorBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
          controlHeight: 44,
          controlOutlineWidth: 0,
        },
        components: {
          Table: {
            colorBgContainer: 'transparent',
            rowHoverBg: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            headerBg: isDark ? '#050505' : '#F9FAFB',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            paddingContentVertical: 16,
          },
          Button: {
            borderRadius: 9999,
            controlHeight: 44,
          },
          Input: {
            controlHeight: 44,
          },
          Modal: {
            contentBg: isDark ? '#0a0a0a' : '#FFFFFF',
            headerBg: isDark ? '#0a0a0a' : '#FFFFFF',
            borderRadiusLG: 24,
          }
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

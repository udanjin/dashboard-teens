"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="text"
      className="!w-10 !h-10 !flex !items-center !justify-center !rounded-full transition-colors bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 shadow-sm border border-black/5 dark:border-white/5"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      icon={
        isDark ? (
          <SunOutlined className="text-lg text-[rgba(255,255,255,0.7)] hover:text-white transition-colors" />
        ) : (
          <MoonOutlined className="text-lg text-gray-500 hover:text-gray-900 transition-colors" />
        )
      }
    />
  );
}

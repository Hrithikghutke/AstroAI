"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[84px] h-[28px] rounded-full bg-neutral-200 dark:bg-neutral-800" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <button
        onClick={() => setTheme("light")}
        className={`p-1 rounded-full transition-colors ${
          theme === "light"
            ? "bg-white text-black shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1 rounded-full transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-neutral-900 text-black dark:text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
        title="System Default"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1 rounded-full transition-colors ${
          theme === "dark"
            ? "bg-neutral-900 text-white shadow-sm"
            : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

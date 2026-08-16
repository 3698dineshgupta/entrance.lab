"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "entrancelab-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  /** false until the client has synced with document.documentElement's real
   *  class (set synchronously pre-hydration by the inline script in
   *  <head>) — lets consumers avoid rendering a theme-dependent icon that
   *  might not match on the very first paint. */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Inline, run via next/script(beforeInteractive) in app/layout.tsx — must be
// synchronous and side-effect-only (sets the class before first paint) so
// there is no light->dark flash on load.
export const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sync React state with whatever the no-flash script already applied.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

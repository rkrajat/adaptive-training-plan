"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";
type ThemePreference = Theme | "system";

interface ThemeContextValue {
  theme: Theme;
  themePreference: ThemePreference;
  systemTheme: Theme;
  setTheme: (theme: ThemePreference) => void;
}

const STORAGE_KEY = "adaptive-training-theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredPreference = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "system";
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage not available (private browsing, etc.)
  }
  return "system";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

// External store for theme preference
let themePreferenceListeners: Array<() => void> = [];
let currentThemePreference: ThemePreference = "system";

const subscribeToThemePreference = (listener: () => void) => {
  themePreferenceListeners = [...themePreferenceListeners, listener];
  return () => {
    themePreferenceListeners = themePreferenceListeners.filter(
      (lst) => lst !== listener
    );
  };
};

const getThemePreferenceSnapshot = () => currentThemePreference;

const getThemePreferenceServerSnapshot = () => "system" as ThemePreference;

const setThemePreferenceExternal = (newTheme: ThemePreference) => {
  currentThemePreference = newTheme;
  themePreferenceListeners.forEach((listener) => listener());
};

// External store for system theme
let systemThemeListeners: Array<() => void> = [];
let currentSystemTheme: Theme = "light";

const subscribeToSystemTheme = (listener: () => void) => {
  systemThemeListeners = [...systemThemeListeners, listener];
  return () => {
    systemThemeListeners = systemThemeListeners.filter(
      (lst) => lst !== listener
    );
  };
};

const getSystemThemeSnapshot = () => currentSystemTheme;

const getSystemThemeServerSnapshot = () => "light" as Theme;

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
}

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) => {
  // Use external stores to avoid setState in effects
  const themePreference = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreferenceSnapshot,
    getThemePreferenceServerSnapshot
  );

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  // Initialize theme preference from localStorage on mount
  useEffect(() => {
    const stored = getStoredPreference();
    currentThemePreference = stored ?? defaultTheme;
    themePreferenceListeners.forEach((listener) => listener());

    currentSystemTheme = getSystemTheme();
    systemThemeListeners.forEach((listener) => listener());
  }, [defaultTheme]);

  // Apply theme whenever preference or system theme changes
  useEffect(() => {
    const resolvedTheme =
      themePreference === "system" ? systemTheme : themePreference;
    applyTheme(resolvedTheme);
  }, [themePreference, systemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event: MediaQueryListEvent) => {
      currentSystemTheme = event.matches ? "dark" : "light";
      systemThemeListeners.forEach((listener) => listener());
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemePreferenceExternal(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
  }, []);

  const theme = useMemo(
    () => (themePreference === "system" ? systemTheme : themePreference),
    [themePreference, systemTheme]
  );

  const value = useMemo(
    () => ({
      theme,
      themePreference,
      systemTheme,
      setTheme,
    }),
    [theme, themePreference, systemTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

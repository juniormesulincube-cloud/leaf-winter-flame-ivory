import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeId = "ember" | "ocean" | "forest" | "violet" | "rose";
export type Mode = "dark" | "light";

export const THEMES: {
  id: ThemeId;
  label: string;
  mascot: string;
  alt: string;
  src: string;
  swatch: string;
}[] = [
  {
    id: "ember",
    label: "Ember orange",
    mascot: "Ember",
    alt: "Ember, a small flame mascot with a red cape",
    src: "/mascots/mascot-ember.png",
    swatch: "bg-swatch-ember",
  },
  {
    id: "ocean",
    label: "Ocean blue",
    mascot: "Drip",
    alt: "Drip, a water-drop mascot with a blue cape",
    src: "/mascots/mascot-ocean.png",
    swatch: "bg-swatch-ocean",
  },
  {
    id: "forest",
    label: "Forest green",
    mascot: "Sprout",
    alt: "Sprout, a leafy mascot with a brown cape",
    src: "/mascots/mascot-forest.png",
    swatch: "bg-swatch-forest",
  },
  {
    id: "violet",
    label: "Violet",
    mascot: "Prism",
    alt: "Prism, a crystal mascot with an indigo cape",
    src: "/mascots/mascot-violet.png",
    swatch: "bg-swatch-violet",
  },
  {
    id: "rose",
    label: "Rose pink",
    mascot: "Petal",
    alt: "Petal, a blossom mascot with a berry cape",
    src: "/mascots/mascot-rose.png",
    swatch: "bg-swatch-rose",
  },
];

const STORAGE_THEME = "fileember-theme";
const STORAGE_MODE = "fileember-mode";

function isTheme(value: string | undefined | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

function apply(theme: ThemeId, mode: Mode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.mode = mode;
  try {
    localStorage.setItem(STORAGE_THEME, theme);
    localStorage.setItem(STORAGE_MODE, mode);
  } catch {
    // Ignore storage failures; the choice still applies for this view.
  }
}

interface ThemeContextValue {
  theme: ThemeId;
  mode: Mode;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("ember");
  const [mode, setModeState] = useState<Mode>("dark");

  useEffect(() => {
    let nextTheme: ThemeId = "ember";
    let nextMode: Mode = "dark";
    try {
      const storedTheme = localStorage.getItem(STORAGE_THEME);
      const storedMode = localStorage.getItem(STORAGE_MODE);
      if (isTheme(storedTheme)) nextTheme = storedTheme;
      if (storedMode === "light" || storedMode === "dark") nextMode = storedMode;
    } catch {
      // Fall back to Ember orange in dark mode.
    }
    setThemeState(nextTheme);
    setModeState(nextMode);
    apply(nextTheme, nextMode);
    for (const item of THEMES) {
      const image = new Image();
      image.src = item.src;
    }
  }, []);

  const setTheme = (next: ThemeId) => {
    setThemeState(next);
    apply(next, mode);
  };

  const setMode = (next: Mode) => {
    setModeState(next);
    apply(theme, next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

export function themeById(id: ThemeId) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export const THEME_BOOT = `(function(){try{var t=localStorage.getItem("${STORAGE_THEME}");var m=localStorage.getItem("${STORAGE_MODE}");var ok={ember:1,ocean:1,forest:1,violet:1,rose:1};if(!ok[t])t="ember";if(m!=="light"&&m!=="dark")m="dark";var d=document.documentElement;d.dataset.theme=t;d.dataset.mode=m;}catch(e){}})();`;

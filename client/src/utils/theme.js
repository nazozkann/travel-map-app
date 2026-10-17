const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const LIGHT_MAP_STYLE = `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${MAPTILER_KEY}`;
const DARK_MAP_STYLE = `https://api.maptiler.com/maps/0196bac3-e637-7c87-b191-32cc9b5b086a/style.json?key=${MAPTILER_KEY}`;

export const THEME_EVENT = "theme-change";

function readSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

// The saved choice wins; without one, follow the OS setting.
export function isDarkTheme() {
  const saved = readSavedTheme();
  if (saved) return saved === "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function getMapStyle() {
  return isDarkTheme() ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}

function syncThemeColor(isDark) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? "#081a2d" : "#f8eee3");
}

export function applySavedTheme() {
  const isDark = isDarkTheme();
  document.body.classList.toggle("dark", isDark);
  syncThemeColor(isDark);
}

export function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  try {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch {
    // storage unavailable; the theme still applies for this visit
  }
  syncThemeColor(isDark);
  window.dispatchEvent(new Event(THEME_EVENT));
}

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const LIGHT_MAP_STYLE = `https://api.maptiler.com/maps/01964971-8ddf-7204-b609-36d18c42b896/style.json?key=${MAPTILER_KEY}`;
const DARK_MAP_STYLE = `https://api.maptiler.com/maps/0196bac3-e637-7c87-b191-32cc9b5b086a/style.json?key=${MAPTILER_KEY}`;

export const THEME_EVENT = "theme-change";

export function isDarkTheme() {
  return localStorage.getItem("theme") === "dark";
}

export function getMapStyle() {
  return isDarkTheme() ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
}

export function applySavedTheme() {
  document.body.classList.toggle("dark", isDarkTheme());
}

export function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  window.dispatchEvent(new Event(THEME_EVENT));
}

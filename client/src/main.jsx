import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "normalize.css";
import "./index.css";
import "./styles/Main.css";
import App from "./App.jsx";
import { applySavedTheme } from "./utils/theme";

// Apply the theme before the first paint so the splash screen matches it.
applySavedTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

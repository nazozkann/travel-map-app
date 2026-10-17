// A round, category-coloured map marker. Colours come from the --cat-* CSS variables.
export default function getMarkerElement(category) {
  const el = document.createElement("div");
  el.className = "map-marker";
  el.style.setProperty("--marker-color", `var(--cat-${category}, var(--cat-other))`);
  return el;
}

export default function getMarkerElement(category) {
  const el = document.createElement("div");
  el.className = "custom-marker";

  const rootStyles = getComputedStyle(document.documentElement);

  const colorMap = {
    "food-drink": rootStyles.getPropertyValue("--food-color"),
    cultural: rootStyles.getPropertyValue("--cultural-color"),
    accommodation: rootStyles.getPropertyValue("--hotels-color"),
    entertainment: rootStyles.getPropertyValue("--entertainment-color"),
    nature: rootStyles.getPropertyValue("--nature-color"),
    other: rootStyles.getPropertyValue("--others-color"),
  };

  el.style.backgroundColor = colorMap[category] || colorMap["other"];

  return el;
}

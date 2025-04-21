import "../styles/Main.css";

export default function getMarkerElement(category) {
  const el = document.createElement("div");
  el.className = "custom-marker";

  switch (category) {
    case "food-drink":
      el.style.backgroundColor = "#ff8c00";
      break;
    case "cultural":
      el.style.backgroundColor = "#8e44ad";
      break;
    case "accommodation":
      el.style.backgroundColor = "#2980b9";
      break;
    case "entertainment":
      el.style.backgroundColor = "#e74c3c";
      break;
    case "nature":
      el.style.backgroundColor = "#27ae60";
      break;
    case "other":
    default:
      el.style.backgroundColor = "#666";
  }

  return el;
}

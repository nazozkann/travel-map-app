import "../styles/Main.css";

export default function getMarkerElement(category) {
  const el = document.createElement("div");
  el.className = "custom-marker";

  switch (category) {
    case "food-drink":
      el.style.backgroundColor = "#f59d6b";
      break;
    case "cultural":
      el.style.backgroundColor = "#7db8c5";
      break;
    case "accommodation":
      el.style.backgroundColor = "#a6c9cd";
      break;
    case "entertainment":
      el.style.backgroundColor = "#f26f5b";
      break;
    case "nature":
      el.style.backgroundColor = "#92b883";
      break;
    case "other":
    default:
      el.style.backgroundColor = "#d2b5c2";
  }

  return el;
}

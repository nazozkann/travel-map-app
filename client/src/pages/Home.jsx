import { useEffect } from "react";
import MapView from "../components/MapView";
import "../styles/Main.css";

export default function Home({ location }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.overflowX = "hidden"; 
    document.body.style.overflowY = "hidden"; 
    document.body.style.width = "100%";
    document.body.style.position = "relative";

    return () => {
      document.body.style.overflow = "auto";
      document.body.style.overflowX = "auto";
      document.body.style.overflowY = "auto";
      document.body.style.width = "auto";
      document.body.style.position = "static";
    };
  }, []);
  return (
    <div style={{ backgroundColor: "#f8eee3" }}>
      <div style={{ opacity: "0.9" }} className="home-container">
        <MapView selectedLocation={location} />
      </div>
    </div>
  );
}

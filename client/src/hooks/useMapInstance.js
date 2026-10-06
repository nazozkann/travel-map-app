import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getMapStyle, THEME_EVENT } from "../utils/theme";

// Creates a MapLibre map in containerRef, follows the light/dark theme and cleans up on unmount.
export default function useMapInstance(containerRef, getOptions) {
  const [map, setMap] = useState(null);

  useEffect(() => {
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyle(),
      ...getOptions(),
    });
    setMap(instance);

    const onThemeChange = () => instance.setStyle(getMapStyle());
    window.addEventListener(THEME_EVENT, onThemeChange);

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange);
      instance.remove();
      setMap(null);
    };
    // Options are only read when the map is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  return map;
}

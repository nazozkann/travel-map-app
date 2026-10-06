import { useEffect, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre v6 looks for its worker next to its own file, which doesn't survive
// bundling. Let Vite bundle the worker (with its shared chunk) and point to it.
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { getMapStyle, THEME_EVENT } from "../utils/theme";

maplibregl.setWorkerUrl(workerUrl);

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

import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Startup from "./pages/Startup";
import { API_URL } from "./utils/api";

const MIN_SPLASH_MS = 1000;
const RETRY_MS = 3000;

export default function Root({ setLocation, setAppReady, appReady }) {
  // Wake the backend (free hosting tiers sleep) before showing the app.
  // Retries in place so deep links like /share/:id are preserved.
  useEffect(() => {
    if (appReady) return;
    let cancelled = false;
    let retryTimer;
    const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_SPLASH_MS));

    const ping = async () => {
      try {
        const res = await fetch(API_URL + "/api/ping");
        if (!res.ok) throw new Error(`Ping failed with ${res.status}`);
        await minDelay;
        if (!cancelled) setAppReady(true);
      } catch (err) {
        console.warn("Backend not reachable yet, retrying...", err);
        if (!cancelled) retryTimer = setTimeout(ping, RETRY_MS);
      }
    };

    ping();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, [appReady, setAppReady]);

  if (!appReady) {
    return <Startup />;
  }

  return (
    <>
      <Navbar setLocation={setLocation} />
      <Outlet />
    </>
  );
}

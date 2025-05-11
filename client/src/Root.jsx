import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Startup from "./pages/Startup";

export default function Root({ setLocation, setAppReady, appReady }) {
  const navigate = useNavigate();

  useEffect(() => {
    const startupFlow = async () => {
      const delay = new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        await fetch(import.meta.env.VITE_API_URL + "/api/ping");
        const pinsRes = await fetch(import.meta.env.VITE_API_URL + "/api/pins");
        await pinsRes.json();
        await delay;
        setAppReady(true);
      } catch (err) {
        console.error("Backend ping başarısız", err);
        navigate("/startup");
      }
    };

    startupFlow();
  }, [navigate, setAppReady]);

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

import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function Root({ setLocation }) {
  const navigate = useNavigate();

  useEffect(() => {
    const pingBackend = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/ping");
        await fetch(import.meta.env.VITE_API_URL + "/api/pins");
        if (!res.ok) throw new Error();
      } catch {
        navigate("/startup");
      }
    };
    pingBackend();

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
  }, [navigate]);

  return (
    <>
      <Navbar setLocation={setLocation} />
      <Outlet />
    </>
  );
}

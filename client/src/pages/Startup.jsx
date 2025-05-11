import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Startup() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_API_URL + "/api/ping", {
          method: "GET",
        });
        if (res.ok) {
          setLoading(false);
          navigate("/");
        }
      } catch (err) {
        console.log("Backend uyanmadı, tekrar denenecek...");
        setTimeout(wakeUpBackend, 3000);
      }
    };

    wakeUpBackend();
  }, [navigate]);

  return (
    <div className="start-up-container">
      <div className="startup-screen">
        <h2>Explora</h2>
        <p className="loader"></p>
      </div>
    </div>
  );
}

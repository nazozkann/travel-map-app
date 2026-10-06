import { useEffect, useState } from "react";
import { AUTH_EVENT, getUsername } from "../utils/auth";

// Current logged-in username (or null); updates on login/logout in any tab.
export default function useAuth() {
  const [username, setUsername] = useState(getUsername);

  useEffect(() => {
    const sync = () => setUsername(getUsername());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return username;
}

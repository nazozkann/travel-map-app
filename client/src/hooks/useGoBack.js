import { useNavigate } from "react-router-dom";

// Goes back inside the app, or to the map when the page was opened directly.
export default function useGoBack() {
  const navigate = useNavigate();
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));
}

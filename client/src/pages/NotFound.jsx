import { Link } from "react-router-dom";

export default function NotFound({ message = "Page not found" }) {
  return (
    <div className="page-status">
      <h2>{message}</h2>
      <Link to="/">Back to the map</Link>
    </div>
  );
}

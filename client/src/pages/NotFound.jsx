import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { EmptyState } from "../components/Cards";

export default function NotFound({ message = "Page not found" }) {
  return (
    <main className="page">
      <EmptyState icon={MapPinOff} title={message}>
        <Link to="/" className="btn btn-primary">
          Back to the map
        </Link>
      </EmptyState>
    </main>
  );
}

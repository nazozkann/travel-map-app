import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Main.css";

function wilsonScore(likes, dislikes) {
  const n = likes + dislikes;
  if (n === 0) return 0;
  const z = 1.96; // 95% güven
  const p = likes / n;
  return (
    (p +
      (z * z) / (2 * n) -
      z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  );
}

export default function BestPlaces() {
  const [pins, setPins] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/pins")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => {
          const scoreA = wilsonScore(a.likes, a.dislikes);
          const scoreB = wilsonScore(b.likes, b.dislikes);
          return scoreB - scoreA;
        });
        setPins(sorted);
      });
  }, []);
  return (
    <div className="places-container">
      <h2>Most Liked Places</h2>
      <div className="places-list">
        {pins.map((pin) => (
          <Link to={`/places/${pin._id}`} key={pin._id} className="places-card">
            <h3>{pin.title}</h3>
            <p>
              <strong>Category:</strong> {pin.category}
            </p>
            <p>{pin.description.slice(0, 80)}...</p>
            <p>
              👍 {pin.likes} &nbsp; 👎 {pin.dislikes}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

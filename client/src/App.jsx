import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import BestPlaces from "./pages/BestPlaces";
import Navbar from "./components/Navbar";
import PinDetail from "./pages/PinDetail";
import ListDetail from "./pages/ListDetail";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/places" element={<BestPlaces />} />
        <Route path="/places/:id" element={<PinDetail />} />
        <Route path="/lists/:listId" element={<ListDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

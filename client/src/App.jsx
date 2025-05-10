import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import BestPlaces from "./pages/BestPlaces";
import Navbar from "./components/Navbar";
import PinDetail from "./pages/PinDetail";
import ListDetail from "./pages/ListDetail";
import { useState } from "react";

function App() {
  const [location, setLocation] = useState(null);
  return (
    <Router>
      <Navbar setLocation={setLocation} />
      <Routes>
        <Route path="/" element={<Home location={location} />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/places" element={<BestPlaces />} />
        <Route path="/places/:id" element={<PinDetail />} />
        <Route path="/lists/:listId" element={<ListDetail />} />
        <Route path="/share/:listId" element={<ListDetail />} />
      </Routes>
    </Router>
  );
}

export default App;

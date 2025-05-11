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
import Startup from "./pages/Startup";
import Root from "./Root";

function App() {
  const [location, setLocation] = useState(null);
  const [appReady, setAppReady] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/startup" element={<Startup />} />
        <Route
          element={
            <Root
              setLocation={setLocation}
              setAppReady={setAppReady}
              appReady={appReady}
            />
          }
        >
          <Route path="/" element={<Home location={location} />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/places" element={<BestPlaces />} />
          <Route path="/places/:id" element={<PinDetail />} />
          <Route path="/lists/:listId" element={<ListDetail />} />
          <Route path="/share/:listId" element={<ListDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

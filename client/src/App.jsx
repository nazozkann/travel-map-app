import { lazy, Suspense, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Root from "./Root";

const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Profile = lazy(() => import("./pages/Profile"));
const BestPlaces = lazy(() => import("./pages/BestPlaces"));
const PinDetail = lazy(() => import("./pages/PinDetail"));
const ListDetail = lazy(() => import("./pages/ListDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  const [location, setLocation] = useState(null);
  const [appReady, setAppReady] = useState(false);

  return (
    <Router>
      <Suspense fallback={<p className="page-status">Loading...</p>}>
        <Routes>
          <Route path="/startup" element={<Navigate to="/" replace />} />
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
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;

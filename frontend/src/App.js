import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Chat from "./components/Chat";
import History from "./components/History";

function App() {
  const token = localStorage.getItem("token");

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route
            path="/"
            element={token ? <Navigate to="/dashboard" /> : <Login />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/chat"
            element={token ? <Chat /> : <Navigate to="/login" />}
          />
          <Route
            path="/history"
            element={token ? <History /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

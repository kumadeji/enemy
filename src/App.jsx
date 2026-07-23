import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import InfoBanner from "./components/InfoBanner";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Roster from "./pages/Roster";
import Media from "./pages/Media";
import Charter from "./pages/Charter";
import History from "./pages/History";
import Contact from "./pages/Contact";
import Queue from "./pages/Queue";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <InfoBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute require="auth"><Profile /></ProtectedRoute>} />
          <Route path="/profile/:uid" element={<ProtectedRoute require="roster"><Profile /></ProtectedRoute>} />
          <Route path="/roster" element={<ProtectedRoute require="roster"><Roster /></ProtectedRoute>} />
          <Route path="/media" element={<Media />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/queue" element={<ProtectedRoute require="auth"><Queue /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute require="admin"><Admin /></ProtectedRoute>} />
        </Routes>
        <footer className="site-footer">
          <div className="container">© Мультиигровое сообщество ENEMY</div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}

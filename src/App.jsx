import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import InfoBanner from "./components/InfoBanner";
import AlphaBadge from "./components/AlphaBadge";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import MyApplication from "./pages/MyApplication";
import Profile from "./pages/Profile";
import Roster from "./pages/Roster";
import Media from "./pages/Media";
import Charter from "./pages/Charter";
import History from "./pages/History";
import Contact from "./pages/Contact";
import Queue from "./pages/Queue";
import Admin from "./pages/Admin";
import AdminPlayerDetail from "./pages/AdminPlayerDetail";
import AdminChangeLog from "./pages/AdminChangeLog";
import BackgroundMap from "./components/BackgroundMap";
import BackgroundMusic from "./components/BackgroundMusic";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BackgroundMap />
		<BackgroundMusic />
		<AlphaBadge />
        <Navbar />
        <InfoBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-application" element={<ProtectedRoute require="auth"><MyApplication /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute require="auth"><Profile /></ProtectedRoute>} />
          <Route path="/profile/:uid" element={<ProtectedRoute require="roster"><Profile /></ProtectedRoute>} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/media" element={<Media />} />
          <Route path="/charter" element={<Charter />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/admin" element={<ProtectedRoute require="admin"><Admin /></ProtectedRoute>} />
          <Route path="/admin/player/:uid" element={<ProtectedRoute require="admin"><AdminPlayerDetail /></ProtectedRoute>} />
		  <Route path="/admin/changelog" element={<ProtectedRoute require="admin"><AdminChangeLog /></ProtectedRoute>} />
        </Routes>
        <footer className="site-footer">
          <div className="container">© Игровое сообщество ENEMY. 2026. Разработчик сайта - [En-Y]Boba, aka kumadeji.</div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}

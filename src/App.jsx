import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import InfoBanner from "./components/InfoBanner";
import AlphaBadge from "./components/AlphaBadge";
import BackgroundMap from "./components/BackgroundMap";
import BackgroundMusic from "./components/BackgroundMusic";
import ProtectedRoute from "./components/ProtectedRoute";
import PageTitle from "./components/PageTitle";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Login from "./pages/Login";
import MyApplication from "./pages/MyApplication";
import AdminEditPlayer from "./pages/AdminEditPlayer";
import Profile from "./pages/Profile";
import Roster from "./pages/Roster";
import Media from "./pages/Media";
import TempTable from "./pages/TempTable";
import Charter from "./pages/Charter";
import History from "./pages/History";
import Contact from "./pages/Contact";
import Queue from "./pages/Queue";
import ArmaHQ from "./pages/ArmaHQ";
import ArmaStats from "./pages/ArmaStats";
import Admin from "./pages/Admin";
import AdminPlayerDetail from "./pages/AdminPlayerDetail";
import AdminChangeLog from "./pages/AdminChangeLog";
import AdminMigrate from "./pages/AdminMigrate";
import ForgotPassword from "./pages/ForgotPassword";
import AccountSettings from "./pages/AccountSettings";
import EmailVerificationBanner from "./components/EmailVerificationBanner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTitle />
		<BackgroundMap />
		<BackgroundMusic />
		<AlphaBadge />
        <Navbar />
        <InfoBanner />
		<EmailVerificationBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<ProtectedRoute require="auth"><AccountSettings /></ProtectedRoute>} />
		  <Route path="/apply" element={<Apply />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-application" element={<ProtectedRoute require="auth"><MyApplication /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute require="auth"><Profile /></ProtectedRoute>} />
          <Route path="/profile/:uid" element={<ProtectedRoute require="roster"><Profile /></ProtectedRoute>} />
		  <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/media" element={<Media />} />
          <Route path="/temptable" element={<TempTable />} />
		  <Route path="/charter" element={<Charter />} />
          <Route path="/history" element={<History />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/hq/arma" element={<ProtectedRoute require="arma-roster"><ArmaHQ /></ProtectedRoute>} />
		  <Route path="/hq/arma/stats" element={<ProtectedRoute require="arma-roster"><ArmaStats /></ProtectedRoute>} />
          <Route path="/queue" element={<ProtectedRoute require="arma-roster"><Queue /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute require="admin"><Admin /></ProtectedRoute>} />
          <Route path="/admin/player/:uid" element={<ProtectedRoute require="admin"><AdminPlayerDetail /></ProtectedRoute>} />
          <Route path="/admin/player/:uid/edit" element={<ProtectedRoute require="admin"><AdminEditPlayer /></ProtectedRoute>} />
          <Route path="/admin/changelog" element={<ProtectedRoute require="admin"><AdminChangeLog /></ProtectedRoute>} />
          <Route path="/admin/migrate" element={<ProtectedRoute require="admin"><AdminMigrate /></ProtectedRoute>} />
        </Routes>
        <footer className="site-footer">
          <div className="container">© Мультиигровое сообщество ENEMY. 2026. Разработка сайта: [En-Y]Boba, aka kumadeji.</div>
        </footer>
      </AuthProvider>
    </BrowserRouter>
  );
}

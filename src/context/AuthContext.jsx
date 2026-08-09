import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LoadingScreen from "../components/LoadingScreen";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProfileData(user) {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    try {
      const profileSnap = await getDoc(doc(db, "profiles", user.uid));
      const profileData = profileSnap.exists() ? { id: user.uid, ...profileSnap.data() } : null;
      setProfile(profileData);

      // ОК 1: Администраторы определяются автоматически по должности
      // "командир батальона" или "зам. командира батальона" в любой игре
      let isAutoAdmin = false;
      if (profileData?.gameRoles) {
        for (const game of Object.keys(profileData.gameRoles)) {
          const role = profileData.gameRoles[game];
          if (role?.position === "Командир батальона" || role?.position === "Зам. командира батальона") {
            isAutoAdmin = true;
            break;
          }
        }
      }
      
      // Также проверяем явное наличие в коллекции admins (для обратной совместимости)
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      setIsAdmin(isAutoAdmin || adminSnap.exists());
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      setProfile(null);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await loadProfileData(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    profile,
    isAdmin,
    loading,
    refreshProfile: () => loadProfileData(currentUser),
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
      <div className="app-fade-in">{children}</div>
    </AuthContext.Provider>
  );
}

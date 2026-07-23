import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

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
      setProfile(profileSnap.exists() ? { id: user.uid, ...profileSnap.data() } : null);

      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      setIsAdmin(adminSnap.exists());
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
      setLoading(false); // теперь ВСЕГДА выполнится, даже если чтение упало с ошибкой
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

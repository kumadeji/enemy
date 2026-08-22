import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import LoadingScreen from "../components/LoadingScreen";
import { sendYandexGoal } from "../utils/yandexMetrica";

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

      // Администраторы определяются автоматически по должности
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
      console.error("Ошибка загрузки личного дела:", err);
      setProfile(null);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Запоминаем состояние ДО reload — нужно, чтобы отследить именно
      // момент перехода "не подтверждён → подтверждён", а не текущее
      // состояние (иначе цель засчитывалась бы при каждом заходе уже
      // давно верифицированного пользователя).
      const wasVerifiedBefore = user?.emailVerified;

      // Принудительно обновляем данные пользователя из Firebase Auth —
      // без этого поле user.emailVerified может оставаться устаревшим
      // (false), даже если пользователь уже подтвердил почту по ссылке
      // из письма в другой вкладке/сессии.
      if (user) {
        await user.reload().catch(() => {});
      }

      // Реальное событие подтверждения email — засчитываем цель только
      // при факте перехода false → true, а не при каждом рендере.
      if (user && !wasVerifiedBefore && user.emailVerified) {
        sendYandexGoal("email_verified_success");
      }

      setCurrentUser(user);
      await loadProfileData(user);

      // Если email в Firebase Auth изменился (например, после подтверждения
      // смены почты по ссылке из письма), синхронизируем копию в
      // Firestore-профиле — там email хранится отдельным полем для
      // удобного отображения в админ-панели
      if (user) {
        try {
          const profileRef = doc(db, "profiles", user.uid);
          const snap = await getDoc(profileRef);
          if (snap.exists() && snap.data().email !== user.email) {
            await updateDoc(profileRef, { email: user.email });
          }
        } catch {
          // не критично — просто пропускаем синхронизацию в этот раз
        }
      }

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

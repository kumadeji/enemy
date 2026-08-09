import { useAuth } from "../context/AuthContext";
import EditApplicationPage from "../components/EditApplicationPage";

export default function MyApplication() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  return <EditApplicationPage targetUid={currentUser.uid} isAdminEditing={false} />;
}

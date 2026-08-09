import { useParams } from "react-router-dom";
import EditApplicationPage from "../components/EditApplicationPage";

export default function AdminEditPlayer() {
  const { uid } = useParams();
  return <EditApplicationPage targetUid={uid} isAdminEditing={true} />;
}

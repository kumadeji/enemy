import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function createNotification(uid, message) {
  if (!uid || !message) return;
  await addDoc(collection(db, "notifications"), {
    uid, message, read: false, createdAt: serverTimestamp()
  });
}

export async function createNotifications(uid, messages) {
  for (const message of messages) {
    await createNotification(uid, message);
  }
}

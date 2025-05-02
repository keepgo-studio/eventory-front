import { doc } from "@/lib/firebase/web-api";
import { getDoc } from "firebase/firestore";
import type { FB_Uid } from "@eventory/shared-types/firebase";

export async function checkJoinExist(eventId: number, uid?: FB_Uid) {
  if (!uid) return false;

  const docRef = doc("join-events/:eventId/joins/:uid", String(eventId), uid);

  return (await getDoc(docRef)).exists();
}
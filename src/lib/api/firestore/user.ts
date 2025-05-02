import { doc, getDoc } from "@/lib/firebase/web-api";
import type { FS_User } from "@eventory/shared-types/firestore";
import type { FB_Uid } from "@eventory/shared-types/firebase";

export async function getUser(uid: FB_Uid) {
  const ref = doc<FS_User>("users/:uid", uid);
  const data = await getDoc(ref);

  return data;
}
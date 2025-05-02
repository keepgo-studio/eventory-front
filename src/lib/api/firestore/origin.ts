import { doc, getDoc } from "@/lib/firebase/web-api";
import type { FB_Uid } from "@eventory/shared-types/firebase";
import type { FS_OriginYoutube } from "@eventory/shared-types/firestore";

export async function getOriginYoutube(uid: FB_Uid) {
  const ref =  doc<FS_OriginYoutube>("origin-youtube/:uid", uid);
  const data = await getDoc(ref);

  return data;
}
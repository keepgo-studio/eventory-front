import type { FB_Uid } from "@eventory/shared-types/firebase";

export type SupportStoragePath = 
  | "images";

export function setPath(path: SupportStoragePath, uid: FB_Uid, file: File) {
  return `${uid}/${path}/${file.name}`;
}
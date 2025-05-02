"use client";

import { doc } from "@/lib/firebase/web-api";
import { serverTimestamp, setDoc } from "firebase/firestore";
import type { SignupForm } from "./login-machine";
import type { User } from "firebase/auth";
import type { FS_User } from "@eventory/shared-types/firestore";
import type { FB_Uid } from "@eventory/shared-types/firebase";
import type { Email } from "@eventory/shared-types";

export async function submitUser(auth: User, formData: SignupForm) {
  const ref = doc("users/:uid", auth.uid);
  const data: FS_User = {
    uid: auth.uid as FB_Uid,
    photoURL: auth.photoURL,
    displayName: auth.displayName,
    email: auth.email as Email,
    role: formData.role,
    canViewList: formData.canViewList,
    canAdminList: formData.canAdminList,
    createdAt: serverTimestamp()
  };

  await setDoc(ref, data);
  return data;
}
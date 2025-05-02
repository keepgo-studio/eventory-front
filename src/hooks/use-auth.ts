"use client";

import { useRouter } from "next/navigation";
import {
  selectUser,
  selectYoutubeInfo,
  setUser,
} from "@/lib/features/user/user-store";
import { useAppDispatch, useAppSelector } from "@/lib/features/hooks";
import { REDIRECT_TO_KEY } from "@/lib/vars";
import { devLog } from "@/lib/web-utils";
import { signOut } from "@/lib/firebase/web-api";
import { useNav } from "./use-nav";

async function deleteSession() {
  return await fetch("/api/session", {
    method: "DELETE",
  });
}

export function useAuth() {
  const router = useRouter();

  const youtubeInfo = useAppSelector(selectYoutubeInfo);
  const user = useAppSelector(selectUser);

  const dispatch = useAppDispatch();
  const { navigate } = useNav();

  function login(pathname?: string) {
    router.push(
      pathname
        ? navigate("/login?redirectTo", { [REDIRECT_TO_KEY]: pathname })
        : navigate("/login")
    );
  }

  async function logout() {
    try {
      await deleteSession();
      await signOut();
      dispatch(setUser(null));

      router.refresh();
    } catch (err) {
      devLog("ERROR", "Auth", "", err);
    }
  }

  return { user, youtubeInfo, login, logout };
}

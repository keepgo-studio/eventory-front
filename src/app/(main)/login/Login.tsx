"use client";

import { REDIRECT_TO_KEY } from "@/lib/vars";
import { useActorRef, useSelector } from "@xstate/react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import type { ActorOptions, ActorRefFrom, AnyActorLogic } from "xstate";
import Signup from "./Signup";
import { Button } from "@/components/ui/button";
import { loginMachine } from "./login-machine";
import type { FS_OriginYoutube, FS_User } from "@eventory/shared-types/firestore";
import { useAppDispatch } from "@/lib/features/hooks";
import { setUser, setYoutubeInfo } from "@/lib/features/user/user-store";
import type { Timestamp } from "firebase/firestore";

interface Props {
  actorOptions?: ActorOptions<AnyActorLogic> | undefined;
}

function Idle({ actorRef }: { actorRef: ActorRefFrom<typeof loginMachine> }) {
  return (
    <Button onClick={() => actorRef.send({ type: "TRY_AUTH" })}>
      Login with Google
    </Button>
  );
}

function Loading({ message }: { message: string }) {
  return <div>{message}</div>;
}

function Fail({ actorRef }: { actorRef: ActorRefFrom<typeof loginMachine> }) {
  const snapshot = actorRef.getSnapshot();

  return (
    <div>
      Fail, try again
      <div>{snapshot.context.error}</div>
      <Button onClick={() => actorRef.send({ type: "TRY_AUTH" })}>
        Login with Google
      </Button>
    </div>
  );
}

export default function Login({ actorOptions }: Props) {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get(REDIRECT_TO_KEY) || "/";
  const router = useRouter();
  const dispatch = useAppDispatch();

  const actorRef = useActorRef(
    loginMachine.provide({
      actions: {
        dispatchYoutubeInfo: (_, params: { data: FS_OriginYoutube | undefined }) => {
          const { data } = params;
          if (data) dispatch(setYoutubeInfo(data));
        },
        redirectToPreviousPath: () => {
          router.replace(redirectTo);
        },
        dispatchUser: (_, params: { data: FS_User | undefined }) => {
          const { data } = params;

          if (!data) return;

          dispatch(setUser({
            ...data,
            createdAt: (data.createdAt as Timestamp).nanoseconds,
          }));
        },
      },
    }),
    actorOptions
  );

  const screenToRender = useSelector(actorRef, (state) => {
    if (state.matches("idle")) {
      return "idle" as const;
    }
    if (state.matches("authenticating")) {
      return "auth" as const;
    }
    if (state.matches("checkingUser")) {
      return "check user" as const;
    }
    if (state.matches("needsSignup")) {
      return "signup" as const;
    }
    if (state.matches("authenticated")) {
      return "end" as const;
    }
    if (state.matches("creatingSession")) {
      return "session" as const;
    }
    if (state.matches("failure")) {
      return "fail" as const;
    }
    if (state.matches("updateYoutue")) {
      return "updating youtube" as const;
    }
    if (state.matches("warning")) {
      return "cannot update youtube" as const;
    }

    throw new Error(
      `Reached an unreachable state: ${JSON.stringify(state.value)}`
    );
  });

  return (
    <div>
      {screenToRender === "idle" ? (
        <Idle actorRef={actorRef} />
      ) : screenToRender === "auth" ? (
        <Loading message="google auth..." />
      ) : screenToRender === "check user" ? (
        <Loading message="checking user is exist..." />
      ) : screenToRender === "signup" ? (
        <Signup actorRef={actorRef} />
      ) : screenToRender === "fail" ? (
        <Fail actorRef={actorRef} />
      ) : screenToRender === "session" ? (
        <Loading message="creating session..." />
      ) : screenToRender === "updating youtube" ? (
        <Loading message="updating youtube channel..." />
      ) : (
        <div>rest: {screenToRender}</div>
      )}
    </div>
  );
}

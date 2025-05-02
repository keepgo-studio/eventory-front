"use client";

import { assign, fromPromise, setup } from "xstate";
import { submitUser } from "./api";
import { signInWithGoogle } from "@/lib/firebase/web-api";
import type { FS_OriginYoutube, FS_User } from "@eventory/shared-types/firestore";
import type { FB_Uid } from "@eventory/shared-types/firebase";
import type { User } from "firebase/auth";
import { getUser } from "@/lib/api/firestore/user";
import { callFunctionYoutube } from "@/lib/api/functions/youtube";

export type SignupForm = Pick<FS_User, "role" | "canAdminList" | "canViewList">;

interface Context {
  authUser: User | undefined;
  error: string | undefined;
  youtube: FS_OriginYoutube | undefined;
}

type Events =
  | { type: "TRY_AUTH" }
  | { type: "SIGNUP"; user: SignupForm }
  ;

const authenticateUserActor = fromPromise(async () => {
  const result = await signInWithGoogle();
  return result?.user;
});

const checkUserInCollectionActor = fromPromise<FS_User | undefined, { uid: FB_Uid | undefined }>(async ({ input }) => {
  const { uid } = input;

  if (uid === undefined) {
    throw new Error("Cannot find uid");
  }
  
  const result = await getUser(uid);

  return result ?? undefined;
});

const registerUserActor = fromPromise<FS_User | undefined, { authUser: User; user: SignupForm }>(async ({ input }) => {
  const { user, authUser } = input;

  return await submitUser(authUser, user);
});

const createSessionActor = fromPromise<void, { authUser: User | undefined }>(async ({ input }) => {
    if (input.authUser === undefined) {
      throw new Error("Cannot find auth user");
    }

    const idToken = await input.authUser.getIdToken();

    await fetch("/api/session", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }
);

const getYoutubeChannelActor = fromPromise<FS_OriginYoutube | undefined, { uid: FB_Uid | undefined }>(async ({ input }) => {
  const { uid } = input;

  if (uid === undefined) {
    throw new Error("Cannot find uid");
  }

  const result = await callFunctionYoutube("getOriginYoutubeViaAPI", { uid });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
});

const updateYoutubeActor = fromPromise<FS_OriginYoutube, { uid: FB_Uid | undefined; youtube: FS_OriginYoutube | undefined }>(async ({ input }) => {
  const { uid, youtube } = input;

  if (uid === undefined) {
    throw new Error("Cannot find uid");
  }

  const result = await callFunctionYoutube("updateOriginYoutubeViaPost", {
    uid,
    docData: youtube
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
});

export const loginMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
  },
  actions: {
    dispatchYoutubeInfo: (_, __: { data: FS_OriginYoutube | undefined }) => {},
    redirectToPreviousPath: () => {},
    // 로그인을 안 한 상태로, 로그인을 하거나 회원가입하고 redux state 업데이트를 위한 action 함수
    dispatchUser: (_, __: { data: FS_User | undefined }) => {},
    assignAuthUser: assign({
      authUser: (_, params: { data: User | undefined }) => params.data,
    }),
    assignError: assign({
      error: (_, params: { error: unknown }) => {
        const { error } = params;
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return 'Unknown error';
      },
    }),
    assignYoutube: assign({
      youtube: (_, params: { data: FS_OriginYoutube | undefined }) =>
        params.data,
    }),
  },
  actors: {
    authenticateUserActor,
    checkUserInCollectionActor,
    registerUserActor,
    getYoutubeChannelActor,
    updateYoutubeActor,
    createSessionActor,
  },
  guards: {
    isRegistered: (_, params: { exist: boolean }) => {
      return params.exist;
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QBsD2UCWA7AdBiyYAxACoBKAmgPoCCAqiQBIDaADALqKgAOqsGAFwyosXEAA9EAWgDMAVgAsOBaxkAOVgoCcrRQEYdAdgA0IAJ6JDAJiVyDWgGxq7VvQ4d6Avp9NpMuAEMAVwEACzAsIQBjAKEsKCIIETA8LAA3VABrFOCwiOjYsDpYMAAnNk4kEF5+IRExSQQDNRxWB1Y9GRk9BQ8VBVMLBENVHCstLrkbK1ZDHoVvX3RsHFzwyIwYuISy0tRSnG5kWIAzfYBbVZD1goEikvKOMRrBYVEqxrc5HDtDBwVxk45KwrE5BogFHIHDgtMC9HI5BpFHJ5A5FiA-CsouEoplsFBimVEslUhlsjhsWBcYTSgBJLAAYVQyEIUTqWAqzz4r3qH0QzmhCh6Wj0rDUKgmCjU4IQDkMhh+3Xh2isais6q06MxuEpuPxNOJWBS2DJKV1mRp9KZLKp7OYekqPG57Ia-MUrQMCgU6n+qrsMsMaj0ym6ckMWkD-y0Ea1yx1OLx8QNu32h2OAjOpUu5stjOZrLtTyqLxdfIQkKUujVam6WhsajmMoR0Icrgmcwc3UDmp8GLjOBOAQwyCCpWI5Go9CYnOLzreroQUisMi0Ibabl0bRrMgG5kQXRkOGcdlYEzUExmVlj-hwRsgsAAyhgoFggtwcCUC2RmcQH7SAOIAHJ0AACjOTq1POZaigiR4RjWejCio8oyqKAJjB4KLivC7jeteKx3hAj7Pq+74wAIFCoCEQQAEZgAyoQBFgRrIIaxrpFkKTkZR1F0QxTEseB1RzryoCNIYcirqeDiSaqXzqjKdZWMoCEyCCajuMuhj4bghHES+b44NxVECLR9GMcxYCsSmBxHKcFxGWAFEmWZ-GWcgQkllBYmWIhOAruuvSIo44yoXohhKFYIx6FYUxqgocxqDpt5gPeT4Ge+-Avvq3BsaSnE4GOmCwHcpQ0p5InvD5TQyLFR6IuGvTCh0Mrnt8XraM4nTekK2m9tqKVpSRhlZVgOVEDZab2VmhVgMVpXlUWEE8lVEiIIhoo4OGHSsB0sLWGqMoJdCqjLnoajblKgbJVEY6xPiD5wPwIh5SaBW3WAhSPbAz0cktwmQaJa1NEKq5aDW57nVFQYyCYe6yp0yieqK6kgnYN13ds32-RNpR7LZ6aZtmmNgNjbwVYDq2fK4CpwrD7hQsFR0dBhfRemGNaM8lb4QIUPGmcQSRGvl5I83zLl0RTK0LjMfwwjo4WOIY8haF6MoeIeoOQqocozLM3PcLzdz80ExCTXZGYOWLxsS2AUultV4WzGMqiqDumhOBd6s6DgMVO64tU7tYyUAO4BKUY3xEQ4glYUqwnKVAAUeusAAlEQA1hxH+L295wPnXMPwqGKCWaOGMgOAGDY-G4kJK-IwIyN4vZYKgEBwGI2pcpTC5SNowbqBpCUjGKXQNjKNjQg3bRdBuiH6-1-b4IQ3fS2Wffev5F3-PKu3buP8PWLYeseD0KLaGii83ms+SbPd8Srw7wNLn5tZQnM4waI4MgBize2qxdWqiF3A3QTPqB4j886NG9IeVUOgPANklBJOGQwHAihrtGaMHRxRcyvisQcw5RxgEgUDRoUxvggmiuDGw9M5AylRD8IMytegzFbJoZKN8NhbEgCQqm61owKnaMFL0SoIq7lQdGLaaDYQMw6h0ZKel0qkV4QuWqq4DBuGjIoBK8If7wxrEoahEwg6Qk9Ao1KRElEjSsrab8K9Zw9zLJKZQiIbAANMYoVCmhlKgl0dhKE-w5DmKGhlRyzleLmQElZFRZZYYKg0dI7RcwURePOlInoqpYpYMUMEyxw1MokRyjEx24VviuHFCMDQp5VYoPWtg9Jp8K6IJrLk-SpEKQCVQAIKx3BinA1hEoeU1hT7qgqdKeGiFYTKEcNWbQ2h5BXjwTqTGD0np5y8qQ9a4xWBSIjO0f4F0L6-2DP-KUNZXBuEvksG81swAm2IQ4tejsnDKTrLoAEX9aqNnhgiHZGkdZdB0BzBYSycBZ0jlAPpnwIotDrOFFcK5ZbfKGIGWmtdJJymnk3ZuQA */
  context: {
    authUser: undefined,
    error: undefined,
    youtube: undefined,
  },
  id: "login",
  initial: "idle",
  states: {
    idle: {
      on: {
        TRY_AUTH: {
          target: "authenticating",
        },
      },
    },

    authenticating: {
      invoke: {
        id: "authenticateUser",
        onDone: {
          target: "checkingUser",
          actions: {
            type: "assignAuthUser",
            params: ({ event }) => ({
              data: event.output,
            }),
          },
        },
        onError: {
          target: "failure",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              error: event.error
            })
          },
        },
        src: "authenticateUserActor",
      },
    },

    checkingUser: {
      invoke: {
        id: "checkUserInCollection",
        src: "checkUserInCollectionActor",
        input: ({ context }) => ({
          uid: context.authUser?.uid as FB_Uid,
        }),
        onDone: [
          {
            target: "creatingSession",
            guard: {
              type: "isRegistered",
              params: ({ event }) => ({
                exist: event.output !== undefined,
              }),
            },
            actions: {
              type: "dispatchUser",
              params: ({ event }) => ({
                data: event.output
              })
            },
            reenter: true,
          },
          {
            target: "needsSignup",
          },
        ],
        onError: {
          target: "failure",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              error: event.error
            })
          },
        },
      },
    },

    failure: {
      on: {
        TRY_AUTH: {
          target: "authenticating",
          actions: {
            type: "assignError",
            params: () => ({
              error: undefined,
            }),
          },
        },
      },
    },

    authenticated: {
      type: "final",
      entry: { 
        type: "redirectToPreviousPath"
      }
    },

    needsSignup: {
      states: {
        selectRole: {
          on: {
            SIGNUP: {
              target: "signingUp",
              reenter: true,
            },
          },
        },

        getYoutubeChannel: {
          invoke: {
            id: "getYoutubeChannel",
            src: "getYoutubeChannelActor",
            input: ({ context }) => ({
              uid: context.authUser?.uid as FB_Uid,
            }),
            onDone: [
              {
                target: "selectRole",
                actions: {
                  type: "assignYoutube",
                  params: ({ event }) => ({ data: event.output }),
                },
              },
            ],
            onError: {
              target: "cannotSignup",
              actions: {
                type: "assignError",
                params: ({ event }) => ({
                  error: event.error
                }),
              }
            },
          },
        },

        signingUp: {
          invoke: {
            id: "registerUser",
            src: "registerUserActor",
            input: ({ event, context }) => {
              if (event.type === "SIGNUP" && context.authUser) {
                return {
                  authUser: context.authUser,
                  user: event.user,
                };
              }
              throw new Error("Invalid event type for signingUp state");
            },
            onDone: {
              target: "#login.creatingSession",
              reenter: true,
              actions: {
                type: "dispatchUser",
                params: ({ event }) => ({
                  data: event.output
                }),
              }
            },
            onError: {
              target: "#login.failure",
              actions: {
                type: "assignError",
                params: ({ event }) => ({
                  error: event.error
                })
              },
            },
          },
        },

        cannotSignup: {},
      },

      initial: "getYoutubeChannel",
    },

    creatingSession: {
      invoke: {
        id: "createSession",
        src: "createSessionActor",
        input: ({ context }) => ({
          authUser: context.authUser,
        }),
        onDone: {
          target: "updateYoutue",
          reenter: true,
        },
        onError: {
          target: "failure",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              error: event.error
            })
          },
        },
      },
    },

    updateYoutue: {
      invoke: {
        id: "updateYoutube",
        src: "updateYoutubeActor",
        input: ({ context }) => ({
          uid: context.authUser?.uid as FB_Uid,
          youtube: context.youtube,
        }),
        onDone: {
          target: "authenticated",
          actions: {
            type: "dispatchYoutubeInfo",
            params: ({ event }) => ({
              data: event.output
            })
          }
        },
        onError: {
          target: "warning",
          actions: {
            type: "assignError",
            params: ({ event }) => ({
              error: event.error
            })
          },
        },
      },
    },

    warning: {
      after: {
        "2000": "authenticated"
      },
    }
  },
});

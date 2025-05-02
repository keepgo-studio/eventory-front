// app/api/session/route.ts (POST)

import { FB_TOKEN_KEY } from "@/lib/vars";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { idToken } = await req.json();

  if (!idToken) {
    return new Response("Missing token", { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set({
    name: FB_TOKEN_KEY,
    value: idToken,
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24,
    path: "/",
    sameSite: "strict"
  });

  return new Response("OK", { status: 200 });
}

export async function DELETE() {
  (await cookies()).delete(FB_TOKEN_KEY);
  return new Response("Logout", { status: 200 });
}
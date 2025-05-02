"use client"

import React from "react";
import type { ActorRefFrom } from "xstate";
import { loginMachine, type SignupForm } from "./login-machine";
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSelector } from "@xstate/react";
import type { FS_OriginYoutube } from "@eventory/shared-types/firestore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function CannotSignup({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof loginMachine>;
}) {
  const snapshot = actorRef.getSnapshot();

  return <div>{snapshot.context.error}</div>
}

function YoutubeCard({ data }: { data: FS_OriginYoutube }) {
  return (
    <Card>
      <CardHeader>{data.snippet.title}</CardHeader>
      
      <CardContent>
        <p>{data.snippet.title}</p>

        <img 
          src={data.snippet.thumbnails.default.url} 
          width={data.snippet.thumbnails.default.width}
          height={data.snippet.thumbnails.default.height}
          alt="youtube channel thumbnail"
        />
      </CardContent>
    </Card>
  )
}

const signupSchema = z.object({
  role: z.enum(["participant", "influencer"]),
});

type SignupSchema = z.infer<typeof signupSchema>;

function SubmitForm({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof loginMachine>;
}) {
  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: "participant",
    },
  });

  const snapshot = actorRef.getSnapshot();
  const { authUser, youtube } = snapshot.context;

  const handleSubmit = (data: SignupSchema) => {
    if (!authUser) return;
    
    const fbUser = {
      role: data.role,
      canAdminList: [],
      canViewList: [],
    } satisfies SignupForm;

    actorRef.send({ type: "SIGNUP", user: fbUser });
  }

  if (!authUser || !youtube) return <></>;

  return (
    <div>
      <section>
        <YoutubeCard data={youtube} />
      </section>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="text-sm text-muted-foreground">
            <div>Email: {authUser.email}</div>
            <div>Name: {authUser.displayName}</div>
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>역할 선택</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Role"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        <SelectItem value="participant">참가자</SelectItem>
                        <SelectItem value="influencer">인플루언서</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            가입하기
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function Signup({
  actorRef,
}: {
  actorRef: ActorRefFrom<typeof loginMachine>;
}) {
  const screenToRender = useSelector(actorRef, (state) => {
    if (state.matches({ needsSignup: "getYoutubeChannel" })) {
      return "getting youtube channel" as const;
    }
    if (state.matches({ needsSignup: "selectRole"})) {
      return "can register" as const;
    }
    if (state.matches({ needsSignup: "signingUp" })) {
      return "submitting" as const;
    }
    if (state.matches({ needsSignup: "cannotSignup" })) {
      return "fail" as const;
    }

    throw new Error(
      `Reached an unreachable state: ${JSON.stringify(state.value)}`
    );
  });

  return (
    <div>
      {screenToRender}
      {screenToRender === "getting youtube channel" ? (
        <>getting youtube info...</>
      ) : screenToRender === "can register" ? (
        <SubmitForm actorRef={actorRef}/>
      ) : screenToRender === "submitting" ? (
        <>registering...</>
      ) : (
        <CannotSignup actorRef={actorRef} />
      )}
    </div>
  )
}

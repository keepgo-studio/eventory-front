"use client";

import React, { useEffect, useState } from "react";
import type { DZ_Event } from "@/db/types";
import EventPreview from "./EventPreview";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/use-fetch";
import { checkIfEventExecutionExists, executeEventEndJob, readEventContents, readEventOrigin } from "./api";
import { Skeleton } from "@/components/ui/skeleton";
import EventOrigin from "./EventOrigin";
import EventJoinEditor from "./EventJoinEditor";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useNav } from "@/hooks/use-nav";
import { useAtom } from "jotai";
import { eventAtom } from "./context";

function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[125px] w-[250px] rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
}

export default function Viewer({ event }: { event: DZ_Event }) {
  const { user, youtubeInfo } = useAuth();
  const { navigate } = useNav();
  // setting event to atom
  const [_, setEvent] = useAtom(eventAtom);

  useEffect(() => {
    setEvent(event);
  }, [event]);

  // get origin data related to the event
  const { data: originData, isLoading: originLoading } = useFetch(
    readEventOrigin,
    event.originType,
    event.id
  );
  // get content data related to the event
  const { data: contentData, isLoading: contentLoading } = useFetch(
    readEventContents,
    event.id
  );

  const [join, setJoin] = useState<boolean>(false);

  const endEvent = async () => {
    if (!user) return;

    if (!youtubeInfo) return;

    
    try {
      if (event.owner !== user.uid) {
        throw new Error("You are not the owner of this event")
      }

      await checkIfEventExecutionExists(event.id);

      await executeEventEndJob(event.id, {
        ownerUid: user.uid,
        originType: event.originType,
        ownerYoutubeChannelId: youtubeInfo.channelId 
      });
    } catch (err) {

    }
  }

  return (
    <div>
      <EventPreview data={event} />

      {originLoading ? <SkeletonCard /> : <EventOrigin origin={originData} />}

      {user?.uid === event.owner && (
        <div>
          <Link
            href={navigate("/events/form/edit?eventId", {
              eventId: String(event.id),
            })}
          >
            <Button>Modify</Button>
          </Link>

          <Button onClick={endEvent}>End Event</Button>
        </div>
      )}

      {!user && <div>You have to Login first</div>}

      {user ? (
        join ? (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-2">Content 구성</h2>
              {contentLoading ? (
                <SkeletonCard />
              ) : (
                <EventJoinEditor content={contentData ?? []} />
              )}
            </section>
          </div>
        ) : (
          <Button type="button" onClick={() => setJoin(true)}>
            Join
          </Button>
        )
      ) : (
        <></>
      )}
    </div>
  );
}

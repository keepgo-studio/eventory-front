"use server";

import { sqlDB } from "@/db/config";
import type { DZ_Event, DZ_EventOrigin } from "@/db/types";
import type { FB_Uid } from "@eventory/shared-types/firebase";
import type { JoinFormSchema } from "./schema";
import {
  adminDoc,
  adminRunTransaction,
  adminServerTimestamp,
} from "@/lib/firebase/node-api";
import type {
  FS_JoinEventInfo,
  FS_JoinEvents,
  JoinBlock,
} from "@eventory/shared-types/firestore";
import { jobsClient } from "@/lib/google-cloud/run";
import type { google } from "@google-cloud/run/build/protos/protos";

export async function readEventIds(limit: number) {
  return await sqlDB.query.events.findMany({
    limit,
    orderBy: (events, { desc }) => [desc(events.createdAt)],
    columns: {
      id: true,
    },
  });
}

export async function readEventById(eventId: number) {
  return await sqlDB.query.events.findFirst({
    where: (event, { eq }) => eq(event.id, eventId),
  });
}

export async function readEventOrigin(
  eventOrigin: DZ_EventOrigin,
  eventId: number
) {
  switch (eventOrigin) {
    case "youtube":
      return await sqlDB.query.eventYoutubeOrigins.findFirst({
        where: (origin, { eq }) => eq(origin.eventId, eventId),
      });
    case "none":
      return await sqlDB.query.eventNoneOrigins.findFirst({
        where: (origin, { eq }) => eq(origin.eventId, eventId),
      });
  }
}

export type ReadEventOrigin = Awaited<ReturnType<typeof readEventOrigin>>;

export async function readEventContents(eventId: number) {
  return sqlDB.query.eventContentBlocks.findMany({
    where: (block, { eq }) => eq(block.eventId, eventId),
    orderBy: (block, { asc }) => [asc(block.orderIndex)],
    with: {
      eventContentBlockOptions: {
        orderBy: (option, { asc }) => [asc(option.orderIndex)],
      },
    },
  });
}

export type ReadEventContents = Awaited<ReturnType<typeof readEventContents>>;

function readEventVersion(eventId: number) {
  return sqlDB.query.events.findFirst({
    where: (event, { eq }) => eq(event.id, eventId),
    columns: {
      version: true,
    },
  });
}

export async function createJoinEvent(
  event: DZ_Event,
  formData: JoinFormSchema,
  params: {
    participantUid: FB_Uid;
    youtubeChannelId: string | null;
  }
) {
  const prev = await readEventVersion(event.id);
  const { participantUid, youtubeChannelId } = params;

  if (prev && prev.version !== event.version) {
    throw new Error("Event version mismatch");
  }

  const ownerUid = event.owner as FB_Uid;

  const eventDocRef = adminDoc("join-events/:eventId", String(event.id));
  const joinDocRef = adminDoc(
    "join-events/:eventId/joins/:uid",
    String(event.id),
    participantUid
  );

  await adminRunTransaction(async (tx) => {
    const eventDoc = await tx.get(eventDocRef);

    if (!eventDoc.exists) {
      const joinEventInfo: FS_JoinEventInfo = {
        owner: ownerUid,
        executedAt: null,
        endAt: null,
      };

      tx.set(eventDocRef, joinEventInfo);
    }

    const joinData: FS_JoinEvents = {
      eventId: event.id,
      createdAt: adminServerTimestamp(),
      joinVersion: event.version,
      updatedAt: adminServerTimestamp(),
      youtubeChannelId:
        event.originType === "youtube" ? youtubeChannelId : null,
      blocks: formData.blocks.map((block): JoinBlock => {
        if (block.type === "text" || block.type === "textarea") {
          return {
            blockId: block.id,
            type: block.type,
            value: block.value,
          };
        } else if (block.type === "radio") {
          return {
            blockId: block.id,
            type: block.type,
            selectIdx: block.selectIdx,
          };
        } else if (block.type === "select") {
          return {
            blockId: block.id,
            type: block.type,
            selectIdxList: block.selectIdxList,
          };
        } else if (block.type === "description") {
          return {
            blockId: block.id,
            type: block.type,
          };
        } else {
          throw new Error(
            `Unsupported Block detected ${JSON.stringify(block)}`
          );
        }
      }),
    };

    tx.set(joinDocRef, joinData);
  });
}

export async function checkIfEventExecutionExists(eventId: number) {
  const eventDocRef = adminDoc("join-events/:eventId", String(eventId));

  return await adminRunTransaction(async (tx) => {
    const eventDoc = await tx.get(eventDocRef);

    // 1. if no one had joined for the event, return undefined
    if (!eventDoc.exists) return undefined;

    const eventData = eventDoc.data() as FS_JoinEventInfo;

    if (eventData.executedAt === null) return undefined;

    // 1. if the event is executed but not ended, return executed time
    if (eventData.endAt === null) return eventData.executedAt;
    
    // 2. if the event is ended, return the end time
    if (eventData.endAt !== null) return eventData.endAt;

    // unreachable code
    return undefined;
  });
}

export async function executeEventEndJob(
  eventId: number,
  params: {
    ownerUid: FB_Uid;
    originType: DZ_EventOrigin;
    ownerYoutubeChannelId: string | null;
  }
) {
  const { ownerUid, originType, ownerYoutubeChannelId } = params;

  if (originType === "youtube" && !ownerYoutubeChannelId) {
    throw new Error("Youtube channel ID is required for youtube origin type");
  }

  const project = process.env.NEXT_PUBLIC_PROJECT_ID;
  const location = "asia-northeast3";
  const jobId = "job-end-event";

  const jobName = jobsClient.jobPath(project, location, jobId);

  const request: google.cloud.run.v2.IRunJobRequest = {
    name: jobName,
    overrides: {
      containerOverrides: [
        {
          env: [
            { name: "EVENT_ID", value: String(eventId) },
            { name: "OWNER_UID", value: ownerUid },
            ...(ownerYoutubeChannelId
              ? [
                  {
                    name: "OWNER_YOUTUBE_CHANNEL_ID",
                    value: ownerYoutubeChannelId,
                  },
                ]
              : []),
          ],
        },
      ],
    },
  };

  const [operation] = await jobsClient.runJob(request);
  const [response] = await operation.promise();

  console.log("Job execution started:", response.name);
}

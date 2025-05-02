"use server"

import type { AppUser } from "@/lib/features/user/user-store";
import type { EventFormSchema } from "./schema";
import {
  eventContentBlockOptions,
  eventContentBlocks,
  events,
  eventNoneOrigins,
  eventYoutubeOrigins,
  eventsHistory,
} from "@/db/schema";
import { sqlTransaction } from "@/db/config";
import { eq } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { DZ_Event } from "@/db/types";

async function insertVersion(tx: PgTransaction<any, any, any>, eventRef: DZ_Event, eventId: number) {
  await tx.insert(eventsHistory).values({
    eventId: eventId,
    version: eventRef.version,
    updatedAt: eventRef.updatedAt,
  });
}

async function insertRelatedTables(tx: PgTransaction<any, any, any>, eventId: number, schema: EventFormSchema) {
  switch (schema.origin.type) {
    case "none":
      await tx.insert(eventNoneOrigins).values({
        eventId: eventId,
        requireMission: schema.origin.require.mission,
      });
      break;
    case "youtube":
      const origin = schema.origin;

      await tx.insert(eventYoutubeOrigins).values({
        eventId: eventId,
        title: origin.title,
        url: origin.url,
        description: origin.description,
        thumbnailURL: origin.thumbnailURL,
        requireComment: origin.require.comment,
        requireLike: origin.require.like,
        requireMission: origin.require.mission,
        requireNotification: origin.require.notification,
        requireSubscribe: origin.require.subscribe,
      });
      break;
  }

  await Promise.all(schema.content.blocks.map((block, blockIdx) =>
    tx.insert(eventContentBlocks).values({
        eventId: eventId,
        orderIndex: blockIdx,
        // common fields
        type: block.type,
        label: block.label,
        required: block.required,
        previewImageURL: block.previewImage ? block.previewImage.url : null,
        // branch fields
        descriptionValue: block.type === "description" ? block.value : null,
        textareaMaxLength: block.type === "textarea" ? block.maxLength : null,
        textareaPlaceholder: block.type === "textarea" ? block.placeholder : null,
        textPlaceholder: block.type === "text" ? block.placeholder : null,
      })
      .returning()
      .then(([createdBlock]) => block.type === "radio" || block.type === "select"
          ? Promise.all(block.options.map((option, optIdx) =>
              tx.insert(eventContentBlockOptions).values({
                blockId: createdBlock.id,
                orderIndex: optIdx,
                value: option.value,
                previewImageURL: option.previewImage ? option.previewImage.url : null,
              })
            ))
          : undefined
      ) // option Promise.all end
    )
  ); // block Promise.all end
}

export async function createEventSQL(user: AppUser, schema: EventFormSchema) {
  return await sqlTransaction(async (tx) => {
    const [createdEvent] = await tx.insert(events).values({
        owner: user.uid,
        title: schema.title,
        description: schema.description,
        startDate: schema.startDate,
        endDate: schema.endDate,
        thumbnailURL: schema.thumbnailURL ? schema.thumbnailURL.url : null,
        originType: schema.origin.type,
        canModifyJoin: schema.canModifyJoin,
      })
      .returning();

    await insertRelatedTables(tx, createdEvent.id, schema);
    await insertVersion(tx, createdEvent, createdEvent.id);

    return createdEvent.id;
  }); // sqlTransaction end
}

// TODO: block에 변화가 없을 경우, version을 업데이트 하지 않도록
export async function updateEventSQL(eventId: number, schema: EventFormSchema) {
  return await sqlTransaction(async (tx) => {
    const updateEvent = () => tx.update(events).set({
        title: schema.title,
        description: schema.description,
        startDate: schema.startDate,
        endDate: schema.endDate,
        thumbnailURL: schema.thumbnailURL ? schema.thumbnailURL.url : null,
        originType: schema.origin.type,
        canModifyJoin: schema.canModifyJoin,
      })
      .where(eq(events.id, eventId))
      .returning();

    const removeRelatedTables = () => 
      Promise.all([
        tx.delete(eventYoutubeOrigins).where(eq(eventYoutubeOrigins.eventId, eventId)),
        tx.delete(eventNoneOrigins).where(eq(eventNoneOrigins.eventId, eventId)),
        tx.delete(eventContentBlocks).where(eq(eventContentBlocks.eventId, eventId)),
        tx.delete(eventContentBlockOptions).where(eq(eventContentBlockOptions.blockId, eventId)),
      ]);

    const [updateEventResult] = await Promise.all([updateEvent(), removeRelatedTables()]);
    const updatedEvent = updateEventResult[0];

    await insertRelatedTables(tx, eventId, schema);
    await insertVersion(tx, updatedEvent, eventId);

    return eventId;
  }); // sqlTransaction end
}

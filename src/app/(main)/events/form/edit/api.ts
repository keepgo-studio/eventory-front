import { sqlDB } from "@/db/config";

export async function readEventFormDataById(eventId: number) {
  return await sqlDB.query.events.findFirst({
    where: (event, { eq }) => eq(event.id, eventId),
    with: {
      eventYoutubeOrigins: true,
      eventNoneOrigins: true,
      eventContentBlocks: {
        where: (block, { eq }) => eq(block.eventId, eventId),
        orderBy: (block, { asc }) => [asc(block.orderIndex)],
        with: {
          eventContentBlockOptions: {
            orderBy: (option, { asc }) => [asc(option.orderIndex)],
          },
        },
      }
    }
  });
}

export type ReadEventFormDataById = Awaited<ReturnType<typeof readEventFormDataById>>;


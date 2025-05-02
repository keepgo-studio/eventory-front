"use server"

import { sqlDB } from "@/db/config";
import { eventNoneOrigins, events, eventYoutubeOrigins } from "@/db/schema";
import type { DZ_EventOrigin } from "@/db/types";
import { and, count, eq, gt, lt, lte, SQL } from "drizzle-orm";

type OriginMap = {
  youtube: {
    subscribe: boolean;
    notification: boolean;
    like: boolean;
    comment: boolean;
    mission: boolean;
  },
  none: {
    mission: boolean;
  },
}

type EventOrigin = {
  [K in DZ_EventOrigin]: { type: K; } & OriginMap[K]
};

type OrderBy = "desc" | "asc";

type EventStatus = {
  upcoming: boolean;
  ongoing: boolean;
  ended: boolean;
};

export type EventsFilter = {
  createdAt: OrderBy;
  limit: number;
  offset: number;
  status?: EventStatus;
  updatedAt?: OrderBy;
  required?: EventOrigin[DZ_EventOrigin];
}

function parseFilter({
  required,
  status,
}: EventsFilter): Array<SQL | undefined> {
  const now = new Date();
  const conditions:Array<SQL | undefined> = [];

  // gt: a > b, lt: a < b
  // Status 필터링
  if (status) {
    if (status.upcoming) {
      conditions.push(gt(events.startDate, now));
    }
    if (status.ongoing) {
      conditions.push(and(lte(events.startDate, now), gt(events.endDate, now)));
    }
    if (status.ended) {
      conditions.push(lt(events.endDate, now));
    }
  }
  
  // Required 필터링
  if (required) {
    conditions.push(eq(events.originType, required.type));

    if (required.type === "youtube") {
      const youtubeConditions = [];
      if (required.subscribe !== undefined) {
        youtubeConditions.push(eq(eventYoutubeOrigins.requireSubscribe, required.subscribe));
      }
      if (required.notification !== undefined) {
        youtubeConditions.push(eq(eventYoutubeOrigins.requireNotification, required.notification));
      }
      if (required.like !== undefined) {
        youtubeConditions.push(eq(eventYoutubeOrigins.requireLike, required.like));
      }
      if (required.comment !== undefined) {
        youtubeConditions.push(eq(eventYoutubeOrigins.requireComment, required.comment));
      }
      if (required.mission !== undefined) {
        youtubeConditions.push(eq(eventYoutubeOrigins.requireMission, required.mission));
      }
      conditions.push(and(...youtubeConditions));
    } else if (required.type === "none") {
      if (required.mission !== undefined) {
        conditions.push(eq(eventNoneOrigins.requireMission, required.mission));
      }
    }
  }

  return conditions;
}

export async function readFilteredEvents(filter: EventsFilter) {
  const {
    createdAt,
    limit,
    offset,
    updatedAt,
  } = filter;

  const conditions = parseFilter(filter);

  return await sqlDB.query.events.findMany({
    limit: limit,
    offset,
    orderBy: (events, fn) => [
      ...(updatedAt ? [fn[updatedAt](events.updatedAt)] : []),
      fn[createdAt](events.createdAt),
    ],
    where: ((_, { and,  }) => and(...conditions)),
  });
}

export async function readFilteredEventsCounts(filter: EventsFilter) {
  const conditions = parseFilter(filter);
  const results = await sqlDB.select({
    count: count(),
  }).from(events).where(and(...conditions));

  return results[0].count;
}

import React from "react";
import type { SearchParams } from "next/dist/server/request/search-params";
import { notFound } from "next/navigation";
import EventEditor from "@/components/event-editor/EventEditor";
import { readEventFormDataById } from "./api";
import { parseFormDataToFormSchema } from "./utils";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { eventId } = await searchParams;

  if (!eventId || typeof eventId !== "string" || isNaN(Number(eventId))) {
    return notFound();
  }

  const id = Number(eventId);

  const data = await readEventFormDataById(id);  
  const initData = parseFormDataToFormSchema(data);

  if (!data || !initData) return notFound();

  return <EventEditor initEventId={id} initData={initData} />;
}

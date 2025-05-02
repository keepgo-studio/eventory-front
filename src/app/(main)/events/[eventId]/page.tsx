import { notFound } from 'next/navigation';
import React from 'react'
import { readEventById, readEventIds } from './api';
import type { SSGParms } from '@/@types/next';
import type { Metadata } from 'next';
import Viewer from './Viewer';
import { Provider } from "jotai";

type Props = { 
  eventId: string;
};

// ISR, 1 minute caching
// https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation-with-revalidatetag
export const revalidate = 60;

export const dynamicParams = true;

// render latest 100 pages
export async function generateStaticParams(): Promise<Props[]> {
  const events = await readEventIds(100);

  return events.map(event => ({ eventId: String(event.id) }));
}

// generateMetadata
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export async function generateMetadata({ params }: SSGParms<Props>): Promise<Metadata> {
  const { eventId } = await params;

  const event = await readEventById(Number(eventId));

  return {
    title: event?.title,
  }
}

export default async function page({ params }: SSGParms<Props>) {
  const { eventId } = await params;
  const data = await readEventById(Number(eventId));

  if (!data) return notFound();

  return (
    <>
      <p>page - ✅</p>

      <Provider>
        <Viewer event={data}/>
      </Provider>
    </>
  )
}
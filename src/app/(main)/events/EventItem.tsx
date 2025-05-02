'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { FB_Uid } from '@eventory/shared-types/firebase'
import Link from 'next/link'
import SmartImage from '@/components/SmartImage'
import { useNav } from '@/hooks/use-nav'
import type { DZ_Event } from '@/db/types'

interface EventItemProps {
  event: DZ_Event;
  myUid?: FB_Uid;
}

export default function EventItem({ event, myUid }: EventItemProps) {
  const { navigate } = useNav();
  const isOwner = myUid === event.owner;

  return (
    <Link href={navigate("/events/:eventId", String(event.id))}>
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {event.thumbnailURL && (
            <SmartImage
              src={event.thumbnailURL}
              alt={event.title}
              className="rounded-md w-40 aspect-square object-cover"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
          </p>
          {isOwner && <p className="text-xs text-primary">Mine</p>}
        </CardContent>
      </Card>
    </Link>
  )
}

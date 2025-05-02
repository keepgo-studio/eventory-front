"use client"

import SmartImage from '@/components/SmartImage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DZ_Event } from '@/db/types';
import { format } from 'date-fns';
import React from 'react'

export default function EventPreview({ data }: { data: DZ_Event }) {
  const { title, description, thumbnailURL, startDate, endDate, owner, originType } = data;

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {thumbnailURL && (
          <SmartImage
            src={thumbnailURL}
            alt={title}
            width={800}
            height={400}
            className="rounded-md object-cover aspect-square"
          />
        )}
        <p className="text-muted-foreground text-sm">
          {format(new Date(startDate), 'yyyy-MM-dd')} ~ {format(new Date(endDate), 'yyyy-MM-dd')}
        </p>
        <div className="text-sm">
          <span className="font-medium">작성자:</span> {owner}
        </div>
        <div className="text-sm">
          <span className="font-medium">유형:</span> {originType === 'youtube' ? 'YouTube 이벤트' : '기본 이벤트'}
        </div>

        <div>
          <p>
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

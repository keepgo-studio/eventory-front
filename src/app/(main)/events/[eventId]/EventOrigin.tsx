import React from 'react'
import type { ReadEventOrigin } from './api';
import { Card, CardContent } from '@/components/ui/card';

export default function EventOrigin({ origin }: { origin: ReadEventOrigin; }) {
  if (!origin) return <p className="text-muted-foreground">origin 데이터 없음</p>;

  if ('requireMission' in origin && Object.keys(origin).length === 2) {
    return (
      <Card>
        <CardContent>참여 미션 필요: {origin.requireMission ? '예' : '아니오'}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1 text-sm">
        <p className="font-medium">YouTube 미션 요건</p>
        <ul className="list-disc list-inside ml-4">
          {Object.entries(origin).map(([key, value]) =>
            typeof value === 'boolean' ? (
              <li key={key}>{key}: {value ? '예' : '아니오'}</li>
            ) : null
          )}
        </ul>
      </CardContent>
    </Card>
  );
}

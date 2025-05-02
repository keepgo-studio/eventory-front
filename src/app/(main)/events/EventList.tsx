'use client'

import React, { useState } from 'react'
import { readFilteredEvents, type EventsFilter } from './api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import EventItem from './EventItem';
import EventPagination from './EventPagination';

const PAGE_SIZE = 10;

export default function EventList() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<EventsFilter>({
    createdAt: "desc",
    limit: PAGE_SIZE,
    offset: 0
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', page],
    queryFn: async () => {
      const offset = page * PAGE_SIZE;
      const events = await readFilteredEvents({ ...filters, offset });
      return events;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading events.</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data && data.length > 0 ? (
          data.map((event, index) => (
            <EventItem key={index} event={event} myUid={user?.uid} />
          ))
        ) : (
          <p>No events found.</p>
        )}
      </div>

      <EventPagination 
        currentPage={page}
        filters={filters}
        onPageChange={(page) => setPage(page)}
        pageSize={PAGE_SIZE}
      />
    </div>
  )
}

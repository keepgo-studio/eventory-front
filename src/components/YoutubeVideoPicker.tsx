'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from "@tanstack/react-query";
import type { YoutubeVideoInfo } from '@eventory/shared-types/youtube';
import { callFunctionYoutube } from '@/lib/api/functions/youtube';
import type { FB_Uid } from '@eventory/shared-types/firebase';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type YouTubeVideoPickerProps = {
  uid: FB_Uid;
  playlistId: string;
  maxResults: number;
  onSelect: (video: YoutubeVideoInfo | null) => void;
};

export default function YouTubeVideoPicker({ 
  uid, 
  onSelect,
  playlistId,
  maxResults
 }: YouTubeVideoPickerProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['youtube-videos', uid],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      const res = await callFunctionYoutube('getUploadedVideoList', { 
        uid,
        playlistId,
        maxResults,
        pageToken: pageParam
       });

      if (!res.success) {
        toast.error(res.error);
        throw new Error(res.error);
      }

      return {
        items: res.data.list,
        nextPageToken: res.data.nextPageToken,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    initialPageParam: undefined,
  });

  // TODO: refactoring 필요, 너무 많이 요청되는거 같음, 아니면 화면을 가리면 괜찮을지도?
  // TODO: list 끝에 도달하면 더 이상 요청하지 못 하게
  // IntersectionObserver로 무한스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCardClick = (item: YoutubeVideoInfo) => {
    const isSame = selectedVideoId === item.videoId;

    setSelectedVideoId(isSame ? null : item.videoId);
    onSelect(isSame ? null : item);
  }

  return (
    <div className="space-y-4">
      <p className="font-semibold text-lg">최근 업로드된 영상</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data?.pages.flatMap((page) =>
          page.items.map((item) => {
            const videoId = item.videoId;

            return (
              <Card
                key={videoId}
                className={`cursor-pointer hover:shadow-md transition ${
                  (selectedVideoId === videoId) ? 'ring-2 ring-primary bg-muted shadow-lg scale-[1.01]' : 'hover:shadow-md'
                }`}
                onClick={() => handleCardClick(item)}
              >
                <CardContent className="p-0">
                  <img
                    src={item.thumbnails.default.url}
                    alt={item.title}
                    className="w-full aspect-video object-cover rounded-t"
                  />
                  <div className="p-3 space-y-1">
                    <div className="text-sm font-medium line-clamp-2">{item.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div ref={loaderRef} className="h-6" />

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-0">
              <Skeleton className="w-full aspect-video rounded-t" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-5/6" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFetchingNextPage && <p className="text-center text-sm text-muted-foreground">더 불러오는 중...</p>}
    </div>
  );
}
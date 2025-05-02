"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { EventFormSchema } from "./schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { extractYoutubeVideoId, generateYoutubeUrl, initialOriginMap, type EventOrigin } from "./utils";
import { devLog, jsonCopy } from "@/lib/web-utils";
import { toast } from "sonner";
import { callFunctionYoutube } from "@/lib/api/functions/youtube";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import YouTubeVideoPicker from "@/components/YoutubeVideoPicker";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import type { DZ_EventOrigin } from "@/db/types";

function SelectedYoutubeVideo() {
  const { watch, getValues } = useFormContext<EventFormSchema>();
  const videoUrl = watch("origin.url");
  const data = getValues("origin");

  if (data.type === "none") return;

  return (
    <div className="p-3 rounded-lg border">
      {data.thumbnailURL && <img src={data.thumbnailURL} />}
      <p>{data.title}</p>
      <Link href={videoUrl}>link</Link>
    </div>
  )
}

function YouTubeOriginEditor() {
  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, youtubeInfo } = useAuth();
  const { setValue } = useFormContext<EventFormSchema>();

  const handleFetchVideoFromUrl = async () => {
    if (!youtubeInfo) {
      toast.error("youtube 정보를 불러오지 못했습니다. 다시 로그인 해주세요.");
      return;
    }

    const inputVideoId = extractYoutubeVideoId(inputUrl);

    if (!inputVideoId) {
      toast.error("잘못된 링크입니다.");
      return;
    }

    setLoading(true);

    try {
      const video = await callFunctionYoutube("getVideoInfo", {
        channelId: youtubeInfo.channelId,
        videoId: inputVideoId,
      });

      if (!video.success) {
        devLog("ERROR", "Functions", video.error);
        toast.error("영상을 찾을 수 없습니다.");
        return;
      }

      const { videoId, title, description, thumbnails } = video.data;

      setValue("origin.url", generateYoutubeUrl(videoId));
      setValue("origin.thumbnailURL", thumbnails.default.url);
      setValue("origin.title", title);
      setValue("origin.description", description);
    } catch (e) {
      console.error(e);
      toast.error("영상 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormItem>
        <FormLabel>유튜브 영상 URL</FormLabel>
        <FormControl>
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleFetchVideoFromUrl}
              disabled={loading}
            >
              불러오기
            </Button>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>

      <SelectedYoutubeVideo />

      {user && youtubeInfo && (
        <YouTubeVideoPicker
          uid={user.uid}
          playlistId={youtubeInfo.uploadListId}
          maxResults={5}
          onSelect={(video) => {
            // release selection
            if (video === null) {
              setValue("origin.url", "");
              setValue("origin.thumbnailURL", null);
              setValue("origin.title", "");
              setValue("origin.description", "");
              return;
            }
            setValue("origin.url", generateYoutubeUrl(video.videoId));
            setValue("origin.thumbnailURL", video.thumbnails.default.url);
            setValue("origin.title", video.title);
            setValue("origin.description", video.description);
          }}
        />
      )}
    </div>
  );
}

function Required({ originType }: { originType: DZ_EventOrigin }) {
  const { control } = useFormContext<EventFormSchema>();

  if (originType === "none")
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          name="origin.require.mission"
          control={control}
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-2">
              <FormLabel>미션 참여 여부</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );

  if (originType === "youtube")
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {(
          ["subscribe", "like", "comment", "notification", "mission"] as const
        ).map((key) => (
          <FormField
            key={key}
            control={control}
            name={`origin.require.${key}`}
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-2">
                <FormLabel className="capitalize">{key}</FormLabel>
                <FormControl>
                  <Switch
                    defaultChecked={field.value}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </div>
    );
}

export default function EventOriginEditor() {
  const { setValue, getValues } = useFormContext<EventFormSchema>();
  const [originType, setOriginType] = useState(getValues("origin.type"));
  const prevType = useRef(getValues("origin.type"));
  const cachedOriginRef = useRef<EventOrigin>(jsonCopy(initialOriginMap));

  useEffect(() => {
    const prev = getValues("origin");
    // cached
    cachedOriginRef.current[prevType.current] = prev as any;
    // set value from cached
    setValue("origin", cachedOriginRef.current[originType] as any);
    prevType.current = originType;
  }, [originType, setValue]);

  return (
    <div className="space-y-4">
      <p>플랫폼 선택</p>

      <RadioGroup
        defaultValue={originType}
        onValueChange={(value) => setOriginType(value as DZ_EventOrigin)}
        className="flex gap-4"
      >
        <RadioGroupItem value="none" id="origin-none" />
        <Label htmlFor="origin-none">없음</Label>
        <RadioGroupItem value="youtube" id="origin-youtube" />
        <Label htmlFor="origin-youtube">YouTube</Label>
      </RadioGroup>

      <Required originType={originType} />

      {(originType === "youtube") && <YouTubeOriginEditor />} 
    </div>
  );
}

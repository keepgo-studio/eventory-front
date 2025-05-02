import { IS_DEV } from "@/lib/vars";
import { generateUrlWithParams } from "@/lib/utils";
import type { FB_Uid, FunctionStatus } from "@eventory/shared-types/firebase";
import type { FS_OriginYoutube } from "@eventory/shared-types/firestore";
import type { YoutubeVideoInfo } from "@eventory/shared-types/youtube";

const FUNCTION_URL = IS_DEV
  ? process.env.NEXT_PUBLIC_DEV_FUNCTION_URL
  : process.env.NEXT_PUBLIC_FUNCTION_URL;

const apiSpecs = {
  updateOriginYoutubeViaPost: {
    method: "POST",
    request: {} as { uid: FB_Uid; docData?: FS_OriginYoutube },
    response: {} as FunctionStatus<FS_OriginYoutube>,
  },
  getOriginYoutubeViaAPI: {
    method: "GET",
    request: {} as { uid: FB_Uid },
    response: {} as FunctionStatus<FS_OriginYoutube>,
  },
  getUploadedVideoList: {
    method: "GET",
    request: {} as {
      uid: FB_Uid;
      playlistId: string;
      pageToken?: string;
      maxResults?: number;
    },
    response: {} as FunctionStatus<{
      nextPageToken?: string;
      prevPageToken?: string;
      pageInfo: {
        totalResults: number;
        resultsPerPage: number;
      };
      list: YoutubeVideoInfo[]
    }>,
  },
  getVideoInfo: {
    method: "GET",
    request: {} as {
      channelId: string;
      videoId: string;
    },
    response: {} as FunctionStatus<YoutubeVideoInfo>,
  }
} as const;

type ApiSpec = typeof apiSpecs;
type ApiKey = keyof ApiSpec;

export async function callFunctionYoutube<K extends ApiKey>(
  key: K,
  args: ApiSpec[K]["request"]
): Promise<ApiSpec[K]["response"]> {
  const spec = apiSpecs[key];
  const url = `${FUNCTION_URL}/youtube-${key}`;
  const fullUrl =
    spec.method === "GET" ? generateUrlWithParams(url, args) : url;

  const res = await fetch(fullUrl, {
    method: spec.method,
    ...(spec.method === "POST"
      ? {
          body: JSON.stringify(args),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });

  return res.json();
}

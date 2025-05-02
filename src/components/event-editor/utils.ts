import type { DZ_EventContentBlockTypes, DZ_EventOrigin } from "@/db/types";
import type { FB_Uid } from "@eventory/shared-types/firebase";
import { TEXTAREA_MAX } from "./schema";

type ImageAttachment = {
  url: string;
};

type OriginMap = {
  youtube: {
    url: string;
    readonly thumbnailURL: string | null;
    readonly title: string;
    readonly description: string;
    require: {
      subscribe: boolean;
      notification: boolean;
      like: boolean;
      comment: boolean;
      mission: boolean;
    }
  },
  none: {
    require: {
      mission: boolean;
    }
  }
}

export type EventOrigin = {
  [K in DZ_EventOrigin]: { type: K; } & OriginMap[K]
};

type EventSchema = {
  startDate: number;
  endDate: number;
  title: string;
  thumbnailURL: ImageAttachment | null;
  origin: EventOrigin[DZ_EventOrigin];
  readonly owner: FB_Uid;
};

// ------------------------------------
// event-content
type EventOption = {
  value: string;
  previewImage: ImageAttachment | null;
};

type EventContentBase = {
  label: string;
  required: boolean;
  previewImage: ImageAttachment | null;
};

type EventContentText = {
  placeholder: string;
};

type EventContentTextarea = {
  maxLength: number;
  placeholder: string;
};

type EventContentSelect = {
  options: EventOption[];
};

type EventContentRadio = {
  options: EventOption[];
};

type EventContentDescription = {
  value: string;
};

type EventContentBlockMap = {
  text: EventContentText;
  textarea: EventContentTextarea;
  radio: EventContentRadio;
  select: EventContentSelect;
  description: EventContentDescription;
};

type EventContentBlockTypes = {
  [K in DZ_EventContentBlockTypes]: {
    type: K;
  } & EventContentBase &
    EventContentBlockMap[K];
};

export const initialOriginMap: EventOrigin = {
  none: {
    type: "none",
    require: {
      mission: false,
    },
  },
  youtube: {
    type: "youtube",
    url: "",
    thumbnailURL: null,
    title: "",
    description: "",
    require: {
      subscribe: false,
      like: false,
      comment: false,
      notification: false,
      mission: false,
    },
  },
};

export const initialBlockMap: EventContentBlockTypes = {
  text: {
    type: "text",
    label: "",
    required: false,
    previewImage: null,
    placeholder: "",
  },
  textarea: {
    type: "textarea",
    label: "",
    required: false,
    previewImage: null,
    placeholder: "",
    maxLength: TEXTAREA_MAX,
  },
  select: {
    type: "select",
    label: "",
    required: false,
    previewImage: null,
    options: [
      { value: "", previewImage: null },
      { value: "", previewImage: null },
    ],
  },
  radio: {
    type: "radio",
    label: "",
    required: false,
    previewImage: null,
    options: [
      { value: "", previewImage: null },
      { value: "", previewImage: null },
    ],
  },
  description: {
    type: "description",
    label: "",
    required: false,
    previewImage: null,
    value: "",
  },
};

export const blockTypes = Object.keys(initialBlockMap) as DZ_EventContentBlockTypes[];

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const pathSegments = parsed.pathname.split("/").filter(Boolean); // 공백 제거

    if (host.includes("youtube.com")) {
      // 1. https://www.youtube.com/watch?v=VIDEO_ID
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }

      // 2. https://www.youtube.com/embed/VIDEO_ID
      if (pathSegments[0] === "embed") {
        return pathSegments[1];
      }

      // 3. https://www.youtube.com/shorts/VIDEO_ID
      if (pathSegments[0] === "shorts") {
        return pathSegments[1];
      }
    }

    // 4. https://youtu.be/VIDEO_ID
    if (host.includes("youtu.be")) {
      return pathSegments[0];
    }

    return null;
  } catch {
    return null;
  }
}

export function generateYoutubeUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

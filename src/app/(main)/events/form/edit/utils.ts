import { TEXTAREA_MAX, type BlockSchema, type EventFormSchema } from "@/components/event-editor/schema";
import type { ReadEventFormDataById } from "./api";
import { devLog } from "@/lib/web-utils";

export function parseFormDataToFormSchema(
  data: ReadEventFormDataById
): EventFormSchema | undefined {
  if (
    !data ||
    (data.eventYoutubeOrigins === null && data.eventNoneOrigins === null) // if no origin founded
  ) {
    devLog("ERROR", "Drizzle", `Event(id:${data?.id}) dosen't have related origin`);
    return undefined;
  }

  return {
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    thumbnailURL: data.thumbnailURL ? { url: data.thumbnailURL } : null,
    endDate: data.endDate,
    canModifyJoin: data.canModifyJoin,
    origin: data.eventYoutubeOrigins
      ? {
          type: "youtube",
          url: data.eventYoutubeOrigins.url,
          title: data.eventYoutubeOrigins.title,
          description: data.eventYoutubeOrigins.description,
          thumbnailURL: data.eventYoutubeOrigins.thumbnailURL,
          require: {
            comment: data.eventYoutubeOrigins.requireComment,
            like: data.eventYoutubeOrigins.requireLike,
            mission: data.eventYoutubeOrigins.requireMission,
            notification: data.eventYoutubeOrigins.requireNotification,
            subscribe: data.eventYoutubeOrigins.requireSubscribe,
          },
        }
      : {
          type: "none",
          require: {
            mission: data.eventNoneOrigins!.requireMission,
          },
        },
    content: {
      blocks: data.eventContentBlocks.map((block): BlockSchema => {
        const previewImage = block.previewImageURL
          ? { url: block.previewImageURL }
          : null;

        switch (block.type) {
          case "text":
            return {
              type: "text",
              label: block.label,
              required: block.required,
              previewImage,
              placeholder: block.textPlaceholder ?? "",
            };

          case "textarea":
            return {
              type: "textarea",
              label: block.label,
              required: block.required,
              previewImage,
              placeholder: block.textareaPlaceholder ?? "",
              maxLength: block.textareaMaxLength ?? TEXTAREA_MAX,
            };

          case "radio":
          case "select":
            return {
              type: block.type,
              label: block.label,
              required: block.required,
              previewImage,
              options: block.eventContentBlockOptions.map((opt) => ({
                value: opt.value,
                previewImage: opt.previewImageURL
                  ? { url: opt.previewImageURL }
                  : null,
              })),
            };

          case "description":
            return {
              type: "description",
              label: block.label,
              required: block.required,
              previewImage,
              value: block.descriptionValue ?? "",
            };
        }
      }),
    },
  };
}

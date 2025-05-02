import type { eventContentBlocks, eventNoneOrigins, events, eventYoutubeOrigins } from "./schema";

// DZ = Drizzle prefix

export type DZ_Event = typeof events.$inferSelect;

export type DZ_EventYoutubeOrigin = typeof eventYoutubeOrigins.$inferSelect;

export type DZ_EventNoneOrigin = typeof eventNoneOrigins.$inferSelect;

export type DZ_EventContentBlock = typeof eventContentBlocks.$inferSelect;

export type DZ_EventOrigin = "youtube" | "none";

export type DZ_EventContentBlockTypes = "text" | "textarea" | "radio" | "select" | "description";
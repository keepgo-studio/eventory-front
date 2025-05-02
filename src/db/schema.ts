import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// --- 1. Event ---
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  thumbnailURL: text("thumbnail_url"),
  originType: varchar("origin_type", { enum: ["none", "youtube"] }).notNull(),
  canModifyJoin: boolean("can_modify_join").notNull().default(false),
  /**
   * length 128
   * reference {@link https://firebase.google.com/docs/auth/admin/manage-users#create_a_user}
   */
  owner: varchar("owner", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`).$onUpdate(() => new Date()),
  version: integer("version").notNull().default(1).$onUpdateFn(() => sql`version + 1`),
});

// --- 2. EventYoutubeOrigins (1:1 with Event.id)
export const eventYoutubeOrigins = pgTable("event_youtube_origins", {
  eventId: integer("event_id").primaryKey().references(() => events.id, { onDelete: "cascade" }),

  url: text("url").notNull(),
  thumbnailURL: text("thumbnail_url"),
  title: text("title").notNull(),
  description: text("description").notNull(),

  requireSubscribe: boolean("require_subscribe").notNull(),
  requireNotification: boolean("require_notification").notNull(),
  requireLike: boolean("require_like").notNull(),
  requireComment: boolean("require_comment").notNull(),
  requireMission: boolean("require_mission").notNull(),
});

// --- 3. NoneOrigin (1:1 with Event.id)
export const eventNoneOrigins = pgTable("none_origins", {
  eventId: integer("event_id").primaryKey().references(() => events.id, { onDelete: "cascade" }),
  requireMission: boolean("require_mission").notNull(),
});

// --- 4. EventContentBlock (1:N with Event.id)
export const eventContentBlocks = pgTable("event_content_blocks", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  orderIndex: integer("order_index").notNull(),
  type: varchar("type", { enum: ["text", "textarea", "radio", "select", "description"] }).notNull(),
  // common fields
  label: varchar("label", { length: 256 }).notNull(),
  required: boolean("required").notNull(),
  previewImageURL: text("preview_image_url"),

  // block type - text
  textPlaceholder: text("text_placeholder"),

  // block type - textarea
  textareaPlaceholder: text("textarea_placeholder"),
  textareaMaxLength: integer("textarea_max_length"),

  // block type - description
  descriptionValue: text("description_value"),
});

// --- 5. EventContentBlockOption (1:N with EventContentBlocks.id)
// block type - radio | select
// radio -> for single choice
// select -> for multiple choices
export const eventContentBlockOptions = pgTable("event_content_block_options", {
  id: serial("id").primaryKey(),
  blockId: integer("block_id").notNull().references(() => eventContentBlocks.id, { onDelete: "cascade" }),

  orderIndex: integer("order_index").notNull(),

  value: varchar("value", { length: 256 }).notNull(),
  previewImageURL: text("preview_image_url"),
});

// --- 6. EventJoin (1:N with Event.id)
export const eventsHistory = pgTable("events_history", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});


// --- relations ---
// These definitions enable Drizzle ORM to infer table relationships,
// which are required for proper type checking and 'with' eager loading support.
export const eventsRelations = relations(events, ({ one, many }) => ({
  eventYoutubeOrigins: one(eventYoutubeOrigins),
  eventNoneOrigins: one(eventNoneOrigins),
  eventContentBlocks: many(eventContentBlocks),
}));

export const eventYoutubeOriginsRelations = relations(eventYoutubeOrigins, ({ one }) => ({
  events: one(events, {
    fields: [eventYoutubeOrigins.eventId],
    references: [events.id]
  })
}))

export const eventNoneOriginsRelations = relations(eventNoneOrigins, ({ one }) => ({
  events: one(events, {
    fields: [eventNoneOrigins.eventId],
    references: [events.id]
  })
}))

export const eventContentBlocksRelations = relations(eventContentBlocks, ({ one, many }) => ({
  events: one(events, {
    fields: [eventContentBlocks.eventId],
    references: [events.id]
  }),
  eventContentBlockOptions: many(eventContentBlockOptions),
}));

export const eventContentBlockOptionsRelations = relations(eventContentBlockOptions, ({ one }) => ({
  eventContentBlocks: one(eventContentBlocks, {
    fields: [eventContentBlockOptions.blockId],
    references: [eventContentBlocks.id]
  })
}));

export const eventsHistoryRelations = relations(eventsHistory, ({ one }) => ({
  events: one(events, {
    fields: [eventsHistory.eventId],
    references: [events.id]
  })
}));

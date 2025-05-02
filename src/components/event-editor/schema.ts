import { z } from "zod";

export const OPTIONS_MIN = 2;

export const TEXTAREA_MAX = 2000;

const imageAttachmentSchema = z.object({
  url: z.string().url({ message: "이미지 URL이 필요합니다" }),
});

const optionSchema = z.object({
  value: z.string().min(1).max(256),
  previewImage: imageAttachmentSchema.nullable(),
});

const baseSchema = z.object({
  label: z.string().max(256).trim(),
  required: z.boolean(),
  previewImage: imageAttachmentSchema.nullable(),
});

const textSchema = baseSchema.extend({
  type: z.literal("text"),
  placeholder: z.string(),
});

const textareaSchema = baseSchema.extend({
  type: z.literal("textarea"),
  maxLength: z.coerce.number().int().max(TEXTAREA_MAX),
  placeholder: z.string(),
});

const selectSchema = baseSchema.extend({
  type: z.literal("select"),
  options: z.array(optionSchema).min(OPTIONS_MIN),
});

const radioSchema = baseSchema.extend({
  type: z.literal("radio"),
  options: z.array(optionSchema).min(OPTIONS_MIN),
});

const descriptionSchema = baseSchema.extend({
  type: z.literal("description"),
  value: z.string()
});

const blockSchema = z.discriminatedUnion("type", [
  textSchema,
  textareaSchema,
  selectSchema,
  radioSchema,
  descriptionSchema,
]);

export type BlockSchema = z.infer<typeof blockSchema>;

const contentSchema = z.object({
  blocks: z.array(blockSchema)
});

const originSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("youtube"),
    url: z.string().url(), // important field for origin
    thumbnailURL: z.string().url().readonly().nullable(),
    title: z.string().readonly(),
    description: z.string().readonly(),
    require: z.object({
      subscribe: z.boolean(),
      like: z.boolean(),
      comment: z.boolean(),
      notification: z.boolean(),
      mission: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal("none"),
    require: z.object({
      mission: z.boolean(),
    })
  }),
]);

export const eventFormSchema = z
  .object({
    // -----------------
    // events schema (should be same with src/db/schema.ts)
    title: z.string().min(1).max(256).trim(),
    description: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    thumbnailURL: imageAttachmentSchema.nullable(),
    origin: originSchema,
    canModifyJoin: z.boolean(),
    // -----------------
    content: contentSchema,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "종료 날짜는 시작 날짜보다 나중이어야 합니다.",
    path: ["endDate"],
  });

export type EventFormSchema = z.infer<typeof eventFormSchema>;

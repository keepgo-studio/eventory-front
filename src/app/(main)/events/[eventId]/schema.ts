import { z } from "zod";

const baseSchema = z.object({
  id: z.number(),
  required: z.boolean()
});

const textSchema = baseSchema.extend({
  type: z.literal("text"),
  value: z.string().max(256)
});

const textareaSchema = baseSchema.extend({
  type: z.literal("textarea"),
  value: z.string(),
});

const descriptionSchema = baseSchema.extend({
  type: z.literal("description"),
});

const radioSchema = baseSchema.extend({
  type: z.literal("radio"),
  selectIdx: z.number().int().nullable()
});

const selectSchema = baseSchema.extend({
  type: z.literal("select"),
  selectIdxList: z.array(z.number().int())
});

export const joinFormSchema = z.object({
  blocks: z.array(
    z.discriminatedUnion("type", [
      textSchema,
      textareaSchema,
      descriptionSchema,
      radioSchema,
      selectSchema
    ]).superRefine((block, ctx) => {
      if (!block.required) return;

      switch (block.type) {
        case "text":
        case "textarea":
          if (!block.value || block.value.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "내용을 입력해주세요",
              path: ["value"],
            });
          }
          break;
        case "radio":
          if (block.selectIdx === null || block.selectIdx === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "하나를 선택해주세요",
              path: ["selectIdx"],
            });
          }
          break;
        case "select":
          if (block.selectIdxList.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "하나 이상 선택해주세요",
              path: ["selectIdxList"],
            });
          }
          break;
      }
    })
  )
});

export type JoinFormSchema = z.infer<typeof joinFormSchema>;
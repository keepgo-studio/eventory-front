"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ImageUploader from "./ImageUploader";
import { Button } from "@/components/ui/button";
import type { BlockProps } from "./Block";
import { Textarea } from "@/components/ui/textarea";

export default function BlockDescription({ index, remove }: BlockProps) {
  const { control } = useFormContext();

  return (
    <div className="border p-4 rounded space-y-4 bg-white">
      {/* label */}
      <FormField
        control={control}
        name={`content.blocks.${index}.label` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description Label</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* value */}
      <FormField
        control={control}
        name={`content.blocks.${index}.value` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>설명 텍스트</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* preview image */}
      <Controller
        control={control}
        name={`content.blocks.${index}.previewImage` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preview Image</FormLabel>
            <FormControl>
              <ImageUploader
                path={"images"}
                onUploadComplete={(url) =>
                  field.onChange(url === null ? null : { url })
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* remove */}
      <div className="pt-2">
        <Button type="button" variant="outline" onClick={remove}>
          Remove
        </Button>
      </div>
    </div>
  );
}

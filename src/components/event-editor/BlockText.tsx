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
import { Button } from "@/components/ui/button";
import ImageUploader from "./ImageUploader";
import type { BlockProps } from "./Block";
import { Switch } from "@/components/ui/switch";

export default function BlockText({ index, remove }: BlockProps) {
  const { control } = useFormContext();

  return (
    <div
      className="border p-4 rounded space-y-4 bg-white shadow-sm"
      data-block-id={index}
    >
      {/* label */}
      <FormField
        control={control}
        name={`content.blocks.${index}.label` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input placeholder="예: 이름을 입력하세요" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* required */}
      <FormField
        control={control}
        name={`content.blocks.${index}.required` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Required</FormLabel>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* placeholder */}
      <FormField
        control={control}
        name={`content.blocks.${index}.placeholder` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Placeholder</FormLabel>
            <FormControl>
              <Input placeholder="예: 홍길동" {...field} />
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

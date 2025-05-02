"use client";

import type { BlockProps } from "./Block";
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
import { Switch } from "@/components/ui/switch";

export default function BlockTextarea({ index, remove }: BlockProps) {
  const { control } = useFormContext();

  return (
    <div className="border p-4 rounded space-y-4 bg-white">
      {/* label */}
      <FormField
        control={control}
        name={`content.blocks.${index}.label` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Textarea Label</FormLabel>
            <FormControl>
              <Input {...field} />
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
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* max length */}
      <FormField
        control={control}
        name={`content.blocks.${index}.maxLength` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max Length</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
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

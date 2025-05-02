"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { initialBlockMap } from "./utils";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "@/components/SortableItem";
import { OPTIONS_MIN } from "./schema";

export default function BlockSelect({ index, remove }: BlockProps) {
  const { control } = useFormContext();
  const optionArray = useFieldArray({
    control,
    name: `content.blocks.${index}.options`,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = optionArray.fields.findIndex((f) => f.id === active.id);
    const newIndex = optionArray.fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1)
      optionArray.move(oldIndex, newIndex);
  }


  const itemCount = optionArray.fields.length;
  const isValidLength = itemCount < OPTIONS_MIN;

  return (
    <div className="border p-4 rounded space-y-4 bg-white">
      {/* label */}
      <FormField
        control={control}
        name={`content.blocks.${index}.label` as const}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Label</FormLabel>
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

      {/* options */}
      <FormField
        control={control}
        name={`content.blocks.${index}.options`}
        render={() => (
          <FormItem>
            {isValidLength && (
              <p className="text-sm text-destructive">
                최소 {OPTIONS_MIN}개 필요합니다
              </p>
            )}

            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={optionArray.fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {optionArray.fields.map((field, optIdx) => (
                    <SortableItem 
                      key={`${field.id}-${optIdx}`} 
                      id={field.id}
                    >
                      <div className="flex items-center gap-4">
                        <FormField
                          control={control}
                          name={`content.blocks.${index}.options.${optIdx}.value` as const}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Options {optIdx + 1}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Controller
                          control={control}
                          name={`content.blocks.${index}.options.${optIdx}.previewImage` as const}
                          render={({ field }) => (
                            <ImageUploader
                              path="images"
                              onUploadComplete={(url) =>
                                field.onChange(url === null ? null : { url })
                              }
                            />
                          )}
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => optionArray.remove(optIdx)}
                        >
                          -
                        </Button>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <Button
              type="button"
              onClick={() =>
                optionArray.append({
                  ...initialBlockMap.select.options[0],
                })
              }
            >
              + Option
            </Button>
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
                path="images"
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

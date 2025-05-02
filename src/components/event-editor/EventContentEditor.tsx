"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { blockTypes, initialBlockMap } from "./utils";
import Block from "./Block";
import type { EventFormSchema } from "./schema";
import { jsonCopy } from "@/lib/web-utils";
import type { DZ_EventContentBlockTypes } from "@/db/types";
import dynamic from "next/dynamic";

const SortableItem = dynamic(() => import('@/components/SortableItem'), {
  ssr: false,
});

const MAX_ITEMS_CNT = 50;

export default function EventContentEditor() {
  const { control } = useFormContext<EventFormSchema>();
  const { fields, remove, move, append } = useFieldArray({
    control,
    name: "content.blocks",
  });

  const itemCount = fields.length;
  const isLimit = itemCount === MAX_ITEMS_CNT;

  const lastBlockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    lastBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [fields.length]);

  // ----------------------------
  // for darg and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const activeField = fields.find((f) => f.id === activeId);
  const activeIndex = fields.findIndex((f) => f.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      move(oldIndex, newIndex);
    }
  }

  function handleAppend(type: DZ_EventContentBlockTypes) {
    append(jsonCopy(initialBlockMap[type]));
  }
  // ----------------------------


  return (
    <div className="space-y-4 max-w-5xl m-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {fields.map((field, index) => (
            <div key={`${field.id}-${index}`} ref={index === fields.length - 1 ? lastBlockRef : null}>
              <SortableItem id={field.id}>
                <Block
                  index={index}
                  type={field.type}
                  remove={() => remove(index)}
                />
              </SortableItem>
            </div>
          ))}
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "1",
                },
              },
            }),
          }}
        >
          {activeField ? (
            <SortableItem id="drag-overlay">
              <Block
                index={activeIndex}
                type={activeField.type}
                remove={() => {}}
              />
            </SortableItem>
          ) : null}
        </DragOverlay>
      </DndContext>

      {isLimit && (
        <p className="text-sm text-destructive">
          최대 {MAX_ITEMS_CNT}개 항목까지만 추가할 수 있습니다.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        {blockTypes.map((type) => (
          <Button
            key={type}
            type="button"
            disabled={isLimit}
            onClick={() => handleAppend(type)}
          >
            + {type}
          </Button>
        ))}
      </div>
    </div>
  );
}

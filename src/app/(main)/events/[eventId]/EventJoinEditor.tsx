"use client";

import React from "react";
import { useForm, useFormContext } from "react-hook-form";
import { joinFormSchema, type JoinFormSchema } from "./schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createJoinEvent, type ReadEventContents } from "./api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SmartImage from "@/components/SmartImage";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAtom } from "jotai";
import { eventAtom } from "./context";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";


type BlockProps = {
  index: number;
  block: ReadEventContents[number];
};

function BlockText({ index, block }: BlockProps) {
  const { control } = useFormContext<JoinFormSchema>();

  return (
    <FormField
      control={control}
      name={`blocks.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{block.label}</FormLabel>
          <FormControl>
            <Input
              placeholder={block.textPlaceholder ?? undefined}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function BlockTextarea({ index, block }: BlockProps) {
  const { control } = useFormContext<JoinFormSchema>();

  return (
    <FormField
      control={control}
      name={`blocks.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{block.label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={block.textareaPlaceholder ?? undefined}
              {...field}
              maxLength={block.textareaMaxLength ?? undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function BlockDescription({ index, block }: BlockProps) {
  return (
    <Card>
      <CardHeader>{block.label}</CardHeader>
      <CardContent>{block.descriptionValue}</CardContent>
    </Card>
  );
}

function BlockRadio({ index, block }: BlockProps) {
  const { control } = useFormContext<JoinFormSchema>();

  return (
    <FormField
      control={control}
      name={`blocks.${index}.selectIdx`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{block.label}</FormLabel>

          <RadioGroup value={String(field.value)}>
            {block.eventContentBlockOptions.map((opt, idx) => (
              <FormItem
                key={`${opt.value}-${idx}`}
                className="flex items-center space-x-2"
              >
                <FormControl>
                  <RadioGroupItem 
                    value={String(idx)}
                    onClick={() => field.onChange(field.value === idx ? null : idx)}
                  />
                </FormControl>
                <FormLabel>{opt.value}</FormLabel>
              </FormItem>
            ))}
          </RadioGroup>
        </FormItem>
      )}
    />
  );
}

function BlockSelect({ index, block }: BlockProps) {
  const { control } = useFormContext<JoinFormSchema>();

  return (
    <FormField
      control={control}
      name={`blocks.${index}.selectIdxList`}
      render={({ field }) => {
        const selected = new Set(field.value ?? []);

        const toggle = (idx: number) => {
          if (selected.has(idx)) {
            selected.delete(idx);
          } else {
            selected.add(idx);
          }
          field.onChange([...selected]);
        };

        return (
          <Card>
            <CardHeader>{block.label}</CardHeader>
            <CardContent className="space-y-2">
              {block.eventContentBlockOptions.map((opt, idx) => {
                const isChecked = selected.has(idx);

                return (
                  <FormItem key={`${opt.value}-${idx}`} className="flex items-center">
                    <FormControl>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggle(idx)}
                      />
                    </FormControl>
                    <FormLabel>{opt.value}</FormLabel>
                  </FormItem>
                );
              })}
            </CardContent>
            <FormMessage />
          </Card>
        );
      }}
    />
  );
}

function ImageAttachment({ src }: { src: string }) {
  return <SmartImage className="aspect-square w-80" src={src} alt="preview image" />;
}

function parseContentToZod(content: ReadEventContents): JoinFormSchema {
  return {
    blocks: content
      .map((block) => {
        const opt: JoinFormSchema["blocks"][number] =
          block.type === "text"
            ? { id: block.id, type: "text", required: block.required, value: "" }
            : block.type === "textarea"
            ? { id: block.id, type: "textarea", required: block.required, value: "" }
            : block.type === "description"
            ? { id: block.id, type: "description", required: block.required }
            : block.type === "radio"
            ? { id: block.id, type: "radio", required: block.required, selectIdx: null }
            : block.type === "select"
            ? { id: block.id, type: "select", required: block.required, selectIdxList: [] }
            : (() => {
                throw new Error(`Unsupported block type: ${block.type}`);
              })();

        return opt;
      }),
  };
}

type JoinFormProps = {
  content: ReadEventContents;
};

// TODO: 버튼 disabled 필요, machine으로 구현하기
// TODO: hasJoined 확인 필요
// TODO: modify 가능하면 업데이트 가능하게
export default function EventJoinEditor({ content }: JoinFormProps) {
  const form = useForm<JoinFormSchema>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: parseContentToZod(content),
  });

  const [event] = useAtom(eventAtom);
  const { user, youtubeInfo, logout } = useAuth();

  const onSubmit = async (data: JoinFormSchema) => {
    if (!event || !user) return;

    if (event.originType === "youtube" && !youtubeInfo) {
      toast.error(
        <>
          <p>유튜브 정보를 불러올 수 없습니다.</p>
          <p>로그아웃 후 다시 로그인 해주세요.</p>
          <div className="h-2"/>
          <Button onClick={() => logout()}>Logout</Button>
        </>
      );
      return;
    }

    try {
      await createJoinEvent(event, data, { 
        participantUid: user.uid, 
        youtubeChannelId: youtubeInfo?.channelId ?? null,
      });
      toast.success("✅ 신청이 완료되었습니다.");
    } catch (err) {
      console.error(err);

      if (err instanceof Error && err.message === "Event version mismatch") {
        toast.error("❌ 신청에 실패했습니다. 이벤트가 업데이트되었습니다.");
        // Modal
        return;
      }
      toast.error("❌ 신청에 실패했습니다.");
    }
  };

  const onError = (errors: typeof form.formState.errors) => {
    console.log("error", errors);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
        {content.map((block, index) => (
          <div key={block.id}>
            {block.type}

            {block.previewImageURL && (
              <ImageAttachment src={block.previewImageURL} />
            )}

            {block.required && <Badge>Required</Badge>}

            {block.type === "text" ? (
              <BlockText index={index} block={block} />
            ) : block.type === "textarea" ? (
              <BlockTextarea index={index} block={block} />
            ) : block.type === "description" ? (
              <BlockDescription index={index} block={block} />
            ) : block.type === "radio" ? (
              <BlockRadio index={index} block={block} />
            ) : block.type === "select" ? (
              <BlockSelect index={index} block={block} />
            ) : (
              <></>
            )}
          </div>
        ))}

        <Button type="submit">참가하기</Button>
      </form>
    </Form>
  );
}

"use client"

import React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import EventContentEditor from "./EventContentEditor";
import { createEventSQL, updateEventSQL } from "./api";
import { eventFormSchema, type EventFormSchema } from "./schema";
import ImageUploader from "./ImageUploader";
import EventOriginEditor from "./EventOriginEditor";
import { initialOriginMap } from "./utils";
import { devLog, jsonCopy } from "@/lib/web-utils";
import { toast } from "sonner";
import { IS_DEV } from "@/lib/vars";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useNav } from "@/hooks/use-nav";
import { Switch } from "../ui/switch";


// [ ]: thumbnailURL origin 에서 가져올 수 있도록
// [ ]: update diff 확인 필요
// [ ]: mission을 content 와 연결할 필요가 있음
export default function EventEditor({
  initEventId,
  initData
}: {
  initEventId?: number;
  initData?: EventFormSchema;
}) {
  const { user } = useAuth();
  const { navigate} = useNav();
  const router = useRouter();

  const form = useForm<EventFormSchema>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: initData ? initData.title : "",
      description: "",
      startDate: initData ? new Date(initData.startDate) : new Date(),
      endDate: initData ? new Date(initData.endDate) : new Date(),
      thumbnailURL: initData ? initData.thumbnailURL : null,
      origin: initData ? initData.origin : jsonCopy(initialOriginMap["none"]),
      canModifyJoin: initData ? initData.canModifyJoin : false,
      content: initData ? jsonCopy(initData.content) : { blocks: [] },
    },
  });

  async function handleSubmit(data: EventFormSchema) {
    if (!user) return;

    let eventId;
    // mode: create new event
    // if initEventId is not provided, create new event
    if (!initEventId) {
      // fetch
      try {
        eventId = await createEventSQL(user, data);
        toast.success("🔥 이벤트가 생성되었습니다.");
        devLog("INFO", "Drizzle", "Event 생성 성공");
      } catch (err) {
        toast.error("❌ 이벤트가 생성이 실패하였습니다.");
        devLog("ERROR", "Drizzle", `Event 생성 실패.\n${JSON.stringify(err)}`)
      }
    } 
    // mode: update event
    else {
      try {
        eventId = await updateEventSQL(initEventId, data);
        toast.success("🔥 이벤트가 수정되었습니다.");
      } catch (err) {
        toast.error("❌ 이벤트 수정이 실패하였습니다.");
        devLog("ERROR", "Drizzle", `Event 수정 실패.\n${JSON.stringify(err)}`)
      }
    }

    if (eventId) {
      router.push(navigate("/events/:eventId", String(eventId)));
    }
  }

  function handleError(errors: typeof form.formState.errors) {
    if (IS_DEV) {
      console.log(errors);
    }
  
    const firstError = Object.values(errors)[0];
    if (firstError?.message) {
      toast.error(firstError.message.toString());
    } else {
      toast.error("폼 입력을 확인해주세요.");
    }
  }

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(handleSubmit, handleError)}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="thumbnailURL"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail image</FormLabel>
                <FormControl>
                  <ImageUploader
                    path={'images'}
                    onUploadComplete={(url) =>
                      field.onChange(url === null ? null : { url })
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <FormDescription>시작날짜를 설정하세요</FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <FormDescription>종료날짜를 설정하세요</FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormField
            control={form.control}
            name="canModifyJoin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Can Modify join?</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <FormLabel>참여 조건 설정</FormLabel>
          <EventOriginEditor />
        </div>

        <div className="max-w-5xl m-auto">
          <FormLabel>Content blocks</FormLabel>
          <EventContentEditor />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  );
}

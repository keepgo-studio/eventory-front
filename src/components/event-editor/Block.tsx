'use client'

import React from "react";
import BlockText from "./BlockText";
import BlockTextarea from "./BlockTextarea";
import BlockSelect from "./BlockSelect";
import BlockRadio from "./BlockRadio";
import BlockDescription from "./BlockDescription";
import type { DZ_EventContentBlockTypes } from "@/db/types";

export type BlockProps = {
  index: number;
  remove: () => void;
};

// content block renderer
export default function Block({
  type,
  ...props
}: { type: DZ_EventContentBlockTypes } & BlockProps) {
  switch (type) {
    case "text":
      return <BlockText {...props} />;
    case "textarea":
      return <BlockTextarea {...props} />;
    case "select":
      return <BlockSelect {...props} />;
    case "radio":
      return <BlockRadio {...props} />;
    case "description":
      return <BlockDescription {...props} />;
    default:
      return null;
  }
}

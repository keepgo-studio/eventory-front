import type { DZ_Event } from "@/db/types";
import { atom } from "jotai";

export const eventAtom = atom<DZ_Event | null>(null);
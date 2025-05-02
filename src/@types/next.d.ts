import type { SearchParams } from "next/dist/server/request/search-params";

export type SSGParms<T extends Record<string, any>> = {
  params: Promise<T>;
  searchParams: SearchParams;
}
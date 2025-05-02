import { resolvePathWithParams } from "@/lib/utils";
import { REDIRECT_TO_KEY } from "@/lib/vars";

export const routes = [
  "/" as const,
  "/login",
  `/login?${REDIRECT_TO_KEY}`,
  "/events",
  "/events/form/new",
  "/events/form/edit?eventId",
  "/events/:eventId",
  "/events/stats",
  "/chats",
  "/stats",
  "/rewards",
  "/settings",
] as const;

export type SupportRoutePath = (typeof routes)[number];

type ExtractPathParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? [string, ...ExtractPathParams<`/${Rest}`>]
    : T extends `${string}:${infer Param}`
    ? [string]
    : [];

type ExtractQueryParams<T extends string> = T extends `${string}?${infer Query}`
  ? Query extends `${infer Key}&${infer Rest}`
    ? Key | ExtractQueryParams<`?${Rest}`>
    : Query
  : never;

type NavigateArgs<T extends SupportRoutePath> =
  ExtractQueryParams<T> extends never
    ? ExtractPathParams<T> extends []
      ? [] // no params, no segments
      : [...ExtractPathParams<T>]
    : ExtractPathParams<T> extends []
    ? [params: Record<ExtractQueryParams<T>, string>]
    : [params: Record<ExtractQueryParams<T>, string>, ...ExtractPathParams<T>];

function extractQueryParams(path: string): string[] {
  const parts = path.split("?");
  if (parts.length < 2) return [];
  return parts[1].split("&");
}

export function useNav() {
  /**
   * Generates a URL path based on a base route, optional path segments, and query parameters.
   *
   * ### Examples
   * ```ts
   * navigate("/login");
   * navigate("/events/:eventId", eventId);
   * navigate("/events", { page: 2 });
   * navigate("/events/:eventId/stats", { mode: "default" }, eventId);
   * ```
   *
   * @param path - The base route path (must be a valid `SupportRoutePath`).
   * @param paramsOrSegment - Either a query parameters object or the first additional path segment.
   * @param segments - Additional path segments to append to the route.
   *
   * @returns A complete URL string with all segments and query parameters properly resolved.
   */
  const navigate = <T extends SupportRoutePath>(
    path: T,
    ...args: NavigateArgs<T>
  ): string => {
    const queryKeys = extractQueryParams(path);

    let queryParams: Record<string, string> | undefined;
    let segments: string[] = [];

    if (queryKeys.length > 0) {
      queryParams = args[0] as Record<string, string>;
      segments = args.slice(1) as string[];
    } else {
      segments = args as string[];
    }

    return resolvePathWithParams(path, segments, queryParams);
  };

  return { navigate };
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UrlParamsSchema = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
    z.null(),
    z.undefined()
  ])
).optional();

export function generateUrlWithParams(
  url: string,
  params: unknown
): string {
  const parsedParams = UrlParamsSchema.parse(params) ?? {};

  const queryString = Object.keys(parsedParams)
    .filter((key) => parsedParams[key] !== undefined && parsedParams[key] !== null)
    .map((key) => {
      const value = parsedParams[key];

      if (Array.isArray(value)) {
        return value
          .map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
          .join("&");
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");

  return queryString ? `${url}?${queryString}` : url;
}

/**
 * 경로 템플릿과 세그먼트를 사용하여 실제 경로를 생성합니다.
 * @param pathTemplate 경로 템플릿 (예: 'events/:eventId/participants/:participantId')
 * @param segments 경로에 삽입될 값들의 배열
 * @returns 실제 경로 문자열
 */
export function resolvePath(template: string, values: string[]): string {
  const regex = /:([a-zA-Z0-9_]+)/g;
  const matches = [...template.matchAll(regex)];
  
  if (matches.length !== values.length) {
    throw new Error(`템플릿 변수 개수(${matches.length})와 값 개수(${values.length})가 일치하지 않습니다.`);
  }

  let i = 0;

  return template.replace(regex, () => {
    const val = values[i++];
    
    if (typeof val !== 'string') {
      throw new Error(`값 #${i}은 문자열이어야 합니다. 받은 값: ${val}`);
    }

    return val;
  });
}

export function resolvePathWithParams(template: string, values: string[], params?: Record<string, string>): string {
  const pathParamRegex = /:([a-zA-Z0-9_]+)/g;
  const queryParamRegex = /\?([a-zA-Z0-9_]+)/g;

  const pathMatches = [...template.matchAll(pathParamRegex)];
  const queryMatches = [...template.matchAll(queryParamRegex)];

  if (pathMatches.length !== values.length) {
    throw new Error(`경로 변수 개수(${pathMatches.length})와 값 개수(${values.length})가 일치하지 않습니다.`);
  }

  // 경로 변수 대체
  let i = 0;
  let result = template.replace(pathParamRegex, () => {
    const val = values[i++];
    if (typeof val !== "string") {
      throw new Error(`값 #${i}은 문자열이어야 합니다. 받은 값: ${val}`);
    }
    return val;
  });

  // 쿼리 변수 확인
  for (const match of queryMatches) {
    const key = match[1];
    if (!params || !(key in params)) {
      throw new Error(`쿼리 파라미터 "${key}"가 필요하지만 제공되지 않았습니다.`);
    }
  }

  // 쿼리 변수 제거 (실제 URL에서 ?표시는 generate 단계에서 처리)
  result = result.replace(queryParamRegex, "");

  return generateUrlWithParams(result, params);
}

export function minMax(min: number, n: number, max: number) {
  if (n < min) return min;
  else if (n > max) return max;
  return n;
}
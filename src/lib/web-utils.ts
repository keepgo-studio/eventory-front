"use client"

type LogLevel = "INFO" | "DEBUG" | "WARN" | "ERROR";

type LogScope = "Firestore" | "Auth" | "LocalStorage" | "Functions" | "Drizzle";

export function devLog(
  level: LogLevel,
  scope: LogScope,
  message: string,
  data?: any
) {
  const prefix = `[${level}]-[${scope}]-[${new Date().toISOString()}]:`;

  switch (level) {
    case "INFO":
      console.info(`${prefix} ${message}`, data ?? "");
      break;
    case "DEBUG":
      console.debug(`${prefix} ${message}`, data ?? "");
      break;
    case "WARN":
      console.warn(`${prefix} ${message}`, data ?? "");
      break;
    case "ERROR":
      console.error(`${prefix} ${message}`, data ?? "");
      break;
    default:
      console.log(`${prefix} ${message}`, data ?? "");
  }
}

export function formatFileSize(file: File, decimals: number = 2) {
  const bytes = file.size;
  
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${parseFloat(size.toFixed(decimals))} ${sizes[i]}`;
}

export function jsonCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

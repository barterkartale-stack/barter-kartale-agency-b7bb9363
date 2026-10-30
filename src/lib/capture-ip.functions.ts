import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

// Replaces the old capture-ip edge function: returns the caller's IP for fraud logging.
export const captureIp = createServerFn({ method: "GET" }).handler(async () => {
  const forwarded = getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for");
  const realIp = getRequestHeader("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || null;
  return { ip };
});

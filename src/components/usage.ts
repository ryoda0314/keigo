"use client";

// 使われ方の数: how many devices use this app, counted as ことのね counts its own (its src/util/usage.ts), for ことのあめ's
// admin screen. What goes: this app's name, a number made on this device (a random UUID, tied to no person and no
// account), the kind (lib/usage.ts: opened, a rain finished, a sentence taken in) and whether it was opened from the home
// screen. Nothing else: no account, name, email or sentence. A plain fetch with the anon key to ことのあめ's pl_app_ping
// (../polylinga/supabase/migrations/20261103000000_app_usage.sql), never sync.ts's Supabase client, so a signed-in
// learner's token does not go with it. Only on the public address (NEXT_PUBLIC_SITE_URL), never waited for, and nothing
// happens when it cannot be sent. The learner switches it off in 設定 (SEND_USAGE).
import { APP } from "@/lib/connect";
import { countsHere, type UsageKind } from "@/lib/usage";
import { prefNow } from "./local";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://keigo-green.vercel.app";
// Beside the record's keigo:v1 and local.ts's keigo: preferences.
const DEVICE = "keigo:device";
/** 設定's 使われ方の数を送る, a usePref key (keigo:sendUsage): "0" once the learner switched it off. */
export const SEND_USAGE = "sendUsage";

function deviceId(): string | null {
  try {
    let id = localStorage.getItem(DEVICE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE, id);
    }
    return id;
  } catch {
    // Storage refused (a private window): nothing is counted.
    return null;
  }
}

function standalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

/** Counts one (not waited for). */
export function countUsage(kind: UsageKind): void {
  if (typeof window === "undefined" || !URL_ || !KEY) return;
  if (!countsHere(location.origin, SITE, process.env.NODE_ENV === "production") || !prefNow(SEND_USAGE, true)) return;
  const device = deviceId();
  if (!device) return;
  fetch(`${URL_}/rest/v1/rpc/pl_app_ping`, {
    method: "POST",
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_app: APP, p_device: device, p_kind: kind, p_standalone: standalone() }),
    keepalive: true,
  }).catch(() => {
    // Not counted, that is all.
  });
}

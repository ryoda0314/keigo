"use client";

import { useEffect } from "react";
import { countUsage } from "@/components/usage";

// Once a page load: going back to the intro and into the app again (the layout mounted anew) is the same opening.
let counted = false;

/** When the app opens, it is counted as opened (components/usage.ts). */
export function CountOpen() {
  useEffect(() => {
    if (counted) return;
    counted = true;
    countUsage("open");
  }, []);
  return null;
}

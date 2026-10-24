"use client";

import { sceneById } from "@/content/index.ts";
import { lineSound, play } from "@/components/audio";
import { prefNow } from "@/components/local";
import { recordVisit, setCurrent } from "@/lib/record";
import { commit } from "@/lib/store";

/**
 * Moves to a scene: it counts as an activity, and the words in the person's line are met (the samples' only when
 * opened). From a tap, the line is heard at once.
 */
export function goToScene(id: string, hear = false) {
  const scene = sceneById(id);
  if (!scene) return;
  const keys = (scene.line.marks ?? []).map((m) => m.word);
  commit((s) => recordVisit(setCurrent(s, { scene: id, sceneThread: undefined }), "scene", id, Date.now(), keys));
  if (hear && prefNow("sound", true)) void play(lineSound(scene.line), scene.line.ko);
}

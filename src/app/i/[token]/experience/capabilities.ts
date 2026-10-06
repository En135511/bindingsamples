"use client";

import { useSyncExternalStore } from "react";

export type Mode = "3d" | "2d" | "static";

let webgl: boolean | null = null;
function hasWebGL() {
  if (webgl === null) {
    try {
      const canvas = document.createElement("canvas");
      webgl = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMode(): Mode {
  if (window.matchMedia(REDUCED).matches) return "static";
  return hasWebGL() ? "3d" : "2d";
}

/**
 * How rich the invitation can be on this device: full 3D, the CSS-animated version,
 * or no motion at all. `null` while rendering on the server.
 */
export function useExperienceMode(): Mode | null {
  return useSyncExternalStore(subscribe, getMode, () => null);
}

/** iOS asks permission for motion sensors; must be called from a tap. */
export function requestMotionPermission() {
  const DOE = (globalThis as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } })
    .DeviceOrientationEvent;
  DOE?.requestPermission?.().catch(() => {});
}

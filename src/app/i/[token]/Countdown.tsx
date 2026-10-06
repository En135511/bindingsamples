"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
// Minute resolution keeps the snapshot stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / 60_000);
const getServerSnapshot = () => null;

export function Countdown({ startsAtIso }: { startsAtIso: string }) {
  const nowMinute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (nowMinute === null) return <div className="h-16" />;

  const minutesLeft = Math.floor(new Date(startsAtIso).getTime() / 60_000) - nowMinute;
  if (minutesLeft <= 0) {
    return <p className="font-serif text-lg text-navy-900 italic">The celebration has begun! 🎉</p>;
  }

  const units = [
    { label: "Days", value: Math.floor(minutesLeft / 1440) },
    { label: "Hours", value: Math.floor((minutesLeft % 1440) / 60) },
    { label: "Minutes", value: minutesLeft % 60 },
  ];

  return (
    <div className="flex justify-center gap-3" aria-label="Time until the celebration">
      {units.map((u) => (
        <div key={u.label} className="w-20 rounded-md bg-navy-900 px-2 py-2 text-gold-300">
          <p className="font-serif text-2xl tabular-nums">{u.value}</p>
          <p className="text-[10px] tracking-[0.2em] text-gold-200/70 uppercase">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

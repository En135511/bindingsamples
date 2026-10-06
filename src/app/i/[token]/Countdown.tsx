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
    return <p className="gold-text font-serif text-xl italic">The celebration has begun! 🎉</p>;
  }

  const units = [
    { label: "Days", value: Math.floor(minutesLeft / 1440) },
    { label: "Hours", value: Math.floor((minutesLeft % 1440) / 60) },
    { label: "Minutes", value: minutesLeft % 60 },
  ];

  return (
    <div className="flex justify-center gap-3" aria-label="Time until the celebration">
      {units.map((u) => (
        <div key={u.label} className="gold-foil w-20 rounded-xl p-[2px] shadow-[0_6px_16px_-6px_rgba(120,85,25,0.5)]">
          <div className="rounded-[10px] bg-gradient-to-b from-white to-cream-100 px-2 pt-2 pb-1.5">
            <p className="font-serif text-3xl font-semibold text-navy-900 tabular-nums">{u.value}</p>
            <p className="text-[10px] font-medium tracking-[0.2em] text-gold-600 uppercase">{u.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

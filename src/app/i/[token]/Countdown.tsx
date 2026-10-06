"use client";

import { useSyncExternalStore } from "react";
import { CountUp } from "./ScrollEffects";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
// Minute resolution keeps the snapshot stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / 60_000);
const getServerSnapshot = () => null;

export function Countdown({ startsAtIso }: { startsAtIso: string }) {
  const nowMinute = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (nowMinute === null) return <div className="h-[5.5rem]" />;

  const minutesLeft = Math.floor(new Date(startsAtIso).getTime() / 60_000) - nowMinute;
  if (minutesLeft <= 0) {
    return <p className="font-body text-2xl text-navy-900 italic">The celebration has begun! 🎉</p>;
  }

  const units = [
    { id: "days", one: "Day", many: "Days", value: Math.floor(minutesLeft / 1440) },
    { id: "hours", one: "Hour", many: "Hours", value: Math.floor((minutesLeft % 1440) / 60) },
    { id: "minutes", one: "Minute", many: "Minutes", value: minutesLeft % 60 },
  ].map((u) => ({ ...u, label: u.value === 1 ? u.one : u.many }));
  const spoken = units.map((u) => `${u.value} ${u.label.toLowerCase()}`).join(", ");

  return (
    <div className="flex justify-center gap-2.5 sm:gap-4">
      {/* Read this instead of the animated tiles, which screen readers skip. */}
      <p className="sr-only">Time until the celebration: {spoken}.</p>
      {units.map((u) => (
        <div
          key={u.id}
          aria-hidden="true"
          className="w-[5.25rem] rounded-md bg-navy-900 px-2 pt-3 pb-2 text-gold-300 shadow-[inset_0_0_0_1px_rgba(201,162,77,0.35)] sm:w-24"
        >
          <CountUp
            value={u.value}
            className="block font-serif text-[2rem] leading-none [font-variant-numeric:lining-nums_tabular-nums] sm:text-4xl"
          />
          <p className="mt-1.5 text-[10px] font-medium tracking-[0.22em] text-gold-200/75 uppercase">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

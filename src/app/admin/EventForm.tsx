"use client";

import { useActionState, useState } from "react";
import type { Event } from "@/db/schema";
import type { FormState } from "./actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  event?: Event;
  submitLabel: string;
};

function Field({
  label,
  name,
  hint,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      <input name={name} className="input" {...rest} />
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

export function EventForm({ action, event, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  // Default a new event to the host's own time zone.
  const [timezone] = useState(
    () => event?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Graduate's name *" name="honoreeName" required defaultValue={event?.honoreeName} />
      <Field
        label="Event title"
        name="title"
        defaultValue={event?.title ?? "Graduation Celebration"}
      />
      <Field
        label="Degree / program"
        name="degree"
        placeholder="Bachelor of Science in Computer Science"
        defaultValue={event?.degree ?? ""}
      />
      <Field label="School" name="school" defaultValue={event?.school ?? ""} />
      <Field
        label="Class of"
        name="classYear"
        placeholder="2026"
        defaultValue={event?.classYear ?? ""}
      />
      <Field
        label="Date & time *"
        name="startsAt"
        type="datetime-local"
        required
        defaultValue={event?.startsAt}
      />
      <Field
        label="Duration (hours)"
        name="durationHours"
        type="number"
        min={0.5}
        step={0.5}
        defaultValue={event ? event.durationMinutes / 60 : 3}
      />
      <Field
        label="Time zone"
        name="timezone"
        defaultValue={timezone}
        hint="e.g. Africa/Nairobi, America/New_York"
        suppressHydrationWarning
      />
      <Field label="Venue name" name="venueName" defaultValue={event?.venueName ?? ""} />
      <Field label="Venue address" name="venueAddress" defaultValue={event?.venueAddress ?? ""} />
      <Field
        label="Map link"
        name="mapUrl"
        type="url"
        hint="Optional. Paste a Google Maps link; otherwise one is made from the address."
        defaultValue={event?.mapUrl ?? ""}
      />
      <Field
        label="Dress code"
        name="dressCode"
        placeholder="Smart casual"
        defaultValue={event?.dressCode ?? ""}
      />
      <Field label="RSVP by" name="rsvpBy" type="date" defaultValue={event?.rsvpBy ?? ""} />
      <Field
        label="Photo link"
        name="photoUrl"
        type="url"
        hint="Optional. A link to a photo of you, shown on the invitation."
        defaultValue={event?.photoUrl ?? ""}
      />
      <label className="sm:col-span-2">
        <span className="label">Personal message</span>
        <textarea
          name="message"
          rows={4}
          className="input"
          placeholder="After years of hard work, I'm finally graduating! It would mean the world to celebrate with you."
          defaultValue={event?.message ?? ""}
        />
      </label>
      <div className="flex items-center gap-4 sm:col-span-2">
        <button disabled={pending} className="btn-primary">
          {pending ? "Saving…" : submitLabel}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef } from "react";
import type { FormState } from "../../actions";

export function AddGuestsForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <label className="label" htmlFor="guests">
        Add guests — one per line
      </label>
      <textarea
        id="guests"
        name="guests"
        rows={4}
        className="input font-mono"
        placeholder={"Aunt Mary, +254 712 345678, 2\nJohn Otieno\nThe Wanjiru Family, 4"}
      />
      <p className="text-xs text-stone-400">
        Write each name the way you would greet them (“Aunt Mary”, “The Wanjiru Family”). After the name you can add a WhatsApp number (with country code) and how many seats they
        get. Both are optional.
      </p>
      <div className="flex items-center gap-4">
        <button disabled={pending} className="btn-primary">
          {pending ? "Adding…" : "Add guests"}
        </button>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
      </div>
    </form>
  );
}

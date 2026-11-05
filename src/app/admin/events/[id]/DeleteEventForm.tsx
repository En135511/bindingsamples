"use client";

export function DeleteEventForm({ action }: { action: () => Promise<void> }) {
  return <form action={action} onSubmit={(event) => {
    if (!window.confirm("Delete this event and all its guest invitations and responses? This cannot be undone.")) event.preventDefault();
  }}><button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-950">Delete event</button></form>;
}

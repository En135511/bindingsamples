import Link from "next/link";
import { MortarboardIcon } from "@/components/MortarboardIcon";

export default function Home() {
  return (
    <main className="cream-sky flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <MortarboardIcon className="h-14 w-14 text-gold-500" />
      <h1 className="gold-text font-serif text-4xl">Invitations</h1>
      <p className="max-w-sm text-stone-600">
        If you received an invitation, please open the personal link that was sent to you.
      </p>
      <Link href="/admin" className="text-sm text-stone-500 underline-offset-4 hover:underline">
        Host login
      </Link>
    </main>
  );
}

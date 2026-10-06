import { MortarboardIcon } from "@/components/MortarboardIcon";

export default function NotFound() {
  return (
    <main className="night-sky flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <MortarboardIcon className="h-12 w-12 text-gold-400" />
      <h1 className="gold-text font-serif text-3xl">Invitation not found</h1>
      <p className="max-w-sm text-gold-200/80">
        This link doesn&apos;t match any invitation. Please check that you copied the whole link you
        received.
      </p>
    </main>
  );
}

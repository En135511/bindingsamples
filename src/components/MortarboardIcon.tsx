export function MortarboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path d="M32 12 4 24l28 12 28-12-28-12Z" fill="currentColor" />
      <path
        d="M16 30v11c0 4 7.2 8 16 8s16-4 16-8V30l-16 7-16-7Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M56 26v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="56" cy="43" r="3" fill="currentColor" />
    </svg>
  );
}

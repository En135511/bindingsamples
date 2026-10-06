// Gold-foil SVG ornaments for the invitation card.

const FOIL_STOPS = (
  <>
    <stop offset="0%" stopColor="#a87c27" />
    <stop offset="25%" stopColor="#f3e0a6" />
    <stop offset="45%" stopColor="#c9a24d" />
    <stop offset="60%" stopColor="#fff3c4" />
    <stop offset="80%" stopColor="#b8892e" />
    <stop offset="100%" stopColor="#e9cf86" />
  </>
);

function Foil({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        {FOIL_STOPS}
      </linearGradient>
    </defs>
  );
}

/** A filigree flourish for one corner; rotate it for the others. */
export function CornerFlourish({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" fill="none">
      <Foil id="corner-foil" />
      <g stroke="url(#corner-foil)" strokeLinecap="round">
        <path d="M4 96V4h92" strokeWidth="2.5" />
        <path d="M12 80V12h68" strokeWidth="1" />
        <path d="M12 52c0-22 18-40 40-40" strokeWidth="1.5" />
        <path d="M22 44c0-12 10-22 22-22" strokeWidth="1.2" />
        <path d="M12 52c6-2 10-8 8-14M52 12c-2 6-8 10-14 8" strokeWidth="1.2" />
      </g>
      <path d="M22 22l5-9 5 9-5 9z" fill="url(#corner-foil)" transform="rotate(-45 27 22)" />
      <circle cx="44" cy="44" r="2.5" fill="url(#corner-foil)" />
    </svg>
  );
}

/** A laurel wreath — drawn around the graduate's photo. */
export function Laurel({ className }: { className?: string }) {
  const leaves = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + side * (0.42 + i * 0.235);
      const r = 92;
      const x = 100 + Math.cos(a) * r;
      const y = 100 + Math.sin(a) * r;
      // Point each leaf along the wreath (the tangent), angled slightly outward.
      const deg = (a * 180) / Math.PI + side * -22 + (side > 0 ? 180 : 0);
      const scale = 1 - i * 0.03;
      leaves.push(
        <path
          key={`${side}-${i}`}
          d="M0-15C7-7 7 7 0 15C-7 7-7-7 0-15Z"
          transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${scale.toFixed(2)})`}
          fill="url(#laurel-foil)"
        />,
      );
    }
  }
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <Foil id="laurel-foil" />
      <path d="M100 192c-30 0-58-14-74-40M100 192c30 0 58-14 74-40" stroke="url(#laurel-foil)" strokeWidth="2" fill="none" />
      {leaves}
      <path d="M92 190l8 8 8-8-8-6z" fill="url(#laurel-foil)" />
    </svg>
  );
}

/** A gold ribbon banner with folded tails. */
export function Ribbon({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex w-fit items-center">
      <svg viewBox="0 0 40 44" className="-mr-3 h-9 w-8 translate-y-2" aria-hidden="true">
        <Foil id="ribbon-tail-l" />
        <path d="M40 4H0l10 18L0 40h40z" fill="url(#ribbon-tail-l)" />
        <path d="M28 40h12V30z" fill="#7d5c18" />
      </svg>
      <div className="gold-foil relative z-10 px-6 py-2 shadow-[0_4px_12px_rgba(140,100,30,0.35)]">
        <span className="block text-[11px] font-semibold tracking-[0.35em] whitespace-nowrap text-[#4a3510] uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
          {children}
        </span>
      </div>
      <svg viewBox="0 0 40 44" className="-ml-3 h-9 w-8 translate-y-2" aria-hidden="true">
        <Foil id="ribbon-tail-r" />
        <path d="M0 4h40L30 22l10 18H0z" fill="url(#ribbon-tail-r)" />
        <path d="M12 40H0V30z" fill="#7d5c18" />
      </svg>
    </div>
  );
}

/** A scrolling flourish divider with a diamond in the middle. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 24" className={className} aria-hidden="true" fill="none">
      <Foil id="flourish-foil" />
      <g stroke="url(#flourish-foil)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 12h78c10 0 14-8 20-8s8 8 0 8" />
        <path d="M232 12h-78c-10 0-14-8-20-8s-8 8 0 8" />
        <path d="M60 12c6 0 10 6 16 6M180 12c-6 0-10 6-16 6" />
      </g>
      <path d="M120 3l7 9-7 9-7-9z" fill="url(#flourish-foil)" />
      <circle cx="104" cy="12" r="1.8" fill="url(#flourish-foil)" />
      <circle cx="136" cy="12" r="1.8" fill="url(#flourish-foil)" />
    </svg>
  );
}

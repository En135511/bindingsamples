"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/** Fades and rises into place the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "header" | "figure" | "p";
}) {
  const Component = motion[as];
  // With reduce-motion on, show everything straight away instead of fading it in.
  const reduce = useReducedMotion();
  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -4% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Component>
  );
}

/** A gold rule with a diamond that draws itself outward from the centre. */
export function GoldDivider({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const line = {
    initial: reduce ? false : { scaleX: 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true, amount: 1 },
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const },
  };
  return (
    <div className={`flex items-center justify-center gap-3 text-gold-500 ${className}`} aria-hidden="true">
      <motion.span {...line} className="h-px w-20 origin-right bg-gradient-to-r from-transparent to-gold-500 sm:w-28" />
      <motion.span
        // With reduce-motion, start as the finished diamond (rotated), not an unturned square.
        initial={reduce ? { scale: 1, rotate: 45 } : { scale: 0, rotate: 0 }}
        whileInView={{ scale: 1, rotate: 45 }}
        viewport={{ once: true, amount: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="block h-2 w-2 bg-gold-500"
      />
      <motion.span {...line} className="h-px w-20 origin-left bg-gradient-to-l from-transparent to-gold-500 sm:w-28" />
    </div>
  );
}

/** Counts up from zero to `value` when it first comes into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(count, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, count]);

  // With reduce-motion, just show the number — from the very first paint.
  if (reduce) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }
  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}

/** An image that drifts and settles gently as the page scrolls, for depth. */
export function ParallaxImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const reduce = useReducedMotion();
  // Fade in once the image has actually loaded (it may already be cached from the preload).
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // An image cached before hydration fires no load event.
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  const { scrollY } = useScroll();
  // A gentle zoom-out as the page scrolls; never moves the photo, so nothing is uncovered.
  const scale = useTransform(scrollY, [0, 900], [1.05, 1], { clamp: true });
  return (
    <motion.img
      ref={imgRef}
      src={src}
      onLoad={() => setLoaded(true)}
      alt={alt}
      className={className}
      style={reduce ? undefined : { scale }}
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    />
  );
}

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

const slides = [
  { src: "/landing/collage/lagos-landmark.webp", label: "Lagos, Nigeria", sub: "Lekki-Ikoyi Link Bridge" },
  { src: "/landing/collage/india-landmark.webp", label: "India", sub: "Taj Mahal, Agra" },
  { src: "/landing/collage/us-landmark.webp", label: "United States", sub: "New York City skyline" },
  { src: "/landing/collage/london-landmark.webp", label: "London, UK", sub: "Big Ben and Westminster" },
];

export function CorridorSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((p) => (p + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div
      className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-white/10 shadow-2xl shadow-black/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.label}
            fill
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover object-center"
            priority={i === 0}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-linear-to-tr from-navy-950/70 via-navy-950/20 to-transparent pointer-events-none" />

      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-4 max-w-[calc(100%-6rem)] rounded-2xl border border-white/20 bg-black/40 px-4 py-2.5 backdrop-blur-md transition-all duration-500">
        <p className="text-xs font-bold text-white leading-snug">{slides[current].label}</p>
        <p className="mt-0.5 truncate text-[11px] text-white/65">{slides[current].sub}</p>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

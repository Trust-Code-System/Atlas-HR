"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: { container: "h-6 w-6", text: "text-xs" },
  sm: { container: "h-8 w-8", text: "text-xs" },
  md: { container: "h-10 w-10", text: "text-sm" },
  lg: { container: "h-12 w-12", text: "text-base" },
  xl: { container: "h-16 w-16", text: "text-xl" },
};

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { container, text } = sizeMap[size];

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full bg-blue-100 items-center justify-center",
        container,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "Avatar"}
          fill
          className="object-cover"
          sizes="64px"
        />
      ) : (
        <span className={cn("font-semibold text-blue-700 select-none", text)}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

export { Avatar };

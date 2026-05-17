import { cn } from "@/lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
  label?: string;
}

function Separator({
  orientation = "horizontal",
  className,
  label,
}: SeparatorProps) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex-1 h-px bg-navy-200" />
        <span className="text-xs font-medium text-navy-400 whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-navy-200" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        orientation === "horizontal"
          ? "h-px w-full bg-navy-200"
          : "w-px h-full bg-navy-200",
        className
      )}
    />
  );
}

export { Separator };

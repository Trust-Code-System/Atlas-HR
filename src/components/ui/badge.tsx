import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:
      "bg-navy-100 text-navy-700 border-navy-200",
    success:
      "bg-blue-100 text-blue-700 border-blue-200",
    warning:
      "bg-yellow-100 text-yellow-700 border-yellow-200",
    error:
      "bg-red-100 text-red-700 border-red-200",
    info:
      "bg-blue-100 text-blue-700 border-blue-200",
    outline:
      "bg-transparent text-navy-700 border-navy-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

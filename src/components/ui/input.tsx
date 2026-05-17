import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-navy-50 disabled:opacity-60",
          "read-only:bg-navy-50 read-only:cursor-default",
          error && "border-error focus:ring-error",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 transition-colors resize-y",
        "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
        "disabled:cursor-not-allowed disabled:bg-navy-50 disabled:opacity-60",
        error && "border-error focus:ring-error",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Input, Textarea };

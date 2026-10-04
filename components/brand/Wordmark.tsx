import { cn } from "@/utils/cn";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

export function Wordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <span
      className={cn(
        "font-semibold tracking-tight select-none",
        sizeClasses[size],
        className,
      )}
    >
      <span className="text-dark-100">food</span>
      <span className="text-brand-500">.bee</span>
    </span>
  );
}

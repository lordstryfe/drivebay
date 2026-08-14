import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-sm border border-border bg-bg-elevated px-3 text-sm text-fg shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-fg-subtle focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

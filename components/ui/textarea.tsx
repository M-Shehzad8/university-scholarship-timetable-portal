import type { ComponentProps } from "react";

import { controlClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn("min-h-28", controlClassName, className)}
      {...props}
    />
  );
}

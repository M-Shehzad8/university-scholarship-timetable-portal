import type { ComponentProps } from "react";

import { controlClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn("h-10", controlClassName, className)} {...props} />
  );
}

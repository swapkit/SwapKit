import { cn } from "../../../lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sk-ui-animate-pulse sk-ui-rounded-md sk-ui-bg-muted", className)} {...props} />;
}

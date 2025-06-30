import { ReactNode } from "react";
import { cn } from "@/lib/utils"; // optional, fallback to `className` if no util

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

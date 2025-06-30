import React from "react";

export type BadgeProps = {
  variant?: "default" | "outline";
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return <span className={className}>{children}</span>;
}

import React from "react";

export type ButtonProps = {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const variantClasses = variant === "primary" ? "bg-blue-500 text-white" : "bg-gray-300 text-black";
  const sizeClasses = size === "sm" ? "px-2 py-1" : size === "md" ? "px-4 py-2" : "px-6 py-3";
  return (
    <button className={`${variantClasses} ${sizeClasses} ${className}`} {...props}>
      {children}
    </button>
  );
}

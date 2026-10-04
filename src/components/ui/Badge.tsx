import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "success" | "warning" | "danger" | "muted";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "muted",
  children,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-lumera-primary/10 text-lumera-primary border-lumera-primary/20",
    accent: "bg-lumera-accent/15 text-lumera-accent border-lumera-accent/30",
    success: "bg-lumera-success/15 text-lumera-success border-lumera-success/30",
    warning: "bg-lumera-warning/15 text-lumera-warning border-lumera-warning/30",
    danger: "bg-lumera-danger/15 text-lumera-danger border-lumera-danger/30",
    muted: "bg-surface-muted text-lumera-text-muted border-border",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};

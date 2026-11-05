import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "cb-btn cb-btn-primary",
  secondary: "cb-btn cb-btn-secondary",
  ghost: "cb-btn cb-btn-ghost",
  danger: "cb-btn cb-btn-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "cb-btn cb-btn-sm",
  md: "cb-btn cb-btn-md",
  lg: "cb-btn cb-btn-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    "cb-btn",
    variantClass[variant],
    size !== "md" ? sizeClass[size] : "",
    fullWidth ? "cb-btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading ? <span className="cb-spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
}

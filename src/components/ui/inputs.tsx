import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Sprout } from "lucide-react";
import { Button } from "./Button";

/* ---------------------------------------------------------------- Field */

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: FieldProps) {
  return (
    <div className="cb-field">
      <label className="cb-field-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span className="cb-required" aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="cb-field-error" id={`${htmlFor ?? "field"}-error`}>
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="cb-field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- TextInput */

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leadingIcon?: ReactNode;
}

export function TextInput({
  label,
  error,
  hint,
  required,
  leadingIcon,
  id,
  className = "",
  ...rest
}: TextInputProps) {
  const inputId = id ?? rest.name ?? "text-input";
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;
  return (
    <div className="cb-field">
      {label ? (
        <label className="cb-field-label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="cb-required" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="cb-input-wrap">
        {leadingIcon ? <span className="cb-input-icon">{leadingIcon}</span> : null}
        <input
          id={inputId}
          className={`cb-input${leadingIcon ? " has-leading-icon" : ""}${error ? " invalid" : ""} ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
      </div>
      {error ? (
        <p className="cb-field-error" id={`${inputId}-error`}>
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="cb-field-hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- PasswordInput */

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  id?: string;
  className?: string;
  leadingIcon?: ReactNode;
}

export function PasswordInput({
  label,
  error,
  hint,
  required,
  id,
  className = "",
  leadingIcon,
  ...rest
}: PasswordInputProps) {
  const inputId = id ?? "password";
  const [show, setShow] = useState(false);
  const inputType = show ? "text" : "password";
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;
  return (
    <div className="cb-field">
      {label ? (
        <label className="cb-field-label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="cb-required" aria-hidden>
              {" "}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className="cb-input-wrap">
        {leadingIcon ? <span className="cb-input-icon">{leadingIcon}</span> : null}
        <input
          id={inputId}
          type={inputType}
          className={`cb-input${leadingIcon ? " has-leading-icon" : ""}${error ? " invalid" : ""} ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <button
          type="button"
          className="cb-input-trailing"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {error ? (
        <p className="cb-field-error" id={`${inputId}-error`}>
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p className="cb-field-hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Loading */

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="cb-loading" role="status">
      <span className="cb-spinner" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- Empty */

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="cb-empty">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "var(--cb-space-4)",
          color: "var(--cb-green)",
        }}
      >
        {icon ?? <Sprout size={40} aria-hidden />}
      </div>
      <h3>{title}</h3>
      <p className="cb-body-text">{message}</p>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Error */

export function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="cb-field-error" role="alert">
      {message}
    </p>
  );
}

/* ---------------------------------------------------------------- Badge */

export type BadgeVariant = "default" | "soft" | "warning" | "error";

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  const variantClass =
    variant === "default" ? "cb-badge" : `cb-badge cb-badge-${variant}`;
  return <span className={variantClass}>{children}</span>;
}

/* ---------------------------------------------------------------- Progress */

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="cb-flex"
      style={{ flexDirection: "column", gap: "var(--cb-space-2)" }}
    >
      {label ? <span className="cb-progress-label">{label}</span> : null}
      <div
        className="cb-progress"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
      >
        <div className="cb-progress-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Page header */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="cb-flex cb-flex-between cb-flex-center"
      style={{ alignItems: "flex-start", marginBottom: "var(--cb-space-6)" }}
    >
      <div>
        <h1 className="cb-page-title">{title}</h1>
        {subtitle ? (
          <p className="cb-body-text" style={{ marginBottom: 0 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="cb-flex">{actions}</div> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- Submit button */

export function SubmitButton({
  loading,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <Button loading={loading} type="submit" {...rest}>
      {children}
    </Button>
  );
}

export { Loader2 };

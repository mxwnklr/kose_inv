import type {
  PropsWithChildren,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes
} from "react";

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function Panel({
  children,
  className = ""
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface p-4 shadow-panel", className)}>
      {children}
    </section>
  );
}

export function Field({
  label,
  children,
  className = ""
}: PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm text-muted", className)}>
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 rounded-md border border-border bg-white px-3 text-sm text-text outline-none transition-shadow duration-soft focus:border-accent focus:ring-2 focus:ring-accent-soft",
        props.className
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm text-text outline-none transition-shadow duration-soft focus:border-accent focus:ring-2 focus:ring-accent-soft",
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 rounded-md border border-border bg-white px-3 text-sm text-text outline-none transition-shadow duration-soft focus:border-accent focus:ring-2 focus:ring-accent-soft",
        props.className
      )}
    />
  );
}

export function Button({
  children,
  className = "",
  variant = "default",
  ...rest
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "ghost" | "muted";
  }
>) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors duration-soft disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" && "bg-accent text-white hover:bg-[#e64f1b]",
        variant === "ghost" && "border border-border bg-white text-text hover:bg-[#f8fafc]",
        variant === "muted" && "bg-[#f3f4f6] text-text hover:bg-[#e5e7eb]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

import { site } from "@/lib/site";

/** Centered card framing for auth pages. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:py-24">
      <div className="text-center">
        <div className="inline-flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold text-ink">{site.name}</span>
          <span className="font-devanagari text-xl text-crimson">{site.nameNe}</span>
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-ink-soft">{subtitle}</p> : null}
      </div>

      <div className="mt-8 rounded-card border border-line bg-paper p-6 shadow-soft sm:p-8">
        {children}
      </div>
    </div>
  );
}

/** "or" divider between OAuth and the email form. */
export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

import { cn } from "@/lib/utils";

interface RateLimitBannerProps {
  secondsLeft: number;
  className?: string;
}

export function RateLimitBanner({ secondsLeft, className }: RateLimitBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-2xl bg-suya/10 border border-suya/25 p-4 flex items-center gap-3",
        className
      )}
    >
      <div className="relative w-11 h-11 shrink-0">
        <div className="absolute inset-0 rounded-full border-2 border-suya/20" />
        <div
          className="absolute inset-0 rounded-full border-2 border-suya border-t-transparent animate-spin"
          style={{ animationDuration: "1.5s" }}
        />
        <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-suya tabular-nums">
          {secondsLeft}s
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-suya leading-tight">NutriAI is at capacity</p>
        <p className="text-xs text-suya/75 mt-0.5">Retrying automatically in {secondsLeft}s…</p>
      </div>
    </div>
  );
}

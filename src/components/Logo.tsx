import { cn } from "@/lib/utils";

type LogoProps = {
  /** sm = nav/header, md = signed-in dashboard, lg = hero/onboarding */
  size?: "sm" | "md" | "lg";
  /** dark = on Forest Night; light = on Warm White */
  theme?: "dark" | "light";
  /** include the "Your AI nutrition partner" tagline */
  withTagline?: boolean;
  className?: string;
};

const SIZE = {
  sm: { box: "w-9 h-9 rounded-[10px] text-lg",     word: "text-base",  tag: "text-[10px]" },
  md: { box: "w-12 h-12 rounded-[12px] text-2xl",  word: "text-xl",    tag: "text-xs" },
  lg: { box: "w-16 h-16 rounded-[16px] text-3xl",  word: "text-3xl",   tag: "text-sm" },
};

export function Logo({ size = "sm", theme = "dark", withTagline = false, className }: LogoProps) {
  const s = SIZE[size];
  const wordColor = theme === "dark" ? "text-warm-white" : "text-forest";
  const tagColor  = theme === "dark" ? "text-vitality-l" : "text-muted";

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          s.box,
          "bg-vitality grid place-items-center font-semibold text-forest leading-none shrink-0"
        )}
        aria-hidden
      >
        N
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cn(s.word, "font-semibold tracking-tight", wordColor)}>
          NutriAI
        </span>
        {withTagline && (
          <span className={cn(s.tag, "tracking-wide", tagColor)}>
            Your AI nutrition partner
          </span>
        )}
      </div>
    </div>
  );
}

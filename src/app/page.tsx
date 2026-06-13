"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Sparkles, Camera, MessageSquare, Activity, Flame, Beef, Wheat, Droplet,
  Heart, Sprout, Wallet, ArrowRight,
} from "lucide-react";
import { getProfile } from "@/lib/storage";
import { UserProfile } from "@/lib/types";
import { Badge, BadgeVariant } from "@/components/ui/badge";

const GOAL_LABEL: Record<string, string> = {
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  maintenance: "Maintenance",
  manage_condition: "Managing condition",
  pregnancy_nutrition: "Pregnancy nutrition",
};

const CONDITION_LABEL: Record<string, { label: string; variant: BadgeVariant }> = {
  hypertension:   { label: "Hypertension",     variant: "clinical" },
  diabetes:       { label: "Diabetes",         variant: "clinical" },
  type2_diabetes: { label: "Type 2 Diabetes",  variant: "clinical" },
  pcos:           { label: "PCOS",             variant: "pcos" },
  pregnancy:      { label: "Pregnancy",        variant: "pregnancy" },
  postpartum:     { label: "Postpartum",       variant: "pregnancy" },
  obesity:        { label: "Weight focus",     variant: "vitality" },
  ulcer:          { label: "Ulcer",            variant: "suya" },
  athlete:        { label: "Athlete",          variant: "vitality" },
};

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn) {
      const localProfile = getProfile();
      if (!localProfile) {
        router.push("/onboarding");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(localProfile);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !profile) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-muted text-sm">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-vitality animate-pulse" />
          Setting your table…
        </div>
      </div>
    );
  }

  const cyclePhase = profile.cycle?.current_phase;
  const t = profile.daily_targets;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-forest bg-adire-grid text-warm-white">
        <div className="max-w-5xl mx-auto px-5 pt-10 pb-14">
          <p className="text-vitality-l text-label-brand mb-3">{timeOfDay()}</p>
          <h1 className="text-display text-warm-white mb-4">
            {profile.name}.
          </h1>
          <p className="text-warm-white/70 text-base max-w-xl leading-relaxed">
            Your plan is tuned to your body, your budget, and what's actually in your kitchen.
            Egusi over kale. Every time.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            <Badge variant="dark">
              <Activity className="w-3 h-3" />
              {GOAL_LABEL[profile.goal] ?? profile.goal}
            </Badge>
            {cyclePhase && (
              <Badge variant="luteal">
                <Sprout className="w-3 h-3" />
                {cyclePhase[0].toUpperCase() + cyclePhase.slice(1)} phase
              </Badge>
            )}
            {profile.conditions
              ?.filter((c) => c !== "none")
              .map((c) => {
                const meta = CONDITION_LABEL[c] ?? { label: c, variant: "neutral" as BadgeVariant };
                return (
                  <Badge key={c} variant={meta.variant}>
                    <Heart className="w-3 h-3" />
                    {meta.label}
                  </Badge>
                );
              })}
          </div>
        </div>
      </section>

      {/* ── Daily targets ───────────────────────────────────────────── */}
      <section className="bg-warm-white">
        <div className="max-w-5xl mx-auto px-5 -mt-8 pb-10">
          <div className="bg-white border border-forest/10 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-forest/5">
              <h2 className="text-base font-semibold text-forest">Today's targets</h2>
              <span className="text-xs text-muted">Adjusted for your profile</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-forest/5">
              {[
                { icon: Flame,   label: "Calories", value: t.calories, unit: "kcal", accent: "text-suya" },
                { icon: Beef,    label: "Protein",  value: t.protein_g, unit: "g",   accent: "text-vitality-d" },
                { icon: Wheat,   label: "Carbs",    value: t.carbs_g,   unit: "g",   accent: "text-forest" },
                { icon: Droplet, label: "Fats",     value: t.fats_g,    unit: "g",   accent: "text-uli-teal" },
              ].map(({ icon: Icon, label, value, unit, accent }) => (
                <div key={label} className="p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${accent}`} strokeWidth={2.2} />
                    <span className="text-label-brand text-muted">{label}</span>
                  </div>
                  <p className="text-3xl font-semibold text-forest tracking-tight leading-none">
                    {value}
                    <span className="text-sm font-medium text-muted ml-1">{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* sodium + budget strip */}
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <div className="rounded-2xl bg-clinical-bg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center">
                <Heart className="w-5 h-5 text-clinical-fg" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-label-brand text-clinical-fg/70">Sodium cap</p>
                <p className="text-sm font-semibold text-clinical-fg truncate">
                  {t.sodium_mg.toLocaleString()} mg/day
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-budget-bg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white grid place-items-center">
                <Wallet className="w-5 h-5 text-budget-fg" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-label-brand text-budget-fg/70">Daily budget</p>
                <p className="text-sm font-semibold text-budget-fg truncate">
                  ₦{profile.daily_budget_ngn.toLocaleString()}
                  <span className="text-budget-fg/60 font-normal"> · ₦{profile.monthly_budget_ngn.toLocaleString()}/mo</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick actions ──────────────────────────────────────────── */}
      <section className="bg-warm-white pb-12">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-label-brand text-muted mb-3">Do something</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <ActionCard
              href="/plan"
              icon={<Sparkles className="w-5 h-5" />}
              title="Plan your week"
              copy="A 7-day Nigerian menu in your budget."
              accent="bg-vitality text-forest"
            />
            <ActionCard
              href="/tracker"
              icon={<Camera className="w-5 h-5" />}
              title="Snap a meal"
              copy="Photo in, macros out. We'll do the maths."
              accent="bg-forest text-warm-white"
            />
            <ActionCard
              href="/chat"
              icon={<MessageSquare className="w-5 h-5" />}
              title="Ask NutriAI"
              copy="Pidgin, Yoruba, Igbo, Hausa or English."
              accent="bg-suya text-white"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function ActionCard({
  href, icon, title, copy, accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  copy: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-3xl bg-white border border-forest/10 p-5 transition-brand hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-4 min-h-[160px]"
    >
      <div className={`w-11 h-11 rounded-2xl grid place-items-center ${accent}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-forest leading-tight">{title}</h3>
        <p className="text-sm text-muted mt-1 leading-snug">{copy}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest transition-brand group-hover:gap-2">
        Open <ArrowRight className="w-3.5 h-3.5" />
      </span>
    </Link>
  );
}

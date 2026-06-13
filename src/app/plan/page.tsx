"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getProfile, saveMealPlan, getLatestMealPlan } from "@/lib/storage";
import { UserProfile, MealPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CalendarDays, CheckCircle2, ChevronDown, RefreshCw, Coins, Heart } from "lucide-react";

const LOADING_LINES = [
  "Pulling your numbers…",
  "Walking the market…",
  "Balancing protein and budget…",
  "Layering the spice…",
  "Plating your week…",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number>(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isLoaded && isSignedIn) {
      const p = getProfile();
      if (!p) {
        router.push("/onboarding");
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(p);
        const existingPlan = getLatestMealPlan();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (existingPlan) setMealPlan(existingPlan);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((p) => (p < LOADING_LINES.length - 1 ? p + 1 : p));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const generatePlan = async () => {
    if (!profile) return;
    setLoading(true);
    setLoadingStep(0);

    try {
      const cyclePhase =
        profile.gender === "female" && profile.cycle ? profile.cycle.current_phase : null;

      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, cyclePhase }),
      });

      if (!res.ok) throw new Error("Failed to generate plan");

      const planData = await res.json();

      const newPlan: MealPlan = {
        id: "plan-" + Date.now(),
        user_id: profile.id,
        generated_at: new Date().toISOString(),
        week_start: new Date().toISOString().split("T")[0],
        context: {
          cycle_phase: cyclePhase as MealPlan["context"]["cycle_phase"],
          budget_ngn: profile.monthly_budget_ngn,
          active_conditions: profile.conditions,
          goal: profile.goal,
        },
        days: planData.days,
        weekly_totals: planData.weekly_totals,
        plan_summary: planData.plan_summary || "Your customized meal plan.",
        clinical_notes: planData.clinical_notes || "",
      };

      saveMealPlan(newPlan);
      setMealPlan(newPlan);
    } catch (err) {
      console.error(err);
      alert("Error generating meal plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !profile) return <div className="min-h-screen bg-warm-white" />;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-forest bg-adire-grid text-warm-white">
        <div className="max-w-4xl mx-auto px-5 pt-10 pb-12">
          <p className="text-vitality-l text-label-brand mb-2">Meal planner</p>
          <h1 className="text-h1-brand text-warm-white">A week, in your kitchen.</h1>
          <p className="text-warm-white/70 mt-2 max-w-lg leading-relaxed">
            Seven days of Nigerian meals tuned to your conditions, your cycle, and your naira budget.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button onClick={generatePlan} disabled={loading} size="lg">
              {mealPlan ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {mealPlan ? "Regenerate" : "Generate plan"}
            </Button>
            <Badge variant="dark">
              <Coins className="w-3 h-3" />
              ₦{profile.daily_budget_ngn.toLocaleString()}/day
            </Badge>
            {profile.cycle?.current_phase && (
              <Badge variant="luteal">
                <Sparkles className="w-3 h-3" />
                {profile.cycle.current_phase[0].toUpperCase() + profile.cycle.current_phase.slice(1)} phase
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ────────────────────────────────────────────────── */}
      <section className="bg-warm-white">
        <div className="max-w-4xl mx-auto px-5 pt-8 pb-24">
          {loading && (
            <div className="bg-white border border-forest/10 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center">
              <div className="relative w-14 h-14 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-forest/10" />
                <div className="absolute inset-0 rounded-full border-2 border-vitality border-t-transparent animate-spin" />
              </div>
              <p className="text-label-brand text-vitality-d mb-2">Cooking</p>
              <h3 className="text-xl font-semibold text-forest mb-2">
                {LOADING_LINES[loadingStep]}
              </h3>
              <p className="text-sm text-muted max-w-sm">
                Keeping you under {profile.daily_targets.sodium_mg.toLocaleString()} mg of sodium and
                ₦{profile.daily_budget_ngn.toLocaleString()} a day.
              </p>
            </div>
          )}

          {!loading && !mealPlan && (
            <div className="bg-white border border-forest/10 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-vitality/20 grid place-items-center mb-5">
                <CalendarDays className="w-7 h-7 text-forest" />
              </div>
              <h3 className="text-xl font-semibold text-forest mb-1.5">No plan yet</h3>
              <p className="text-sm text-muted max-w-sm leading-relaxed">
                Tap <span className="font-semibold text-forest">Generate plan</span> above. Takes about
                15 seconds to produce a 7-day Nigerian menu tuned to your profile.
              </p>
            </div>
          )}

          {!loading && mealPlan && (
            <div className="space-y-6">
              {/* Weekly summary card */}
              <div className="rounded-3xl bg-forest text-warm-white overflow-hidden border border-vitality/10 bg-adire-grid">
                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-warm-white/10">
                  <div className="p-5">
                    <p className="text-label-brand text-vitality-l mb-1.5">Daily cost</p>
                    <p className="text-2xl font-semibold tracking-tight">
                      ₦{mealPlan.weekly_totals.avg_daily_cost_ngn.toLocaleString()}
                    </p>
                    <p className="text-xs text-warm-white/55 mt-1">
                      ≈ ₦{mealPlan.weekly_totals.estimated_monthly_cost_ngn.toLocaleString()}/month
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-label-brand text-vitality-l mb-1.5">Daily calories</p>
                    <p className="text-2xl font-semibold tracking-tight">
                      {mealPlan.weekly_totals.avg_daily_calories.toLocaleString()} kcal
                    </p>
                    <p className="text-xs text-warm-white/55 mt-1">
                      Target: {profile.daily_targets.calories.toLocaleString()} kcal
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="text-label-brand text-vitality-l mb-1.5">Nutrition score</p>
                    <p className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                      {mealPlan.weekly_totals.nutritional_completeness_score}%
                      <CheckCircle2 className="w-5 h-5 text-vitality" />
                    </p>
                    <p className="text-xs text-warm-white/55 mt-1">vs. your targets</p>
                  </div>
                </div>
                {mealPlan.plan_summary && (
                  <div className="px-5 pb-5 pt-1 border-t border-warm-white/10">
                    <p className="text-sm text-warm-white/75 leading-relaxed mt-3">
                      {mealPlan.plan_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Clinical note */}
              {mealPlan.clinical_notes && (
                <div className="rounded-2xl bg-clinical-bg p-4 flex gap-3">
                  <Heart className="w-5 h-5 text-clinical-fg shrink-0 mt-0.5" />
                  <p className="text-sm text-clinical-fg leading-relaxed">
                    {mealPlan.clinical_notes}
                  </p>
                </div>
              )}

              {/* Day list */}
              <div className="space-y-3">
                {mealPlan.days.map((day) => {
                  const open = expandedDay === day.day_index;
                  return (
                    <div
                      key={day.day_index}
                      className="bg-white rounded-2xl border border-forest/10 overflow-hidden transition-brand"
                    >
                      <button
                        onClick={() => setExpandedDay(open ? -1 : day.day_index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-forest/[0.03] transition-brand"
                        aria-expanded={open}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl grid place-items-center font-semibold tracking-tight transition-brand ${
                              open ? "bg-vitality text-forest" : "bg-forest/5 text-forest"
                            }`}
                          >
                            {DAY_NAMES[day.day_index]}
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-forest leading-tight">
                              {new Date(day.date).toLocaleDateString("en-GB", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              {day.daily_totals.calories.toLocaleString()} kcal ·{" "}
                              {day.daily_totals.protein_g}g protein
                              {day.daily_totals.cost_ngn ? ` · ₦${day.daily_totals.cost_ngn.toLocaleString()}` : ""}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`text-muted w-5 h-5 transition-brand ${open ? "rotate-180" : ""}`}
                        />
                      </button>

                      {open && (
                        <div className="px-4 pb-4 border-t border-forest/5 bg-warm-white/40">
                          {day.cycle_phase_note && (
                            <div className="my-3 rounded-xl bg-luteal-bg p-3 flex gap-2 items-start">
                              <Sparkles className="w-4 h-4 text-luteal-fg shrink-0 mt-0.5" />
                              <p className="text-xs text-luteal-fg leading-relaxed font-medium">
                                {day.cycle_phase_note}
                              </p>
                            </div>
                          )}
                          <div className="grid sm:grid-cols-2 gap-3 pt-3">
                            {Object.entries(day.meals).map(([slot, meal]) => {
                              const m = meal as {
                                name: string;
                                annotation?: { label?: string; reason?: string };
                                totals?: { cost_ngn?: number };
                              };
                              return (
                                <div
                                  key={slot}
                                  className="bg-white rounded-xl border border-forest/10 p-4"
                                >
                                  <p className="text-label-brand text-muted mb-1.5">{slot}</p>
                                  <h4 className="font-semibold text-forest leading-tight">
                                    {m.name}
                                  </h4>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {m.annotation && (
                                      <Badge variant="vitality">
                                        {m.annotation.label || m.annotation.reason || "Healthy"}
                                      </Badge>
                                    )}
                                    {m.totals?.cost_ngn && (
                                      <Badge variant="budget">
                                        ₦{m.totals.cost_ngn.toLocaleString()}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getProfile, saveMealPlan, getLatestMealPlan } from "@/lib/storage";
import { UserProfile, MealPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar as CalendarIcon, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

const LOADING_MESSAGES = [
  "Creating your plan...",
  "Analyzing your macros...",
  "Scanning the food database...",
  "Adding Nigerian spice...",
  "Finalizing your menu..."
];

export default function PlanPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number>(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) return;

    if (isLoaded && isSignedIn) {
      const p = getProfile();
      if (!p) {
        router.push("/onboarding");
      } else {
        setProfile(p);
        const existingPlan = getLatestMealPlan();
        if (existingPlan) setMealPlan(existingPlan);
      }
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const generatePlan = async () => {
    if (!profile) return;
    setLoading(true);
    setLoadingStep(0);

    try {
      const cyclePhase = profile.gender === 'female' && profile.cycle_data 
        ? profile.cycle_data.current_phase 
        : null;

      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, cyclePhase })
      });

      if (!res.ok) throw new Error("Failed to generate plan");
      
      const planData = await res.json();
      
      // Save full plan with ID and metadata
      const newPlan: MealPlan = {
        id: "plan-" + Date.now(),
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        days: planData.days,
        weekly_totals: planData.weekly_totals
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

  if (!isLoaded || !profile) {
    return <div className="min-h-screen bg-warm-white" />;
  }

  return (
    <div className="min-h-screen bg-warm-white p-6 pt-12 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-forest mb-2">Meal Planner</h1>
          <p className="text-muted">Personalized Nigerian meals tailored to your health profile.</p>
        </div>
        <Button onClick={generatePlan} disabled={loading} className="gap-2">
          <Sparkles className="w-4 h-4" />
          {mealPlan ? "Regenerate Plan" : "Generate Plan"}
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-forest/10 shadow-sm animate-in fade-in">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 border-4 border-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-vitality rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-forest mb-2 animate-pulse">
            {LOADING_MESSAGES[loadingStep]}
          </h3>
          <p className="text-muted text-sm">Our AI is crunching the numbers to keep you under {profile.daily_targets.sodium_limit_mg}mg of sodium.</p>
        </div>
      )}

      {!loading && !mealPlan && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-forest/10 shadow-sm">
          <CalendarIcon className="w-16 h-16 text-forest/20 mb-4" />
          <h3 className="text-xl font-semibold text-forest mb-2">No active meal plan</h3>
          <p className="text-muted text-center max-w-md">
            Click the button above to generate your first 7-day meal plan based on your ₦{profile.monthly_budget_ngn} monthly budget.
          </p>
        </div>
      )}

      {!loading && mealPlan && (
        <div className="space-y-4">
          <div className="bg-forest text-warm-white p-6 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-forest-2 text-sm font-medium mb-1">Weekly Snapshot</p>
              <h2 className="text-2xl font-bold">~₦{mealPlan.weekly_totals.avg_daily_cost_ngn.toLocaleString()}/day</h2>
            </div>
            <div className="text-right">
              <p className="text-forest-2 text-sm font-medium mb-1">Nutrition Score</p>
              <div className="flex items-center gap-1 text-vitality font-bold text-2xl justify-end">
                {mealPlan.weekly_totals.nutritional_completeness_score}% <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {mealPlan.days.map((day) => (
            <div key={day.day_index} className="bg-white rounded-xl border border-forest/10 overflow-hidden transition-all">
              <button 
                onClick={() => setExpandedDay(day.day_index === expandedDay ? -1 : day.day_index)}
                className="w-full flex justify-between items-center p-4 hover:bg-forest/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-vitality/20 flex items-center justify-center text-forest font-bold">
                    D{day.day_index + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-forest">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <p className="text-xs text-muted">
                      {day.daily_totals.calories} kcal • {day.daily_totals.protein_g}g Protein
                    </p>
                  </div>
                </div>
                {expandedDay === day.day_index ? <ChevronUp className="text-muted" /> : <ChevronDown className="text-muted" />}
              </button>

              {expandedDay === day.day_index && (
                <div className="p-4 pt-0 border-t border-forest/5">
                  {day.cycle_phase_note && (
                    <div className="bg-purple-50 text-purple-700 text-xs font-medium p-2 rounded mb-4">
                      Cycle Sync: {day.cycle_phase_note}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(day.meals).map(([mealType, meal]: [string, any]) => (
                      <div key={mealType} className="bg-warm-white p-4 rounded-lg">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">{mealType}</p>
                        <h4 className="font-semibold text-forest mb-1">{meal.name}</h4>
                        {meal.annotation && (
                          <span className="inline-block px-2 py-1 bg-vitality/20 text-forest text-xs rounded-full mb-2">
                            {meal.annotation.note || meal.annotation.benefit || "Healthy Choice"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

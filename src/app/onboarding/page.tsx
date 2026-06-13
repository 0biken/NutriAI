"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, CycleData } from "@/lib/types";
import { saveProfile } from "@/lib/storage";
import { calculateTargets } from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { SelectCard } from "@/components/ui/select-card";
import { Logo } from "@/components/Logo";
import { Heart, Target, Sparkles, Wallet, CalendarDays, AlertCircle, Activity, Baby, Scale } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const CONDITIONS = [
  { id: "hypertension", title: "Hypertension",  desc: "We'll cap sodium at <1,500 mg/day",   icon: Heart },
  { id: "diabetes",     title: "Diabetes",      desc: "Strict sugar & low-GI swallows",      icon: Activity },
  { id: "pcos",         title: "PCOS",          desc: "Low-GI, anti-inflammatory, magnesium",icon: Sparkles },
  { id: "pregnancy",    title: "Pregnancy",     desc: "Folate, iron, calcium priorities",    icon: Baby },
  { id: "obesity",      title: "Weight focus",  desc: "Caloric deficit + high protein",      icon: Scale },
  { id: "ulcer",        title: "Stomach ulcer", desc: "Low-acid, gentle preparations",       icon: AlertCircle },
] as const;

const GOALS = [
  { id: "weight_loss", title: "Lose weight",  desc: "Lower calories, high protein, satiating Nigerian foods" },
  { id: "maintenance", title: "Maintain",     desc: "Keep things steady, eat what works" },
  { id: "muscle_gain", title: "Build muscle", desc: "More protein, more carbs, intentional surplus" },
];

const ACTIVITIES = [
  { id: "sedentary",          title: "Sedentary",         desc: "Mostly seated — desk job, light walking" },
  { id: "lightly_active",     title: "Lightly active",    desc: "1–3 light sessions per week" },
  { id: "moderately_active",  title: "Moderately active", desc: "3–5 sessions per week" },
  { id: "very_active",        title: "Very active",       desc: "6–7 sessions or physical work" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    conditions: [],
    dietary_restrictions: [],
  });
  const [cycle, setCycle] = useState<Partial<CycleData>>({});

  const totalSteps = profile.gender === "male" ? 4 : 5;

  const handleNext = () => {
    if (step === 4 && profile.gender === "male") return finishOnboarding();
    if (step === 5 || (step === 4 && profile.gender !== "female")) return finishOnboarding();
    setStep((s) => (s + 1) as Step);
  };

  const finishOnboarding = () => {
    const targets = calculateTargets(profile);

    const finalProfile: UserProfile = {
      id: "local-user-" + Date.now(),
      name: profile.name || "User",
      age: profile.age || 30,
      gender: profile.gender as "male" | "female",
      weight_kg: profile.weight_kg || 70,
      height_cm: profile.height_cm || 170,
      conditions: profile.conditions || [],
      goal: ((profile.goal as string) === "pregnancy" ? "pregnancy_nutrition" : profile.goal) as
        | "weight_loss" | "muscle_gain" | "maintenance" | "manage_condition" | "pregnancy_nutrition",
      activity_level: profile.activity_level as UserProfile["activity_level"],
      dietary_restrictions: profile.dietary_restrictions || [],
      monthly_budget_ngn: profile.monthly_budget_ngn || 50000,
      daily_budget_ngn: Math.round((profile.monthly_budget_ngn || 50000) / 30),
      disliked_foods: [],
      created_at: new Date().toISOString(),
      daily_targets: targets,
      ...(profile.gender === "female" && cycle.last_period_start && {
        cycle: {
          last_period_start: cycle.last_period_start,
          cycle_length_days: cycle.cycle_length_days || 28,
          period_length_days: 5,
          has_pcos: profile.conditions?.includes("pcos") || false,
          current_phase: "follicular",
          current_day: 1,
          days_until_next_period: 28,
          next_phase_in_days: 7,
        },
      }),
    };

    saveProfile(finalProfile);
    router.push("/");
  };

  const toggleCondition = (c: string) => {
    setProfile((p) => ({
      ...p,
      conditions: p.conditions?.includes(c as NonNullable<UserProfile["conditions"]>[number])
        ? p.conditions.filter((x) => x !== c)
        : [...(p.conditions || []), c as NonNullable<UserProfile["conditions"]>[number]],
    }));
  };

  const stepMeta = [
    { eyebrow: "01 · You",        title: "Tell us about you.",       sub: "Plainly. No judgement." },
    { eyebrow: "02 · Conditions", title: "Anything we should know?", sub: "We'll tune every meal around it." },
    { eyebrow: "03 · Goals",      title: "What are we aiming at?",   sub: "Pick the one that matters most this season." },
    { eyebrow: "04 · Budget",     title: "What does food cost you?", sub: "Real numbers in naira. We'll fit the plan to it." },
    { eyebrow: "05 · Cycle",      title: "Sync to your cycle.",      sub: "Phase-aware nutrition. Optional, powerful." },
  ][step - 1];

  const canContinue =
    (step === 1 && profile.name && profile.gender && profile.age && profile.weight_kg && profile.height_cm) ||
    (step === 2) ||
    (step === 3 && profile.goal && profile.activity_level) ||
    (step === 4 && profile.monthly_budget_ngn) ||
    (step === 5);

  return (
    <div className="min-h-screen bg-warm-white">
      {/* ── Wizard hero ─────────────────────────────────────────── */}
      <div className="bg-forest bg-adire-grid text-warm-white">
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-10">
          <Logo size="sm" theme="dark" className="mb-8" />
          <p className="text-vitality-l text-label-brand mb-2">{stepMeta.eyebrow}</p>
          <h1 className="text-h1-brand text-warm-white">{stepMeta.title}</h1>
          <p className="text-warm-white/65 mt-2 text-sm">{stepMeta.sub}</p>

          <div className="mt-6 flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-brand ${
                  i + 1 <= step ? "bg-vitality" : "bg-warm-white/15"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-warm-white/45 mt-2">Step {step} of {totalSteps}</p>
        </div>
      </div>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 -mt-6 pb-28">
        <div className="bg-white rounded-3xl border border-forest/10 shadow-sm p-6 sm:p-8">
          {step === 1 && <Step1 profile={profile} setProfile={setProfile} />}
          {step === 2 && <Step2 profile={profile} onToggle={toggleCondition} />}
          {step === 3 && <Step3 profile={profile} setProfile={setProfile} />}
          {step === 4 && <Step4 profile={profile} setProfile={setProfile} />}
          {step === 5 && profile.gender === "female" && <Step5 cycle={cycle} setCycle={setCycle} />}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((s) => (s - 1) as Step)}
          >
            ← Back
          </Button>
          <Button onClick={handleNext} disabled={!canContinue} size="lg">
            {step === 5 || (step === 4 && profile.gender === "male") ? "Finish setup" : "Continue →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Steps ─────────────────────────────────────────────────────── */

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-label-brand text-forest">{children}</label>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full h-11 px-4 rounded-xl border border-forest/15 bg-white text-forest placeholder:text-muted " +
  "focus:outline-none focus:ring-2 focus:ring-vitality focus:border-vitality transition-brand";

function Step1({
  profile, setProfile,
}: { profile: Partial<UserProfile>; setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>> }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <FieldLabel>What should we call you?</FieldLabel>
        <input
          type="text" className={inputCls} placeholder="e.g. Chidi"
          value={profile.name || ""}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Age</FieldLabel>
          <input
            type="number" inputMode="numeric" className={inputCls} placeholder="28"
            value={profile.age || ""}
            onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel>Sex</FieldLabel>
          <select
            className={inputCls}
            value={profile.gender || ""}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value as UserProfile["gender"] })}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <FieldLabel hint="kg">Weight</FieldLabel>
          <input
            type="number" inputMode="decimal" className={inputCls} placeholder="72"
            value={profile.weight_kg || ""}
            onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })}
          />
        </div>
        <div>
          <FieldLabel hint="cm">Height</FieldLabel>
          <input
            type="number" inputMode="numeric" className={inputCls} placeholder="170"
            value={profile.height_cm || ""}
            onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({
  profile, onToggle,
}: { profile: Partial<UserProfile>; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted mb-1">
        Pick anything that applies. Pick none — we'll still build you a solid plan.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {CONDITIONS.map(({ id, title, desc, icon: Icon }) => (
          <SelectCard
            key={id}
            title={title}
            description={desc}
            icon={<Icon className="w-4 h-4" />}
            selected={profile.conditions?.includes(id as NonNullable<UserProfile["conditions"]>[number])}
            onClick={() => onToggle(id)}
          />
        ))}
      </div>
    </div>
  );
}

function Step3({
  profile, setProfile,
}: { profile: Partial<UserProfile>; setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>> }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <FieldLabel>Primary goal</FieldLabel>
        <div className="grid gap-3">
          {GOALS.map((g) => (
            <SelectCard
              key={g.id}
              title={g.title}
              description={g.desc}
              icon={<Target className="w-4 h-4" />}
              selected={profile.goal === g.id}
              onClick={() => setProfile({ ...profile, goal: g.id as NonNullable<UserProfile["goal"]> })}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>How active are you most weeks?</FieldLabel>
        <div className="grid gap-3">
          {ACTIVITIES.map((a) => (
            <SelectCard
              key={a.id}
              title={a.title}
              description={a.desc}
              icon={<Activity className="w-4 h-4" />}
              selected={profile.activity_level === a.id}
              onClick={() => setProfile({ ...profile, activity_level: a.id as NonNullable<UserProfile["activity_level"]> })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({
  profile, setProfile,
}: { profile: Partial<UserProfile>; setProfile: React.Dispatch<React.SetStateAction<Partial<UserProfile>>> }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <FieldLabel hint="₦">Monthly food budget</FieldLabel>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-forest font-semibold">₦</span>
          <input
            type="number" inputMode="numeric"
            className={inputCls + " pl-8"}
            placeholder="50,000"
            value={profile.monthly_budget_ngn || ""}
            onChange={(e) => setProfile({ ...profile, monthly_budget_ngn: Number(e.target.value) })}
          />
        </div>
        <div className="mt-3 rounded-2xl bg-budget-bg p-3 flex items-center gap-3">
          <Wallet className="w-4 h-4 text-budget-fg shrink-0" />
          <p className="text-xs text-budget-fg leading-relaxed">
            We'll lean on suya, beans, plantain, ugu — local proteins and veg that hit your macros for less.
          </p>
        </div>
      </div>

      <div>
        <FieldLabel hint="Optional">Dietary restrictions</FieldLabel>
        <input
          type="text" className={inputCls}
          placeholder="e.g. no pork, peanut allergy"
          onChange={(e) =>
            setProfile({
              ...profile,
              dietary_restrictions: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
            })
          }
        />
        <p className="text-xs text-muted mt-1.5">Comma-separated. Add more later from settings.</p>
      </div>
    </div>
  );
}

function Step5({
  cycle, setCycle,
}: { cycle: Partial<CycleData>; setCycle: React.Dispatch<React.SetStateAction<Partial<CycleData>>> }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-pcos-bg p-4 flex gap-3">
        <Sparkles className="w-5 h-5 text-pcos-fg shrink-0 mt-0.5" />
        <p className="text-sm text-pcos-fg leading-relaxed">
          Iron in menstrual phase. Magnesium in luteal. Antioxidants at ovulation. We'll cue the right foods at the right time.
        </p>
      </div>

      <div>
        <FieldLabel>Last period start date</FieldLabel>
        <div className="relative">
          <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="date"
            className={inputCls + " pl-11"}
            onChange={(e) => setCycle({ ...cycle, last_period_start: e.target.value })}
          />
        </div>
      </div>

      <div>
        <FieldLabel hint="days">Average cycle length</FieldLabel>
        <input
          type="number" inputMode="numeric"
          className={inputCls}
          defaultValue={28}
          onChange={(e) => setCycle({ ...cycle, cycle_length_days: Number(e.target.value) })}
        />
        <p className="text-xs text-muted mt-1.5">Most people fall between 24–32 days.</p>
      </div>
    </div>
  );
}

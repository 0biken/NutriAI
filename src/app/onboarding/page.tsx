"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, CycleData } from "@/lib/types";
import { saveProfile } from "@/lib/storage";
import { calculateTargets } from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { SelectCard } from "@/components/ui/select-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Target, AlertCircle } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    conditions: [],
    dietary_restrictions: [],
  });
  const [cycle, setCycle] = useState<Partial<CycleData>>({});

  const handleNext = () => {
    // If we're on step 4 and male, skip cycle tracking and finish
    if (step === 4 && profile.gender === 'male') {
      finishOnboarding();
      return;
    }
    // If step 5 or (step 4 and female but skipping), or standard finish
    if (step === 5 || (step === 4 && profile.gender !== 'female')) {
      finishOnboarding();
    } else {
      setStep((s) => (s + 1) as Step);
    }
  };

  const finishOnboarding = () => {
    // Calculate targets
    const targets = calculateTargets(profile);
    
    const finalProfile: UserProfile = {
      id: "local-user-" + Date.now(),
      name: profile.name || "User",
      age: profile.age || 30,
      gender: profile.gender as "male" | "female",
      weight_kg: profile.weight_kg || 70,
      height_cm: profile.height_cm || 170,
      conditions: profile.conditions || [],
      goal: ((profile.goal as string) === "pregnancy" ? "pregnancy_nutrition" : profile.goal) as "weight_loss" | "muscle_gain" | "maintenance" | "manage_condition" | "pregnancy_nutrition",
      activity_level: profile.activity_level as UserProfile["activity_level"],
      dietary_restrictions: profile.dietary_restrictions || [],
      monthly_budget_ngn: profile.monthly_budget_ngn || 50000,
      daily_budget_ngn: Math.round((profile.monthly_budget_ngn || 50000) / 30),
      disliked_foods: [],
      created_at: new Date().toISOString(),
      daily_targets: targets,
      ...(profile.gender === 'female' && cycle.last_period_start && {
        cycle: {
          last_period_start: cycle.last_period_start,
          cycle_length_days: cycle.cycle_length_days || 28,
          period_length_days: 5,
          has_pcos: profile.conditions?.includes('pcos') || false,
          current_phase: "follicular",
          current_day: 1,
          days_until_next_period: 28,
          next_phase_in_days: 7
        }
      })
    };

    saveProfile(finalProfile);
    router.push("/");
  };

  const toggleCondition = (c: string) => {
    setProfile(p => ({
      ...p,
      conditions: p.conditions?.includes(c as NonNullable<UserProfile["conditions"]>[number]) 
        ? p.conditions.filter(x => x !== c)
        : [...(p.conditions || []), c as NonNullable<UserProfile["conditions"]>[number]]
    }));
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center p-6 pt-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-forest mb-2">Build your profile</h1>
        <p className="text-muted mb-8">We need some details to personalize your nutrition.</p>
        
        <ProgressBar currentStep={step} totalSteps={profile.gender === 'male' ? 4 : 5} className="mb-8" />

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-forest/10 mb-8 min-h-[400px]">
          {/* STEP 1: BASIC INFO */}
          {step === 1 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-forest mb-2">Basic Information</h2>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <input 
                  type="text" 
                  className="border rounded-md p-2" 
                  placeholder="e.g. Chidi"
                  value={profile.name || ""}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Age</label>
                  <input type="number" className="border rounded-md p-2" 
                    value={profile.age || ""} onChange={e => setProfile({...profile, age: Number(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Gender</label>
                  <select className="border rounded-md p-2 bg-white"
                    value={profile.gender || ""} onChange={e => setProfile({...profile, gender: e.target.value as UserProfile["gender"]})}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input type="number" className="border rounded-md p-2" 
                    value={profile.weight_kg || ""} onChange={e => setProfile({...profile, weight_kg: Number(e.target.value)})} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Height (cm)</label>
                  <input type="number" className="border rounded-md p-2" 
                    value={profile.height_cm || ""} onChange={e => setProfile({...profile, height_cm: Number(e.target.value)})} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONDITIONS */}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-forest mb-2">Health Conditions</h2>
              <p className="text-sm text-muted mb-2">Select any that apply to you. We&apos;ll adjust your macro limits automatically.</p>
              
              <div className="grid gap-3">
                {[
                  { id: 'hypertension', title: 'Hypertension (High BP)', desc: 'We will limit sodium to < 1500mg' },
                  { id: 'diabetes', title: 'Diabetes', desc: 'Strict sugar and carb balancing' },
                  { id: 'pcos', title: 'PCOS', desc: 'Hormone-friendly meal suggestions' },
                  { id: 'ulcer', title: 'Stomach Ulcer', desc: 'Avoid acidic and extremely spicy foods' }
                ].map(cond => (
                  <SelectCard 
                    key={cond.id}
                    title={cond.title}
                    description={cond.desc}
                    icon={<AlertCircle className="w-5 h-5" />}
                    selected={profile.conditions?.includes(cond.id as NonNullable<UserProfile["conditions"]>[number])}
                    onClick={() => toggleCondition(cond.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: GOALS */}
          {step === 3 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-forest mb-2">Goals & Activity</h2>
              
              <label className="text-sm font-medium mt-2">Primary Goal</label>
              <div className="grid gap-3">
                {[
                  { id: 'weight_loss', title: 'Weight Loss' },
                  { id: 'maintenance', title: 'Maintenance' },
                  { id: 'muscle_gain', title: 'Muscle Gain' }
                ].map(g => (
                  <SelectCard 
                    key={g.id}
                    title={g.title}
                    icon={<Target className="w-5 h-5" />}
                    selected={profile.goal === g.id}
                    onClick={() => setProfile({...profile, goal: g.id as NonNullable<UserProfile["goal"]>})}
                  />
                ))}
              </div>

              <label className="text-sm font-medium mt-4">Activity Level</label>
              <select className="border rounded-md p-2 bg-white"
                value={profile.activity_level || ""} onChange={e => setProfile({...profile, activity_level: e.target.value as NonNullable<UserProfile["activity_level"]>})}>
                <option value="">Select...</option>
                <option value="sedentary">Sedentary (Little to no exercise)</option>
                <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                <option value="very_active">Very Active (6-7 days/week)</option>
              </select>
            </div>
          )}

          {/* STEP 4: BUDGET & DIET */}
          {step === 4 && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-semibold text-forest mb-2">Budget & Preferences</h2>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Monthly Food Budget (NGN)</label>
                <input type="number" className="border rounded-md p-2" 
                  value={profile.monthly_budget_ngn || ""} onChange={e => setProfile({...profile, monthly_budget_ngn: Number(e.target.value)})} />
                <p className="text-xs text-muted">We use this to recommend locally affordable ingredients like Suya or Garri instead of expensive imports.</p>
              </div>

              <div className="grid gap-2 mt-4">
                <label className="text-sm font-medium">Dietary Restrictions (Optional)</label>
                <input type="text" className="border rounded-md p-2" placeholder="e.g. Vegan, No pork, Peanut allergy"
                  onChange={e => setProfile({...profile, dietary_restrictions: e.target.value.split(',').map(s=>s.trim())})} />
              </div>
            </div>
          )}

          {/* STEP 5: CYCLE (FEMALE ONLY) */}
          {step === 5 && profile.gender === 'female' && (
             <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-xl font-semibold text-forest mb-2">Cycle Syncing</h2>
             <p className="text-sm text-muted mb-4">Tracking your cycle helps us recommend foods that balance your hormones.</p>
             
             <div className="grid gap-2">
               <label className="text-sm font-medium">Last Period Start Date</label>
               <input type="date" className="border rounded-md p-2" 
                 onChange={e => setCycle({...cycle, last_period_start: e.target.value})} />
             </div>

             <div className="grid gap-2 mt-4">
               <label className="text-sm font-medium">Average Cycle Length (Days)</label>
               <input type="number" className="border rounded-md p-2" defaultValue={28}
                 onChange={e => setCycle({...cycle, cycle_length_days: Number(e.target.value)})} />
             </div>
           </div>
          )}

        </div>

        <div className="flex justify-between w-full">
          <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1 as Step)}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={step === 1 && (!profile.name || !profile.gender)}>
            {step === 5 || (step === 4 && profile.gender === 'male') ? 'Complete Profile' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}

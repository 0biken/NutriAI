"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getProfile } from "@/lib/storage";
import { UserProfile } from "@/lib/types";

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Clerk handles this via proxy/middleware for full route protection, 
      // but this is a client-side safety net.
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
    return <div className="min-h-screen bg-warm-white flex items-center justify-center text-forest">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-warm-white p-6 pt-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-forest mb-2">Welcome back, {profile.name}!</h1>
      <p className="text-muted mb-8">Here is your nutrition overview for today.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-muted">Daily Calories</p>
          <p className="text-2xl font-bold text-forest">{profile.daily_targets.calories} kcal</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-muted">Protein</p>
          <p className="text-2xl font-bold text-forest">{profile.daily_targets.protein_g} g</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-muted">Carbs</p>
          <p className="text-2xl font-bold text-forest">{profile.daily_targets.carbs_g} g</p>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <p className="text-sm text-muted">Fats</p>
          <p className="text-2xl font-bold text-forest">{profile.daily_targets.fats_g} g</p>
        </div>
      </div>

      <div className="bg-vitality/10 p-6 rounded-xl border border-vitality-d">
        <h2 className="text-xl font-semibold text-forest mb-2">Goal: {profile.goal.replace('_', ' ')}</h2>
        <p className="text-sm text-forest-2">
          Your targets have been optimized for your activity level and health profile.
          {profile.conditions.length > 0 && ` We've adjusted your limits specifically for: ${profile.conditions.join(', ')}.`}
        </p>
      </div>
    </div>
  );
}

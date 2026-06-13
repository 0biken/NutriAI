import { UserProfile, NutrientTargets } from "./types";

export function calculateTargets(profile: Partial<UserProfile>): NutrientTargets {
  // Base BMR Calculation (Mifflin-St Jeor)
  // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
  // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
  
  const weight = profile.weight_kg || 70;
  const height = profile.height_cm || 170;
  const age = profile.age || 30;
  const gender = profile.gender || 'female';

  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = gender === 'male' ? bmr + 5 : bmr - 161;

  // Activity Multiplier
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725
  };
  const multiplier = activityMultipliers[profile.activity_level || 'sedentary'] || 1.2;
  
  let tdee = bmr * multiplier;

  // Goal Adjustment
  if (profile.goal === 'weight_loss') tdee -= 500;
  if (profile.goal === 'muscle_gain') tdee += 300;

  const calories = Math.round(tdee);

  // Macros
  // Protein: ~1.6g per kg of body weight for maintenance/loss, more for gain
  const proteinMultiplier = profile.goal === 'muscle_gain' ? 2.0 : 1.6;
  const protein = Math.round(weight * proteinMultiplier);
  
  // Carbs: ~45-65% of total calories (4 calories per gram)
  const carbsCalories = calories * 0.5;
  const carbs = Math.round(carbsCalories / 4);

  // Fats: ~20-35% of total calories (9 calories per gram)
  const fatsCalories = calories * 0.3;
  const fats = Math.round(fatsCalories / 9);

  // Sodium limit based on conditions
  let sodium_limit_mg = 2300; // Default max
  if (profile.conditions?.includes('hypertension')) {
    sodium_limit_mg = 1500;
  }

  // Sugar limit (max 10% of total calories)
  let sugar_limit_g = Math.round((calories * 0.1) / 4);
  if (profile.conditions?.includes('diabetes')) {
    sugar_limit_g = 25; // Strict cap for diabetes
  }

  return {
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fats_g: fats,
    sodium_limit_mg,
    sugar_limit_g
  };
}

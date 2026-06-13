import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { FOOD_DATABASE } from '@/lib/food-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profile, cyclePhase } = body;

    if (!profile) {
      return NextResponse.json({ error: 'User profile is required' }, { status: 400 });
    }

    const systemPrompt = `// NutriAI Prompt v1.0.0-hackathon
// Last updated: 2026-06-13
// Model: gemini-1.5-pro

You are NutriAI's clinical meal planning engine. You generate 7-day Nigerian meal plans that are culturally authentic, clinically safe, and budget-constrained.

RULES:
1. Use ONLY foods from the provided Nigerian food database. Do not invent foods.
2. Respect ALL clinical flags:
   - hypertension → sodium < 1500mg/day, prioritize potassium
   - type2_diabetes → glycemic load < 80/day, high fiber
   - pcos → low GI, anti-inflammatory, magnesium-rich
   - pregnancy → folate > 400mcg, iron > 27mg, no alcohol
   - obesity → caloric deficit 300-500kcal below target
3. Respect the daily budget in NGN. Cost per day must not exceed daily_budget_ngn.
4. If female and cycle_phase is provided, prioritize phase-specific nutrients:
   - menstrual: iron + vitamin C pairings, anti-inflammatory
   - follicular: lean protein, complex carbs
   - ovulation: antioxidants, omega-3
   - luteal: magnesium, complex carbs, B6
5. Every meal must have a clinically relevant annotation (e.g. "+Iron", "Low GI", "Low Sodium").
6. Provide a smart substitute for at least 2 meals per day (cheaper or condition-better alternative).
7. Return VALID JSON matching the MealPlan schema exactly. No markdown, no commentary outside JSON.

OUTPUT SCHEMA:
{
  "plan_summary": "string",
  "clinical_notes": "string",
  "days": [
    {
      "day_index": 0,
      "date": "YYYY-MM-DD",
      "cycle_phase_note": "string or null",
      "meals": {
        "breakfast": { "name": "string", "foods": [...], "totals": {...}, "annotation": {...}, "substitute": {...} },
        "lunch": { ... },
        "dinner": { ... },
        "snack": { ... }
      },
      "daily_totals": { "calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "sodium_mg": number, "iron_mg": number, "folate_mcg": number, "calcium_mg": number, "potassium_mg": number, "magnesium_mg": number, "fiber_g": number, "cost_ngn": number },
      "target_adherence": { "calories_pct": number, "protein_pct": number, "sodium_pct": number }
    }
  ],
  "weekly_totals": {
    "avg_daily_calories": number,
    "avg_daily_cost_ngn": number,
    "estimated_monthly_cost_ngn": number,
    "nutritional_completeness_score": number
  }
}

FOOD DATABASE (seed 50 items):
${JSON.stringify(FOOD_DATABASE, null, 2)}

USER PROFILE:
${JSON.stringify(profile, null, 2)}

CYCLE PHASE (if applicable):
${cyclePhase || 'Not applicable'}

Generate the plan now.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    });

    if (!response.text) {
      throw new Error('No response text from Gemini');
    }

    const plan = JSON.parse(response.text);
    return NextResponse.json(plan);

  } catch (error: unknown) {
    console.error('Meal Plan Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal plan', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

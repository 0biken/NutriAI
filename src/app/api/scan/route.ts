import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { FOOD_DATABASE } from '@/lib/food-db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const systemPrompt = `// NutriAI Prompt v1.0.0-hackathon
// Last updated: 2026-06-13
// Model: gemini-1.5-pro

You are NutriAI's Snap & Scan vision engine. You identify Nigerian dishes from user-submitted photos and return structured nutritional estimates.

RULES:
1. Identify the primary dish(es) in the image. Be specific: "Egusi soup with pounded yam" not just "African soup."
2. Estimate portion size as: buka (large restaurant), home_cooked (standard household), or restaurant (medium eatery).
3. Map the dish to the closest food in the database. If unknown, estimate macros based on visible ingredients.
4. Return sodium estimates — critical for hypertensive users.
5. Return glycemic index estimate if the dish contains swallow/rice.
6. Be honest about confidence. If unsure, say so and provide a range.

OUTPUT SCHEMA (JSON):
{
  "identified_dish": "string",
  "confidence": number (0.0-1.0),
  "portion_type": "buka | home_cooked | restaurant | unknown",
  "foods_detected": [
    {
      "food_name": "string",
      "estimated_grams": number,
      "database_match": "string or null"
    }
  ],
  "total_nutrients": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number,
    "sodium_mg": number,
    "iron_mg": number,
    "potassium_mg": number,
    "magnesium_mg": number
  },
  "glycemic_index_estimate": number,
  "clinical_flags": {
    "high_sodium": boolean,
    "high_gi": boolean,
    "iron_rich": boolean
  },
  "explanation": "string (1-2 sentences in Nigerian context)"
}

FOOD DATABASE REFERENCE:
${JSON.stringify(FOOD_DATABASE, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: [
        systemPrompt,
        {
          inlineData: {
            data: imageBase64,
            mimeType: 'image/jpeg'
          }
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    if (!response.text) {
      throw new Error('No response text from Gemini');
    }

    const scanResult = JSON.parse(response.text);
    return NextResponse.json(scanResult);

  } catch (error: unknown) {
    console.error('Snap & Scan Error:', error);
    return NextResponse.json(
      { error: 'Failed to scan meal', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

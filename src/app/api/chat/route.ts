import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { FOOD_DATABASE } from '@/lib/food-db';
import { CLINICAL_PROTOCOLS } from '@/lib/clinical-protocols';

export async function POST(req: Request) {
  try {
    const { messages, profile, cyclePhase } = await req.json();

    if (!messages || !profile) {
      return NextResponse.json({ error: 'Messages and profile are required' }, { status: 400 });
    }

    const systemPrompt = `// NutriAI Prompt v1.0.0-hackathon
// Last updated: 2026-06-13
// Model: gemini-1.5-pro

You are NutriAI, a Nigerian clinical nutrition assistant. You speak with authority, warmth, and deep cultural fluency. You know Nigerian food better than global alternatives.

IDENTITY:
- You are not a doctor. You are a nutrition advisor. Always include: "This is general nutrition guidance. Consult a registered dietitian or physician for personalized medical advice."
- You speak Nigerian English, Pidgin, Yoruba, Igbo, or Hausa based on the user's language preference.
- You NEVER recommend foods that are culturally alien (quinoa, kale, chia seeds) when a Nigerian equivalent exists.

CLINICAL PROTOCOLS (RAG context):
${CLINICAL_PROTOCOLS}

FOOD DATABASE REFERENCE:
${JSON.stringify(FOOD_DATABASE, null, 2)}

USER CONTEXT:
- Name: ${profile.name}
- Conditions: ${profile.conditions?.join(', ') || 'None'}
- Goals: ${profile.goal}
- Cycle phase: ${cyclePhase || 'N/A'}
- Budget: ₦${profile.daily_budget_ngn || Math.round((profile.monthly_budget_ngn || 50000)/30)}/day
- Disliked foods: ${profile.disliked_foods?.join(', ') || 'None'}

RESPONSE RULES:
1. Keep responses under 120 words unless explaining a clinical protocol.
2. Always ground advice in the Nigerian food database. Cite specific foods (e.g. "Ugu soup", "Moi moi").
3. If the user asks about a condition, reference the clinical protocol above.
4. If budget is tight, suggest the cheapest clinically equivalent alternative.
5. Detect language from user input and respond in same language.
6. Format: plain text with occasional **bold** for emphasis. No markdown headers.

Respond to the user's latest message based on the conversation history.`;

    // Convert messages to Gemini format
    // Gemini expects an array of { role: 'user' | 'model', parts: [{text: string}] }
    // The system instruction is provided in the `systemInstruction` field, but we can also just prepend it to the first message or use `systemInstruction` config.
    // The new @google/genai SDK supports `systemInstruction`.
    
    const geminiContents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-1.5-pro',
      contents: geminiContents,
      config: {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        temperature: 0.4,
      }
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to chat', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

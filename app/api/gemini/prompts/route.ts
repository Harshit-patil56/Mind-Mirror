import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, promptsResponseSchema } from '@/lib/gemini-server';
import { getAlternatePrompts, type CircadianPhase } from '@/lib/circadian';

export const dynamic = 'force-dynamic';

const PROMPTS_SYSTEM_INSTRUCTION = `You are a world-class introspective journaling architect and cognitive psychologist for MindMirror.
Your goal is to formulate 4 fresh, thought-provoking, and deeply resonant introspective journaling prompt questions tailored specifically to the user's selected circadian phase.

Circadian Phase Intentions:
- morning: Prefrontal priming, intentional focus, preempting cognitive friction, executive clarity, and positive nervous system tone.
- midday: Midday reset, pausing autopilot, auditing cognitive load & physical energy, recalibrating afternoon high-leverage priorities.
- evening: Cognitive offloading, parking unfinished mental loops, decompression, recognizing hidden lessons, and acknowledging quiet wins.
- night: Expressive release, soothing late-night rumination, radical self-compassion, unedited emotional honesty, and mental surrender before sleep.

CRITICAL DIRECTIVES:
1. Provide EXACTLY 4 prompts.
2. Each prompt MUST be an engaging, reflective, open-ended question (maximum 18 words each).
3. Do NOT use cliché, generic, or robotic prompts like "What are you grateful for?" or "How was your day?".
4. Prompts must be introspective, compassionate, intellectually stimulating, and psychologically grounding.
5. If previous prompts are provided, generate completely distinct questions exploring different psychological angles.
6. Conform strictly to the JSON schema.`;

const VALID_PHASES: CircadianPhase[] = ['morning', 'midday', 'evening', 'night'];

export async function POST(req: NextRequest) {
  let phase: CircadianPhase = 'morning';
  let currentPrompts: string[] = [];

  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) || {};
    } catch {
      // Use defaults if empty/invalid body
    }

    if (typeof body.phase === 'string' && VALID_PHASES.includes(body.phase as CircadianPhase)) {
      phase = body.phase as CircadianPhase;
    }

    if (Array.isArray(body.currentPrompts)) {
      currentPrompts = body.currentPrompts.filter((p): p is string => typeof p === 'string');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      const fallback = getAlternatePrompts(phase, currentPrompts);
      return NextResponse.json({ prompts: fallback, source: 'offline-alternates' });
    }

    const previousContext = currentPrompts.length > 0
      ? `\n<previous_prompts>\n${currentPrompts.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n</previous_prompts>\n\nEnsure the new prompts do not repeat these themes.`
      : '';

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `<target_circadian_phase>${phase}</target_circadian_phase>${previousContext}\n\nPlease formulate 4 fresh, deeply introspective journaling prompts for this circadian phase.`,
          },
        ],
      },
    ];

    const { text, modelUsed } = await generateContentWithFallback({
      systemInstruction: PROMPTS_SYSTEM_INSTRUCTION,
      contents,
      responseSchema: promptsResponseSchema,
      responseMimeType: 'application/json',
      temperature: 0.85,
    });

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.prompts) && parsed.prompts.length >= 4) {
        return NextResponse.json({
          prompts: parsed.prompts.slice(0, 4).map((p: unknown) => String(p).trim()),
          modelUsed,
          source: 'gemini',
        });
      }
    } catch (parseError) {
      console.warn('[Gemini Prompts] JSON parse failed, falling back to alternates:', parseError);
    }

    // Fallback if structure didn't match
    const fallback = getAlternatePrompts(phase, currentPrompts);
    return NextResponse.json({ prompts: fallback, source: 'offline-alternates' });
  } catch (error: unknown) {
    console.error('[Gemini Prompts API Error]:', error);
    const fallback = getAlternatePrompts(phase, currentPrompts);
    return NextResponse.json({ prompts: fallback, source: 'offline-fallback' });
  }
}

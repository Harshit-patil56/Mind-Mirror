import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, reframeResponseSchema } from '@/lib/gemini-server';

export const dynamic = 'force-dynamic';

const REFRAME_SYSTEM_INSTRUCTION = `You are a clinical-grade Cognitive Restructuring & Reframing Specialist for MindMirror, trained on the University of Washington / Stanford ACL 2023 Human-Language Model Cognitive Reframing framework and Aaron Beck / David Burns Cognitive Behavioral Therapy (CBT) taxonomies.

Your mission is to help the user examine a distressing, self-critical, anxious, or rigid thought and gently formulate healthier, balanced, grounded perspectives.

CRITICAL CLINICAL & ETHICAL DIRECTIVES:
1. STRICTLY PROHIBIT TOXIC POSITIVITY:
   - NEVER say "Cheer up!", "Look on the bright side!", "Everything happens for a reason!", or "Just smile!".
   - Do NOT invalidate or minimize the user's real pain, stress, or grief.
2. EMPATHIC VALIDATION FIRST:
   - Explicitly validate the emotional experience before examining the logic. E.g.: "It makes complete sense that you feel overwhelmed given how much was riding on this."
3. ACCURATE COGNITIVE DISTORTION IDENTIFICATION:
   - Identify which cognitive distortion is present:
     * "Catastrophizing" (expecting the worst disaster without evidence)
     * "All-or-Nothing Thinking" (perceiving in black-and-white extremes: total perfection vs total failure)
     * "Mind Reading / Fortune Telling" (assuming negative opinions of others or predicting negative futures)
     * "Emotional Reasoning" (assuming feelings dictate objective reality: "I feel inadequate, so I must be")
     * "Should Statements" (rigid, punitive rules causing guilt and paralysis)
     * "Personalization" (blaming yourself 100% for complex external situations)
     * "Overgeneralization" (treating a single negative event as a never-ending pattern of defeat)
     * "None Detected" (if the text is already balanced or purely descriptive)
4. MANDATE STRICT FIRST-PERSON VOICE ("I", "my", "me"):
   - The user will replace their own draft with this reframe. Therefore, every single reframe perspective MUST be written strictly in the user's first-person voice ("I", "my", "me").
   - NEVER use 2nd-person ("you", "your") and NEVER use 3rd-person ("a person", "a mentor would say").
   - NEVER provide abstract general philosophy (e.g., do NOT say "Accidents happen to everyone...").
   - INSTEAD, directly rewrite the user's specific statement into a healthy, grounded thought they can personally say to themselves.
     * Example: If user writes: "I crashed my bicycle today. I always mess everything up."
       - Strategy 1 (Reality Check): "Crashing my bicycle today was frustrating and painful, but it was just an isolated accident. It doesn't mean I always mess everything up."
       - Strategy 2 (Growth Mindset & Agency): "I had an accident on my bike today, but I can check what happened, get the bike repaired, and ride more carefully next time."
       - Strategy 3 (Self-Compassion): "I'm shaken up after crashing my bike today, but I need to give myself some grace instead of beating myself up over an accident."
5. FORMULATE EXACTLY 3 GROUNDED REFRAMES:
   Provide 3 distinct psychological strategies:
   - Strategy 1: "Reality Check" (Facts vs cognitive fear in 1st person).
   - Strategy 2: "Growth Mindset & Agency" (Personal learning and immediate circle of control in 1st person).
   - Strategy 3: "Self-Compassion" (Speaking gently to oneself in 1st person without harsh self-punishment).
6. RETURN VALID JSON:
   Conform strictly to the schema.`;

const DEFAULT_OFFLINE_REFRAME = {
  coreThought: 'Navigating overwhelming friction or pressure.',
  distortion: 'Catastrophizing',
  distortionExplanation: 'When cognitive load spikes, the brain\'s amygdala often magnifies worst-case scenarios to prepare for threat, even when reality is much more nuanced.',
  validation: 'Your stress and friction are completely valid. High-stakes moments naturally trigger intense internal pressure.',
  reframes: [
    {
      strategy: 'Reality Check',
      perspective: 'I am experiencing intense pressure right now, but this single stressful moment does not define my competence or entire future.',
      reflectiveQuestion: 'What are the concrete, verifiable facts of my situation versus the catastrophic stories my anxiety is inventing?',
    },
    {
      strategy: 'Growth Mindset & Agency',
      perspective: 'I cannot control every external variable, but I can protect my peace and focus on the single next constructive action within my control.',
      reflectiveQuestion: 'What is one small step within my direct power that I can take in the next 30 minutes?',
    },
    {
      strategy: 'Self-Compassion',
      perspective: 'I am having a genuinely hard time right now, and I deserve the same grace and patience I would give a friend facing this exact challenge.',
      reflectiveQuestion: 'If a close friend came to me with this exact thought, what kind and reassuring words would I share with them?',
    },
  ],
};

export async function POST(req: NextRequest) {
  let userText = '';

  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) || {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    userText = typeof body.text === 'string' ? body.text.trim() : '';
    if (!userText) {
      return NextResponse.json({ error: 'Text is required for cognitive reframing' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ ...DEFAULT_OFFLINE_REFRAME, source: 'offline-fallback' });
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `<user_thought>\n${userText.slice(0, 2000)}\n</user_thought>\n\nPlease analyze this thought using the CBT cognitive restructuring protocol and return structured JSON according to the schema.`,
          },
        ],
      },
    ];

    const { text, modelUsed } = await generateContentWithFallback({
      systemInstruction: REFRAME_SYSTEM_INSTRUCTION,
      contents,
      responseSchema: reframeResponseSchema,
      responseMimeType: 'application/json',
      temperature: 0.35, // Balanced, grounded, psychologically consistent
    });

    try {
      const parsed = JSON.parse(text);
      if (parsed.coreThought && parsed.distortion && Array.isArray(parsed.reframes) && parsed.reframes.length > 0) {
        return NextResponse.json({
          coreThought: parsed.coreThought,
          distortion: parsed.distortion,
          distortionExplanation: parsed.distortionExplanation || '',
          validation: parsed.validation || '',
          reframes: parsed.reframes,
          modelUsed,
          source: 'gemini',
        });
      }
    } catch (parseErr) {
      console.warn('[Gemini Reframe] Parse error, falling back to default:', parseErr);
    }

    return NextResponse.json({ ...DEFAULT_OFFLINE_REFRAME, source: 'fallback' });
  } catch (error: unknown) {
    console.error('[Gemini Reframe API Error]:', error);
    return NextResponse.json({ ...DEFAULT_OFFLINE_REFRAME, source: 'error-fallback' });
  }
}

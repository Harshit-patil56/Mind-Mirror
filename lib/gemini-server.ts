import { GoogleGenAI, Type, type Schema } from '@google/genai';

// Resilient Model Fallback Ladder (Prioritize high-quota flash-lite & flash-latest)
const MODEL_FALLBACK_LADDER = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

// Reusable GoogleGenAI Client initialization (lazy, server-only)
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the server environment.');
  }
  return new GoogleGenAI({ apiKey });
}

// Check if an error code or status is recoverable for fallback
function isRecoverableError(error: unknown): boolean {
  if (!error) return false;
  const errString = String(error).toLowerCase();
  return (
    errString.includes('503') ||
    errString.includes('unavailable') ||
    errString.includes('429') ||
    errString.includes('resource_exhausted') ||
    errString.includes('rate limit') ||
    errString.includes('404') ||
    errString.includes('not_found') ||
    errString.includes('500') ||
    errString.includes('internal') ||
    errString.includes('overloaded')
  );
}

// Multi-model fallback execution engine
export async function generateContentWithFallback({
  systemInstruction,
  contents,
  responseSchema,
  responseMimeType,
  temperature = 0.7,
}: {
  systemInstruction?: string;
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  responseSchema?: Schema;
  responseMimeType?: string;
  temperature?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAIClient();
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: Record<string, unknown> = {
        temperature,
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (responseMimeType) {
        config.responseMimeType = responseMimeType;
      }

      if (responseSchema) {
        config.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      const responseText = response.text || '';
      return { text: responseText, modelUsed: model };
    } catch (err: unknown) {
      lastError = err;
      console.warn(`[Gemini Fallback Ladder] Model ${model} encountered error:`, err);
      if (isRecoverableError(err)) {
        continue; // Try next model in ladder
      } else {
        // If it's a structural fatal error, break immediately
        throw err;
      }
    }
  }

  throw lastError || new Error('All models in fallback ladder exhausted.');
}

// Summarization Schema Definition
export const summaryResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A concise, evocative title for the journal entry (maximum 6 words).',
    },
    summary: {
      type: Type.STRING,
      description: 'A thoughtful, structured summary of the user\'s thoughts, emotions, and key takeaways (2 to 4 paragraphs).',
    },
    mood: {
      type: Type.STRING,
      description: 'Predominant emotional state (e.g. Reflective, Focused, Calm, Optimistic, Challenged, Grateful, Curious).',
    },
    sentimentScore: {
      type: Type.NUMBER,
      description: 'Numeric valence score between -1.0 (strongly negative/distressed) to 1.0 (strongly positive/uplifted), with 0.0 being neutral.',
    },
    keyThemes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Top 3 to 5 core themes, topics, or life areas explored (e.g. Work Growth, Mindfulness, Relationships, Health).',
    },
    actionItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Concrete, actionable next steps or gentle commitments mentioned by the user (up to 4 items).',
    },
  },
  required: ['title', 'summary', 'mood', 'sentimentScore', 'keyThemes', 'actionItems'],
};

// Fast Title Generation Schema Definition
export const titleResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A concise, evocative 3 to 5 word title summarizing the central theme or topic of the conversation (no quotes).',
    },
  },
  required: ['title'],
};

// Insights Schema Definition (Original Feature)
export const insightResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    period: {
      type: Type.STRING,
      description: 'Timeframe analyzed (e.g. Recent Reflections, Past 7 Days, Monthly Synthesis).',
    },
    synthesis: {
      type: Type.STRING,
      description: 'Deep psychological and philosophical synthesis of recurring cognitive patterns, emotional transitions, and personal progress.',
    },
    recurringThemes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Persistent patterns observed across the entries.',
    },
    emotionalTrend: {
      type: Type.STRING,
      description: 'Trajectory of user mood and resilience (e.g., "Shifting from uncertainty towards clarity and grounding").',
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Gentle, introspective reflection questions or mindful nudges tailored to the observed patterns.',
    },
  },
  required: ['period', 'synthesis', 'recurringThemes', 'emotionalTrend', 'recommendations'],
};

// Prompts Schema Definition for Circadian Prompt Suggestions
export const promptsResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    prompts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 4 deep, evocative, psychologically grounded introspective journaling prompts tailored to the circadian phase.',
    },
  },
  required: ['prompts'],
};

// Cognitive Reframe Schema Definition (UW/Stanford ACL 2023 & SALT-NLP CBT Framework)
export const reframeResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    coreThought: {
      type: Type.STRING,
      description: 'The distilled negative, catastrophic, or self-critical thought identified in the user text.',
    },
    distortion: {
      type: Type.STRING,
      description: 'The primary cognitive distortion name (e.g. Catastrophizing, All-or-Nothing Thinking, Mind Reading, Emotional Reasoning, Should Statements, Personalization, Overgeneralization, or None Detected).',
    },
    distortionExplanation: {
      type: Type.STRING,
      description: 'A compassionate 1 to 2 sentence explanation of why the brain defaults to this distortion under stress.',
    },
    validation: {
      type: Type.STRING,
      description: 'Empathetic, compassionate acknowledgment that validates the user\'s feelings without endorsing the cognitive distortion (strictly no toxic positivity).',
    },
    reframes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          strategy: {
            type: Type.STRING,
            description: 'The restructuring strategy (e.g. "Reality Check", "Growth Mindset", "Compassionate Mentor", "Circle of Control", "Impermanence").',
          },
          perspective: {
            type: Type.STRING,
            description: 'A realistic, grounded alternative perspective written strictly in the user\'s own first-person voice ("I", "my") that directly rewrites their specific situation.',
          },
          reflectiveQuestion: {
            type: Type.STRING,
            description: 'A thoughtful open-ended question the user can journal on based on this new perspective.',
          },
        },
        required: ['strategy', 'perspective', 'reflectiveQuestion'],
      },
      description: 'Exactly 3 distinct, grounded reframing options exploring different psychological angles.',
    },
  },
  required: ['coreThought', 'distortion', 'distortionExplanation', 'validation', 'reframes'],
};

// Utility to sanitize Firestore payloads and strip all undefined values
export function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

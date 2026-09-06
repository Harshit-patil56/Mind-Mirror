import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, titleResponseSchema } from '@/lib/gemini-server';

export const dynamic = 'force-dynamic';

const TITLE_SYSTEM_INSTRUCTION = `You are the Conversation Title Synthesizer for MindMirror, modeled on Open WebUI and ChatGPT.
Your task is to analyze the initial turns of a personal journal conversation and create a short, elegant, reflective title.

CRITICAL DIRECTIVES:
1. Maximum 3 to 5 words.
2. Evocative, thoughtful, and human (e.g., "Exploring Creative Friction", "Morning Energy & Focus", "Unpacking a Tough Decision").
3. Do NOT include quotes, asterisks, or prefix words like "Title:".
4. Return strictly valid JSON conforming to the schema.`;

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) || {};
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    if (rawMessages.length === 0) {
      return NextResponse.json({ error: 'At least one message is required to generate a title.' }, { status: 400 });
    }

    // Use the first 2-4 messages to synthesize the title
    const sampleMessages = rawMessages.slice(0, 4);
    const transcript = sampleMessages
      .map((m: { role?: string; content?: string }) => {
        const speaker = m.role === 'assistant' ? 'Companion' : 'User';
        const cleanContent = typeof m.content === 'string' ? m.content.slice(0, 1000) : '';
        return `[${speaker}]: ${cleanContent}`;
      })
      .join('\n\n');

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `<conversation_sample>\n${transcript}\n</conversation_sample>\n\nGenerate a concise 3 to 5 word title for this conversation.`,
          },
        ],
      },
    ];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({ title: 'Reflective Session' });
    }

    const result = await generateContentWithFallback({
      systemInstruction: TITLE_SYSTEM_INSTRUCTION,
      contents,
      responseSchema: titleResponseSchema,
      responseMimeType: 'application/json',
      temperature: 0.4,
    });

    let parsedTitle = 'New Conversation';
    try {
      const parsed = JSON.parse(result.text);
      if (typeof parsed.title === 'string' && parsed.title.trim()) {
        parsedTitle = parsed.title.trim().replace(/^["']|["']$/g, '');
      }
    } catch {
      // Fallback to raw text if JSON parsing fails
      if (result.text && result.text.length < 50) {
        parsedTitle = result.text.trim().replace(/^["']|["']$/g, '');
      }
    }

    return NextResponse.json({ title: parsedTitle, modelUsed: result.modelUsed });
  } catch (error: unknown) {
    console.error('Title generation error:', error);
    // Graceful fallback without throwing error to client
    return NextResponse.json({ title: 'Reflective Session' });
  }
}

# Gemini System & Security Directives: Personal Gemini Journal

## Model Execution Standards
1. **Server-Side Exclusivity**: Gemini API SDK (`@google/genai`) must only run in server-side API routes or Server Actions.
2. **Resilient Model Fallback Ladder**:
   - Primary: `gemini-3.6-flash`
   - High-Availability Fallback: `gemini-3.1-flash-lite`
   - Dynamic Alias: `gemini-flash-latest`
   - Deep Reasoning Fallback: `gemini-3.7-flash`
3. **Prompt Boundary Isolation**: User-authored content is passed strictly as conversation data with clear XML/delimited encapsulation. Security instructions cannot be overridden by conversational inputs.
4. **Structured JSON Output**: All automatic summaries, reflections, mood tags, and action items must be schema-validated using `responseSchema` and `Type` primitives from `@google/genai`.

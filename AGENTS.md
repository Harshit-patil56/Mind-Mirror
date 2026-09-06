# Security Constitution & Operational Directives: Personal Gemini Journal

## 1. Core Threat Modeling & Least Privilege
* Threat-model every feature before implementation against the 5 Threat Zones (Input Surfaces, Planning & Reasoning, Tool Execution, Memory & State, Inter-System Communication).
* Enforce absolute defense in depth: client requests are never trusted; all authorization checks are performed server-side or enforced via cryptographic token validation and Firestore Security Rules.
* Prohibit hardcoded secrets, API keys, service credentials, and private tokens.
* Maintain strict server-side boundary for Gemini API calls. No client-side exposure of `process.env.GEMINI_API_KEY`.

## 2. Identity, Authentication & Data Isolation
* Firebase Authentication is the single source of truth for identity.
* Strict per-user isolation: All personal journal records, conversation turns, reflections, and summaries MUST be scoped under `/users/{userId}/...`.
* Never trust client-supplied `userId` or `authorId` fields for authorization. Always validate against `request.auth.uid`.
* Firestore Security Rules must mathematically prevent IDOR (Insecure Direct Object Reference) and BOLA (Broken Object Level Authorization).
* Zero insecure defaults: `allow read, write: if false;` as global fallback. No blanket reads (`allow read: if isSignedIn();` is forbidden).
* Subcollections and single documents must validate path IDs with regex and size constraints (`isValidId`).

## 3. Prompt Injection, Input Hygiene & Safe Rendering
* Treat all user journal entries, reflections, and model outputs as plain data, never executable instructions.
* System instructions for Gemini must be immutably defined on the server side and protected from user overrides using strict input boundary markers.
* Prevent Denial of Wallet / Resource Exhaustion: enforce maximum token limits, character length bounding, and rate throttling on all conversational endpoints.
* Sanitize all data written to Firestore; strip `undefined` values to prevent runtime driver crashes.
* Never expose raw error traces, database internals, or environment variables to the browser.

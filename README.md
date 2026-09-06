# Personal Gemini Journal

A production-grade, privacy-first reflective journaling application powered by Google Gemini and Firebase Firestore with mathematically verified per-user data isolation. Built with Next.js 15, Tailwind CSS, `@google/genai`, and Firebase Authentication.

---

## 1. Architectural & Security Highlights

* **Strict Server-Side AI Execution**: Zero exposure of `GEMINI_API_KEY` to browser bundles. All generative and conversational interactions route through Next.js server endpoints (`/api/gemini/chat`, `/api/gemini/summarize`, `/api/gemini/insights`).
* **Resilient Model Fallback Ladder**: Gracefully handles API fluctuations and rate limits:
  1. `gemini-3.6-flash` (Primary)
  2. `gemini-3.1-flash-lite` (High-Availability Fallback)
  3. `gemini-flash-latest` (Dynamic Alias)
  4. `gemini-3.7-flash` (Deep Reasoning Fallback)
* **Zero Insecure Defaults in Firestore**: Global fallback denies all access (`match /{document=**} { allow read, write: if false; }`). All personal records exist under `/users/{userId}/...` and require `request.auth.uid == userId`.
* **Zero-Crash Payload Hygiene**: Automated sanitization strips all `undefined` fields recursively before submitting documents to the Firestore driver.
* **Apple Human Interface Guidelines Aesthetic**: Polished, distraction-free typographic hierarchy, subtle card framing, intuitive light/dark theme switching, and smooth transitions.
* **Longitudinal Intelligence (Original Feature)**: Deep cross-entry synthesis that tracks emotional trajectories, recurrent themes, and generates personalized introspective questions.
* **Built-in Security Inspector**: Interactive test suite executing real negative security tests directly against Firestore rules from the client.

---

## 2. Threat Modeling: The 5 Threat Zones

| Threat Zone | Primary Attack Vectors | Implemented Mitigations |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Prompt injection, malicious payloads, payload buffer bloat | Strict character length caps (4,000 chars), sanitization, defensive destructuring, payload validation. |
| **2. Planning & Reasoning** | System instruction bypass, persona hijacking | Immutable server-side system instructions, delimited XML tags (`<user_journal_content>`) protecting conversation context. |
| **3. Tool & API Execution** | Server-Side Request Forgery (SSRF), token leakage | Exclusively server-side execution of `@google/genai`; zero client-side exposure of API secrets. |
| **4. Memory & State** | Broken Object Level Auth (BOLA / IDOR), cross-user snooping | Strict path scoping (`/users/{userId}/...`), owner-bound Firestore rules checking `request.auth.uid == userId`, defensive payload stripping of `undefined`. |
| **5. Inter-System Communication** | Upstream API failures, 429 rate limits, token compromise | Resilient fallback ladder across 4 Gemini model variants with automatic error interception and retry logic. |

---

## 3. Cloud Firestore Security Rules

Deploy the following rules to Firestore to enforce strict user data isolation:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global fallback: Deny all reads and writes by default
    match /{document=**} {
      allow read, write: if false;
    }

    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // All user-scoped documents and collections
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // Journal & conversation summaries collection
      match /journals/{journalId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId)
          && request.resource.data.title is string
          && request.resource.data.title.size() <= 200
          && request.resource.data.summary is string
          && request.resource.data.summary.size() <= 10000;
      }

      // Active & historical multi-turn conversation sessions
      match /conversations/{conversationId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId);
      }

      // Personal Reflection & Mood/Theme Insights
      match /insights/{insightId} {
        allow read, delete: if isOwner(userId);
        allow create, update: if isOwner(userId) 
          && (request.resource.data.userId == null || request.resource.data.userId == userId);
      }
    }
  }
}
```

---

## 4. Google Cloud Setup & Secret Manager Bindings

### Prerequisites
1. Install the Google Cloud SDK (`gcloud` CLI) and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable required Google Cloud services:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com
   ```

### Secret Manager Configuration
Store your Gemini API key in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add the API key secret payload
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the Cloud Run default runtime service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run, mounting the `GEMINI_API_KEY` secret directly as an environment variable:

```bash
# Deploy to Google Cloud Run
gcloud run deploy personal-gemini-journal \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

### Mandatory Campaign Verification Labeling
To register the Cloud Run service for challenge verification:

```bash
gcloud run services update personal-gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Verification & Functional Walkthrough

| Verification Step | Test Procedure | Expected Outcome |
| :--- | :--- | :--- |
| **Authentication Flow** | Sign in using Google Sign-In or Anonymous Guest mode in `AuthView`. | Authenticated session is established; user UID is displayed in the nav bar; user entries load from `/users/{uid}/journals`. |
| **Multi-Turn Conversation** | Send a journal reflection prompt in `JournalChat`. | Gemini responds with an empathetic, thoughtful reflection question; conversation turns are saved into Firestore. |
| **Structured Summarization** | Click **"Summarize & Save Reflection"** in the chat header. | Gemini extracts key themes, emotional mood tag, sentiment score, and action items via JSON schema validation; document is saved into `/users/{uid}/journals`. |
| **History & Recall** | Navigate to the **"Journal Entries"** tab. Filter by search or mood. | Saved reflections render in descending order; clicking an entry opens the detailed reading modal with options to delete or "Continue This Thought". |
| **Longitudinal Insights** | Navigate to the **"Insights"** tab and click **"Synthesize Insights"**. | Server analyzes entries and returns a synthesis narrative, emotional trend trajectory, and tailored introspective inquiries. |
| **Adversarial Security Test** | Open the **Security Inspector** from the nav bar and click **"Run Security Tests"**. | Negative tests (cross-user writes, cross-user reads, and client secret inspection) execute against Firestore rules and confirm all attacks are blocked (`PERMISSION_DENIED`). |
| **Conversational Thinking State** | Submit a message or prompt starter in `JournalChat`. | While awaiting the response, the companion status displays a soft breathing `Thinking...` label and a luminous pulsating thought orb without abrupt jumping or boxy containers. |
| **Data Sovereignty & Purge** | Open the **Privacy** modal, click **"Download JSON Archive"**, and then test **"Erase My Journal Records"**. | JSON archive downloads immediately; confirming purge deletes all records under the user path with zero residual traces. |

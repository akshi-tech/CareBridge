# CareBridge

> From symptoms to continuity of care.

CareBridge is a continuity-of-care web app that helps people organise their health information over time. Users can track symptoms, review rule-based safety checks, follow a monitoring plan, and prepare a concise summary for a healthcare professional.

**CareBridge is not a diagnostic tool and does not prescribe medication.** Its purpose is to make health information clearer and easier to share with a qualified clinician.

## Features

- **Symptom tracking** — record symptoms, severity, duration, and changes over time.
- **AI-assisted organisation** — converts a user’s description into structured symptom information and summaries. The AI is not used to diagnose.
- **Deterministic safety checks** — applies fixed red-flag rules for cough, sore throat, and common cold symptoms. AI cannot override these rules.
- **Care plans** — shows what to monitor, self-care guidance, things to avoid, expected improvement, and follow-up timing.
- **Health timeline** — keeps symptom updates, self-care, medication, follow-up, and clinician-visit events in one place.
- **Medication tracking** — records medications and dose status.
- **Doctor summary** — creates a copyable and downloadable overview for a healthcare appointment.
- **Care circle and records** — helps organise health records and trusted support contacts.

## Care journey

`Track → Understand → Monitor → Follow-up`

1. Describe what you are experiencing.
2. Review the organised symptom information and safety result.
3. Monitor the care plan and timeline.
4. Share a clear follow-up summary with a healthcare professional.

## Safety approach

CareBridge uses deterministic rules to identify potential red flags. Results are shown in three levels:

- **Low** — home care and monitoring.
- **Review** — consider professional medical review.
- **Urgent** — seek professional medical evaluation.

For urgent symptoms or an emergency, contact local emergency services or a qualified healthcare professional directly. Do not rely on this app in place of medical advice.

## Technology

- React and TypeScript
- TanStack Start and TanStack Router
- Vite and Tailwind CSS
- shadcn/ui and Lucide icons
- Supabase (PostgreSQL, authentication, and server functionality)
- OpenAI API for constrained symptom extraction and summarisation

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project and the required environment configuration

### Installation

```bash
git clone https://github.com/akshi-tech/CareBridge.git
cd CareBridge
npm install
npm run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173`.

## Available commands

```bash
npm run dev       # Start the local development server
npm run build     # Create a production build
npm run preview   # Preview the production build
npm run lint      # Check the code for linting issues
npm run format    # Format the code with Prettier
```

## Database

Supabase configuration and database migrations are in [`supabase/`](supabase/). The data model supports users, symptom entries, care plans, timeline events, medications, medication logs, and follow-ups.

## Disclaimer

CareBridge provides health-information organisation and safety guidance only. It does not diagnose, treat, cure, or prevent any disease, and it is not a substitute for professional medical advice, diagnosis, or treatment.

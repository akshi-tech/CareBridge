<<<<<<< HEAD
# CareBridge
=======
# CareBridge Health

Build a complete full-stack web application called "CareBridge".

PRODUCT:

CareBridge is a continuity-of-care platform that helps users:

1. Track symptoms

2. Structure their health information

3. Understand what to monitor

4. Check safety red flags

5. Maintain a longitudinal health timeline

6. Prepare a concise follow-up summary for a healthcare professional

IMPORTANT:

CareBridge must NOT diagnose diseases.

CareBridge must NOT prescribe medication.

CareBridge must NOT claim that a user is cured.

The AI should organize and summarize information.

Safety escalation must be controlled by deterministic rules, not by the LLM.

TAGLINE:

"From Symptoms to Continuity of Care"

CORE JOURNEY:

Track → Understand → Monitor → Follow-up

TECH STACK:

Frontend:

- React / TypeScript

- Tailwind CSS

- shadcn/ui

- Lucide icons

- Responsive desktop + mobile UI

- Modern healthcare SaaS design

Backend:

- Supabase

- PostgreSQL

- Supabase Auth

- Supabase Edge Functions where needed

AI:

- OpenAI API

- AI only for natural language symptom extraction and summarization

- Never allow AI to make a definitive diagnosis

DATABASE TABLES:

users

symptom_entries

conditions

care_plans

timeline_events

medications

medication_logs

followups

USER TABLE:

id

name

email

date_of_birth

gender

blood_group

created_at

SYMPTOM_ENTRIES:

id

user_id

symptom_name

severity

duration_days

started_at

description

created_at

CONDITIONS:

id

category

name

symptoms

self_care

expected_improvement

avoid

red_flags

care_level

evidence_source

created_at

CARE_PLANS:

id

user_id

condition_id

risk_level

status

started_at

follow_up_at

notes

TIMELINE_EVENTS:

id

user_id

care_plan_id

event_type

title

description

severity

event_date

MEDICATIONS:

id

user_id

name

dosage

frequency

start_date

end_date

instructions

MEDICATION_LOGS:

id

medication_id

scheduled_at

taken_at

status

FOLLOWUPS:

id

user_id

care_plan_id

scheduled_for

status

notes

created_at

PAGES:

1. Landing Page

2. Login

3. Register

4. Dashboard

5. Symptom Tracker

6. New Symptom Entry

7. AI Symptom Analysis

8. Safety Check

9. Care Plan

10. Health Timeline

11. Medications

12. Health Records

13. Doctor Summary

14. Care Circle

15. Settings

DASHBOARD:

Create a premium healthcare dashboard.

Left sidebar:

- CareBridge logo

- Dashboard

- My Care

- Symptom Tracker

- Care Plans

- Timeline

- Medications

- Health Records

- Care Circle

- Doctor Summary

- Settings

Main dashboard:

- Greeting

- Current health overview

- Active concerns

- Follow-up reminders

- Medication status

- Recent timeline

- Quick action buttons

- Care journey progress

Use clean cards, subtle shadows, rounded corners and strong spacing.

SYMPTOM INPUT:

Create a large natural language input:

"Tell us what you're experiencing"

Example:

"I've had a cough for four days and my throat feels irritated. It was worse yesterday but feels slightly better today."

Button:

"Analyze My Symptoms"

Show animated processing steps:

Understanding your description

↓

Identifying symptoms

↓

Checking safety

↓

Building your care journey

AI OUTPUT:

Return structured JSON:

{

  symptoms: [

    {

      name: "",

      severity: null,

      duration_days: null

    }

  ],

  associated_symptoms: [],

  red_flags_present: [],

  missing_safety_questions: [],

  summary: ""

}

Never invent symptoms.

SAFETY ENGINE:

Create deterministic safety rules.

For cough:

red flags:

- breathing difficulty

- chest pain

- coughing blood

For sore throat:

red flags:

- difficulty breathing

- difficulty swallowing

- drooling

- rapidly worsening symptoms

For common cold:

red flags:

- breathing difficulty

- chest pain

- confusion

- blood-stained phlegm

If red flag is present:

risk_level = URGENT

If symptom persists beyond configured threshold:

risk_level = REVIEW

Otherwise:

risk_level = LOW

The AI must never override the safety engine.

SAFETY RESULT UI:

LOW:

"Home care + monitoring"

REVIEW:

"Consider professional medical review"

URGENT:

"Seek professional medical evaluation"

Display:

- Risk level

- Why this result

- Safety checks performed

- What to monitor

- When to seek professional help

CARE PLAN:

Show:

- Current concern

- What to monitor

- Self-care information

- Things to avoid

- Expected improvement

- Safety warnings

- Follow-up date

TIMELINE:

Create beautiful vertical health timeline.

Events:

- Symptom started

- Symptom update

- Self-care

- Medication

- Follow-up

- Doctor visit

- Resolved

Include symptom severity graph from 0-10.

DOCTOR SUMMARY:

Create a professional summary card.

Sections:

Primary concern

Started

Duration

Current trend

Associated symptoms

Red flags

Self-care tried

Medications

Questions to discuss

Buttons:

"Copy Summary"

"Download Summary"

DESIGN:

Premium healthcare startup aesthetic.

Use:

- White background

- Soft blue/teal accents

- Dark navy text

- Green for safe

- Amber for review

- Red only for urgent states

Do NOT make it look like a generic hospital website.

Make it look like a modern AI healthcare SaaS product.

Use:

- Inter font

- Lucide icons

- subtle gradients

- glassmorphism only where appropriate

- excellent responsive design

- loading states

- empty states

- error states

- toast notifications

- smooth transitions

DEMO DATA:

Create demo user:

Aryan Jaiswal

Create a demo active concern:

"Mild cough"

Duration:

4 days

Severity:

4/10

Trend:

Improving

Associated symptom:

Throat irritation

No red flags.

Create timeline events showing:

Day 1 symptom started

Day 2 symptom update

Day 3 self-care

Day 4 improving

Create a doctor summary based on this demo data.

IMPORTANT:

The application must actually work end-to-end.

Do not create fake buttons.

All major buttons should perform real actions.

Connect frontend to Supabase.

Create database schema.

Create API/server functions where needed.

Create authentication.

Create loading and error states.

Make the application deployable.

Prioritize a polished working MVP over unnecessary features.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://carebridge-health-journey.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/82bdda8c-e4a8-48d2-9981-c645877934a4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
>>>>>>> 49d6a72 (Initial commit)

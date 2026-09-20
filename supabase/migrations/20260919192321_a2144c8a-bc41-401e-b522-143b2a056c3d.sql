CREATE TABLE public.symptom_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity INTEGER,
  duration_days INTEGER,
  associated_symptoms TEXT[] NOT NULL DEFAULT '{}',
  red_flags_present TEXT[] NOT NULL DEFAULT '{}',
  missing_safety_questions TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL,
  safety_report JSONB NOT NULL,
  ai_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT symptom_analyses_input_not_blank CHECK (btrim(input_text) <> ''),
  CONSTRAINT symptom_analyses_summary_not_blank CHECK (btrim(summary) <> ''),
  CONSTRAINT symptom_analyses_symptoms_array CHECK (jsonb_typeof(symptoms) = 'array'),
  CONSTRAINT symptom_analyses_severity_valid CHECK (severity IS NULL OR severity BETWEEN 0 AND 10),
  CONSTRAINT symptom_analyses_duration_valid CHECK (duration_days IS NULL OR duration_days >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_analyses TO authenticated;
GRANT ALL ON public.symptom_analyses TO service_role;

ALTER TABLE public.symptom_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptom analyses"
ON public.symptom_analyses FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own symptom analyses"
ON public.symptom_analyses FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom analyses"
ON public.symptom_analyses FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom analyses"
ON public.symptom_analyses FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER set_symptom_analyses_updated_at
BEFORE UPDATE ON public.symptom_analyses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX symptom_analyses_user_created_idx
ON public.symptom_analyses (user_id, created_at DESC);
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.conditions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.symptom_entries ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.care_plans ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.timeline_events ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.medications ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.medication_logs ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.followups ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.care_circle ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_conditions_updated_at BEFORE UPDATE ON public.conditions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_symptom_entries_updated_at BEFORE UPDATE ON public.symptom_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_care_plans_updated_at BEFORE UPDATE ON public.care_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_timeline_events_updated_at BEFORE UPDATE ON public.timeline_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_medication_logs_updated_at BEFORE UPDATE ON public.medication_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_followups_updated_at BEFORE UPDATE ON public.followups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_care_circle_updated_at BEFORE UPDATE ON public.care_circle FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_not_blank CHECK (name IS NULL OR btrim(name) <> ''),
  ADD CONSTRAINT profiles_blood_group_valid CHECK (blood_group IS NULL OR blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));

ALTER TABLE public.symptom_entries
  ADD CONSTRAINT symptom_entries_name_not_blank CHECK (btrim(symptom_name) <> ''),
  ADD CONSTRAINT symptom_entries_severity_valid CHECK (severity IS NULL OR severity BETWEEN 0 AND 10),
  ADD CONSTRAINT symptom_entries_duration_valid CHECK (duration_days IS NULL OR duration_days >= 0);

ALTER TABLE public.care_plans
  ADD CONSTRAINT care_plans_title_not_blank CHECK (title IS NULL OR btrim(title) <> ''),
  ADD CONSTRAINT care_plans_risk_level_valid CHECK (risk_level IN ('LOW', 'REVIEW', 'URGENT')),
  ADD CONSTRAINT care_plans_status_valid CHECK (status IN ('active', 'closed')),
  ADD CONSTRAINT care_plans_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.timeline_events
  ADD CONSTRAINT timeline_events_type_not_blank CHECK (btrim(event_type) <> ''),
  ADD CONSTRAINT timeline_events_title_not_blank CHECK (btrim(title) <> ''),
  ADD CONSTRAINT timeline_events_severity_valid CHECK (severity IS NULL OR severity BETWEEN 0 AND 10),
  ADD CONSTRAINT timeline_events_plan_owner_fkey FOREIGN KEY (care_plan_id, user_id) REFERENCES public.care_plans(id, user_id) ON DELETE CASCADE;

ALTER TABLE public.medications
  ADD CONSTRAINT medications_name_not_blank CHECK (btrim(name) <> ''),
  ADD CONSTRAINT medications_date_order_valid CHECK (end_date IS NULL OR end_date >= start_date),
  ADD CONSTRAINT medications_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.medication_logs
  ADD CONSTRAINT medication_logs_status_valid CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  ADD CONSTRAINT medication_logs_medication_owner_fkey FOREIGN KEY (medication_id, user_id) REFERENCES public.medications(id, user_id) ON DELETE CASCADE;

ALTER TABLE public.followups
  ADD CONSTRAINT followups_status_valid CHECK (status IN ('pending', 'completed', 'cancelled')),
  ADD CONSTRAINT followups_plan_owner_fkey FOREIGN KEY (care_plan_id, user_id) REFERENCES public.care_plans(id, user_id) ON DELETE CASCADE;

ALTER TABLE public.care_circle
  ADD CONSTRAINT care_circle_name_not_blank CHECK (btrim(name) <> '');

CREATE INDEX symptom_entries_user_created_idx ON public.symptom_entries (user_id, created_at DESC);
CREATE INDEX symptom_entries_user_started_idx ON public.symptom_entries (user_id, started_at DESC);
CREATE INDEX care_plans_user_started_idx ON public.care_plans (user_id, started_at DESC);
CREATE INDEX care_plans_user_status_idx ON public.care_plans (user_id, status);
CREATE INDEX care_plans_condition_idx ON public.care_plans (condition_id);
CREATE INDEX timeline_events_user_event_date_idx ON public.timeline_events (user_id, event_date DESC);
CREATE INDEX timeline_events_care_plan_idx ON public.timeline_events (care_plan_id);
CREATE INDEX medications_user_start_date_idx ON public.medications (user_id, start_date DESC);
CREATE INDEX medication_logs_user_scheduled_idx ON public.medication_logs (user_id, scheduled_at DESC);
CREATE INDEX medication_logs_medication_idx ON public.medication_logs (medication_id);
CREATE INDEX followups_user_scheduled_idx ON public.followups (user_id, scheduled_for);
CREATE INDEX followups_care_plan_idx ON public.followups (care_plan_id);
CREATE INDEX care_circle_user_created_idx ON public.care_circle (user_id, created_at);
CREATE INDEX conditions_category_name_idx ON public.conditions (category, name);
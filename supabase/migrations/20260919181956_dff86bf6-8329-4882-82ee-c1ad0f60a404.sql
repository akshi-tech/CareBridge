-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  blood_group TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- conditions (public reference library)
CREATE TABLE public.conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  self_care TEXT[] NOT NULL DEFAULT '{}',
  expected_improvement TEXT,
  avoid TEXT[] NOT NULL DEFAULT '{}',
  red_flags TEXT[] NOT NULL DEFAULT '{}',
  care_level TEXT NOT NULL DEFAULT 'self_care',
  evidence_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.conditions TO anon;
GRANT SELECT ON public.conditions TO authenticated;
GRANT ALL ON public.conditions TO service_role;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conditions readable" ON public.conditions FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.conditions (category, name, symptoms, self_care, expected_improvement, avoid, red_flags, care_level, evidence_source) VALUES
('respiratory', 'Cough',
 ARRAY['cough','throat irritation','chest discomfort'],
 ARRAY['Drink warm fluids regularly','Rest and sleep with head slightly elevated','Use steam inhalation once or twice a day','Track severity daily'],
 'Most simple coughs settle noticeably within 7-10 days.',
 ARRAY['Smoking or smoke exposure','Cold drinks late at night','Strenuous exercise while symptomatic'],
 ARRAY['breathing difficulty','chest pain','coughing blood'],
 'self_care', 'General primary-care guidance'),
('respiratory', 'Sore throat',
 ARRAY['sore throat','throat irritation','pain on swallowing'],
 ARRAY['Warm salt-water gargles','Sip warm fluids through the day','Rest your voice','Keep the room humidified'],
 'Usually improves within 5-7 days.',
 ARRAY['Shouting or straining the voice','Very spicy or acidic foods','Smoking'],
 ARRAY['difficulty breathing','difficulty swallowing','drooling','rapidly worsening symptoms'],
 'self_care', 'General primary-care guidance'),
('respiratory', 'Common cold',
 ARRAY['runny nose','sneezing','cough','sore throat','mild fever','fatigue'],
 ARRAY['Rest and hydration','Saline nasal rinse','Monitor temperature once or twice daily','Stay home while symptomatic'],
 'Symptoms typically peak on day 2-3 and settle within 7-10 days.',
 ARRAY['Close contact with vulnerable people','Skipping sleep','Alcohol while symptomatic'],
 ARRAY['breathing difficulty','chest pain','confusion','blood-stained phlegm'],
 'self_care', 'General primary-care guidance');

-- symptom_entries
CREATE TABLE public.symptom_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  symptom_name TEXT NOT NULL,
  severity INT,
  duration_days INT,
  started_at DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_entries TO authenticated;
GRANT ALL ON public.symptom_entries TO service_role;
ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own symptoms" ON public.symptom_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- care_plans
CREATE TABLE public.care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  condition_id UUID REFERENCES public.conditions ON DELETE SET NULL,
  title TEXT,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  status TEXT NOT NULL DEFAULT 'active',
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  follow_up_at DATE,
  notes TEXT,
  safety_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_plans TO authenticated;
GRANT ALL ON public.care_plans TO service_role;
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own care plans" ON public.care_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- timeline_events
CREATE TABLE public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  care_plan_id UUID REFERENCES public.care_plans ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity INT,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_events TO authenticated;
GRANT ALL ON public.timeline_events TO service_role;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own timeline" ON public.timeline_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- medications
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medications TO authenticated;
GRANT ALL ON public.medications TO service_role;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own medications" ON public.medications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- medication_logs
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.medications ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_logs TO authenticated;
GRANT ALL ON public.medication_logs TO service_role;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own med logs" ON public.medication_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- followups
CREATE TABLE public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  care_plan_id UUID REFERENCES public.care_plans ON DELETE CASCADE,
  scheduled_for DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followups TO authenticated;
GRANT ALL ON public.followups TO service_role;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own followups" ON public.followups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- care_circle
CREATE TABLE public.care_circle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  can_view_summary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_circle TO authenticated;
GRANT ALL ON public.care_circle TO service_role;
ALTER TABLE public.care_circle ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own care circle" ON public.care_circle FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
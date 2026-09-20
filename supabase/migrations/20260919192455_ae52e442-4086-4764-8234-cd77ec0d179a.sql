CREATE OR REPLACE FUNCTION public.validate_symptom_analysis()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  item JSONB;
  text_value TEXT;
  combined_text TEXT := NEW.summary;
BEGIN
  IF jsonb_typeof(NEW.symptoms) <> 'array' THEN
    RAISE EXCEPTION 'symptoms must be an array';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(NEW.symptoms)
  LOOP
    IF jsonb_typeof(item) <> 'object'
       OR NOT (item ? 'name')
       OR NOT (item ? 'severity')
       OR NOT (item ? 'duration_days')
       OR jsonb_typeof(item->'name') <> 'string'
       OR btrim(item->>'name') = ''
       OR (jsonb_typeof(item->'severity') NOT IN ('number', 'null'))
       OR (jsonb_typeof(item->'duration_days') NOT IN ('number', 'null'))
       OR (jsonb_typeof(item->'severity') = 'number' AND ((item->>'severity')::numeric < 0 OR (item->>'severity')::numeric > 10 OR trunc((item->>'severity')::numeric) <> (item->>'severity')::numeric))
       OR (jsonb_typeof(item->'duration_days') = 'number' AND ((item->>'duration_days')::numeric < 0 OR trunc((item->>'duration_days')::numeric) <> (item->>'duration_days')::numeric)) THEN
      RAISE EXCEPTION 'invalid symptom object';
    END IF;
    combined_text := combined_text || ' ' || (item->>'name');
  END LOOP;

  FOREACH text_value IN ARRAY NEW.associated_symptoms || NEW.red_flags_present || NEW.missing_safety_questions
  LOOP
    IF btrim(text_value) = '' THEN
      RAISE EXCEPTION 'analysis text arrays cannot contain blank values';
    END IF;
    combined_text := combined_text || ' ' || text_value;
  END LOOP;

  IF combined_text ~* '\m(diagnos(e|ed|is)|prescri(be|bed|ption)|cure(d)?|fully recovered|dose|mg)\M'
     OR combined_text ~* '\myou (have|likely have|are suffering from)\M'
     OR combined_text ~* '\mtake [0-9]+\M' THEN
    RAISE EXCEPTION 'analysis contains prohibited medical claims';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_symptom_analysis() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_symptom_analysis() TO service_role;

CREATE TRIGGER validate_symptom_analysis_before_write
BEFORE INSERT OR UPDATE ON public.symptom_analyses
FOR EACH ROW EXECUTE FUNCTION public.validate_symptom_analysis();
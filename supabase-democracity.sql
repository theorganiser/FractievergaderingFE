-- Democracity: dagen waarop raadsleden in een klas komen vertellen, en wie zich heeft aangemeld.
-- Plak dit in de Supabase SQL Editor en voer uit. Veilig om opnieuw uit te voeren.
--
-- Lezen mag iedereen (anon key). Schrijven kan alleen de server (service-role key):
-- aanmelden/afmelden en het beheren van de data gaan via /api/democracity.

CREATE TABLE IF NOT EXISTS democracity_dagen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datum DATE NOT NULL,
  tijd TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL,
  max_personen INT NOT NULL DEFAULT 2,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (datum, tijd, school)
);

CREATE TABLE IF NOT EXISTS democracity_aanmeldingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dag_id UUID NOT NULL REFERENCES democracity_dagen(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (dag_id, naam)
);

ALTER TABLE democracity_dagen ENABLE ROW LEVEL SECURITY;
ALTER TABLE democracity_aanmeldingen ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'democracity_dagen' AND policyname = 'Iedereen kan democracity-dagen lezen') THEN
    CREATE POLICY "Iedereen kan democracity-dagen lezen" ON democracity_dagen FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'democracity_aanmeldingen' AND policyname = 'Iedereen kan democracity-aanmeldingen lezen') THEN
    CREATE POLICY "Iedereen kan democracity-aanmeldingen lezen" ON democracity_aanmeldingen FOR SELECT USING (true);
  END IF;
END $$;

-- Maximum per dag afdwingen in de database (ook als twee mensen tegelijk klikken)
CREATE OR REPLACE FUNCTION democracity_max_check() RETURNS TRIGGER AS $$
DECLARE
  max_p INT;
  huidig INT;
BEGIN
  SELECT max_personen INTO max_p FROM democracity_dagen WHERE id = NEW.dag_id FOR UPDATE;
  SELECT COUNT(*) INTO huidig FROM democracity_aanmeldingen WHERE dag_id = NEW.dag_id;
  IF huidig >= max_p THEN
    RAISE EXCEPTION 'DAG_VOL';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS democracity_max_check_trigger ON democracity_aanmeldingen;
CREATE TRIGGER democracity_max_check_trigger
  BEFORE INSERT ON democracity_aanmeldingen
  FOR EACH ROW EXECUTE FUNCTION democracity_max_check();

-- De bekende uitvoeringen (januari/februari 2027)
INSERT INTO democracity_dagen (datum, tijd, school) VALUES
  ('2027-01-06', '9.30 – 11.30', 'De Hoeksteen'),
  ('2027-01-08', '9.30 – 11.30', 'Jozefschool'),
  ('2027-01-13', '9.30 – 11.30', 'De Hoeksteen'),
  ('2027-01-15', '9.30 – 11.30', 'Elan Primair'),
  ('2027-01-22', '9.30 – 11.30', 'Gooilandschool'),
  ('2027-01-22', '12.30 – 14.30', 'Gooilandschool'),
  ('2027-01-27', '9.30 – 11.30', 'Jozefschool'),
  ('2027-01-29', '9.30 – 11.30', 'Vrije School Michael'),
  ('2027-02-03', '9.30 – 11.30', 'Godelindeschool'),
  ('2027-02-05', '9.30 – 11.30', 'Godelindeschool'),
  ('2027-02-10', '9.30 – 11.30', 'Elan Primair'),
  ('2027-02-12', '9.30 – 11.30', 'De Indon')
ON CONFLICT (datum, tijd, school) DO NOTHING;

SELECT 'Democracity aangemaakt ✓' AS status, (SELECT COUNT(*) FROM democracity_dagen) AS aantal_dagen;

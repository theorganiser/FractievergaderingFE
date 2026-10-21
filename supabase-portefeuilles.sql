-- ============================================================
-- Portefeuilleverdeling — woordvoerders per beleidsterrein
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
--
-- Deze tabel is bewust ALLEEN via SQL te wijzigen: er zijn geen
-- insert/update/delete policies, dus de anon-key waarmee de app
-- werkt kan hier niet in schrijven. Wijzigingen (na verkiezingen,
-- portefeuillewissel) doe je hier in de SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS portefeuilles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volgorde INTEGER NOT NULL,
  onderwerp TEXT NOT NULL,
  programma TEXT DEFAULT '',
  woordvoerder_1 TEXT DEFAULT '',
  woordvoerder_2 TEXT DEFAULT '',
  woordvoerder_3 TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_portefeuilles_volgorde ON portefeuilles(volgorde ASC);

ALTER TABLE portefeuilles ENABLE ROW LEVEL SECURITY;

-- Iedereen mag lezen — er is bewust GEEN insert/update/delete policy,
-- dus de app zelf kan hier nooit in schrijven, alleen jij via de SQL Editor.
CREATE POLICY "Iedereen kan portefeuilles lezen"
  ON portefeuilles FOR SELECT
  USING (true);

-- Data uit de concept-portefeuilleverdeling
INSERT INTO portefeuilles (volgorde, onderwerp, programma, woordvoerder_1, woordvoerder_2, woordvoerder_3) VALUES
  (1,  'Bestuurlijke vernieuwing & Burgerparticipatie (P1)', '1', 'Vera', 'Bianca', 'Jan'),
  (2,  'Algemeen bestuur (P1)', '1', 'Claudia', 'Vera', 'Jan'),
  (3,  'Regio & intergemeentelijke samenwerking (P1)', '1', 'Claudia', 'Jan', 'Pieter'),
  (4,  'Vluchtelingen & integratie (P1)', '1', 'Vera', 'Robin', 'Claudia'),
  (5,  'Openbare orde & veiligheid (P2)', '2', 'Pieter', 'Claudia', 'Jan'),
  (6,  'Vergunningen & Handhaving (P1 en 2)', '2', 'Pieter', 'Ralph', 'Jan'),
  (7,  'Verkeer & Vervoer; Parkeren (P3)', '3', 'Pieter', 'Jan', 'Vera'),
  (8,  'Havens (P3)', '3', 'Ralph', 'Jan', 'Pieter'),
  (9,  'Natuur & Openbare ruimte (P3)', '3', 'Claudia', 'Marga', 'Robin'),
  (10, 'Ruimtelijke Ordening (P4)', '4', 'Claudia', 'Ralph', 'Vera'),
  (11, 'Economische zaken (P4)', '4', 'Vera', 'Pieter', 'Ralph'),
  (12, 'Toerisme/recreatie/evenementen (P4)', '4', 'Marga', 'Bianca', 'Claudia'),
  (13, 'Begraafplaatsen (P4)', '4', 'Bianca', 'Marga', 'Claudia'),
  (14, 'Volkshuisvesting & wonen (P4)', '4', 'Ralph', 'Jan', 'Pieter'),
  (15, 'Milieu & duurzaamheid (P5)', '5', 'Marga en Bianca', 'Vera', 'Robin'),
  (16, 'Warmtenet', '', 'Bianca', 'Vera', 'Marga'),
  (17, 'Werkgelegenheid & arbeidsparticipatie (P6)', '6', 'Bianca', 'Jan', 'Pieter'),
  (18, 'Zorg & welzijn/sociaal domein (P7)', '7', 'Marga', 'Claudia', 'Bianca'),
  (19, 'Onderwijs (P7)', '7', 'Vera', 'Bianca', 'Ralph'),
  (20, 'Jeugd 18- (P7)', '7', 'Bianca', 'Vera', 'Robin'),
  (21, 'Dierenwelzijn (P7)', '7', 'Vera', 'Marga', 'Jan'),
  (22, 'Cultuur/monumenten (P8)', '8', 'Marga', 'Claudia', 'Bianca'),
  (23, 'Bibliotheek (P8)', '8', 'Marga', 'Robin', 'Bianca'),
  (24, 'Sport (P8)', '8', 'Bianca', 'Vera', 'Marga'),
  (25, 'Subsidiebeleid (P9)', '9', 'Vera', 'Robin', 'Jan'),
  (26, 'Financiën & belastingen (P9)', '9', 'Ralph', 'Robin', 'Vera'),
  (27, 'Bedrijfsvoering en P&O (P9)', '9', 'Pieter', 'Vera', 'Robin'),
  (28, 'ICT & dienstverlening (P9)', '9', 'Pieter', 'Robin', 'Bianca'),
  (29, 'Inkoop en inkoopbeleid (P9)', '9', 'Robin', 'Pieter', 'Ralph'),
  (30, 'Omgevingswet', 'Extra', 'Ralph', 'Jan', 'Claudia'),
  (31, 'Project Crailo', 'Extra', 'Ralph', 'Robin', 'Vera');

SELECT 'Portefeuilles tabel aangemaakt en gevuld ✓' as status;

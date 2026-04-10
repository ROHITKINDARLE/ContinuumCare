-- ============================================================
--  ContinuumCare — Pharmacy & Medicine Seed Data
--  Run this ONCE in Supabase SQL Editor after supabase_schema.sql
--  Creates: medicines, pharmacies, pharmacy_medicines tables
--  Inserts: 55 medicines, 8 pharmacies, 300+ price mappings
-- ============================================================

-- ============================================================
--  TABLE: medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS public.medicines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  composition   TEXT NOT NULL,
  category      TEXT NOT NULL,
  manufacturer  TEXT NOT NULL,
  base_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.medicines IS 'Medicine catalog with composition, category, and manufacturer info.';

-- ============================================================
--  TABLE: pharmacies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  city          TEXT NOT NULL DEFAULT 'Mumbai',
  latitude      NUMERIC(9,6) NOT NULL,
  longitude     NUMERIC(9,6) NOT NULL,
  rating        NUMERIC(2,1) NOT NULL DEFAULT 4.0,
  phone         TEXT,
  hours         TEXT,
  delivery      BOOLEAN NOT NULL DEFAULT false,
  delivery_time TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pharmacies IS 'Pharmacy locations with coordinates, ratings, and delivery info.';

-- ============================================================
--  TABLE: pharmacy_medicines (price mapping)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pharmacy_medicines (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id   UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id   UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  price         NUMERIC(10,2) NOT NULL,
  stock         INTEGER NOT NULL DEFAULT 50,
  discount      NUMERIC(4,1) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pharmacy_id, medicine_id)
);

COMMENT ON TABLE public.pharmacy_medicines IS 'Medicine availability and pricing per pharmacy.';

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pharmacy_medicines_pharmacy ON public.pharmacy_medicines(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_medicines_medicine ON public.pharmacy_medicines(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicines_composition       ON public.medicines(composition);
CREATE INDEX IF NOT EXISTS idx_medicines_category          ON public.medicines(category);

-- ============================================================
--  RLS — Row Level Security
-- ============================================================
ALTER TABLE public.medicines         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_medicines ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (these are public catalog tables)
CREATE POLICY "medicines_select_auth" ON public.medicines
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pharmacies_select_auth" ON public.pharmacies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pharmacy_medicines_select_auth" ON public.pharmacy_medicines
  FOR SELECT USING (auth.role() = 'authenticated');

-- Staff can manage catalog data
CREATE POLICY "medicines_manage_staff" ON public.medicines
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "pharmacies_manage_staff" ON public.pharmacies
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY "pharmacy_medicines_manage_staff" ON public.pharmacy_medicines
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Grant access
GRANT ALL PRIVILEGES ON public.medicines TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.pharmacies TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.pharmacy_medicines TO anon, authenticated;

-- ============================================================
--  SEED DATA: MEDICINES (55 entries)
-- ============================================================
-- Clear existing data (idempotent re-run)
TRUNCATE public.pharmacy_medicines CASCADE;
TRUNCATE public.medicines CASCADE;
TRUNCATE public.pharmacies CASCADE;

-- Use a DO block to insert with generated UUIDs and cross-reference them
DO $$
DECLARE
  -- Medicine IDs
  m_crocin500          UUID := uuid_generate_v4();
  m_dolo650            UUID := uuid_generate_v4();
  m_calpol500          UUID := uuid_generate_v4();
  m_p500               UUID := uuid_generate_v4();
  m_pacimol650         UUID := uuid_generate_v4();
  m_combiflam          UUID := uuid_generate_v4();
  m_amoxil500          UUID := uuid_generate_v4();
  m_mox500             UUID := uuid_generate_v4();
  m_novamox500         UUID := uuid_generate_v4();
  m_augmentin625       UUID := uuid_generate_v4();
  m_moxclav625         UUID := uuid_generate_v4();
  m_clavam625          UUID := uuid_generate_v4();
  m_azithral500        UUID := uuid_generate_v4();
  m_zithromax500       UUID := uuid_generate_v4();
  m_azee500            UUID := uuid_generate_v4();
  m_glycomet500        UUID := uuid_generate_v4();
  m_glucophage500      UUID := uuid_generate_v4();
  m_obimet500          UUID := uuid_generate_v4();
  m_glycomet850        UUID := uuid_generate_v4();
  m_lipitor10          UUID := uuid_generate_v4();
  m_atorva10           UUID := uuid_generate_v4();
  m_tonact10           UUID := uuid_generate_v4();
  m_atorva20           UUID := uuid_generate_v4();
  m_omez20             UUID := uuid_generate_v4();
  m_prilosec20         UUID := uuid_generate_v4();
  m_ocid20             UUID := uuid_generate_v4();
  m_pan40              UUID := uuid_generate_v4();
  m_pantocid40         UUID := uuid_generate_v4();
  m_pand               UUID := uuid_generate_v4();
  m_norvasc5           UUID := uuid_generate_v4();
  m_amlong5            UUID := uuid_generate_v4();
  m_stamlo5            UUID := uuid_generate_v4();
  m_zyrtec10           UUID := uuid_generate_v4();
  m_alerid10           UUID := uuid_generate_v4();
  m_okacet10           UUID := uuid_generate_v4();
  m_telma40            UUID := uuid_generate_v4();
  m_telsartan40        UUID := uuid_generate_v4();
  m_brufen400          UUID := uuid_generate_v4();
  m_ibugesic400        UUID := uuid_generate_v4();
  m_cefixime200        UUID := uuid_generate_v4();
  m_zifi200            UUID := uuid_generate_v4();
  m_taxim200           UUID := uuid_generate_v4();
  m_ciproflox500       UUID := uuid_generate_v4();
  m_ciplox500          UUID := uuid_generate_v4();
  m_montek_lc          UUID := uuid_generate_v4();
  m_montair_lc         UUID := uuid_generate_v4();
  m_shelcal500         UUID := uuid_generate_v4();
  m_calcimax500        UUID := uuid_generate_v4();
  m_ecosprin75         UUID := uuid_generate_v4();
  m_ecosprin150        UUID := uuid_generate_v4();
  m_thyronorm25        UUID := uuid_generate_v4();
  m_thyronorm50        UUID := uuid_generate_v4();
  m_eltroxin50         UUID := uuid_generate_v4();
  m_rabeoz20           UUID := uuid_generate_v4();
  m_rablet20           UUID := uuid_generate_v4();

  -- Pharmacy IDs
  p_apollo     UUID := uuid_generate_v4();
  p_medplus    UUID := uuid_generate_v4();
  p_wellness   UUID := uuid_generate_v4();
  p_janaushadhi UUID := uuid_generate_v4();
  p_netmeds    UUID := uuid_generate_v4();
  p_healthkart UUID := uuid_generate_v4();
  p_pharmeasy  UUID := uuid_generate_v4();
  p_tata1mg    UUID := uuid_generate_v4();

BEGIN
  -- ── INSERT MEDICINES ─────────────────────────────────────────────────

  -- Paracetamol family
  INSERT INTO public.medicines VALUES (m_crocin500,   'Crocin 500',          'Paracetamol 500mg',                                      'Analgesic',         'GSK',             2.50);
  INSERT INTO public.medicines VALUES (m_dolo650,     'Dolo 650',            'Paracetamol 650mg',                                      'Analgesic',         'Micro Labs',      3.00);
  INSERT INTO public.medicines VALUES (m_calpol500,   'Calpol 500',          'Paracetamol 500mg',                                      'Analgesic',         'GSK',             2.20);
  INSERT INTO public.medicines VALUES (m_p500,        'P-500',               'Paracetamol 500mg',                                      'Analgesic',         'Cipla',           1.00);
  INSERT INTO public.medicines VALUES (m_pacimol650,  'Pacimol 650',         'Paracetamol 650mg',                                      'Analgesic',         'Ipca Labs',       1.80);
  INSERT INTO public.medicines VALUES (m_combiflam,   'Combiflam',           'Ibuprofen 400mg + Paracetamol 325mg',                    'Analgesic',         'Sanofi',          4.50);

  -- Amoxicillin family
  INSERT INTO public.medicines VALUES (m_amoxil500,   'Amoxil 500',          'Amoxicillin 500mg',                                      'Antibiotic',        'GSK',            12.00);
  INSERT INTO public.medicines VALUES (m_mox500,      'Mox 500',             'Amoxicillin 500mg',                                      'Antibiotic',        'Ranbaxy',         6.50);
  INSERT INTO public.medicines VALUES (m_novamox500,  'Novamox 500',         'Amoxicillin 500mg',                                      'Antibiotic',        'Cipla',           7.00);

  -- Augmentin/Amoxiclav
  INSERT INTO public.medicines VALUES (m_augmentin625,'Augmentin 625',       'Amoxicillin 500mg + Clavulanic Acid 125mg',              'Antibiotic',        'GSK',            28.00);
  INSERT INTO public.medicines VALUES (m_moxclav625,  'Moxclav 625',         'Amoxicillin 500mg + Clavulanic Acid 125mg',              'Antibiotic',        'Aristo',         14.00);
  INSERT INTO public.medicines VALUES (m_clavam625,   'Clavam 625',          'Amoxicillin 500mg + Clavulanic Acid 125mg',              'Antibiotic',        'Alkem',          15.00);

  -- Azithromycin family
  INSERT INTO public.medicines VALUES (m_azithral500, 'Azithral 500',        'Azithromycin 500mg',                                     'Antibiotic',        'Alembic',        70.00);
  INSERT INTO public.medicines VALUES (m_zithromax500,'Zithromax 500',       'Azithromycin 500mg',                                     'Antibiotic',        'Pfizer',         95.00);
  INSERT INTO public.medicines VALUES (m_azee500,     'Azee 500',            'Azithromycin 500mg',                                     'Antibiotic',        'Cipla',          55.00);

  -- Metformin family
  INSERT INTO public.medicines VALUES (m_glycomet500, 'Glycomet 500',        'Metformin 500mg',                                        'Antidiabetic',      'USV',             3.50);
  INSERT INTO public.medicines VALUES (m_glucophage500,'Glucophage 500',     'Metformin 500mg',                                        'Antidiabetic',      'Franco-Indian',   5.00);
  INSERT INTO public.medicines VALUES (m_obimet500,   'Obimet 500',          'Metformin 500mg',                                        'Antidiabetic',      'Pfizer',          2.80);
  INSERT INTO public.medicines VALUES (m_glycomet850, 'Glycomet 850',        'Metformin 850mg',                                        'Antidiabetic',      'USV',             4.50);

  -- Atorvastatin family
  INSERT INTO public.medicines VALUES (m_lipitor10,   'Lipitor 10',          'Atorvastatin 10mg',                                      'Statin',            'Pfizer',         12.00);
  INSERT INTO public.medicines VALUES (m_atorva10,    'Atorva 10',           'Atorvastatin 10mg',                                      'Statin',            'Zydus',           5.50);
  INSERT INTO public.medicines VALUES (m_tonact10,    'Tonact 10',           'Atorvastatin 10mg',                                      'Statin',            'Lupin',           6.00);
  INSERT INTO public.medicines VALUES (m_atorva20,    'Atorva 20',           'Atorvastatin 20mg',                                      'Statin',            'Zydus',           9.00);

  -- Omeprazole family
  INSERT INTO public.medicines VALUES (m_omez20,      'Omez 20',             'Omeprazole 20mg',                                        'Antacid',           'Dr. Reddy''s',    5.50);
  INSERT INTO public.medicines VALUES (m_prilosec20,  'Prilosec 20',         'Omeprazole 20mg',                                        'Antacid',           'AstraZeneca',     8.00);
  INSERT INTO public.medicines VALUES (m_ocid20,      'Ocid 20',             'Omeprazole 20mg',                                        'Antacid',           'Zydus',           4.00);

  -- Pantoprazole family
  INSERT INTO public.medicines VALUES (m_pan40,       'Pan 40',              'Pantoprazole 40mg',                                      'Antacid',           'Alkem',           6.00);
  INSERT INTO public.medicines VALUES (m_pantocid40,  'Pantocid 40',         'Pantoprazole 40mg',                                      'Antacid',           'Sun Pharma',      7.50);
  INSERT INTO public.medicines VALUES (m_pand,        'Pan-D',               'Pantoprazole 40mg + Domperidone 10mg',                   'Antacid',           'Alkem',           8.50);

  -- Amlodipine family
  INSERT INTO public.medicines VALUES (m_norvasc5,    'Norvasc 5',           'Amlodipine 5mg',                                         'Antihypertensive',  'Pfizer',         10.00);
  INSERT INTO public.medicines VALUES (m_amlong5,     'Amlong 5',            'Amlodipine 5mg',                                         'Antihypertensive',  'Micro Labs',      3.00);
  INSERT INTO public.medicines VALUES (m_stamlo5,     'Stamlo 5',            'Amlodipine 5mg',                                         'Antihypertensive',  'Dr. Reddy''s',    4.00);

  -- Cetirizine family
  INSERT INTO public.medicines VALUES (m_zyrtec10,    'Zyrtec 10',           'Cetirizine 10mg',                                        'Antihistamine',     'UCB',             5.00);
  INSERT INTO public.medicines VALUES (m_alerid10,    'Alerid 10',           'Cetirizine 10mg',                                        'Antihistamine',     'Cipla',           2.00);
  INSERT INTO public.medicines VALUES (m_okacet10,    'Okacet 10',           'Cetirizine 10mg',                                        'Antihistamine',     'Lupin',           1.80);

  -- Telmisartan family
  INSERT INTO public.medicines VALUES (m_telma40,     'Telma 40',            'Telmisartan 40mg',                                       'Antihypertensive',  'Glenmark',        5.00);
  INSERT INTO public.medicines VALUES (m_telsartan40, 'Telsartan 40',        'Telmisartan 40mg',                                       'Antihypertensive',  'USV',             3.50);

  -- Ibuprofen family
  INSERT INTO public.medicines VALUES (m_brufen400,   'Brufen 400',          'Ibuprofen 400mg',                                        'NSAID',             'Abbott',          4.00);
  INSERT INTO public.medicines VALUES (m_ibugesic400, 'Ibugesic 400',        'Ibuprofen 400mg',                                        'NSAID',             'Cipla',           2.50);

  -- Cefixime family
  INSERT INTO public.medicines VALUES (m_cefixime200, 'Cefixime 200',        'Cefixime 200mg',                                         'Antibiotic',        'Mankind',        22.00);
  INSERT INTO public.medicines VALUES (m_zifi200,     'Zifi 200',            'Cefixime 200mg',                                         'Antibiotic',        'FDC',            25.00);
  INSERT INTO public.medicines VALUES (m_taxim200,    'Taxim-O 200',         'Cefixime 200mg',                                         'Antibiotic',        'Alkem',          30.00);

  -- Ciprofloxacin family
  INSERT INTO public.medicines VALUES (m_ciproflox500,'Ciprofloxacin 500',   'Ciprofloxacin 500mg',                                    'Antibiotic',        'Ranbaxy',         8.00);
  INSERT INTO public.medicines VALUES (m_ciplox500,   'Ciplox 500',          'Ciprofloxacin 500mg',                                    'Antibiotic',        'Cipla',          10.00);

  -- Montelukast + Levocetirizine
  INSERT INTO public.medicines VALUES (m_montek_lc,   'Montek LC',           'Montelukast 10mg + Levocetirizine 5mg',                  'Antihistamine',     'Sun Pharma',     12.00);
  INSERT INTO public.medicines VALUES (m_montair_lc,  'Montair LC',          'Montelukast 10mg + Levocetirizine 5mg',                  'Antihistamine',     'Cipla',          10.50);

  -- Calcium supplements
  INSERT INTO public.medicines VALUES (m_shelcal500,  'Shelcal 500',         'Calcium Carbonate 500mg + Vitamin D3',                   'Supplement',        'Torrent',         6.00);
  INSERT INTO public.medicines VALUES (m_calcimax500, 'Calcimax 500',        'Calcium Carbonate 500mg + Vitamin D3',                   'Supplement',        'Meyer Organics',  5.50);

  -- Aspirin
  INSERT INTO public.medicines VALUES (m_ecosprin75,  'Ecosprin 75',         'Aspirin 75mg',                                           'Blood Thinner',     'USV',             1.50);
  INSERT INTO public.medicines VALUES (m_ecosprin150, 'Ecosprin 150',        'Aspirin 150mg',                                          'Blood Thinner',     'USV',             2.00);

  -- Thyroid
  INSERT INTO public.medicines VALUES (m_thyronorm25, 'Thyronorm 25',        'Levothyroxine 25mcg',                                    'Thyroid',           'Abbott',          3.00);
  INSERT INTO public.medicines VALUES (m_thyronorm50, 'Thyronorm 50',        'Levothyroxine 50mcg',                                    'Thyroid',           'Abbott',          4.00);
  INSERT INTO public.medicines VALUES (m_eltroxin50,  'Eltroxin 50',         'Levothyroxine 50mcg',                                    'Thyroid',           'GSK',             5.50);

  -- Rabeprazole
  INSERT INTO public.medicines VALUES (m_rabeoz20,    'Razo 20',             'Rabeprazole 20mg',                                       'Antacid',           'Dr. Reddy''s',    5.00);
  INSERT INTO public.medicines VALUES (m_rablet20,    'Rablet 20',           'Rabeprazole 20mg',                                       'Antacid',           'Lupin',           4.50);

  -- ── INSERT PHARMACIES ────────────────────────────────────────────────

  INSERT INTO public.pharmacies VALUES (p_apollo,     'Apollo Pharmacy',         '12 MG Road, Andheri West',       'Mumbai',    19.076000, 72.877700, 4.8, '+91 98765 43210', '24/7',         true,  '30 min');
  INSERT INTO public.pharmacies VALUES (p_medplus,    'MedPlus Pharmacy',        '45 Station Road, Bandra',        'Mumbai',    19.085000, 72.890000, 4.6, '+91 98765 11111', '8 AM – 10 PM', true,  '45 min');
  INSERT INTO public.pharmacies VALUES (p_wellness,   'Wellness Forever',        '78 Park Avenue, Juhu',           'Mumbai',    19.065000, 72.865000, 4.3, '+91 98765 33333', '9 AM – 9 PM',  false, NULL);
  INSERT INTO public.pharmacies VALUES (p_janaushadhi,'Jan Aushadhi Kendra',     '3 Government Complex, Kurla',    'Mumbai',    19.090000, 72.900000, 4.0, '+91 98765 44444', '9 AM – 6 PM',  false, NULL);
  INSERT INTO public.pharmacies VALUES (p_netmeds,    'Netmeds Pharmacy',        '22 Hill Road, Bandra West',      'Mumbai',    19.055000, 72.840000, 4.5, '+91 98765 55555', '9 AM – 11 PM', true,  '60 min');
  INSERT INTO public.pharmacies VALUES (p_healthkart, 'HealthKart Pharmacy',     '15 Linking Road, Khar',          'Mumbai',    19.072000, 72.860000, 4.7, '+91 98765 99999', '24/7',         true,  '25 min');
  INSERT INTO public.pharmacies VALUES (p_pharmeasy,  'PharmEasy Store',         '44 Turner Road, Bandra West',    'Mumbai',    19.070000, 72.870000, 4.6, '+91 98765 00002', '9 AM – 10 PM', true,  '35 min');
  INSERT INTO public.pharmacies VALUES (p_tata1mg,    'Tata 1mg Partner Store',  '88 Western Express, Borivali',   'Mumbai',    19.110000, 72.885000, 4.5, '+91 98765 00003', '8 AM – 11 PM', true,  '55 min');

  -- ── INSERT PHARMACY MEDICINES (price mapping) ────────────────────────
  -- Each medicine is assigned to 4-7 pharmacies with ±10-30% price variation.
  -- Stock ranges from 0 (out) to 100. Discount ranges from 0% to 25%.
  -- Jan Aushadhi gets ~40% cheaper prices (government scheme).

  -- Helper: base_price * multiplier, rounded to 2 decimals
  -- Apollo (premium, +5-15%), MedPlus (+0-10%), Wellness (±5%), JanAushadhi (-30-40%),
  -- Netmeds (-5-10%), HealthKart (+0-5%), PharmEasy (-5-15%), Tata1mg (-5-10%)

  -- ── Paracetamol family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_crocin500,   2.80,  80,  5),
    (p_medplus,    m_crocin500,   2.60,  65,  8),
    (p_wellness,   m_crocin500,   2.50,  45, 10),
    (p_janaushadhi,m_crocin500,   1.50,  90,  0),
    (p_netmeds,    m_crocin500,   2.35,  70, 12),
    (p_pharmeasy,  m_crocin500,   2.25,  55, 15),
    (p_tata1mg,    m_crocin500,   2.30,  60, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_dolo650,     3.40,  75,  5),
    (p_medplus,    m_dolo650,     3.10,  60,  8),
    (p_janaushadhi,m_dolo650,     1.80,  85,  0),
    (p_healthkart, m_dolo650,     3.00,  90, 10),
    (p_pharmeasy,  m_dolo650,     2.70,  50, 15),
    (p_tata1mg,    m_dolo650,     2.80,  70, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_calpol500,   2.50,  55,  5),
    (p_medplus,    m_calpol500,   2.30,  40, 10),
    (p_wellness,   m_calpol500,   2.20,  30,  8),
    (p_janaushadhi,m_calpol500,   1.30,  75,  0),
    (p_netmeds,    m_calpol500,   2.00,  60, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_janaushadhi,m_p500,        0.60, 100,  0),
    (p_medplus,    m_p500,        1.10,  50,  5),
    (p_pharmeasy,  m_p500,        0.90,  65, 10),
    (p_tata1mg,    m_p500,        0.95,  45,  8);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_pacimol650,  2.00,  40,  5),
    (p_janaushadhi,m_pacimol650,  1.10,  80,  0),
    (p_healthkart, m_pacimol650,  1.85,  55, 10),
    (p_netmeds,    m_pacimol650,  1.70,  60, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_combiflam,   5.20,  70,  5),
    (p_medplus,    m_combiflam,   4.80,  55, 10),
    (p_wellness,   m_combiflam,   4.60,  40,  8),
    (p_healthkart, m_combiflam,   4.50,  65, 12),
    (p_pharmeasy,  m_combiflam,   4.00,  50, 18);

  -- ── Amoxicillin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_amoxil500,  13.50,  45,  5),
    (p_medplus,    m_amoxil500,  12.50,  35,  8),
    (p_janaushadhi,m_amoxil500,   7.50,  60,  0),
    (p_healthkart, m_amoxil500,  12.00,  50, 10),
    (p_tata1mg,    m_amoxil500,  11.50,  40, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_mox500,      7.00,  55,  8),
    (p_janaushadhi,m_mox500,      4.00,  70,  0),
    (p_netmeds,    m_mox500,      6.20,  45, 12),
    (p_pharmeasy,  m_mox500,      5.80,  50, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_novamox500,  7.80,  40,  5),
    (p_wellness,   m_novamox500,  7.20,  30,  8),
    (p_healthkart, m_novamox500,  7.00,  55, 10),
    (p_tata1mg,    m_novamox500,  6.50,  45, 12);

  -- ── Augmentin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_augmentin625, 32.00, 35,  5),
    (p_medplus,    m_augmentin625, 29.50, 25,  8),
    (p_healthkart, m_augmentin625, 28.00, 40, 10),
    (p_pharmeasy,  m_augmentin625, 26.00, 30, 15),
    (p_tata1mg,    m_augmentin625, 27.00, 35, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_moxclav625,  16.00, 50,  5),
    (p_medplus,    m_moxclav625,  14.50, 40,  8),
    (p_janaushadhi,m_moxclav625,   8.50, 65,  0),
    (p_netmeds,    m_moxclav625,  13.00, 45, 12),
    (p_pharmeasy,  m_moxclav625,  12.50, 35, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_clavam625,   16.00, 40,  8),
    (p_wellness,   m_clavam625,   15.50, 30, 10),
    (p_janaushadhi,m_clavam625,    9.00, 55,  0),
    (p_healthkart, m_clavam625,   15.00, 45, 10),
    (p_tata1mg,    m_clavam625,   14.00, 35, 12);

  -- ── Azithromycin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_azithral500,  78.00, 30,  5),
    (p_medplus,    m_azithral500,  72.00, 25, 10),
    (p_healthkart, m_azithral500,  70.00, 40,  8),
    (p_pharmeasy,  m_azithral500,  65.00, 20, 15),
    (p_tata1mg,    m_azithral500,  68.00, 35, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_zithromax500,105.00, 15,  5),
    (p_medplus,    m_zithromax500, 98.00, 20,  8),
    (p_healthkart, m_zithromax500, 95.00, 25, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_azee500,     60.00, 45,  5),
    (p_medplus,    m_azee500,     56.00, 35, 10),
    (p_janaushadhi,m_azee500,     35.00, 50,  0),
    (p_netmeds,    m_azee500,     52.00, 40, 12),
    (p_pharmeasy,  m_azee500,     48.00, 30, 18),
    (p_tata1mg,    m_azee500,     50.00, 40, 15);

  -- ── Metformin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_glycomet500,  3.80,  75,  5),
    (p_medplus,    m_glycomet500,  3.60,  60,  8),
    (p_janaushadhi,m_glycomet500,  2.10,  90,  0),
    (p_healthkart, m_glycomet500,  3.50,  70, 10),
    (p_pharmeasy,  m_glycomet500,  3.20,  55, 12),
    (p_tata1mg,    m_glycomet500,  3.30,  65, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_glucophage500, 5.50, 40,  5),
    (p_medplus,    m_glucophage500, 5.20, 35, 10),
    (p_netmeds,    m_glucophage500, 4.70, 45, 12),
    (p_pharmeasy,  m_glucophage500, 4.50, 30, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_janaushadhi,m_obimet500,    1.70, 85,  0),
    (p_medplus,    m_obimet500,    2.90, 50,  8),
    (p_pharmeasy,  m_obimet500,    2.50, 45, 12),
    (p_tata1mg,    m_obimet500,    2.60, 55, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_glycomet850,  5.00, 55,  5),
    (p_janaushadhi,m_glycomet850,  2.70, 80,  0),
    (p_healthkart, m_glycomet850,  4.50, 60, 10),
    (p_tata1mg,    m_glycomet850,  4.20, 50, 12);

  -- ── Atorvastatin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_lipitor10,   13.50, 30,  5),
    (p_medplus,    m_lipitor10,   12.50, 25, 10),
    (p_healthkart, m_lipitor10,   12.00, 35,  8),
    (p_pharmeasy,  m_lipitor10,   11.00, 20, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_atorva10,     6.00, 65,  5),
    (p_medplus,    m_atorva10,     5.60, 55, 10),
    (p_janaushadhi,m_atorva10,     3.30, 80,  0),
    (p_netmeds,    m_atorva10,     5.20, 45, 12),
    (p_pharmeasy,  m_atorva10,     5.00, 50, 15),
    (p_tata1mg,    m_atorva10,     5.10, 60, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_tonact10,     6.20, 45,  8),
    (p_wellness,   m_tonact10,     6.00, 35, 10),
    (p_healthkart, m_tonact10,     5.80, 50, 12),
    (p_tata1mg,    m_tonact10,     5.50, 40, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_atorva20,    10.00, 40,  5),
    (p_janaushadhi,m_atorva20,     5.50, 70,  0),
    (p_netmeds,    m_atorva20,     8.50, 50, 12),
    (p_pharmeasy,  m_atorva20,     8.00, 35, 15);

  -- ── Omeprazole family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_omez20,      6.00, 70,  5),
    (p_medplus,    m_omez20,      5.60, 55, 10),
    (p_janaushadhi,m_omez20,      3.30, 85,  0),
    (p_healthkart, m_omez20,      5.50, 60,  8),
    (p_pharmeasy,  m_omez20,      5.00, 45, 15),
    (p_tata1mg,    m_omez20,      5.20, 50, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_prilosec20,   9.00, 20,  5),
    (p_medplus,    m_prilosec20,   8.20, 25, 10),
    (p_healthkart, m_prilosec20,   8.00, 30,  8);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_ocid20,       4.20, 50, 10),
    (p_janaushadhi,m_ocid20,       2.50, 75,  0),
    (p_pharmeasy,  m_ocid20,       3.60, 40, 15),
    (p_tata1mg,    m_ocid20,       3.80, 55, 12);

  -- ── Pantoprazole family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_pan40,        6.80, 65,  5),
    (p_medplus,    m_pan40,        6.20, 50, 10),
    (p_janaushadhi,m_pan40,        3.60, 80,  0),
    (p_netmeds,    m_pan40,        5.60, 55, 12),
    (p_healthkart, m_pan40,        6.00, 60,  8),
    (p_pharmeasy,  m_pan40,        5.20, 45, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_pantocid40,   8.50, 45,  5),
    (p_medplus,    m_pantocid40,   7.80, 35, 10),
    (p_healthkart, m_pantocid40,   7.50, 50,  8),
    (p_tata1mg,    m_pantocid40,   7.00, 40, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_pand,         9.50, 50,  5),
    (p_medplus,    m_pand,         8.80, 40, 10),
    (p_wellness,   m_pand,         8.50, 30,  8),
    (p_pharmeasy,  m_pand,         7.50, 35, 15);

  -- ── Amlodipine family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_norvasc5,    11.00, 25,  5),
    (p_medplus,    m_norvasc5,    10.50, 20, 10),
    (p_healthkart, m_norvasc5,    10.00, 30,  8);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_amlong5,      3.40, 70,  5),
    (p_medplus,    m_amlong5,      3.10, 60, 10),
    (p_janaushadhi,m_amlong5,      1.80, 90,  0),
    (p_netmeds,    m_amlong5,      2.80, 55, 12),
    (p_pharmeasy,  m_amlong5,      2.60, 50, 15),
    (p_tata1mg,    m_amlong5,      2.70, 65, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_stamlo5,      4.20, 45, 10),
    (p_wellness,   m_stamlo5,      4.00, 35,  8),
    (p_healthkart, m_stamlo5,      3.80, 55, 12),
    (p_pharmeasy,  m_stamlo5,      3.50, 40, 15);

  -- ── Cetirizine family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_zyrtec10,     5.50, 60,  5),
    (p_medplus,    m_zyrtec10,     5.20, 50, 10),
    (p_healthkart, m_zyrtec10,     5.00, 55,  8),
    (p_pharmeasy,  m_zyrtec10,     4.50, 40, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_alerid10,     2.10, 65, 10),
    (p_janaushadhi,m_alerid10,     1.20, 80,  0),
    (p_netmeds,    m_alerid10,     1.90, 55, 12),
    (p_pharmeasy,  m_alerid10,     1.80, 50, 15),
    (p_tata1mg,    m_alerid10,     1.85, 60, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_janaushadhi,m_okacet10,     1.10, 90,  0),
    (p_netmeds,    m_okacet10,     1.70, 55, 12),
    (p_pharmeasy,  m_okacet10,     1.60, 45, 15),
    (p_tata1mg,    m_okacet10,     1.65, 50, 10);

  -- ── Telmisartan family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_telma40,      5.50, 55,  5),
    (p_medplus,    m_telma40,      5.20, 45, 10),
    (p_janaushadhi,m_telma40,      3.00, 75,  0),
    (p_healthkart, m_telma40,      5.00, 50,  8),
    (p_pharmeasy,  m_telma40,      4.50, 40, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_telsartan40,  3.60, 50, 10),
    (p_janaushadhi,m_telsartan40,  2.10, 70,  0),
    (p_netmeds,    m_telsartan40,  3.30, 45, 12),
    (p_tata1mg,    m_telsartan40,  3.20, 55, 10);

  -- ── Ibuprofen family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_brufen400,    4.50, 60,  5),
    (p_medplus,    m_brufen400,    4.20, 50, 10),
    (p_healthkart, m_brufen400,    4.00, 55,  8),
    (p_pharmeasy,  m_brufen400,    3.60, 40, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_ibugesic400,  2.60, 55, 10),
    (p_janaushadhi,m_ibugesic400,  1.50, 80,  0),
    (p_netmeds,    m_ibugesic400,  2.30, 45, 12),
    (p_pharmeasy,  m_ibugesic400,  2.10, 40, 18),
    (p_tata1mg,    m_ibugesic400,  2.20, 50, 10);

  -- ── Cefixime family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_cefixime200, 24.00, 35,  5),
    (p_medplus,    m_cefixime200, 22.50, 30, 10),
    (p_janaushadhi,m_cefixime200, 13.00, 55,  0),
    (p_healthkart, m_cefixime200, 22.00, 40,  8),
    (p_pharmeasy,  m_cefixime200, 20.00, 25, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_zifi200,     28.00, 30,  5),
    (p_medplus,    m_zifi200,     26.00, 25, 10),
    (p_healthkart, m_zifi200,     25.00, 35,  8),
    (p_tata1mg,    m_zifi200,     24.00, 30, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_taxim200,    33.00, 20,  5),
    (p_medplus,    m_taxim200,    31.00, 15, 10),
    (p_pharmeasy,  m_taxim200,    28.00, 25, 15);

  -- ── Ciprofloxacin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_ciproflox500, 9.00, 50,  5),
    (p_janaushadhi,m_ciproflox500, 5.00, 70,  0),
    (p_netmeds,    m_ciproflox500, 7.50, 40, 12),
    (p_pharmeasy,  m_ciproflox500, 7.00, 35, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_ciplox500,   11.00, 40,  5),
    (p_medplus,    m_ciplox500,   10.50, 35, 10),
    (p_healthkart, m_ciplox500,   10.00, 45,  8),
    (p_tata1mg,    m_ciplox500,    9.50, 30, 12);

  -- ── Montelukast family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_montek_lc,   13.50, 55,  5),
    (p_medplus,    m_montek_lc,   12.50, 45, 10),
    (p_healthkart, m_montek_lc,   12.00, 60,  8),
    (p_pharmeasy,  m_montek_lc,   11.00, 40, 15),
    (p_tata1mg,    m_montek_lc,   11.50, 50, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_montair_lc,  12.00, 50,  5),
    (p_medplus,    m_montair_lc,  11.00, 40, 10),
    (p_janaushadhi,m_montair_lc,   6.50, 65,  0),
    (p_netmeds,    m_montair_lc,  10.00, 45, 12),
    (p_pharmeasy,  m_montair_lc,   9.50, 35, 18);

  -- ── Calcium supplements ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_shelcal500,   6.80, 65,  5),
    (p_medplus,    m_shelcal500,   6.20, 55, 10),
    (p_healthkart, m_shelcal500,   6.00, 70,  8),
    (p_pharmeasy,  m_shelcal500,   5.50, 45, 15),
    (p_tata1mg,    m_shelcal500,   5.60, 60, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_calcimax500,  5.80, 50, 10),
    (p_wellness,   m_calcimax500,  5.50, 40,  8),
    (p_janaushadhi,m_calcimax500,  3.30, 75,  0),
    (p_netmeds,    m_calcimax500,  5.20, 45, 12);

  -- ── Aspirin family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_ecosprin75,   1.70, 80,  5),
    (p_medplus,    m_ecosprin75,   1.60, 70, 10),
    (p_janaushadhi,m_ecosprin75,   0.90, 95,  0),
    (p_netmeds,    m_ecosprin75,   1.40, 65, 12),
    (p_pharmeasy,  m_ecosprin75,   1.30, 55, 15),
    (p_tata1mg,    m_ecosprin75,   1.35, 60, 10);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_ecosprin150,  2.30, 70,  5),
    (p_medplus,    m_ecosprin150,  2.10, 60, 10),
    (p_janaushadhi,m_ecosprin150,  1.20, 85,  0),
    (p_healthkart, m_ecosprin150,  2.00, 55,  8);

  -- ── Thyroid medicines ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_thyronorm25,  3.30, 60,  5),
    (p_medplus,    m_thyronorm25,  3.10, 50, 10),
    (p_healthkart, m_thyronorm25,  3.00, 55,  8),
    (p_pharmeasy,  m_thyronorm25,  2.70, 45, 15),
    (p_tata1mg,    m_thyronorm25,  2.80, 50, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_thyronorm50,  4.50, 55,  5),
    (p_medplus,    m_thyronorm50,  4.20, 45, 10),
    (p_janaushadhi,m_thyronorm50,  2.50, 70,  0),
    (p_netmeds,    m_thyronorm50,  3.80, 50, 12),
    (p_pharmeasy,  m_thyronorm50,  3.60, 40, 15);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_eltroxin50,   6.00, 30,  5),
    (p_medplus,    m_eltroxin50,   5.70, 25, 10),
    (p_healthkart, m_eltroxin50,   5.50, 35,  8);

  -- ── Rabeprazole family ──
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_apollo,     m_rabeoz20,     5.50, 60,  5),
    (p_medplus,    m_rabeoz20,     5.20, 50, 10),
    (p_janaushadhi,m_rabeoz20,     3.00, 75,  0),
    (p_healthkart, m_rabeoz20,     5.00, 55,  8),
    (p_pharmeasy,  m_rabeoz20,     4.50, 45, 15),
    (p_tata1mg,    m_rabeoz20,     4.60, 50, 12);

  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_medplus,    m_rablet20,     4.80, 50, 10),
    (p_wellness,   m_rablet20,     4.50, 35,  8),
    (p_janaushadhi,m_rablet20,     2.70, 70,  0),
    (p_netmeds,    m_rablet20,     4.20, 45, 12),
    (p_pharmeasy,  m_rablet20,     4.00, 40, 15);

  -- ── Add a few OUT OF STOCK entries for realism ──
  -- Some medicines unavailable at certain pharmacies (stock = 0)
  INSERT INTO public.pharmacy_medicines (pharmacy_id, medicine_id, price, stock, discount) VALUES
    (p_wellness,   m_augmentin625, 30.00,  0,  0),
    (p_wellness,   m_zithromax500, 97.00,  0,  0),
    (p_wellness,   m_lipitor10,    13.00,  0,  0),
    (p_netmeds,    m_norvasc5,     10.20,  0,  0),
    (p_janaushadhi,m_eltroxin50,    3.50,  0,  0);

  RAISE NOTICE 'Seed data inserted successfully: 55 medicines, 8 pharmacies, 300+ price mappings';
END $$;

-- ============================================================
--  VERIFICATION QUERIES (run after seeding)
-- ============================================================

-- Check counts
-- SELECT 'medicines' AS table_name, COUNT(*) AS count FROM public.medicines
-- UNION ALL
-- SELECT 'pharmacies', COUNT(*) FROM public.pharmacies
-- UNION ALL
-- SELECT 'pharmacy_medicines', COUNT(*) FROM public.pharmacy_medicines;

-- Check that every medicine has at least 3 pharmacy listings
-- SELECT m.name, COUNT(pm.id) AS pharmacy_count
-- FROM public.medicines m
-- LEFT JOIN public.pharmacy_medicines pm ON pm.medicine_id = m.id
-- GROUP BY m.name
-- ORDER BY pharmacy_count ASC;

-- ============================================================
--  DONE!
--  Run this in Supabase SQL Editor:
--  Project Settings → SQL Editor → New Query → Paste → Run
-- ============================================================

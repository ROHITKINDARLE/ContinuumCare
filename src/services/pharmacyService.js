/**
 * Pharmacy Service — Smart Medicine Price Comparison
 *
 * Provides:
 *  • Supabase-first data loading (falls back to in-memory mock data)
 *  • Composition-based generic alternative matching (exact + similar)
 *  • Monthly cost estimation
 *  • Geolocation with graceful fallback
 *  • Nearby pharmacy lookup with Haversine distance
 *  • Medicine price search across pharmacies
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ─── DATA SOURCE ABSTRACTION ────────────────────────────────────────────────
// Tries Supabase first. On any failure, falls back to in-memory mock data.

let _cachedMedicines = null;
let _cachedPharmacies = null;
let _cachedPharmacyMedicines = null;
let _dataSource = 'mock'; // 'supabase' or 'mock'

/**
 * Load all data — tries Supabase, falls back to mock.
 * Caches on first successful load.
 */
async function ensureDataLoaded() {
  if (_cachedMedicines && _cachedPharmacies && _cachedPharmacyMedicines) return;

  if (isSupabaseConfigured) {
    try {
      const [medRes, phRes, pmRes] = await Promise.all([
        supabase.from('medicines').select('*'),
        supabase.from('pharmacies').select('*'),
        supabase.from('pharmacy_medicines').select('*'),
      ]);

      if (medRes.data?.length > 0 && phRes.data?.length > 0 && pmRes.data?.length > 0) {
        _cachedMedicines = medRes.data.map((m) => ({
          id: m.id,
          name: m.name,
          composition: m.composition,
          category: m.category,
          manufacturer: m.manufacturer,
          pricePerUnit: Number(m.base_price),
        }));

        _cachedPharmacies = phRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          lat: Number(p.latitude),
          lng: Number(p.longitude),
          rating: Number(p.rating),
          address: p.address || '',
          phone: p.phone || '',
          hours: p.hours || '',
          delivery: p.delivery || false,
          deliveryTime: p.delivery_time || null,
          city: p.city || 'Mumbai',
        }));

        _cachedPharmacyMedicines = pmRes.data.map((pm) => ({
          pharmacyId: pm.pharmacy_id,
          medicineId: pm.medicine_id,
          price: Number(pm.price),
          stock: Number(pm.stock),
          discount: Number(pm.discount),
        }));

        _dataSource = 'supabase';
        console.log(`[PharmacyService] Loaded from Supabase: ${_cachedMedicines.length} medicines, ${_cachedPharmacies.length} pharmacies, ${_cachedPharmacyMedicines.length} price entries`);
        return;
      }
    } catch (err) {
      console.warn('[PharmacyService] Supabase fetch failed, falling back to mock data:', err.message);
    }
  }

  // Fallback: use in-memory mock data
  _cachedMedicines = [...MEDICINE_DB];
  _cachedPharmacies = [...PHARMACY_DB];
  _cachedPharmacyMedicines = null; // will use getPharmacyMedicinePrice() instead
  _dataSource = 'mock';
}

/**
 * Returns (sync) the current data source type
 */
export function getDataSource() {
  return _dataSource;
}

// ─── MEDICINE DATABASE (FALLBACK) ───────────────────────────────────────────
// Used when Supabase tables are not yet populated.

const MEDICINE_DB = [
  // Paracetamol family
  { id: 'm1',  name: 'Crocin 500',        composition: 'Paracetamol 500mg',                     category: 'Analgesic',      manufacturer: 'GSK',          pricePerUnit: 2.5  },
  { id: 'm2',  name: 'Dolo 650',          composition: 'Paracetamol 650mg',                     category: 'Analgesic',      manufacturer: 'Micro Labs',   pricePerUnit: 3.0  },
  { id: 'm3',  name: 'Calpol 500',        composition: 'Paracetamol 500mg',                     category: 'Analgesic',      manufacturer: 'GSK',          pricePerUnit: 2.2  },
  { id: 'm4',  name: 'P-500',             composition: 'Paracetamol 500mg',                     category: 'Analgesic',      manufacturer: 'Cipla',        pricePerUnit: 1.0  },
  { id: 'm5',  name: 'Pacimol 650',       composition: 'Paracetamol 650mg',                     category: 'Analgesic',      manufacturer: 'Ipca Labs',    pricePerUnit: 1.8  },

  // Amoxicillin family
  { id: 'm6',  name: 'Amoxil 500',        composition: 'Amoxicillin 500mg',                     category: 'Antibiotic',     manufacturer: 'GSK',          pricePerUnit: 12.0 },
  { id: 'm7',  name: 'Mox 500',           composition: 'Amoxicillin 500mg',                     category: 'Antibiotic',     manufacturer: 'Ranbaxy',      pricePerUnit: 6.5  },
  { id: 'm8',  name: 'Novamox 500',       composition: 'Amoxicillin 500mg',                     category: 'Antibiotic',     manufacturer: 'Cipla',        pricePerUnit: 7.0  },
  { id: 'm9',  name: 'Amoxyclav 625',     composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', category: 'Antibiotic', manufacturer: 'Alkem',        pricePerUnit: 18.0 },

  // Augmentin/Amoxiclav extended
  { id: 'm10', name: 'Augmentin 625',     composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', category: 'Antibiotic', manufacturer: 'GSK',          pricePerUnit: 28.0 },
  { id: 'm11', name: 'Moxclav 625',       composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', category: 'Antibiotic', manufacturer: 'Aristo',       pricePerUnit: 14.0 },
  { id: 'm12', name: 'Clavam 625',        composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', category: 'Antibiotic', manufacturer: 'Alkem',        pricePerUnit: 15.0 },

  // Metformin family
  { id: 'm13', name: 'Glycomet 500',      composition: 'Metformin 500mg',                       category: 'Antidiabetic',   manufacturer: 'USV',          pricePerUnit: 3.5  },
  { id: 'm14', name: 'Glucophage 500',    composition: 'Metformin 500mg',                       category: 'Antidiabetic',   manufacturer: 'Franco-Indian',pricePerUnit: 5.0  },
  { id: 'm15', name: 'Obimet 500',        composition: 'Metformin 500mg',                       category: 'Antidiabetic',   manufacturer: 'Pfizer',       pricePerUnit: 2.8  },
  { id: 'm16', name: 'Glycomet 850',      composition: 'Metformin 850mg',                       category: 'Antidiabetic',   manufacturer: 'USV',          pricePerUnit: 4.5  },

  // Atorvastatin family
  { id: 'm17', name: 'Lipitor 10',        composition: 'Atorvastatin 10mg',                     category: 'Statin',         manufacturer: 'Pfizer',       pricePerUnit: 12.0 },
  { id: 'm18', name: 'Atorva 10',         composition: 'Atorvastatin 10mg',                     category: 'Statin',         manufacturer: 'Zydus',        pricePerUnit: 5.5  },
  { id: 'm19', name: 'Tonact 10',         composition: 'Atorvastatin 10mg',                     category: 'Statin',         manufacturer: 'Lupin',        pricePerUnit: 6.0  },
  { id: 'm20', name: 'Atorva 20',         composition: 'Atorvastatin 20mg',                     category: 'Statin',         manufacturer: 'Zydus',        pricePerUnit: 9.0  },

  // Omeprazole family
  { id: 'm21', name: 'Omez 20',           composition: 'Omeprazole 20mg',                       category: 'Antacid',        manufacturer: 'Dr. Reddy\'s', pricePerUnit: 5.5  },
  { id: 'm22', name: 'Prilosec 20',       composition: 'Omeprazole 20mg',                       category: 'Antacid',        manufacturer: 'AstraZeneca',  pricePerUnit: 8.0  },
  { id: 'm23', name: 'Ocid 20',           composition: 'Omeprazole 20mg',                       category: 'Antacid',        manufacturer: 'Zydus',        pricePerUnit: 4.0  },

  // Pantoprazole family
  { id: 'm24', name: 'Pan 40',            composition: 'Pantoprazole 40mg',                     category: 'Antacid',        manufacturer: 'Alkem',        pricePerUnit: 6.0  },
  { id: 'm25', name: 'Pantocid 40',       composition: 'Pantoprazole 40mg',                     category: 'Antacid',        manufacturer: 'Sun Pharma',   pricePerUnit: 7.5  },
  { id: 'm26', name: 'Pan-D',             composition: 'Pantoprazole 40mg + Domperidone 10mg',  category: 'Antacid',        manufacturer: 'Alkem',        pricePerUnit: 8.5  },

  // Amlodipine family
  { id: 'm27', name: 'Norvasc 5',         composition: 'Amlodipine 5mg',                        category: 'Antihypertensive', manufacturer: 'Pfizer',      pricePerUnit: 10.0 },
  { id: 'm28', name: 'Amlong 5',          composition: 'Amlodipine 5mg',                        category: 'Antihypertensive', manufacturer: 'Micro Labs',  pricePerUnit: 3.0  },
  { id: 'm29', name: 'Stamlo 5',          composition: 'Amlodipine 5mg',                        category: 'Antihypertensive', manufacturer: 'Dr. Reddy\'s',pricePerUnit: 4.0  },

  // Azithromycin family
  { id: 'm30', name: 'Azithral 500',      composition: 'Azithromycin 500mg',                    category: 'Antibiotic',     manufacturer: 'Alembic',      pricePerUnit: 70.0 },
  { id: 'm31', name: 'Zithromax 500',     composition: 'Azithromycin 500mg',                    category: 'Antibiotic',     manufacturer: 'Pfizer',       pricePerUnit: 95.0 },
  { id: 'm32', name: 'Azee 500',          composition: 'Azithromycin 500mg',                    category: 'Antibiotic',     manufacturer: 'Cipla',        pricePerUnit: 55.0 },

  // Cetirizine family
  { id: 'm33', name: 'Zyrtec 10',         composition: 'Cetirizine 10mg',                       category: 'Antihistamine',  manufacturer: 'UCB',          pricePerUnit: 5.0  },
  { id: 'm34', name: 'Alerid 10',         composition: 'Cetirizine 10mg',                       category: 'Antihistamine',  manufacturer: 'Cipla',        pricePerUnit: 2.0  },
  { id: 'm35', name: 'Okacet 10',         composition: 'Cetirizine 10mg',                       category: 'Antihistamine',  manufacturer: 'Lupin',        pricePerUnit: 1.8  },

  // Telmisartan
  { id: 'm36', name: 'Telma 40',          composition: 'Telmisartan 40mg',                      category: 'Antihypertensive', manufacturer: 'Glenmark',   pricePerUnit: 5.0  },
  { id: 'm37', name: 'Telsartan 40',      composition: 'Telmisartan 40mg',                      category: 'Antihypertensive', manufacturer: 'USV',        pricePerUnit: 3.5  },

  // Ibuprofen family
  { id: 'm38', name: 'Brufen 400',        composition: 'Ibuprofen 400mg',                       category: 'NSAID',          manufacturer: 'Abbott',       pricePerUnit: 4.0  },
  { id: 'm39', name: 'Ibugesic 400',      composition: 'Ibuprofen 400mg',                       category: 'NSAID',          manufacturer: 'Cipla',        pricePerUnit: 2.5  },
];

// ─── PHARMACY DATABASE (FALLBACK) ───────────────────────────────────────────

const PHARMACY_DB = [
  { id: 'ph1',  name: 'Apollo Pharmacy',         lat: 19.0760, lng: 72.8777, rating: 4.8, address: '12 MG Road, Andheri West',       phone: '+91 98765 43210', hours: '24/7',       delivery: true,  deliveryTime: '30 min' },
  { id: 'ph2',  name: 'MedPlus Pharmacy',         lat: 19.0850, lng: 72.8900, rating: 4.6, address: '45 Station Road, Bandra',        phone: '+91 98765 11111', hours: '8 AM – 10 PM', delivery: true,  deliveryTime: '45 min' },
  { id: 'ph3',  name: 'Wellness Forever',          lat: 19.0650, lng: 72.8650, rating: 4.3, address: '78 Park Avenue, Juhu',           phone: '+91 98765 33333', hours: '9 AM – 9 PM',  delivery: false, deliveryTime: null },
  { id: 'ph4',  name: 'Jan Aushadhi Kendra',       lat: 19.0900, lng: 72.9000, rating: 4.0, address: '3 Government Complex, Kurla',    phone: '+91 98765 44444', hours: '9 AM – 6 PM',  delivery: false, deliveryTime: null },
  { id: 'ph5',  name: 'Netmeds Pharmacy',          lat: 19.0550, lng: 72.8400, rating: 4.5, address: '22 Hill Road, Bandra West',      phone: '+91 98765 55555', hours: '9 AM – 11 PM', delivery: true,  deliveryTime: '60 min' },
  { id: 'ph6',  name: 'Frank Ross Pharmacy',       lat: 19.1000, lng: 72.8800, rating: 4.2, address: '56 SV Road, Goregaon',           phone: '+91 98765 66666', hours: '8 AM – 10 PM', delivery: true,  deliveryTime: '40 min' },
  { id: 'ph7',  name: 'Local Medical Store',       lat: 19.0780, lng: 72.8820, rating: 4.1, address: '9 Garden Lane, Andheri East',    phone: '+91 98765 77777', hours: '7 AM – 11 PM', delivery: false, deliveryTime: null },
  { id: 'ph8',  name: 'Sanjivani Pharmacy',        lat: 19.0600, lng: 72.8500, rating: 4.4, address: '33 Link Road, Malad',            phone: '+91 98765 88888', hours: '8 AM – 9 PM',  delivery: true,  deliveryTime: '50 min' },
  { id: 'ph9',  name: 'HealthKart Pharmacy',       lat: 19.0720, lng: 72.8600, rating: 4.7, address: '15 Linking Road, Khar',          phone: '+91 98765 99999', hours: '24/7',         delivery: true,  deliveryTime: '25 min' },
  { id: 'ph10', name: 'Shree Ganesh Medical',      lat: 19.0830, lng: 72.8950, rating: 3.9, address: '67 Market Road, Sion',           phone: '+91 98765 00001', hours: '8 AM – 8 PM',  delivery: false, deliveryTime: null },
  { id: 'ph11', name: 'PharmEasy Store',            lat: 19.0700, lng: 72.8700, rating: 4.6, address: '44 Turner Road, Bandra West',   phone: '+91 98765 00002', hours: '9 AM – 10 PM', delivery: true,  deliveryTime: '35 min' },
  { id: 'ph12', name: 'Tata 1mg Partner',          lat: 19.1100, lng: 72.8850, rating: 4.5, address: '88 Western Express, Borivali',   phone: '+91 98765 00003', hours: '8 AM – 11 PM', delivery: true,  deliveryTime: '55 min' },
];

// ─── PHARMACY ↔ MEDICINE PRICING (mock fallback) ────────────────────────────
// Deterministic pseudo-random for consistent pricing when using mock data

function getPharmacyMedicinePrice(pharmacyId, medicine) {
  const hash = (pharmacyId + medicine.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const variation = ((hash % 40) - 20) / 100;
  const price = Math.round(medicine.pricePerUnit * (1 + variation) * 100) / 100;
  const stockSeed = (hash * 7) % 100;
  const stock = stockSeed < 5 ? 'out' : stockSeed < 15 ? 'low' : 'in';
  return { price: Math.max(0.5, price), stock };
}

// ─── HAVERSINE DISTANCE ─────────────────────────────────────────────────────

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GEOLOCATION WITH FALLBACK ──────────────────────────────────────────────

const DEFAULT_LOCATION = { lat: 19.0760, lng: 72.8777 }; // Mumbai

/**
 * Get user location with graceful fallback
 * @returns {Promise<{lat: number, lng: number, isFallback: boolean}>}
 */
export async function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...DEFAULT_LOCATION, isFallback: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isFallback: false,
        });
      },
      () => {
        resolve({ ...DEFAULT_LOCATION, isFallback: true });
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  });
}

// ─── NEARBY PHARMACIES ──────────────────────────────────────────────────────

/**
 * Get nearby pharmacies sorted by distance
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @param {number} [radiusKm=10] - Search radius in km
 * @returns {Array} Pharmacies with distance
 */
export function getNearbyPharmacies(lat, lng, radiusKm = 10) {
  const pharmacies = _cachedPharmacies || PHARMACY_DB;
  return pharmacies
    .map((pharmacy) => {
      const distance = haversineDistance(lat, lng, pharmacy.lat, pharmacy.lng);
      return { ...pharmacy, distance: Math.round(distance * 10) / 10 };
    })
    .filter((p) => p.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

// ─── MEDICINE PRICE ACROSS PHARMACIES ───────────────────────────────────────

/**
 * Resolve stock number to stock status string
 */
function resolveStockStatus(stockQty) {
  if (stockQty <= 0) return 'out';
  if (stockQty <= 10) return 'low';
  return 'in';
}

/**
 * Get medicine prices across nearby pharmacies
 * Tries Supabase data first, falls back to mock-generated prices.
 * @param {string} medicineName - Name to search
 * @param {number} lat - User latitude
 * @param {number} lng - User longitude
 * @returns {Promise<{medicine: object|null, pharmacyPrices: Array}>}
 */
export async function getMedicinePrices(medicineName, lat, lng) {
  await ensureDataLoaded();

  const medicine = findMedicine(medicineName);
  if (!medicine) return { medicine: null, pharmacyPrices: [] };

  const pharmacies = getNearbyPharmacies(lat || DEFAULT_LOCATION.lat, lng || DEFAULT_LOCATION.lng);

  let pharmacyPrices;

  if (_dataSource === 'supabase' && _cachedPharmacyMedicines) {
    // Use real Supabase price data
    const medicinePrices = _cachedPharmacyMedicines.filter((pm) => pm.medicineId === medicine.id);

    pharmacyPrices = pharmacies
      .map((pharmacy) => {
        const priceEntry = medicinePrices.find((pm) => pm.pharmacyId === pharmacy.id);
        if (!priceEntry) return null;

        return {
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          distance: pharmacy.distance,
          rating: pharmacy.rating,
          address: pharmacy.address,
          phone: pharmacy.phone,
          hours: pharmacy.hours,
          delivery: pharmacy.delivery,
          deliveryTime: pharmacy.deliveryTime,
          price: priceEntry.price,
          stock: resolveStockStatus(priceEntry.stock),
          discount: priceEntry.discount,
        };
      })
      .filter(Boolean);
  } else {
    // Fallback: use deterministic mock pricing
    pharmacyPrices = pharmacies.map((pharmacy) => {
      const { price, stock } = getPharmacyMedicinePrice(pharmacy.id, medicine);
      return {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        distance: pharmacy.distance,
        rating: pharmacy.rating,
        address: pharmacy.address,
        phone: pharmacy.phone,
        hours: pharmacy.hours,
        delivery: pharmacy.delivery,
        deliveryTime: pharmacy.deliveryTime,
        price,
        stock,
      };
    });
  }

  // Sort: available first, then by price
  pharmacyPrices.sort((a, b) => {
    if (a.stock === 'out' && b.stock !== 'out') return 1;
    if (b.stock === 'out' && a.stock !== 'out') return -1;
    return a.price - b.price;
  });

  // Mark cheapest available
  const cheapest = pharmacyPrices.find((p) => p.stock !== 'out');
  if (cheapest) cheapest.isBestPrice = true;

  return { medicine, pharmacyPrices };
}

// ─── COMPOSITION-BASED GENERIC ALTERNATIVES ─────────────────────────────────

/**
 * Find medicine in database using fuzzy name matching
 */
function findMedicine(name) {
  if (!name) return null;
  const medicines = _cachedMedicines || MEDICINE_DB;
  const lower = name.toLowerCase().trim();

  // Exact name match
  let match = medicines.find((m) => m.name.toLowerCase() === lower);
  if (match) return match;

  // Partial match (name starts with / contains)
  match = medicines.find((m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
  if (match) return match;

  // Match on composition keywords
  match = medicines.find((m) => m.composition.toLowerCase().includes(lower));
  return match || null;
}

/**
 * Extract the active drug name from a composition string.
 * e.g. "Paracetamol 500mg" → "paracetamol"
 *      "Amoxicillin 500mg + Clavulanic Acid 125mg" → "amoxicillin"
 */
function extractDrugName(composition) {
  if (!composition) return '';
  const match = composition.match(/^([a-zA-Z\s]+?)(?:\s+\d|$|\s*\+)/);
  return match ? match[1].trim().toLowerCase() : composition.toLowerCase().split(' ')[0];
}

/**
 * Get generic alternatives based on composition matching
 *
 * Logic:
 *  1. Find the base medicine's composition
 *  2. Find all medicines with EXACT same composition → "same"
 *  3. Find medicines with SIMILAR composition (same drug, different dosage) → "similar"
 *  4. Exclude the original medicine
 *
 * @param {string} medicineName
 * @returns {Promise<{ base: object|null, alternatives: Array }>}
 */
export async function getGenericAlternatives(medicineName) {
  await ensureDataLoaded();

  const medicines = _cachedMedicines || MEDICINE_DB;
  const base = findMedicine(medicineName);
  if (!base) return { base: null, alternatives: [] };

  const baseDrugName = extractDrugName(base.composition);
  const alternatives = [];

  for (const med of medicines) {
    if (med.id === base.id) continue;

    // Exact composition match
    if (med.composition.toLowerCase() === base.composition.toLowerCase()) {
      alternatives.push({
        ...med,
        confidence: 'same',
        note: 'Same Composition ✅',
        savingsPerUnit: Math.round((base.pricePerUnit - med.pricePerUnit) * 100) / 100,
      });
      continue;
    }

    // Similar composition: same active drug, different dosage or combo
    const medDrugName = extractDrugName(med.composition);
    if (baseDrugName && medDrugName === baseDrugName) {
      alternatives.push({
        ...med,
        confidence: 'similar',
        note: 'Similar Composition ⚠️',
        savingsPerUnit: Math.round((base.pricePerUnit - med.pricePerUnit) * 100) / 100,
      });
      continue;
    }

    // Check if the base composition includes drug name from another med (for combos)
    if (baseDrugName && med.composition.toLowerCase().includes(baseDrugName)) {
      alternatives.push({
        ...med,
        confidence: 'different',
        note: 'Doctor Approval Needed ❗',
        savingsPerUnit: Math.round((base.pricePerUnit - med.pricePerUnit) * 100) / 100,
      });
    }
  }

  // Sort: same first, then similar, then different; within each group by price
  const ORDER = { same: 0, similar: 1, different: 2 };
  alternatives.sort((a, b) => {
    const orderDiff = ORDER[a.confidence] - ORDER[b.confidence];
    if (orderDiff !== 0) return orderDiff;
    return a.pricePerUnit - b.pricePerUnit;
  });

  return { base, alternatives };
}

// ─── MONTHLY COST CALCULATION ───────────────────────────────────────────────

/**
 * Calculate monthly cost for a medicine
 * @param {number} pricePerUnit - Price per tablet/unit
 * @param {number} frequencyPerDay - Times taken per day
 * @returns {number} Monthly cost (30 days)
 */
export function calculateMonthlyCost(pricePerUnit, frequencyPerDay) {
  if (!pricePerUnit || !frequencyPerDay) return 0;
  return Math.round(pricePerUnit * frequencyPerDay * 30 * 100) / 100;
}

/**
 * Parse frequency string to number of times per day
 * Handles: "Once daily", "Twice daily", "3 times a day", "1-0-1", "1-1-1", etc.
 * @param {string} frequency
 * @returns {number}
 */
export function parseFrequency(frequency) {
  if (!frequency) return 1;
  const lower = frequency.toLowerCase().trim();

  // Pattern: "1-0-1" or "1-1-1"
  const dashPattern = lower.match(/^(\d+)-(\d+)-(\d+)$/);
  if (dashPattern) {
    return Number(dashPattern[1]) + Number(dashPattern[2]) + Number(dashPattern[3]);
  }

  // Word-based
  if (lower.includes('once')) return 1;
  if (lower.includes('twice') || lower.includes('two') || lower.includes('bd') || lower.includes('bid')) return 2;
  if (lower.includes('thrice') || lower.includes('three') || lower.includes('tds') || lower.includes('tid')) return 3;
  if (lower.includes('four') || lower.includes('qid')) return 4;

  // Numeric: "3 times"
  const numMatch = lower.match(/(\d+)\s*times/);
  if (numMatch) return Number(numMatch[1]);

  // Default
  return 1;
}

// ─── SEARCH ─────────────────────────────────────────────────────────────────

/**
 * Search medicines by name or composition
 * @param {string} query
 * @returns {Array}
 */
export function searchMedicines(query) {
  if (!query || query.length < 2) return [];
  const medicines = _cachedMedicines || MEDICINE_DB;
  const lower = query.toLowerCase().trim();

  return medicines
    .filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.composition.toLowerCase().includes(lower) ||
        m.category.toLowerCase().includes(lower)
    )
    .slice(0, 10);
}

// ─── PHARMACY ORDER (localStorage mock) ─────────────────────────────────────

/**
 * Save pharmacy order preference
 * @param {object} orderData - { patientId, pharmacyId, pharmacyName, medicines, totalPrice }
 * @returns {object} saved order
 */
export function createPharmacyOrder(orderData) {
  const orders = JSON.parse(localStorage.getItem('cc_pharmacy_orders') || '[]');
  const order = {
    id: `order_${Date.now()}`,
    ...orderData,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  localStorage.setItem('cc_pharmacy_orders', JSON.stringify(orders));
  return order;
}

/**
 * Get saved pharmacy orders
 * @param {string} [patientId] - Optional filter
 * @returns {Array}
 */
export function getPharmacyOrders(patientId) {
  const orders = JSON.parse(localStorage.getItem('cc_pharmacy_orders') || '[]');
  if (patientId) return orders.filter((o) => o.patientId === patientId);
  return orders;
}

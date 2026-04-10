import { supabase } from '../lib/supabase';

export async function getDiagnosticBookings(patientId = null) {
  let query = supabase
    .from('diagnostic_bookings')
    .select(`
      *,
      booked_by_profile:profiles!diagnostic_bookings_booked_by_fkey(full_name, role),
      patient:patients!diagnostic_bookings_patient_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createDiagnosticBooking(bookingData) {
  const { data, error } = await supabase
    .from('diagnostic_bookings')
    .insert(bookingData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDiagnosticBooking(id, updates) {
  const { data, error } = await supabase
    .from('diagnostic_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Structured lab/diagnostic center data
export const NEARBY_LABS = [
  {
    id: 'lab-1',
    name: 'LifeCare Diagnostics',
    address: '42 MG Road, Sector 14, Gurugram',
    phone: '+91 98765 43210',
    rating: 4.5,
    distance: '1.2 km',
    tests: ['Blood Test', 'X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Urine Test'],
    timing: '7:00 AM - 9:00 PM',
    homeCollection: true,
  },
  {
    id: 'lab-2',
    name: 'PathKind Labs',
    address: '18 Civil Lines, Near City Hospital',
    phone: '+91 98765 43211',
    rating: 4.3,
    distance: '2.5 km',
    tests: ['Blood Test', 'ECG', 'Thyroid Panel', 'Lipid Profile', 'HbA1c'],
    timing: '6:30 AM - 8:00 PM',
    homeCollection: true,
  },
  {
    id: 'lab-3',
    name: 'Metro Health Diagnostics',
    address: '7B Industrial Area, Phase 2',
    phone: '+91 98765 43212',
    rating: 4.1,
    distance: '3.8 km',
    tests: ['Blood Test', 'MRI', 'PET Scan', 'Bone Density', 'Allergy Panel'],
    timing: '8:00 AM - 10:00 PM',
    homeCollection: false,
  },
  {
    id: 'lab-4',
    name: 'Apollo Diagnostics',
    address: '23 Jubilee Hills, Main Road',
    phone: '+91 98765 43213',
    rating: 4.7,
    distance: '4.1 km',
    tests: ['Full Body Checkup', 'Blood Test', 'CT Scan', 'Ultrasound', 'ECG'],
    timing: '24 Hours',
    homeCollection: true,
  },
];

export const AVAILABLE_TESTS = [
  'Complete Blood Count (CBC)',
  'Lipid Profile',
  'Thyroid Function Test',
  'HbA1c',
  'Liver Function Test',
  'Kidney Function Test',
  'Blood Sugar (Fasting)',
  'Blood Sugar (PP)',
  'Urine Routine',
  'Chest X-Ray',
  'ECG',
  'Ultrasound Abdomen',
  'CT Scan',
  'MRI',
  'Vitamin D',
  'Vitamin B12',
  'Iron Studies',
  'Electrolytes Panel',
];

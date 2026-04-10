import { supabase } from '../lib/supabase';

export async function getVisits(patientId) {
  let query = supabase
    .from('visits')
    .select(`
      *,
      logged_by_profile:profiles!visits_logged_by_fkey(full_name, role),
      patient:patients!visits_patient_id_fkey(full_name)
    `)
    .order('visited_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query.limit(50);
  if (error) throw error;
  return data;
}

export async function getRecentVisits(limit = 10) {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      logged_by_profile:profiles!visits_logged_by_fkey(full_name, role),
      patient:patients!visits_patient_id_fkey(full_name)
    `)
    .order('visited_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function createVisit(visitData) {
  const { data, error } = await supabase
    .from('visits')
    .insert(visitData)
    .select(`
      *,
      logged_by_profile:profiles!visits_logged_by_fkey(full_name, role),
      patient:patients!visits_patient_id_fkey(full_name)
    `)
    .single();
  if (error) throw error;
  return data;
}

export async function getVitalsTrend(patientId, limit = 10) {
  const { data, error } = await supabase
    .from('visits')
    .select('id, systolic_bp, diastolic_bp, temperature_f, spo2, heart_rate, weight_kg, visited_at')
    .eq('patient_id', patientId)
    .order('visited_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data;
}

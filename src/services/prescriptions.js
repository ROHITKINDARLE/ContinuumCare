import { supabase } from '../lib/supabase';

export async function getPrescriptions(patientId = null) {
  let query = supabase
    .from('prescriptions')
    .select(`
      *,
      prescribed_by_profile:profiles!prescriptions_prescribed_by_fkey(full_name, role),
      patient:patients!prescriptions_patient_id_fkey(full_name),
      medications(*)
    `)
    .order('prescribed_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createPrescription(prescriptionData) {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert(prescriptionData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMedication(medicationData) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medicationData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addMedications(medicationsArray) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medicationsArray)
    .select();
  if (error) throw error;
  return data;
}

export async function updateMedication(id, updates) {
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedication(id) {
  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

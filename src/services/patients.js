import { supabase } from '../lib/supabase';

export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      created_by_profile:profiles!patients_created_by_fkey(full_name, role),
      assignments:patient_assignments(
        profile:profiles(id, full_name, role)
      )
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPatient(id) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      created_by_profile:profiles!patients_created_by_fkey(full_name, role),
      assignments:patient_assignments(
        id,
        relationship,
        profile:profiles(id, full_name, role)
      )
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPatient(patientData) {
  const { data, error } = await supabase
    .from('patients')
    .insert(patientData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePatient(id, updates) {
  const { data, error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function assignPatient(patientId, profileId, relationship = 'assigned') {
  const { data, error } = await supabase
    .from('patient_assignments')
    .insert({ patient_id: patientId, profile_id: profileId, relationship })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeAssignment(assignmentId) {
  const { error } = await supabase
    .from('patient_assignments')
    .delete()
    .eq('id', assignmentId);
  if (error) throw error;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name');
  if (error) throw error;
  return data;
}

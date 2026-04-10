import { supabase } from '../lib/supabase';

export async function getLabReports(patientId = null) {
  let query = supabase
    .from('lab_reports')
    .select(`
      *,
      uploaded_by_profile:profiles!lab_reports_uploaded_by_fkey(full_name, role),
      patient:patients!lab_reports_patient_id_fkey(full_name)
    `)
    .order('report_date', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createLabReport(reportData) {
  const { data, error } = await supabase
    .from('lab_reports')
    .insert(reportData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

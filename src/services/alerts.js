import { supabase } from '../lib/supabase';

export async function getAlerts(patientId = null) {
  let query = supabase
    .from('alerts')
    .select(`
      *,
      patient:patients!alerts_patient_id_fkey(id, full_name),
      acknowledged_by_profile:profiles!alerts_acknowledged_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data;
}

export async function getActiveAlertCount() {
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) throw error;
  return count || 0;
}

export async function acknowledgeAlert(alertId, userId) {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function resolveAlert(alertId, userId) {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      status: 'resolved',
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Real-time subscription for new alerts
export function subscribeToAlerts(callback) {
  const channel = supabase
    .channel(`alerts-realtime-${Date.now()}-${Math.random()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alerts' },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Real-time subscription for visit inserts (triggers alert checks on backend)
export function subscribeToVisits(callback) {
  const channel = supabase
    .channel(`visits-realtime-${Date.now()}-${Math.random()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'visits' },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

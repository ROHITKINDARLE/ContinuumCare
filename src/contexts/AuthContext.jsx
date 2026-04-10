import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - skipping profile fetch');
      return;
    }
    
    try {
      console.log('Fetching profile for userId:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error.message);
        
        // If profile doesn't exist, try to create it from auth metadata
        if (error.code === 'PGRST116') { // No rows returned
          console.log('Profile not found - attempting to create from auth data...');
          
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
              const role = user.user_metadata?.role || 'nurse';
              const phone = user.user_metadata?.phone || null;
              
              console.log('Creating profile with:', { fullName, role, phone });
              
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{ id: userId, full_name: fullName, role, phone }])
                .select('id, full_name, role')
                .single();
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
                return;
              }
              
              if (newProfile) {
                console.log('Profile created successfully:', newProfile);
                setProfile(newProfile);
              }
            }
          } catch (createErr) {
            console.error('Failed to create profile:', createErr);
          }
        }
        return;
      }
      
      if (data) {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
      } else {
        console.warn('No profile data returned');
      }
    } catch (err) {
      console.error('Exception during profile fetch:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured');
          setLoading(false);
          return;
        }

        console.log('Getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          throw error;
        }
        
        console.log('Session retrieved:', session?.user?.id);
        
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Fetch profile after setting user
          if (session?.user) {
            console.log('Fetching profile for user:', session.user.id);
            fetchProfile(session.user.id);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    ) || {};

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isDoctor: profile?.role === 'doctor',
    isNurse: profile?.role === 'nurse',
    isFamily: profile?.role === 'family',
    canWrite: profile?.role === 'doctor' || profile?.role === 'nurse',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

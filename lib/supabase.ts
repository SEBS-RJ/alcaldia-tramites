// ─── Configuración del cliente Supabase ──────────────────────────────────────
// Reemplaza los valores con los de tu proyecto en supabase.com
// Settings → API → Project URL y anon public key

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://fggqorgreyjkrtxheorg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZ3FvcmdyZXlqa3J0eGhlb3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzUwNjgsImV4cCI6MjA4ODIxMTA2OH0.IwpRcG3bvGGcINDPt8w1TAO2DUAr-HpqqA0EWCxp0kM';

// Almacenamiento simple compatible con web y móvil.
// En Sprint futuro con backend se usará almacenamiento seguro (SecureStore + JWT).
const almacenamientoSimple = {
  getItem: (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return Promise.resolve(localStorage.getItem(key));
      }
      // En móvil usamos una variable en memoria para Sprint 1
      return Promise.resolve(memoriaLocal[key] ?? null);
    } catch {
      return Promise.resolve(null);
    }
  },
  setItem: (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        memoriaLocal[key] = value;
      }
    } catch {}
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        delete memoriaLocal[key];
      }
    } catch {}
    return Promise.resolve();
  },
};

// Almacenamiento en memoria para móvil (suficiente para Sprint 1)
const memoriaLocal: Record<string, string> = {};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: almacenamientoSimple,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
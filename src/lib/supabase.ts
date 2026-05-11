import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kkurtpwottnozceqkukr.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdXJ0cHdvdHRub3pjZXFrdWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODczNDksImV4cCI6MjA5NDA2MzM0OX0.cGpf9Y_rRUl7k9MFiPkK3yZa6ifGP24j9Na4KIBbCHg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

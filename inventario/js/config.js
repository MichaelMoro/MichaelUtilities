/* ============================================================
   config.js — Supabase client singleton
   ============================================================ */
const SUPABASE_URL  = 'https://adkcmjimbnoqzxujyzfu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka2NtamltYm5vcXp4dWp5emZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2Mjk4MDMsImV4cCI6MjExMDIwNTgwM30.jfguCpA5ETXX6NXJvPl13ypELfp0_ZJh-d-4teLp6Vg';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

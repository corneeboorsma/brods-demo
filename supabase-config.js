// ============================================================
// Brodshoes – Supabase configuratie
// ============================================================

const SUPABASE_URL  = 'https://rvredacgaphaoucmuosm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cmVkYWNnYXBoYW91Y211b3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NTM5MTcsImV4cCI6MjEwMzEyOTkxN30.KAQ7WBUFZYGu21TR6arGopL1QVAYVkiHz7zbkNuwg9Y';

// Singleton — één client voor alle pagina's
if (!window._sbClient) {
  window._sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}

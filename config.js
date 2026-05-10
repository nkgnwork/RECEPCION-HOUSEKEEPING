// ═══════════════════════════════════════════════════════════════════════════
// HOTEL LAS VICUÑAS — Configuración local
// ═══════════════════════════════════════════════════════════════════════════
// Este archivo contiene las credenciales del entorno. NO commitear al repo
// público. Subilo manualmente al hosting estático junto con index.html.
//
// Para entornos nuevos, copiá .env.example y completá los valores reales.
// ═══════════════════════════════════════════════════════════════════════════

window.HLV_CONFIG = {
  // ── Supabase (sincronización en tiempo real) ─────────────────────────────
  // La ANON key de Supabase está diseñada para uso público desde el browser.
  // La seguridad real está en las Row Level Security (RLS) policies de la BD.
  // Documentación: https://supabase.com/docs/guides/api/api-keys
  SUPABASE_URL:      "https://nozambkjwkmvusvuqyiu.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vemFtYmtqd2ttdnVzdnVxeWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTE1NzQsImV4cCI6MjA4OTI2NzU3NH0.NSXp5_Wvnh9-WSIOYlMtfYa0yQFBYZ0INHo7zqwbcX0",

  // ── Anthropic API (OCR de fotos de cuaderno) ─────────────────────────────
  // ⚠️ La key de Anthropic NO se hardcodea acá porque es sensible.
  // Cada usuario la guarda en localStorage al usar la función por primera vez.
  // Para mover esto a server-side (recomendado), ver README → "Edge Function".
  ANTHROPIC_API_KEY: "",  // dejar vacío — viene de localStorage del usuario
};

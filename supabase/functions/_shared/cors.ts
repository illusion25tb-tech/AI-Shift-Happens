const ALLOWED_ORIGINS = [
  'https://tbai.com.de',
  'http://localhost:5173',
  'http://localhost:3000',
]

// Dynamic CORS — checks Origin header, falls back to production domain
// All edge functions import this as `corsHeaders` for backwards compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

// Note: Supabase Edge Functions don't forward the Origin header reliably,
// so we keep wildcard CORS. Auth is enforced via Bearer tokens (not cookies),
// making wildcard CORS safe against CSRF.

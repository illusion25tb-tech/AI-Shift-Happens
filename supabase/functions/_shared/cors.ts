const ALLOWED_ORIGINS = [
  'https://tbai.com.de',
  'http://localhost:5173',
  'http://localhost:3000',
]

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

export function getCorsHeaders(req?: Request) {
  const origin = req?.headers.get('Origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowed,
  }
}

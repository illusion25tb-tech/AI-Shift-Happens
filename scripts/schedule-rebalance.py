import requests

token = open("C:/Users/illum/.supabase/access-token").read().strip()
print(f"Token: {token[:20]}...")

anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTU3OTYsImV4cCI6MjA4OTA3MTc5Nn0.N_xwWC-IlleuVhaOX4i3G6dsT2lIYwmXLwBm_kKv1-I"

sql = (
    "SELECT cron.schedule(\n"
    "  'rebalance-options',\n"
    "  '0 2 * * *',\n"
    "  $$\n"
    "    SELECT net.http_post(\n"
    "      url := 'https://amhfxaqolholacanqyas.supabase.co/functions/v1/rebalance-cron',\n"
    "      headers := '{\"Content-Type\": \"application/json\", \"apikey\": \"" + anon_key + "\"}'::jsonb,\n"
    "      body := '{}'::jsonb\n"
    "    );\n"
    "  $$\n"
    ");\n"
)

r = requests.post(
    "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/database/query",
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={"query": sql},
)
print(r.status_code, r.text[:200])

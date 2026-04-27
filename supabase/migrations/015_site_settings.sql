-- Migration: Site Settings (Feature-Flags + globale Konfiguration)
-- Created: 2026-04-27
--
-- Generic key/JSONB store fuer site-wide flags und settings.
-- Erweiterbar ohne neue Migrations: einfach neue Rows einfuegen.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT 'null'::jsonb,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen (Settings sind nicht sensibel — nur Feature-Flags)
CREATE POLICY site_settings_select_all ON public.site_settings FOR SELECT USING (true);

-- Schreiben ausschliesslich ueber service-role (Admin Edge Function)
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

-- Seed: LinkedIn-Share standardmaessig AN
INSERT INTO public.site_settings (key, value, description) VALUES
  ('linkedin_share_enabled', 'true'::jsonb, 'Zeigt den "Teile dein Ergebnis"-LinkedIn-Button im ResultScreen')
ON CONFLICT (key) DO NOTHING;

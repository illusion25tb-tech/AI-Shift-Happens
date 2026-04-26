-- Fix Mojibake + TR/ES Übersetzungen für Sponsor + Prizes
-- Erstellt: 2026-04-26
-- Anwendung: Im Supabase Dashboard SQL Editor einfügen + Run
-- URL: https://supabase.com/dashboard/project/amhfxaqolholacanqyas/sql/new

-- 1) Sponsor "tbai": TR + ES nachpflegen + DE/EN bestätigen
UPDATE public.sponsors
SET description_i18n = jsonb_build_object(
  'de', 'AI Consulting & Enablement',
  'en', 'AI Consulting & Enablement',
  'tr', 'Yapay Zeka Danışmanlığı & Etkinleştirme',
  'es', 'Consultoría e Implementación de IA'
)
WHERE id = '95fb3011-7f54-4ccf-b9c9-1ba51d9888fd';

-- 2) Prizes: title_i18n + description_i18n für alle 4 Sprachen + Mojibake-Fix
UPDATE public.prizes
SET
  title_i18n = jsonb_build_object(
    'de', 'AI Enablement Workshop',
    'en', 'AI Enablement Workshop',
    'tr', 'Yapay Zeka Etkinleştirme Atölyesi',
    'es', 'Taller de Habilitación de IA'
  ),
  description_i18n = jsonb_build_object(
    'de', 'Halbtags-Workshop AI-Integration für dein Team',
    'en', 'Half-day workshop on AI integration for your team',
    'tr', 'Ekibiniz için yarım günlük yapay zeka entegrasyon atölyesi',
    'es', 'Taller de medio día sobre integración de IA para tu equipo'
  )
WHERE title = 'AI Enablement Workshop';

-- Verifikation
SELECT
  'sponsor' as type, name, description_i18n
FROM public.sponsors
WHERE id = '95fb3011-7f54-4ccf-b9c9-1ba51d9888fd'
UNION ALL
SELECT
  'prize ' || prize_type, title, jsonb_build_object('title', title_i18n, 'desc', description_i18n)
FROM public.prizes
WHERE title = 'AI Enablement Workshop';

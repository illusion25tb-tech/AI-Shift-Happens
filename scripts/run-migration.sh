#!/usr/bin/env bash
# Migration runner for shift-happens question pool
# Run from project root: bash scripts/run-migration.sh

export SUPABASE_URL=https://amhfxaqolholacanqyas.supabase.co
export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5NTc5NiwiZXhwIjoyMDg5MDcxNzk2fQ.R6BmGuHqpTOtjbC8S6Qh2u3RI5FIN9IH4iMOrZMTXtQ
export QUESTIONS_FILE=scripts/questions-original.json

npx tsx scripts/migrate-questions.ts

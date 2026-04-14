"""Translate DE questions to EN using Claude API and insert into Supabase."""
import json, os, sys, time, requests

SUPABASE_URL = "https://amhfxaqolholacanqyas.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
BATCH_SIZE = 10  # questions per Claude API call

if not SERVICE_KEY or not ANTHROPIC_KEY:
    print("Set SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY env vars")
    sys.exit(1)

headers_sb = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

def get_de_questions_without_en():
    """Get DE questions that don't have an EN twin (no pair_id match)."""
    # Get all DE questions
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/questions?locale=eq.de&is_active=eq.true&select=id,external_id,pair_id,category,scenario_text,mindset_tip,options,difficulty&order=category,created_at&limit=500",
        headers=headers_sb,
    )
    de_questions = r.json()

    # Get existing EN pair_ids
    r2 = requests.get(
        f"{SUPABASE_URL}/rest/v1/questions?locale=eq.en&is_active=eq.true&select=pair_id&limit=500",
        headers=headers_sb,
    )
    en_pair_ids = {q["pair_id"] for q in r2.json() if q.get("pair_id")}

    # Filter: DE questions without EN twin
    missing = [q for q in de_questions if q.get("pair_id") not in en_pair_ids]
    # Also include those without pair_id
    no_pair = [q for q in de_questions if not q.get("pair_id")]

    return missing + no_pair

def translate_batch(questions):
    """Translate a batch of DE questions to EN using Claude API."""
    q_data = []
    for q in questions:
        q_data.append({
            "id": q["id"],
            "category": q["category"],
            "scenario_text": q["scenario_text"],
            "mindset_tip": q["mindset_tip"],
            "options": q["options"],
        })

    prompt = f"""Translate these {len(q_data)} German AI quiz questions to English.
Keep the exact same structure. Translate scenario_text, mindset_tip, and each option's text and feedbackText.
Do NOT change scores or IDs. Maintain professional business tone.

Input:
{json.dumps(q_data, ensure_ascii=False, indent=2)}

Return a JSON array with the same structure but all text in English.
Return ONLY the JSON array, no markdown fences."""

    r = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 8000,
            "messages": [{"role": "user", "content": prompt}],
        },
    )

    if r.status_code != 200:
        print(f"  Claude API error: {r.status_code} {r.text[:200]}")
        return []

    text = r.json()["content"][0]["text"]
    cleaned = text.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"  JSON parse error")
        return []

def insert_en_questions(de_questions, en_translations):
    """Insert translated EN questions into Supabase."""
    inserted = 0
    for de_q, en_t in zip(de_questions, en_translations):
        pair_id = de_q.get("pair_id") or de_q.get("external_id") or de_q["id"][:8]
        ext_id = f"EN-{de_q.get('external_id', de_q['id'][:12])}"

        payload = {
            "external_id": ext_id,
            "locale": "en",
            "pair_id": pair_id,
            "category": de_q["category"],
            "scenario_text": en_t["scenario_text"],
            "mindset_tip": en_t["mindset_tip"],
            "options": en_t["options"],
            "difficulty": de_q.get("difficulty", 1),
            "is_active": True,
            "generated_by": "auto-translate",
        }

        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/questions",
            headers={**headers_sb, "Prefer": "return=minimal"},
            json=payload,
        )

        if r.status_code in (200, 201):
            inserted += 1
        else:
            print(f"  Insert error: {r.status_code} {r.text[:100]}")

    return inserted

def main():
    questions = get_de_questions_without_en()
    print(f"Found {len(questions)} DE questions without EN twin\n")

    if not questions:
        print("Nothing to translate!")
        return

    total_inserted = 0
    batches = [questions[i:i + BATCH_SIZE] for i in range(0, len(questions), BATCH_SIZE)]

    for i, batch in enumerate(batches):
        print(f"Batch {i+1}/{len(batches)} ({len(batch)} questions, category: {batch[0]['category']})...")

        translations = translate_batch(batch)
        if not translations:
            print("  SKIP — no translations returned")
            continue

        if len(translations) != len(batch):
            print(f"  WARN: got {len(translations)} translations for {len(batch)} questions")
            translations = translations[:len(batch)]

        inserted = insert_en_questions(batch, translations)
        total_inserted += inserted
        print(f"  OK: {inserted} inserted")

        # Rate limit
        time.sleep(1)

    print(f"\nDone! {total_inserted} EN questions inserted.")

if __name__ == "__main__":
    main()

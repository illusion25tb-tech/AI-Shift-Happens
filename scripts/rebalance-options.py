"""Rebalance answer option lengths via Claude API + Supabase Management API."""
import json, sys, time, requests

SB_AUTH = "Bearer sbp_8b6071f12db56054efb1f5152a9cee44c36f3e17"
DB_URL = "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/database/query"
ANTHROPIC_KEY = None  # Set via env or hardcode

# Try to get from Supabase secrets
def db_query(sql):
    r = requests.post(DB_URL, headers={"Authorization": SB_AUTH, "Content-Type": "application/json"}, json={"query": sql})
    return r.json() if r.status_code in (200, 201) else None

def get_anthropic_key():
    """Get key from Supabase secrets via edge function env."""
    global ANTHROPIC_KEY
    import os
    ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")
    if ANTHROPIC_KEY:
        return True
    print("Set ANTHROPIC_API_KEY env var")
    return False

def rebalance_batch(questions):
    """Send batch to Claude to rewrite options with equal lengths."""
    batch = []
    for q in questions:
        opts = q["options"]
        batch.append({
            "id": q["id"],
            "locale": q["locale"],
            "scenario": q.get("scenario_text", "")[:100],
            "options": [{"text": o["text"], "score": o["score"], "feedbackText": o["feedbackText"]} for o in opts],
        })

    prompt = f"""Rewrite the answer options for these {len(batch)} quiz questions.

RULES:
- Keep the EXACT same meaning and score for each option
- Keep feedbackText unchanged
- Make ALL 3 options approximately the same length (15-25 words each)
- If the correct answer (score=100) is too long, shorten it while keeping the key insight
- If wrong answers are too short, add plausible detail
- Maintain the same language (de or en)
- German: use correct umlauts

Input:
{json.dumps(batch, ensure_ascii=False)}

Return a JSON array with same structure but rebalanced option texts.
Return ONLY the JSON array, no markdown fences."""

    r = requests.post("https://api.anthropic.com/v1/messages", headers={
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
    }, json={
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 8000,
        "messages": [{"role": "user", "content": prompt}],
    })

    if r.status_code != 200:
        print(f"  API error: {r.status_code}")
        return []

    text = r.json()["content"][0]["text"]
    cleaned = text.replace("```json\n", "").replace("```\n", "").replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except:
        print("  JSON parse error")
        return []

def main():
    if not get_anthropic_key():
        sys.exit(1)

    print("Loading imbalanced questions...")
    rows = db_query("SELECT id, locale, scenario_text, options FROM questions WHERE is_active = true")
    if not rows:
        print("No questions found")
        return

    imbalanced = []
    for q in rows:
        opts = q["options"]
        if len(opts) != 3: continue
        correct = [o for o in opts if o.get("score") == 100]
        wrong = [o for o in opts if o.get("score") != 100]
        if not correct or not wrong: continue
        cl = len(correct[0]["text"])
        awl = sum(len(o["text"]) for o in wrong) / len(wrong)
        if awl > 0 and cl > awl * 1.5:
            q["ratio"] = cl / awl
            imbalanced.append(q)

    imbalanced.sort(key=lambda x: x["ratio"], reverse=True)
    print(f"Found {len(imbalanced)} imbalanced questions")

    BATCH_SIZE = 8
    fixed = 0

    for i in range(0, len(imbalanced), BATCH_SIZE):
        batch = imbalanced[i:i + BATCH_SIZE]
        print(f"\nBatch {i // BATCH_SIZE + 1}/{(len(imbalanced) + BATCH_SIZE - 1) // BATCH_SIZE} ({len(batch)} questions)...")

        results = rebalance_batch(batch)
        if not results:
            continue

        for result in results:
            qid = result.get("id")
            new_opts = result.get("options")
            if not qid or not new_opts or len(new_opts) != 3:
                continue

            # Validate scores unchanged
            orig = next((q for q in batch if q["id"] == qid), None)
            if not orig:
                continue
            orig_scores = sorted([o["score"] for o in orig["options"]])
            new_scores = sorted([o["score"] for o in new_opts])
            if orig_scores != new_scores:
                print(f"  SKIP {qid[:8]}: scores changed")
                continue

            # Update in DB
            opts_json = json.dumps(new_opts, ensure_ascii=False).replace("'", "''")
            sql = f"UPDATE questions SET options = '{opts_json}'::jsonb WHERE id = '{qid}'"
            db_query(sql)
            fixed += 1

        print(f"  Fixed: {min(len(results), len(batch))}")
        time.sleep(1)

    print(f"\nDone! Fixed {fixed}/{len(imbalanced)} questions")

if __name__ == "__main__":
    main()

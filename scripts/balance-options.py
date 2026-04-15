"""Balance option lengths in existing questions using Claude API.
Finds questions where the correct answer is significantly longer than wrong answers,
then rewrites all options to be similar length."""
import json, os, sys, requests

SUPABASE_URL = "https://amhfxaqolholacanqyas.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not SERVICE_KEY:
    # Try to get from Supabase Management API
    r = requests.get(
        "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/api-keys",
        headers={"Authorization": "Bearer sbp_8b6071f12db56054efb1f5152a9cee44c36f3e17"},
    )
    for k in r.json():
        if k["name"] == "service_role":
            SERVICE_KEY = k["api_key"]
            break

if not SERVICE_KEY:
    print("Need SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

# Get all questions
print("Loading questions...")
r = requests.get(
    f"{SUPABASE_URL}/rest/v1/questions?is_active=eq.true&select=id,options,locale&limit=1000",
    headers=headers,
)
if r.status_code != 200:
    print(f"Error loading questions: {r.status_code} {r.text[:200]}")
    sys.exit(1)

questions = r.json()
print(f"Loaded {len(questions)} questions")

# Find imbalanced questions
imbalanced = []
for q in questions:
    opts = q.get("options", [])
    if not opts or len(opts) != 3:
        continue

    lengths = [(o.get("text", ""), len(o.get("text", "")), o.get("score", 0)) for o in opts]
    correct = [l for l in lengths if l[2] == 100]
    wrong = [l for l in lengths if l[2] != 100]

    if not correct or not wrong:
        continue

    correct_len = correct[0][1]
    avg_wrong_len = sum(l[1] for l in wrong) / len(wrong)

    # Flag if correct answer is >50% longer than average wrong answer
    if avg_wrong_len > 0 and correct_len > avg_wrong_len * 1.5:
        imbalanced.append({
            "id": q["id"],
            "locale": q["locale"],
            "ratio": round(correct_len / avg_wrong_len, 1),
            "correct_len": correct_len,
            "avg_wrong_len": round(avg_wrong_len),
        })

imbalanced.sort(key=lambda x: x["ratio"], reverse=True)
print(f"\nFound {len(imbalanced)} imbalanced questions (correct >50% longer than wrong)")
print(f"Top 10 worst:")
for q in imbalanced[:10]:
    print(f"  {q['id'][:8]}... ({q['locale']}): correct={q['correct_len']} chars, avg_wrong={q['avg_wrong_len']} chars, ratio={q['ratio']}x")

print(f"\nTotal: {len(imbalanced)} to fix out of {len(questions)}")

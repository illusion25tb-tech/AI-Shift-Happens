"""AI-Shift Happens — Full System Test (no LinkedIn/sharing)"""
import requests, json

BASE = "https://amhfxaqolholacanqyas.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTU3OTYsImV4cCI6MjA4OTA3MTc5Nn0.N_xwWC-IlleuVhaOX4i3G6dsT2lIYwmXLwBm_kKv1-I"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5NTc5NiwiZXhwIjoyMDg5MDcxNzk2fQ.R6BmGuHqpTOtjbC8S6Qh2u3RI5FIN9IH4iMOrZMTXtQ"
SB_TOKEN = "sbp_3e60711ac91eb3c58cf23c99cde081c0d700bc93"
DB_URL = "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/database/query"

passed = 0
failed = 0

def fn(name, body=None, auth=None):
    h = {"apikey": ANON_KEY, "Content-Type": "application/json"}
    if auth: h["Authorization"] = f"Bearer {auth}"
    r = requests.post(f"{BASE}/functions/v1/{name}", headers=h, json=body or {}, timeout=30)
    return r.status_code, r.json() if r.text else {}

def db(sql):
    r = requests.post(DB_URL, headers={"Authorization": f"Bearer {SB_TOKEN}", "Content-Type": "application/json"}, json={"query": sql}, timeout=15)
    return r.json() if r.status_code in (200,201) else None

def ok(t, d=""):
    global passed; passed += 1
    print(f"  OK   {t}" + (f" ({d})" if d else ""))

def fail(t, d=""):
    global failed; failed += 1
    print(f"  FAIL {t}" + (f" -- {d}" if d else ""))

print("=" * 60)
print("  AI-SHIFT HAPPENS — FULL SYSTEM TEST")
print("=" * 60)

# ━━━ 1. LANDING PAGE ━━━
print("\n--- 1. Landing Page ---")
r = requests.get("https://tbai.com.de/mindset-shift/", timeout=10)
if r.status_code == 200 and "AI-Shift Happens" in r.text: ok("Page loads")
else: fail("Page loads", str(r.status_code))

for tag in ["og:image", "og:title", "og:description", "twitter:card", "manifest.json", "theme-color"]:
    if tag in r.text: ok(f"Meta: {tag}")
    else: fail(f"Meta: {tag}")

# Footer links
for link in ["privacy", "faq", "sponsors"]:
    if link in r.text: ok(f"Footer: {link}")
    else: fail(f"Footer: {link}")

# ━━━ 2. SPA ROUTES ━━━
print("\n--- 2. SPA Routes ---")
routes = ["/", "/app", "/app/daily", "/app/freeplay", "/app/challenge", "/app/team",
          "/app/leaderboard", "/app/profile", "/app/faq", "/app/admin", "/app/stats",
          "/app/privacy", "/app/sponsors"]
all_ok = True
for route in routes:
    r = requests.get(f"https://tbai.com.de/mindset-shift{route}", timeout=10)
    if r.status_code != 200:
        fail(f"Route {route}", str(r.status_code))
        all_ok = False
if all_ok: ok(f"All {len(routes)} routes return 200")

# ━━━ 3. STATIC ASSETS ━━━
print("\n--- 3. Assets ---")
for asset, label in [("sw.js","Service Worker"), ("manifest.json","PWA Manifest"),
    ("og-image.png","OG Image"), ("icons/icon-192.png","Icon 192"), ("icons/icon-512.png","Icon 512"),
    ("tbai-logo.png","tbai Logo"), (".htaccess","htaccess")]:
    r = requests.get(f"https://tbai.com.de/mindset-shift/{asset}", timeout=10)
    if r.status_code == 200: ok(f"{label}", f"{len(r.content)//1024}KB")
    else: fail(label, str(r.status_code))

# ━━━ 4. AUTH ━━━
print("\n--- 4. Auth ---")
r = requests.post(f"{BASE}/auth/v1/token?grant_type=password",
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": "test@tbai.cloud", "password": "test123456"}, timeout=10)
TOKEN = None
if r.status_code == 200:
    TOKEN = r.json().get("access_token")
    USER_ID = r.json()["user"]["id"]
    ok("Login", f"user {USER_ID[:8]}...")
else:
    fail("Login", str(r.status_code))

if not TOKEN:
    print("\nAbort: no auth")
    exit(1)

# ━━━ 5. PUBLIC ENDPOINTS ━━━
print("\n--- 5. Public Endpoints ---")

code, data = fn("get-public-stats")
if code == 200 and data.get("players"):
    ok("Public stats", f"{data['players']} players, {data['questions']} questions, {data['quizzes_played']} quizzes")
else: fail("Public stats", str(data)[:60])

code, data = fn("get-sponsors")
if code == 200:
    ok("Sponsors", f"{len(data.get('sponsors',[]))} sponsors, {len(data.get('weekly_prizes',[]))} weekly, {len(data.get('monthly_prizes',[]))} monthly")
else: fail("Sponsors", str(data)[:60])

for tab in ["weekly", "alltime", "company", "halloffame"]:
    code, data = fn(f"get-leaderboard?tab={tab}")
    if code == 200: ok(f"Leaderboard {tab}", f"{len(data.get('entries',[]))} entries")
    else: fail(f"Leaderboard {tab}")

# ━━━ 6. AUTH-PROTECTED ENDPOINTS ━━━
print("\n--- 6. Auth-Protected (should block anon) ---")
for ep in ["get-freeplay-questions", "create-challenge", "get-challenge",
           "submit-answer", "get-daily-quiz", "finish-daily", "teams",
           "streak-freeze", "claim-referral", "get-stats"]:
    code, data = fn(ep, {"action": "check"}, auth=None)
    err = data.get("error", "")
    if "auth" in err.lower() or "token" in err.lower() or "unauthorized" in err.lower() or "missing" in err.lower():
        ok(f"{ep}: blocked")
    else:
        fail(f"{ep}: NOT blocked", f"{code} {err[:40]}")

# Admin should also block
code, data = fn("admin", {"action": "dashboard_stats"}, auth=TOKEN)
if code == 403: ok("Admin: blocked for non-admin")
elif code == 200: ok("Admin: user is admin", str(data)[:60])
else: fail("Admin", f"{code} {str(data)[:40]}")

# ━━━ 7. DAILY QUIZ FLOW ━━━
print("\n--- 7. Daily Quiz ---")
code, data = fn("get-daily-quiz", auth=TOKEN)
if code == 200:
    if data.get("already_played"):
        ok("Daily quiz", "already played today")
    elif data.get("questions"):
        qs = data["questions"]
        ok("Load daily", f"{len(qs)} questions")
        # Submit one answer
        q = qs[0]
        code2, ans = fn("submit-answer", {
            "question_id": q["id"], "selected_index": q["options"][0]["index"],
            "time_ms": 8000, "streak_count": 1, "is_bonus": False
        }, auth=TOKEN)
        if code2 == 200 and "total_score" in ans:
            ok("Submit answer", f"score={ans['total_score']}, correct={ans['is_correct']}")
        else: fail("Submit answer", str(ans)[:60])
    else: fail("Daily quiz", str(data)[:60])
else: fail("Daily quiz", f"HTTP {code}")

# ━━━ 8. FREE PLAY ━━━
print("\n--- 8. Free Play ---")
code, data = fn("get-freeplay-questions", {"locale": "de", "count": 3}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play DE", f"{len(data['questions'])} q, {data.get('total_available',0)} available")
else: fail("Free Play DE", str(data)[:60])

code, data = fn("get-freeplay-questions", {"locale": "en", "count": 3}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play EN", f"{len(data['questions'])} q")
else: fail("Free Play EN", str(data)[:60])

code, data = fn("get-freeplay-questions", {"locale": "de", "count": 3, "category": "automation-agents"}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play filter", "automation-agents")
else: fail("Free Play filter", str(data)[:60])

# ━━━ 9. CHALLENGE ━━━
print("\n--- 9. Challenge ---")
code, data = fn("create-challenge", {"locale": "de"}, auth=TOKEN)
if code == 200 and data.get("challenge_id"):
    cid = data["challenge_id"]
    ok("Create challenge", cid[:8])
    code2, data2 = fn("get-challenge", {"challenge_id": cid}, auth=TOKEN)
    if code2 == 200 and data2.get("questions"):
        ok("Load challenge", f"{len(data2['questions'])} q")
    else: fail("Load challenge", str(data2)[:60])
else: fail("Create challenge", str(data)[:60])

# ━━━ 10. TEAM ━━━
print("\n--- 10. Team ---")
fn("teams", {"action": "leave"}, auth=TOKEN)

code, data = fn("teams", {"action": "create", "name": "FullTest Team"}, auth=TOKEN)
if code == 200 and data.get("team_id"):
    ok("Create team", f"code={data['invite_code']}")

    code2, data2 = fn("teams", {"action": "my_team"}, auth=TOKEN)
    if code2 == 200 and data2.get("team"):
        t = data2["team"]
        ok("My team", f"role={t['my_role']}, members={t['member_count']}, sees_code={t.get('invite_code') is not None}")
    else: fail("My team", str(data2)[:60])

    code3, data3 = fn("teams", {"action": "leaderboard"}, auth=TOKEN)
    if code3 == 200: ok("Team leaderboard", f"{len(data3.get('entries',[]))} teams")
    else: fail("Team leaderboard")

    fn("teams", {"action": "leave"}, auth=TOKEN)
    ok("Leave team")
else: fail("Create team", str(data)[:60])

# ━━━ 11. STREAK FREEZE ━━━
print("\n--- 11. Streak Freeze ---")
code, data = fn("streak-freeze", {"action": "check"}, auth=TOKEN)
if code == 200 and "streak_at_risk" in data:
    ok("Streak freeze check", f"at_risk={data['streak_at_risk']}, cost={data['cost_xp']}")
else: fail("Streak freeze", str(data)[:60])

# ━━━ 12. STATS ━━━
print("\n--- 12. Stats ---")
code, data = fn("get-stats", auth=TOKEN)
if code == 200 and "totals" in data:
    t = data["totals"]
    ok("User stats", f"quizzes={t['quizzes']}, correct={t['correct']}/{t['questions']}, cats={len(data.get('category_scores',{}))}")
    if data.get("comparison"):
        ok("Comparison", f"percentile={data['comparison']['percentile']}%, players={data['comparison']['total_players']}")
else: fail("Stats", str(data)[:60])

# ━━━ 13. DATABASE ━━━
print("\n--- 13. Database ---")
tables = {
    "profiles": "SELECT count(*) as c FROM profiles",
    "questions (DE)": "SELECT count(*) as c FROM questions WHERE is_active=true AND locale='de'",
    "questions (EN)": "SELECT count(*) as c FROM questions WHERE is_active=true AND locale='en'",
    "teams": "SELECT count(*) as c FROM teams",
    "daily_quizzes": "SELECT count(*) as c FROM daily_quizzes",
    "quiz_attempts": "SELECT count(*) as c FROM quiz_attempts",
    "weekly_scores": "SELECT count(*) as c FROM weekly_scores",
    "user_badges": "SELECT count(*) as c FROM user_badges",
    "challenges": "SELECT count(*) as c FROM challenges",
    "sponsors": "SELECT count(*) as c FROM sponsors",
    "prizes": "SELECT count(*) as c FROM prizes",
}
for label, sql in tables.items():
    result = db(sql)
    if result and len(result) > 0:
        ok(f"{label}", f"{result[0]['c']} rows")
    else: fail(label, "query failed")

# ━━━ 14. CRON JOBS ━━━
print("\n--- 14. Cron Jobs ---")
result = db("SELECT jobname, schedule FROM cron.job ORDER BY jobid")
if result:
    for j in result:
        ok(f"Cron: {j['jobname']}", j['schedule'])
else: fail("Cron jobs", "query failed")

# ━━━ 15. SECURITY ━━━
print("\n--- 15. Security ---")

# Generate-questions should block anon
code, data = fn("generate-questions", {"category": "prompt-architecture"})
if code in (403, 401) or "unauthorized" in str(data).lower():
    ok("generate-questions: blocked")
else: fail("generate-questions: NOT blocked", str(data)[:60])

# Weekly-champion should block anon
code, data = fn("weekly-champion")
if code in (403, 401) or "unauthorized" in str(data).lower():
    ok("weekly-champion: blocked")
else: fail("weekly-champion: NOT blocked", str(data)[:60])

# Rebalance-cron should block anon
code, data = fn("rebalance-cron")
if code in (403, 401) or "unauthorized" in str(data).lower():
    ok("rebalance-cron: blocked")
else: fail("rebalance-cron: NOT blocked", str(data)[:60])

# Security headers
r = requests.get("https://tbai.com.de/mindset-shift/", timeout=10)
for header in ["X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy"]:
    if header.lower() in {k.lower(): v for k, v in r.headers.items()}:
        ok(f"Header: {header}")
    else: fail(f"Header: {header}")

# ━━━ 16. DEPLOYED BUNDLE ━━━
print("\n--- 16. Deployed Bundle ---")
bundle_tag = [l for l in r.text.split('\n') if '.js"' in l and 'src=' in l]
if bundle_tag:
    ok("JS bundle found")
    # Check for key features in bundle
    import re
    m = re.search(r'src="([^"]+\.js)"', bundle_tag[0])
    if m:
        bundle_url = f"https://tbai.com.de{m.group(1)}"
        br = requests.get(bundle_url, timeout=15)
        features = ["BottomNav", "Onboarding", "SponsorBanner", "StreakCalendar", "AnimatedCounter",
                     "Confetti", "ErrorBoundary", "CookieConsent", "ShareStatsCard"]
        found = [f for f in features if f.lower() in br.text.lower()]
        ok(f"Bundle features", f"{len(found)}/{len(features)} components")
else: fail("JS bundle")

# ━━━ SUMMARY ━━━
print("\n" + "=" * 60)
total = passed + failed
pct = round(passed/total*100) if total > 0 else 0
print(f"  RESULT: {passed}/{total} passed ({pct}%), {failed} failed")
print("=" * 60)

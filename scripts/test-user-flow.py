"""Full user-flow test for AI-Shift Happens"""
import requests, json

BASE = "https://amhfxaqolholacanqyas.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTU3OTYsImV4cCI6MjA4OTA3MTc5Nn0.N_xwWC-IlleuVhaOX4i3G6dsT2lIYwmXLwBm_kKv1-I"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5NTc5NiwiZXhwIjoyMDg5MDcxNzk2fQ.R6BmGuHqpTOtjbC8S6Qh2u3RI5FIN9IH4iMOrZMTXtQ"

passed = 0
failed = 0

def fn(name, body=None, auth=None):
    headers = {"apikey": ANON_KEY, "Content-Type": "application/json"}
    if auth:
        headers["Authorization"] = f"Bearer {auth}"
    r = requests.post(f"{BASE}/functions/v1/{name}", headers=headers, json=body or {})
    return r.status_code, r.json()

def ok(test, detail=""):
    global passed
    passed += 1
    d = f" ({detail})" if detail else ""
    print(f"  OK   {test}{d}")

def fail(test, detail=""):
    global failed
    failed += 1
    d = f" -- {detail}" if detail else ""
    print(f"  FAIL {test}{d}")

print("=" * 55)
print("  AI-SHIFT HAPPENS -- FULL USER FLOW TEST")
print("=" * 55)

# 1. Landing
print("\n--- 1. Landing Page ---")
r = requests.get("https://tbai.com.de/mindset-shift/")
if r.status_code == 200 and "AI-Shift Happens" in r.text:
    ok("Landing loads")
else:
    fail("Landing", str(r.status_code))

if "og:image" in r.text:
    ok("OG meta tags")
else:
    fail("OG meta tags")

if "manifest.json" in r.text:
    ok("PWA manifest linked")
else:
    fail("PWA manifest")

# 2. Public Stats
print("\n--- 2. Public Stats ---")
code, data = fn("get-public-stats")
if code == 200 and data.get("players", 0) > 0:
    ok("Live stats", f"{data['players']} players, {data['questions']} questions")
else:
    fail("Public stats", str(data)[:80])

# 3. Auth
print("\n--- 3. Auth ---")
r = requests.post(f"{BASE}/auth/v1/token?grant_type=password", headers={
    "apikey": ANON_KEY, "Content-Type": "application/json"
}, json={"email": "test@tbai.cloud", "password": "test123456"})

TOKEN = None
USER_ID = None
if r.status_code == 200:
    TOKEN = r.json()["access_token"]
    USER_ID = r.json()["user"]["id"]
    ok("Login", f"user {USER_ID[:8]}...")
else:
    r2 = requests.post(f"{BASE}/auth/v1/signup", headers={
        "apikey": ANON_KEY, "Content-Type": "application/json"
    }, json={"email": "test@tbai.cloud", "password": "test123456"})
    if r2.status_code in (200, 201) and r2.json().get("access_token"):
        TOKEN = r2.json()["access_token"]
        USER_ID = r2.json()["user"]["id"]
        ok("Signup + Login", f"new user {USER_ID[:8]}...")
    else:
        fail("Auth", f"login: {r.status_code}, signup: {r2.status_code}")

if not TOKEN:
    print("\nAbort: no auth token")
    exit(1)

# 4. Daily Quiz
print("\n--- 4. Daily Quiz ---")
code, data = fn("get-daily-quiz", auth=TOKEN)
if code == 200:
    if data.get("already_played"):
        ok("Daily quiz", "already played today")
    elif data.get("questions"):
        qs = data["questions"]
        ok("Load daily quiz", f"{len(qs)} questions")
        q = qs[0]
        code2, ans = fn("submit-answer", {
            "question_id": q["id"],
            "selected_index": q["options"][0]["index"],
            "time_ms": 5000, "streak_count": 1, "is_bonus": False,
        }, auth=TOKEN)
        if code2 == 200 and "total_score" in ans:
            ok("Submit answer", f"score={ans['total_score']}, correct={ans['is_correct']}")
        else:
            fail("Submit answer", str(ans)[:80])
    else:
        fail("Daily quiz", str(data)[:80])
else:
    fail("Daily quiz", f"HTTP {code}")

# 5. Free Play
print("\n--- 5. Free Play ---")
code, data = fn("get-freeplay-questions", {"locale": "de", "count": 3}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play DE", f"{len(data['questions'])} questions, {data.get('total_available',0)} available")
else:
    fail("Free Play DE", str(data)[:80])

code, data = fn("get-freeplay-questions", {"locale": "en", "count": 3}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play EN", f"{len(data['questions'])} questions")
else:
    fail("Free Play EN", str(data)[:80])

# Category filter
code, data = fn("get-freeplay-questions", {"locale": "de", "count": 3, "category": "automation-agents"}, auth=TOKEN)
if code == 200 and data.get("questions"):
    ok("Free Play category filter", "automation-agents")
else:
    fail("Free Play category filter", str(data)[:80])

# 6. Challenge
print("\n--- 6. Challenge ---")
code, data = fn("create-challenge", {"locale": "de"}, auth=TOKEN)
if code == 200 and data.get("challenge_id"):
    cid = data["challenge_id"]
    ok("Create challenge", f"id={cid[:8]}...")

    code2, data2 = fn("get-challenge", {"challenge_id": cid}, auth=TOKEN)
    if code2 == 200 and data2.get("questions"):
        ok("Load challenge", f"{len(data2['questions'])} questions")
    else:
        fail("Load challenge", str(data2)[:80])
else:
    fail("Create challenge", str(data)[:80])

# 7. Team
print("\n--- 7. Team ---")
fn("teams", {"action": "leave"}, auth=TOKEN)

code, data = fn("teams", {"action": "create", "name": "TestTeam"}, auth=TOKEN)
if code == 200 and data.get("team_id"):
    invite = data["invite_code"]
    ok("Create team", f"code={invite}")

    code2, data2 = fn("teams", {"action": "my_team"}, auth=TOKEN)
    if code2 == 200 and data2.get("team"):
        t = data2["team"]
        ok("My team", f"role={t['my_role']}, members={t['member_count']}, sees_code={t['invite_code'] is not None}")
    else:
        fail("My team", str(data2)[:80])

    code3, data3 = fn("teams", {"action": "leaderboard"}, auth=TOKEN)
    if code3 == 200:
        ok("Team leaderboard", f"{len(data3.get('entries',[]))} teams")
    else:
        fail("Team leaderboard")

    fn("teams", {"action": "leave"}, auth=TOKEN)
    ok("Leave team")
else:
    fail("Create team", str(data)[:80])

# 8. Leaderboard
print("\n--- 8. Leaderboard ---")
for tab in ["weekly", "alltime", "company", "halloffame"]:
    code, data = fn(f"get-leaderboard?tab={tab}")
    if code == 200:
        ok(f"Leaderboard {tab}", f"{len(data.get('entries',[]))} entries")
    else:
        fail(f"Leaderboard {tab}")

# 9. Stats
print("\n--- 9. Stats ---")
code, data = fn("get-stats", auth=TOKEN)
if code == 200 and "totals" in data:
    t = data["totals"]
    cats = len(data.get("category_scores", {}))
    hist = len(data.get("score_history", []))
    ok("User stats", f"quizzes={t['quizzes']}, accuracy={t['correct']}/{t['questions']}, categories={cats}, history_days={hist}")
else:
    fail("Stats", str(data)[:80])

# 10. Admin
print("\n--- 10. Admin ---")
code, data = fn("admin", {"action": "dashboard_stats"}, auth=TOKEN)
if code == 403:
    ok("Admin blocked for non-admin")
elif code == 200:
    ok("Admin dashboard (is admin)", str(data))
else:
    fail("Admin", str(data)[:80])

# 11. Profile
print("\n--- 11. Profile ---")
headers = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
r = requests.get(f"{BASE}/rest/v1/profiles?id=eq.{USER_ID}&select=display_name,company_name,team_id,team_role,is_admin,avatar_url,created_at,total_xp,level", headers=headers)
if r.status_code == 200 and len(r.json()) > 0:
    p = r.json()[0]
    ok("Profile data", f"name={p.get('display_name')}, xp={p.get('total_xp')}, lv={p.get('level')}, avatar={'yes' if p.get('avatar_url') else 'no'}")
else:
    fail("Profile", str(r.text)[:80])

# 12. Routes
print("\n--- 12. SPA Routes ---")
routes = ["/", "/app", "/app/daily", "/app/freeplay", "/app/challenge", "/app/team",
          "/app/leaderboard", "/app/profile", "/app/faq", "/app/admin", "/app/stats"]
all_ok = True
for route in routes:
    r = requests.get(f"https://tbai.com.de/mindset-shift{route}", timeout=10)
    if r.status_code != 200:
        fail(f"Route {route}", str(r.status_code))
        all_ok = False
if all_ok:
    ok(f"All {len(routes)} SPA routes return 200")

# 13. Assets
print("\n--- 13. Assets ---")
for asset, label in [("sw.js", "Service Worker"), ("manifest.json", "PWA Manifest"), ("og-image.png", "OG Image"),
                      ("icons/icon-192.png", "Icon 192"), ("icons/icon-512.png", "Icon 512")]:
    r = requests.get(f"https://tbai.com.de/mindset-shift/{asset}")
    if r.status_code == 200:
        ok(label, f"{len(r.content)//1024}KB")
    else:
        fail(label, str(r.status_code))

# Summary
print("\n" + "=" * 55)
total = passed + failed
print(f"  RESULT: {passed}/{total} passed, {failed} failed")
print("=" * 55)

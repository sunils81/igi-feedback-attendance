#!/usr/bin/env python3
"""
IGI Portal — Seed students table from Batch_Students CSV + Attendance CSV
Run: python3 ~/Downloads/igi-feedback-attendance/upload_students.py
"""

import csv, json, os
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SB_URL = "https://atbexvtrcopaagcdbpqi.supabase.co"
SB_KEY = "sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb"

HEADERS = {
    "apikey":        SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal,resolution=merge-duplicates",
}

UPLOAD_DIR = os.path.expanduser("~/Downloads")

def nz(v):
    v = str(v).strip() if v is not None else ""
    return None if v == "" else v

def push(table, rows):
    if not rows:
        print(f"  ⚠  No rows to push to {table}")
        return
    url = f"{SB_URL}/rest/v1/{table}"
    body = json.dumps(rows).encode()
    req = Request(url, data=body, headers=HEADERS, method="POST")
    try:
        res = urlopen(req, timeout=20)
        print(f"  ✅ {table}: {len(rows)} rows upserted (HTTP {res.status})")
    except HTTPError as e:
        detail = e.read().decode()
        print(f"  ❌ {table}: HTTP {e.code} — {detail[:300]}")

# ── 1. Read Batch_Students CSV ────────────────────────────────────────────────
bs_path = os.path.join(UPLOAD_DIR, "IGI Lecture Attendance & Feedback - Batch_Students (2).csv")
students = {}   # key = (student_id, batch_code)

print("📂 Reading Batch_Students CSV…")
with open(bs_path, newline="", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        sid = nz(r.get("Student ID"))
        bc  = nz(r.get("Primary Batch Code"))
        if not sid or not bc:
            continue
        key = (sid, bc)
        students[key] = {
            "student_id":  sid,
            "batch_code":  bc,
            "name":        nz(r.get("Name")),
            "mobile_last4": nz(r.get("Mobile Last 4")),
            "mobile":      nz(r.get("Mobile")),
            "email":       nz(r.get("Email")),
            "status":      nz(r.get("Status")) or "Active",
        }

print(f"  Found {len(students)} students in Batch_Students CSV")

# ── 2. Supplement from Attendance_Feedback CSV (catches extras) ───────────────
att_path = os.path.join(UPLOAD_DIR, "IGI Lecture Attendance & Feedback - Attendance_Feedback (1).csv")
extra = 0

if os.path.exists(att_path):
    print("📂 Reading Attendance_Feedback CSV for extra students…")
    with open(att_path, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            sid = nz(r.get("Enrollment No"))
            bc  = nz(r.get("Batch Code"))
            if not sid or not bc:
                continue
            key = (sid, bc)
            if key not in students:
                students[key] = {
                    "student_id":  sid,
                    "batch_code":  bc,
                    "name":        nz(r.get("Student Name")),
                    "mobile_last4": None,
                    "mobile":      None,
                    "email":       None,
                    "status":      "Active",
                }
                extra += 1
    print(f"  Found {extra} additional students from Attendance CSV")

# ── 3. Summary before upload ──────────────────────────────────────────────────
# Deduplicate by (student_id, batch_code) — dict already handles this, but be safe
seen = set()
rows = []
for r in students.values():
    k = (r["student_id"], r["batch_code"])
    if k not in seen:
        seen.add(k)
        rows.append(r)
batches_covered = sorted(set(r["batch_code"] for r in rows))
print(f"\n📊 Total: {len(rows)} student-batch rows across {len(batches_covered)} batches:")
for b in batches_covered:
    count = sum(1 for r in rows if r["batch_code"] == b)
    print(f"   {b}: {count} student(s)")

# ── 4. Upload ─────────────────────────────────────────────────────────────────
print(f"\n📤 Upserting {len(rows)} rows → students table (one at a time to avoid duplicate conflicts)…")
ok = 0
fail = 0
for row in rows:
    url = f"{SB_URL}/rest/v1/students"
    body = json.dumps([row]).encode()
    req = Request(url, data=body, headers=HEADERS, method="POST")
    try:
        res = urlopen(req, timeout=20)
        ok += 1
    except HTTPError as e:
        detail = e.read().decode()
        print(f"  ❌ {row['student_id']}/{row['batch_code']}: {detail[:200]}")
        fail += 1
print(f"  ✅ {ok} upserted, {fail} failed")

print("\n✅ Done. Refresh the Instructor Portal to see student counts.")

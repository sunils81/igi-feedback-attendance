#!/usr/bin/env python3
"""
IGI Portal — Supabase CSV Uploader (corrected column mappings)
Run: python3 ~/Downloads/igi-feedback-attendance/upload_csvs.py
"""

import csv, json, os, time, re
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SB_URL  = "https://atbexvtrcopaagcdbpqi.supabase.co"
SB_KEY  = "sb_publishable_TpzxX5a3M7lnFeND8xLfhQ_YJOxOkhb"
CSV_DIR = os.path.expanduser("~/Downloads")
PREFIX  = "IGI Lecture Attendance & Feedback - "

HEADERS = {
    "apikey":        SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=minimal,resolution=merge-duplicates",
}

def nz(v):
    """Empty string → None."""
    v = str(v).strip() if v is not None else ""
    return None if v == "" else v

def fix_ts(v):
    """Fix timestamp strings — convert gmt+0530 → +05:30 etc."""
    v = nz(v)
    if not v:
        return None
    # Replace 'gmt+HHMM' or 'GMT+HHMM' with '+HH:MM'
    v = re.sub(r'(?i)gmt([+-])(\d{2})(\d{2})', lambda m: m.group(1)+m.group(2)+':'+m.group(3), v)
    return v

def fix_date(v):
    """Convert JS Date string like 'Fri Jun 12 2026 00:00:00 GMT+0530 (...)' → '2026-06-12'."""
    v = nz(v)
    if not v:
        return None
    # Already a simple date or ISO timestamp — return as-is
    if re.match(r'^\d{4}-\d{2}-\d{2}', v):
        return v[:10]
    # JS Date string: extract date part
    m = re.search(r'(\w{3})\s+(\w{3})\s+(\d{1,2})\s+(\d{4})', v)
    if m:
        months = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06',
                  'Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'}
        mon = months.get(m.group(2), '01')
        day = m.group(3).zfill(2)
        yr  = m.group(4)
        return f"{yr}-{mon}-{day}"
    return None

def dedup(rows, key_fn):
    """Remove duplicate rows by key."""
    seen = set()
    out = []
    for r in rows:
        k = key_fn(r)
        if k not in seen:
            seen.add(k)
            out.append(r)
    return out

def load_csv(sheet):
    path = os.path.join(CSV_DIR, PREFIX + sheet + ".csv")
    if not os.path.exists(path):
        print(f"  ⚠️  Not found: {path}")
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def upsert(table, rows, conflict=None):
    if not rows:
        return True, 0
    url = f"{SB_URL}/rest/v1/{table}"
    if conflict:
        url += f"?on_conflict={conflict}"
    data = json.dumps(rows).encode()
    req = Request(url, data=data, headers={**HEADERS, "Content-Length": str(len(data))}, method="POST")
    try:
        with urlopen(req, timeout=30) as r:
            return True, r.status
    except HTTPError as e:
        return False, e.read().decode()

def push(table, rows, conflict=None, batch=200):
    if not rows:
        print("  (no data)")
        return
    print(f"  {len(rows)} rows → uploading…")
    ok_n = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        ok, info = upsert(table, chunk, conflict)
        if ok:
            ok_n += len(chunk)
            print(f"  ✅ batch {i//batch+1}: {len(chunk)} rows")
        else:
            print(f"  ❌ batch {i//batch+1} FAILED: {info[:300]}")
        time.sleep(0.3)
    print(f"  → {ok_n}/{len(rows)} uploaded")

# ─────────────────────────────────────────────────────────────────────────────
# 1. online_tests
#    DB: test_id, batch_code, title, duration_mins, starts_at, ends_at,
#        status, created_by, created_at
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 OnlineTests → online_tests")
rows = []
for r in load_csv("OnlineTests"):
    rows.append({
        "test_id":      nz(r.get("Test ID")),
        "batch_code":   nz(r.get("Batch Code")),
        "title":        nz(r.get("Test Label")),
        "duration_mins":nz(r.get("Duration (mins)")),
        "starts_at":    nz(r.get("Activated At")),
        "ends_at":      nz(r.get("Closed At")),
        "status":       nz(r.get("Status")),
        "created_by":   nz(r.get("Created By")),
        "created_at":   nz(r.get("Created At")),
    })
rows = [r for r in rows if r["test_id"]]
rows = dedup(rows, lambda r: r["test_id"])
push("online_tests", rows, conflict="test_id")

# ─────────────────────────────────────────────────────────────────────────────
# 2. question_bank
#    DB: id, course, topic, question, option_a-d, correct_ans, q_type,
#        max_marks, instructor, source, created_at
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 QuestionBank → question_bank")
# id column is UUID — don't set it; store QB_ID in source field
rows = []
for r in load_csv("QuestionBank"):
    qb_id = nz(r.get("QB_ID"))
    if not qb_id:
        continue
    rows.append({
        # no "id" — let Supabase auto-generate UUID
        "course":      nz(r.get("Course")),
        "topic":       nz(r.get("Topic")),
        "question":    nz(r.get("Question")),
        "option_a":    nz(r.get("Option1")),
        "option_b":    nz(r.get("Option2")),
        "option_c":    nz(r.get("Option3")),
        "option_d":    nz(r.get("Option4")),
        "correct_ans": nz(r.get("CorrectOption")),
        "q_type":      nz(r.get("Type")),
        "source":      qb_id,   # store QB_ID here for reference
        "created_at":  nz(r.get("Added At")),
    })
push("question_bank", rows)  # no conflict key — insert only

# ─────────────────────────────────────────────────────────────────────────────
# 3. test_questions  (junction: test_id + question_id + order)
#    DB: id(auto), test_id, question_id, order_no
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 OT_Questions → test_questions (skipped: question_id is UUID, QB_IDs not compatible)")
# test_questions.question_id is UUID referencing question_bank.id
# QB_IDs (QB0001 etc) can't be inserted directly — skipping this table

# ─────────────────────────────────────────────────────────────────────────────
# 4. test_responses
#    DB: id(auto or response_id?), test_id, student_id, batch_code,
#        answers, score, submitted_at
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 OT_Responses → test_responses")
rows = []
for r in load_csv("OT_Responses"):
    rows.append({
        "test_id":      nz(r.get("Test ID")),
        "student_id":   nz(r.get("Student ID")),
        "batch_code":   nz(r.get("Batch Code")),
        "answers":      nz(r.get("Answers JSON")),
        "score":        nz(r.get("Total Score")),
        "submitted_at": nz(r.get("Submitted At")),
    })
rows = [r for r in rows if r["test_id"] and r["student_id"]]
rows = dedup(rows, lambda r: (r["test_id"], r["student_id"]))
push("test_responses", rows, conflict="test_id,student_id")

# ─────────────────────────────────────────────────────────────────────────────
# 5. test_starts
#    DB: id(auto), test_id, student_id, started_at
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 OT_Starts → test_starts")
rows = []
for r in load_csv("OT_Starts"):
    rows.append({
        "test_id":    nz(r.get("Test ID")),
        "student_id": nz(r.get("Student ID")),
        "started_at": nz(r.get("Started At")),
    })
rows = [r for r in rows if r["test_id"] and r["student_id"]]
push("test_starts", rows, conflict="test_id,student_id")

# ─────────────────────────────────────────────────────────────────────────────
# 6. test_warnings
#    DB: id(auto), test_id, student_id, warning_type, count, logged_at
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 OT_Warnings → test_warnings")
rows = []
for r in load_csv("OT_Warnings"):
    rows.append({
        "test_id":      nz(r.get("Test ID")),
        "student_id":   nz(r.get("Student ID")),
        "warning_type": nz(r.get("Warning Type")),
        "count":        nz(r.get("Warning Count")),
        "logged_at":    nz(r.get("Timestamp")),
    })
rows = [r for r in rows if r["test_id"] and r["student_id"]]
push("test_warnings", rows)

# ─────────────────────────────────────────────────────────────────────────────
# 7. tray_registry
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Tray_Registry → tray_registry")
rows = []
for r in load_csv("Tray_Registry"):
    rows.append({
        "tray_id":            nz(r.get("TrayID")),
        "category":           nz(r.get("Category")),
        "topic_code":         nz(r.get("TopicCode")),
        "topic_name":         nz(r.get("TopicName")),
        "home_centre":        nz(r.get("HomeCentre")),
        "home_instructor":    nz(r.get("HomeInstructor")),
        "stone_count":        nz(r.get("StoneCount")),
        "week_usage":         nz(r.get("WeekUsage")),
        "location_status":    nz(r.get("LocationStatus")),
        "current_centre":     nz(r.get("CurrentCentre")),
        "expected_return":    fix_date(r.get("ExpectedReturn")),
        "registered_at":      fix_ts(r.get("RegisteredAt")),
        "notes":              nz(r.get("Notes")),
        "borrower_confirmed": nz(r.get("BorrowerConfirmed")),
    })
rows = [r for r in rows if r["tray_id"]]
push("tray_registry", rows, conflict="tray_id")

# ─────────────────────────────────────────────────────────────────────────────
# 8. tray_history
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Tray_History → tray_history")
rows = []
for r in load_csv("Tray_History"):
    rows.append({
        "history_id":      nz(r.get("HistoryID")),
        "tray_id":         nz(r.get("TrayID")),
        "leg_number":      nz(r.get("LegNumber")),
        "from_centre":     nz(r.get("FromCentre")),
        "to_centre":       nz(r.get("ToCentre")),
        "from_instructor": nz(r.get("FromInstructor")),
        "to_instructor":   nz(r.get("ToInstructor")),
        "planned_start":   nz(r.get("PlannedStart")),
        "planned_end":     nz(r.get("PlannedEnd")),
        "actual_sent":     nz(r.get("ActualSent")),
        "actual_received": nz(r.get("ActualReceived")),
        "status":          nz(r.get("Status")),
    })
rows = [r for r in rows if r["history_id"]]
push("tray_history", rows, conflict="history_id")

# ─────────────────────────────────────────────────────────────────────────────
# 9. tray_notifications
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Tray_Notifications → tray_notifications")
rows = []
for r in load_csv("Tray_Notifications"):
    rows.append({
        "notif_id":      nz(r.get("NotifID")),
        "to_instructor": nz(r.get("ToInstructor")),
        "type":          nz(r.get("Type")),
        "booking_id":    nz(r.get("BookingID")),
        "message":       nz(r.get("Message")),
        "read":          nz(r.get("Read")),
        "created_at":    nz(r.get("CreatedAt")),
    })
rows = [r for r in rows if r["notif_id"]]
push("tray_notifications", rows, conflict="notif_id")

# ─────────────────────────────────────────────────────────────────────────────
# 10. revenue_annual_targets
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Revenue_Annual_Targets → revenue_annual_targets")
rows = []
for r in load_csv("Revenue_Annual_Targets"):
    rows.append({
        "period":                       nz(r.get("Period")),
        "counsellor":                   nz(r.get("Counsellor")),
        "centre":                       nz(r.get("Centre")),
        "annual_course_fee_target":     nz(r.get("Annual Course Fee Target")),
        "annual_course_fee_gst_target": nz(r.get("Annual Course Fee + GST Target")),
        "notes":                        nz(r.get("Notes")),
        "updated_by":                   nz(r.get("Updated By")),
        "updated_at":                   nz(r.get("Updated At")),
    })
rows = [r for r in rows if r["period"]]
push("revenue_annual_targets", rows, conflict="period,counsellor")

# ─────────────────────────────────────────────────────────────────────────────
# 11. revenue_centre_targets
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Revenue_Centre_Targets → revenue_centre_targets")
rows = []
for r in load_csv("Revenue_Centre_Targets"):
    rows.append({
        "period":                       nz(r.get("Period")),
        "centre":                       nz(r.get("Centre")),
        "annual_course_fee_target":     nz(r.get("Annual Course Fee Target")),
        "annual_course_fee_gst_target": nz(r.get("Annual Course Fee + GST Target")),
        "notes":                        nz(r.get("Notes")),
        "updated_by":                   nz(r.get("Updated By")),
        "updated_at":                   nz(r.get("Updated At")),
    })
rows = [r for r in rows if r["period"]]
push("revenue_centre_targets", rows, conflict="period,centre")

# ─────────────────────────────────────────────────────────────────────────────
# 12. revenue_target_revisions
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Revenue_Target_Revisions → revenue_target_revisions")
rows = []
for r in load_csv("Revenue_Target_Revisions"):
    rows.append({
        "revised_at":                 nz(r.get("Revised At")),
        "target_type":                nz(r.get("Target Type")),
        "period":                     nz(r.get("Period")),
        "centre":                     nz(r.get("Centre")),
        "counsellor":                 nz(r.get("Counsellor")),
        "old_course_fee_target":      nz(r.get("Old Course Fee Target")),
        "old_course_fee_gst_target":  nz(r.get("Old Course Fee + GST Target")),
        "new_course_fee_target":      nz(r.get("New Course Fee Target")),
        "new_course_fee_gst_target":  nz(r.get("New Course Fee + GST Target")),
        "reason":                     nz(r.get("Reason")),
        "updated_by":                 nz(r.get("Updated By")),
    })
rows = [r for r in rows if r["revised_at"]]
push("revenue_target_revisions", rows)

# ─────────────────────────────────────────────────────────────────────────────
# 13. revenue_monthly_achieved — merge all counsellor sheets
# ─────────────────────────────────────────────────────────────────────────────
print("\n📤 Revenue_Monthly (all counsellors) → revenue_monthly_achieved")
counsellors = ["Anuradha","Arpita","Bianca","Kripa","Mrinal","Preethy","Rajini","Rohit","Sunita"]
all_monthly = []
seen = set()

for c in counsellors:
    for r in load_csv(f"Revenue_Monthly_{c}"):
        key = (nz(r.get("Month")), nz(r.get("Period")), nz(r.get("Counsellor")) or c)
        if key in seen:
            continue
        seen.add(key)
        all_monthly.append({
            "month":                   nz(r.get("Month")),
            "period":                  nz(r.get("Period")),
            "counsellor":              nz(r.get("Counsellor")) or c,
            "assigned_centre":         nz(r.get("Assigned Centre")),
            "business_centre":         nz(r.get("Business Centre")),
            "business_type":           nz(r.get("Business Type")),
            "student_count":           nz(r.get("Student Count")),
            "achieved_course_fee":     nz(r.get("Achieved Course Fee")),
            "achieved_course_fee_gst": nz(r.get("Achieved Course Fee + GST")),
            "notes":                   nz(r.get("Notes")),
            "updated_by":              nz(r.get("Updated By")),
            "locked":                  nz(r.get("Locked")),
            "updated_at":              nz(r.get("Updated At")),
        })

# also master sheet
for r in load_csv("Revenue_Monthly_Achieved"):
    key = (nz(r.get("Month")), nz(r.get("Period")), nz(r.get("Counsellor")))
    if key not in seen and key[0]:
        seen.add(key)
        all_monthly.append({
            "month":                   nz(r.get("Month")),
            "period":                  nz(r.get("Period")),
            "counsellor":              nz(r.get("Counsellor")),
            "assigned_centre":         nz(r.get("Assigned Centre")),
            "business_centre":         nz(r.get("Business Centre")),
            "business_type":           nz(r.get("Business Type")),
            "student_count":           nz(r.get("Student Count")),
            "achieved_course_fee":     nz(r.get("Achieved Course Fee")),
            "achieved_course_fee_gst": nz(r.get("Achieved Course Fee + GST")),
            "notes":                   nz(r.get("Notes")),
            "updated_by":              nz(r.get("Updated By")),
            "locked":                  nz(r.get("Locked")),
            "updated_at":              nz(r.get("Updated At")),
        })

print(f"  {len(all_monthly)} total rows (merged)")
push("revenue_monthly_achieved", all_monthly, conflict="month,period,counsellor")

print("\n" + "="*55)
print("  All uploads complete!")
print("="*55)

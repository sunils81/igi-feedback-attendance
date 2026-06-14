#!/usr/bin/env python3
"""Upload INV_Items and INV_Stock to Supabase."""

import csv, json, os, time
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
    v = str(v).strip() if v is not None else ""
    return None if v == "" else v

def load_csv(sheet):
    path = os.path.join(CSV_DIR, PREFIX + sheet + ".csv")
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))

def post(table, rows, conflict=None, ret="minimal"):
    url = f"{SB_URL}/rest/v1/{table}"
    if conflict:
        url += f"?on_conflict={conflict}"
    prefer = f"return={ret},resolution=merge-duplicates"
    data = json.dumps(rows).encode()
    req = Request(url, data=data, headers={
        **HEADERS,
        "Prefer": prefer,
        "Content-Length": str(len(data))
    }, method="POST")
    try:
        with urlopen(req, timeout=30) as r:
            body = r.read()
            return True, json.loads(body) if body else []
    except HTTPError as e:
        return False, e.read().decode()

def get(table, select="*", eq=None):
    url = f"{SB_URL}/rest/v1/{table}?select={select}"
    if eq:
        for k, v in eq.items():
            url += f"&{k}=eq.{v}"
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except:
        return []

def push(table, rows, conflict=None, batch=200):
    print(f"\n📤 {table}: {len(rows)} rows")
    ok_n = 0
    for i in range(0, len(rows), batch):
        chunk = rows[i:i+batch]
        ok, info = post(table, chunk, conflict)
        if ok:
            ok_n += len(chunk)
            print(f"  ✅ batch {i//batch+1}: {len(chunk)} rows")
        else:
            print(f"  ❌ FAILED: {str(info)[:300]}")
        time.sleep(0.3)
    print(f"  → {ok_n}/{len(rows)} uploaded")

# ── Step 1: Upload inv_items ──────────────────────────────────────────────────
rows_items = []
for r in load_csv("INV_Items"):
    code = nz(r.get("Item ID"))
    if not code:
        continue
    cost_raw = r.get("Unit Cost (Rs)", "").strip()
    cost = float(cost_raw) if cost_raw else None
    rows_items.append({
        "item_code":     code,
        "item_name":     nz(r.get("Item Name")),
        "category":      nz(r.get("Category")),
        "unit":          nz(r.get("Unit")),
        "reorder_level": nz(r.get("Reorder Level")),
        "unit_cost":     cost,
        "notes":         nz(r.get("Notes")),
        "is_active":     True,
        "created_at":    nz(r.get("Created At")),
    })

push("inv_items", rows_items, conflict="item_code")

# ── Step 2: Query back UUIDs for item_code → id mapping ──────────────────────
print("\n🔍 Fetching item UUIDs from Supabase…")
db_items = get("inv_items", select="id,item_code")
code_to_uuid = {i["item_code"]: i["id"] for i in db_items}
print(f"  Got {len(code_to_uuid)} items")

# ── Step 3: Upload inv_stock ──────────────────────────────────────────────────
# DB cols: id(uuid auto), item_id(uuid FK), centre, qty, updated_at
# CSV:     Stock ID, Centre, Item ID, Quantity, Updated At, Updated By
rows_stock = []
skipped = 0
for r in load_csv("INV_Stock"):
    code = nz(r.get("Item ID"))
    uuid = code_to_uuid.get(code)
    if not uuid:
        skipped += 1
        continue
    rows_stock.append({
        "item_id":    uuid,
        "centre":     nz(r.get("Centre")),
        "qty":        nz(r.get("Quantity")),
        "updated_at": nz(r.get("Updated At")),
    })

if skipped:
    print(f"  ⚠️  {skipped} stock rows skipped (item code not found)")
push("inv_stock", rows_stock, conflict="item_id,centre")

print("\n✅ Inventory upload complete!")

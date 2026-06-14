-- ============================================================
-- Unit cost update from Pan India Inventory Sheet
-- Run in Supabase → SQL Editor
-- 48 items updated, 12 left as NULL (cost not in master sheet)
-- ============================================================
UPDATE inv_items SET unit_cost = 79 WHERE item_code = 'ITEM-001'; -- Education Brochure
UPDATE inv_items SET unit_cost = 142 WHERE item_code = 'ITEM-002'; -- Spiral Note Book
UPDATE inv_items SET unit_cost = 20 WHERE item_code = 'ITEM-003'; -- Pens
UPDATE inv_items SET unit_cost = 2348 WHERE item_code = 'ITEM-004'; -- Diamond Grading Manual
UPDATE inv_items SET unit_cost = 59 WHERE item_code = 'ITEM-005'; -- Diamond Grading Handbook
UPDATE inv_items SET unit_cost = 597 WHERE item_code = 'ITEM-006'; -- RBC Work Sheet
UPDATE inv_items SET unit_cost = 667 WHERE item_code = 'ITEM-007'; -- Fancy Shape Work Sheet
UPDATE inv_items SET unit_cost = 140 WHERE item_code = 'ITEM-008'; -- Fine Tip Tweezer
UPDATE inv_items SET unit_cost = 0 WHERE item_code = 'ITEM-009'; -- Color Card
UPDATE inv_items SET unit_cost = 2500 WHERE item_code = 'ITEM-010'; -- Diamond Grading Kit
UPDATE inv_items SET unit_cost = 1800 WHERE item_code = 'ITEM-012'; -- Grading Lamps
UPDATE inv_items SET unit_cost = 38000 WHERE item_code = 'ITEM-013'; -- UV Lamp
UPDATE inv_items SET unit_cost = 100000 WHERE item_code = 'ITEM-014'; -- Microscope
UPDATE inv_items SET unit_cost = 900 WHERE item_code = 'ITEM-015'; -- Dial Gauge
UPDATE inv_items SET unit_cost = 1350 WHERE item_code = 'ITEM-016'; -- Jewelry Gauge
UPDATE inv_items SET unit_cost = 3600 WHERE item_code = 'ITEM-017'; -- Colored Stone Manual
UPDATE inv_items SET unit_cost = 597 WHERE item_code = 'ITEM-018'; -- CS Work Sheet
UPDATE inv_items SET unit_cost = 25 WHERE item_code = 'ITEM-019'; -- Color Chart
UPDATE inv_items SET unit_cost = 1750 WHERE item_code = 'ITEM-021'; -- Colored Stone Grading Kit
UPDATE inv_items SET unit_cost = 31800 WHERE item_code = 'ITEM-022'; -- SG Kit / Weighing Scale
UPDATE inv_items SET unit_cost = 7500 WHERE item_code = 'ITEM-023'; -- Refractometer
UPDATE inv_items SET unit_cost = 2450 WHERE item_code = 'ITEM-024'; -- Dichroscope
UPDATE inv_items SET unit_cost = 9500 WHERE item_code = 'ITEM-025'; -- Polariscope
UPDATE inv_items SET unit_cost = 1574 WHERE item_code = 'ITEM-026'; -- Jewelry Design Manual
UPDATE inv_items SET unit_cost = 7500 WHERE item_code = 'ITEM-028'; -- Jewelry Design Kit
UPDATE inv_items SET unit_cost = 350 WHERE item_code = 'ITEM-029'; -- Portfolio Bag
UPDATE inv_items SET unit_cost = 120 WHERE item_code = 'ITEM-031'; -- A3 Black/Grey Sheets
UPDATE inv_items SET unit_cost = 1154 WHERE item_code = 'ITEM-034'; -- Polished Diamond Grading Manual
UPDATE inv_items SET unit_cost = 1154 WHERE item_code = 'ITEM-035'; -- Rough Diamond Grading Manual
UPDATE inv_items SET unit_cost = 342 WHERE item_code = 'ITEM-036'; -- Small Diamond Assortment Manual
UPDATE inv_items SET unit_cost = 250 WHERE item_code = 'ITEM-037'; -- Gem Cloth
UPDATE inv_items SET unit_cost = 1911 WHERE item_code = 'ITEM-040'; -- IRES Manual
UPDATE inv_items SET unit_cost = 783 WHERE item_code = 'ITEM-041'; -- Jewelry Design CAD Manual
UPDATE inv_items SET unit_cost = 954 WHERE item_code = 'ITEM-043'; -- JewelPad Design Manual
UPDATE inv_items SET unit_cost = 2057 WHERE item_code = 'ITEM-044'; -- Diploma in Pearl Manual
UPDATE inv_items SET unit_cost = 597 WHERE item_code = 'ITEM-045'; -- Pearl Work Sheet
UPDATE inv_items SET unit_cost = 400 WHERE item_code = 'ITEM-048'; -- Black Laptop Bags
UPDATE inv_items SET unit_cost = 145 WHERE item_code = 'ITEM-049'; -- Black Jute Bags
UPDATE inv_items SET unit_cost = 36 WHERE item_code = 'ITEM-050'; -- Student Diploma
UPDATE inv_items SET unit_cost = 20 WHERE item_code = 'ITEM-051'; -- Participant Certificate
UPDATE inv_items SET unit_cost = 50 WHERE item_code = 'ITEM-052'; -- Diploma Frame
UPDATE inv_items SET unit_cost = 100 WHERE item_code = 'ITEM-053'; -- White Folder
UPDATE inv_items SET unit_cost = 210 WHERE item_code = 'ITEM-054'; -- Black Folder
UPDATE inv_items SET unit_cost = 500 WHERE item_code = 'ITEM-055'; -- Grading Lamp Tubes
UPDATE inv_items SET unit_cost = 140 WHERE item_code = 'ITEM-056'; -- Medium Tip Tweezer
UPDATE inv_items SET unit_cost = 550 WHERE item_code = 'ITEM-057'; -- 10X Loupe
UPDATE inv_items SET unit_cost = 75 WHERE item_code = 'ITEM-058'; -- Paper Bag
UPDATE inv_items SET unit_cost = 1350 WHERE item_code = 'ITEM-059'; -- Grading Lamp (Small)

-- These 12 items have no cost in the master sheet (will show ⚠️ Missing until filled):
-- ITEM-011: Assortment Pads
-- ITEM-020: RI Liquid
-- ITEM-027: JD Journal / Sketch Book
-- ITEM-030: Vellum Sheets
-- ITEM-032: A4 Gateway Sheet
-- ITEM-033: Sheet Protectors
-- ITEM-038: Ghodi (Stand)
-- ITEM-039: Diamond Sorting Sieve
-- ITEM-042: PC with Rhino Software
-- ITEM-046: Pearl Grading Kit
-- ITEM-047: Pearl Assortment Tray
-- ITEM-060: Assortment Pad (Small)

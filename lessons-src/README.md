# Lesson decks (day-wise presentations)

Each syllabus day's lecture rebuilt as an animated HTML deck in the Diamond Masterclass
style, opened from the instructor portal's **📽 Lessons** tab.

## How access works
- **Opens straight away:** days the batch has already covered (recap), the batch's next
  day(s) while it is running, and whatever today's session recorded.
- **Everything else** (a future day, a different order) needs **Request access** with a
  reason. The HOD approves in the admin portal (📽 Lessons tab); Bhavin Patel is the backup
  approver in his Lessons tab. Both sides get a push notification.
- An approval lasts until the end of the chosen day (IST): today, +1, 3 or 7 days.
- Smart Learning courses (DG Integrated, Coloured Stone Integrated, SDA, iRES) are outside
  the lock: every deck of the parent course is open.
- Students never see decks. Files live in the **private** `lesson-decks` bucket and are
  served only through `/api/push/lesson-open`, which re-checks the rule in the database
  (`lesson_authorize_open`) and signs a 5-minute link. Every opening is logged in
  `lesson_access_log`.
- Today's deck is saved on the classroom laptop (Cache Storage `igi-lessons-v1`) as soon as
  the Lessons tab opens, so a Wi-Fi drop doesn't stop the class.

Rules and tables: `supabase/migrations/migration_lesson_decks.sql`.
Portal UI: `assets/lessons.js`. Server: `api/push/handler.js` (`lesson-open`, `lesson-notify`).

## Making or changing a deck
```
lessons-src/
  engine/          head.html + foot.html: the shared look, navigation, quiz, 3D crystals
  decks/<slug>/    deck.json (course, syllabus day, title) + scenes.html
                   media-src/  images taken from the original PowerPoint (not in git)
  dist/            built single-file decks (not in git)
```
1. `python3 lessons-src/build.py <slug>` (or `--all`). Images are resized and inlined, so
   each deck is one self-contained file. Open `dist/<slug>.html` in Chrome to check it;
   add `?all` to the address to show every hidden card at once.
2. Publish: `python3 lessons-src/upload.py <slug> --env <file with SUPABASE_URL and
   SUPABASE_SERVICE_ROLE_KEY>`. It uploads `<slug>-v<N>.html` and creates or bumps the
   `lesson_decks` row, so laptops holding an old copy fetch the new one. The service key
   is not available from `vercel env pull` (it is a secret); take it from the Supabase
   dashboard → Project settings → API, use it once, and delete the file.

Keys inside a deck: → / clicker reveal and advance, ← back, M sections, F full screen,
P laser, Esc / ✕ Exit returns to the portal.

## Published (2026-10-15)
| Course | Day | Deck | Source PowerPoint |
|---|---|---|---|
| Diamond Graduate | 1 | The Evolution of Diamonds (43 slides) | 1 new evolution of diamonds version 1.1.pptx |
| Diamond Graduate | 2 | Morphology of Rough (37 slides) | 05-Rough Morphology new.pptx |
| Diamond Graduate | 4 | Rough Diamond Sorting (24 slides) | 07-Rough Sorting new.pptx |

## Published (2026-10-17)
Sources: `7 Weeks DG` WeTransfer folder, mapped by topic to the 30-day portal syllabus.

| Day | Part | Slug | Deck |
|---|---|---|---|
| 3 | 1 | dg-origin-of-rough | Origin of Rough |
| 3 | 2 | dg-rough-trading | The Rough Diamond Trade |
| 6 | 1 | dg-clarity-inclusions | Clarity I · Inclusions & Blemishes |
| 7 | 1 | dg-clarity-grading | Clarity II · Grades & Plotting |
| 8 | 1 | dg-colour-grading | Colour Grading |
| 11 | 1 | dg-measurements | Measurements & Carat Weight |
| 12 | 1 | dg-proportions | Estimating Proportions |
| 13 | 1 | dg-cut-finish | Cut & Finish Grades |
| 16 | 1 | dg-fancy-shapes | Fancy Shapes (from Fancy Shapes.pdf) |
| 17 | 1 | dg-treatments | Colour & Clarity Treatments |
| 18 | 1 | dg-synthetics-imitations | Lab-Grown Diamonds & Imitations |
| 19 | 1 | dg-pricing | Diamond Pricing |
| 19 | 2 | dg-jewellery-business | Jewelry Business Essentials (full IGI masterclass, bundled from IGI-LGD-Masterclass with `bundle_html.py`) |
| 21 | 1 | dg-assortment | Small Diamond Assortment |
| 23 | 1 | dg-mounted-jewellery | Grading Mounted Jewellery |
| 23 | 2 | dg-settings | Settings in Jewellery |
| 23 | 3 | dg-metal-qa | IGI Metal Quality Assurance |


Full-day (3-week) batches use the same decks: the portal pairs syllabus days (Day N = syllabus 2N-1, 2N).
External HTML courses: `python3 lessons-src/bundle_html.py <course.html> <slug>` packs media/ and fonts/ into one file for the portal.

## January 2027 schedules (applied 2026-10-17)
DG and CSG batches starting on or after 2027-01-01 follow the plans in "7 Weeks & 3 Weeks GG Schedule.xlsx":
Full Day -> "<course> (3 Weeks)" (18 days, Mon-Sat), any other type -> "<course> (7 Weeks)" (35 days, Mon-Fri),
one syllabus day per session. Older batches keep the 30-day syllabus. The rule lives in three places that must
match: `syllabusKeyFor` in assets/shared.js and api/_lib/syllabi.cjs, and `lesson_syllabus_key()` in the database
(supabase/migrations/migration_lesson_syllabus_2027.sql, which also adds the deck rows for both DG plans).
The plan rows point at the same published files; `upload.py` moves every row sharing a file when a deck is republished.

## Colored Stone Graduate decks (published 2026-10-17)
Sources: `wetransfer_a-introdouction-crystallography-pptx` (CSG PowerPoints, extracted to `dist/_extract/csg/`), plus photos from the IGI Coloured Stone Masterclass in `shared-media/` (credited on the slides). Files: `lesson-decks/colored-stone-graduate/<slug>-v1.html`.

| Slug | Deck | 30-day (6 weeks) | 7 Weeks | 3 Weeks |
|---|---|---|---|---|
| csg-intro (v2) | Introduction to Gemology (crystal-system slides moved out) | 1.1 | 1.1 | 1.1 |
| csg-crystallography-1 | Crystallography Part 1 · structure and the seven systems (3D) | 1.2 | 1.2 | 1.2 |
| csg-crystallography-2 | Crystallography Part 2 · symmetry, habit, gallery, bench (3D) | 1.3 | 2.1 | 1.3 |
| csg-properties | Properties of Gemstones | 2.1 | 2.2 | 1.4 |
| csg-refractometer | The Refractometer | 2.2 | 3.1 | 2.1 |
| csg-polariscope | The Polariscope | 2.3 | 3.2 | 2.2 |
| csg-dichroscope | The Dichroscope | 3.1 | 4.1 | 2.3 |
| csg-spectroscope | The Spectroscope | 3.2 | 4.3 | 2.5 |
| csg-luminescence | Luminescence & UV | 4.2 | 4.2 | 2.4 |
| csg-microscope | The Microscope & Inclusions | 4.1, 6.1 | 5.1 | 3.1 |
| csg-corundum | Corundum: Ruby & Sapphire | 7.1 | 7.1 | 5.1 |
| csg-emerald | Emerald | 9.1 | 9.1 | 6.1 |
| csg-synthetics | Synthetic Production Methods | 11.1 | 13.1 | 8.1 |
| csg-treatments | Treatments in Gemstones | 12.1 | 11.1 | 7.1 |
| csg-sr | Singly Refractive Gemstones (Group I) | 14.1 | 16.1 | 9.1 |
| csg-uniaxial-1 | Uniaxial Gemstones 1 (Group II) | 16.1 | 18.1 | 10.1 |
| csg-uniaxial-2 | Uniaxial Gemstones 2 · Quartz | 16.2 | 18.2 | 10.2 |
| csg-biaxial-1 | Biaxial Gemstones 1 (Group III) | 18.1 | 21.1 | 11.1 |
| csg-biaxial-2 | Biaxial Gemstones 2 | 18.2 | 21.2 | 11.2 |
| csg-organics-1 | Organic Gemstones 1 · Pearl | 21.1 | 23.1, 31.1 | 13.1, 16.1 |
| csg-organics-2 | Organic Gemstones 2 | 21.2 | 23.2 | 13.2 |
| csg-pricing | Gemstone Value Factors | 22.1 | 34.1 | 17.1 |

Day.part numbers are portal syllabus days. Media for each deck is copied into `decks/<slug>/media-src/` from the extract (only files the deck uses).

## World gem map (globe-src/)

`python3 globe-src/make_globe.py` injects the interactive gem-origin globe into the CSG decks:
the full map (plus the look-alike, "Which one is the ruby?" and inclusion-fingerprint slides) in
`csg-intro`, and a filtered "Where it's found" slide in Corundum, Emerald, SR, Uniaxial 1–2,
Biaxial 1–2 and Organics 1–2. Edit localities, origin clues and chapter days in
`globe-src/gemdata.json`, then re-run the script and `build.py`. Re-running is safe (sections are
replaced by id). Libraries in `globe-src/libs/`: d3-array, d3-geo, topojson-client (ISC) and
world-atlas countries-50m/110m (ISC; Natural Earth, public domain). The inclusion photos
(`inc-*.jpg`) are copies of course photos placed in `shared-media/`.

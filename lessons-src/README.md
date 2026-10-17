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
| 17 | 1 | dg-treatments | Colour & Clarity Treatments |
| 18 | 1 | dg-synthetics-imitations | Lab-Grown Diamonds & Imitations |
| 19 | 1 | dg-pricing | Diamond Pricing |
| 19 | 2 | dg-jewellery-business | Jewellery Business Essentials |
| 21 | 1 | dg-assortment | Small Diamond Assortment |
| 23 | 1 | dg-mounted-jewellery | Grading Mounted Jewellery |
| 23 | 2 | dg-settings | Settings in Jewellery |
| 23 | 3 | dg-metal-qa | IGI Metal Quality Assurance |

Not built: Day 16 Fancy Shapes (source .ppt is password-protected; resave unlocked as .pptx).

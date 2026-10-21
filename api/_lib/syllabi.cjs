// Syllabus data for auto day-progression in the session-creation cron.
// Source of truth for course content is instructor-portal.html (const SYLLABI).
// If the syllabus there changes, mirror the change here too.

const SYLLABI = {
  'Diamond Graduate': [
    {day:1,  week:'Week 1', topic:'General Information, Introduction, IGI A/V, Mining Process, Crystallography'},
    {day:2,  week:'Week 1', topic:'Morphology of Rough — Lecture + Lab'},
    {day:3,  week:'Week 1', topic:'Rough to Polish, Origin of Rough'},
    {day:4,  week:'Week 1', topic:'Sorting'},
    {day:5,  week:'Week 1', topic:'Factory Visit'},
    {day:6,  week:'Week 2', topic:'Instruments & Lighting Techniques, Inclusions & Blemishes'},
    {day:7,  week:'Week 2', topic:'Clarity Grade Definitions with Plotting'},
    {day:8,  week:'Week 2', topic:'Color'},
    {day:9,  week:'Week 2', topic:'Lab on Color'},
    {day:10, week:'Week 2', topic:'Weekly Test – Clarity & Color'},
    {day:11, week:'Week 3', topic:'Measurements, Weight Estimation, Table Size, Crown Angle'},
    {day:12, week:'Week 3', topic:'Crown Height %, Pavilion Depth %, Girdle & Culet'},
    {day:13, week:'Week 3', topic:'Proportions, Polish & Symmetry'},
    {day:14, week:'Week 3', topic:'Lab Practice'},
    {day:15, week:'Week 3', topic:'Weekly Test – 4Cs'},
    {day:16, week:'Week 4', topic:'Fancy Shapes'},
    {day:17, week:'Week 4', topic:'Color & Clarity Treatments'},
    {day:18, week:'Week 4', topic:'Imitations and Synthetics'},
    {day:19, week:'Week 4', topic:'Pricing'},
    {day:20, week:'Week 4', topic:'Weekly Test – Full Stones'},
    {day:21, week:'Week 5', topic:'Sieving & Gauging, Clarity Sorting of Stars & Melees'},
    {day:22, week:'Week 5', topic:'Color Sorting of Stars & Melees'},
    {day:23, week:'Week 5', topic:'Mounted Jewelry'},
    {day:24, week:'Week 5', topic:'Lab on Mounted Jewelry'},
    {day:25, week:'Week 5', topic:'Weekly Test – Full Stones'},
    {day:26, week:'Week 6', topic:'Lab on Mounted Jewelry'},
    {day:27, week:'Week 6', topic:'Full Stones (Round + Fancy)'},
    {day:28, week:'Week 6', topic:'Final Test – Color & Clarity Sorting'},
    {day:29, week:'Week 6', topic:'Final Test – 4 Stone Challenge'},
    {day:30, week:'Week 6', topic:'Re-Test, Instructor Review & Diploma Distribution'}
  ],

  /* From January 2027 (batches starting on or after 2027-01-01), from Sunil's sheet
     "7 Weeks & 3 Weeks GG Schedule.xlsx": Half Day batches run the 7-week plan (35 days,
     Mon-Fri), Full Day batches the 3-week plan (18 days, Mon-Sat), one day per session.
     Older batches keep the 30-day syllabus above. Mirrored in api/_lib/syllabi.cjs. */
  'Diamond Graduate (7 Weeks)': [
    {day:1,  week:'Week 1', topic:'Evolution of Diamonds'},
    {day:2,  week:'Week 1', topic:'Mines to Market (Diamond Manufacturing)'},
    {day:3,  week:'Week 1', topic:'Morphology'},
    {day:4,  week:'Week 1', topic:'Rough Diamond Sorting & Trading'},
    {day:5,  week:'Week 1', topic:'Origin Identification'},
    {day:6,  week:'Week 2', topic:'Clarity Grading (Inclusions & Blemishes)'},
    {day:7,  week:'Week 2', topic:'Clarity Grading (Grades & Plotting)'},
    {day:8,  week:'Week 2', topic:'Color Grading & Fluorescence'},
    {day:9,  week:'Week 2', topic:'Carat Weight, Girdle Thickness & Culet Condition'},
    {day:10, week:'Week 2', topic:'Crown Angle, Table Size, Crown Height & Pavilion Depth'},
    {day:11, week:'Week 3', topic:'Polish & Symmetry Grading'},
    {day:12, week:'Week 3', topic:'Proportion Grade, Understanding Hearts & Arrows & Light Performance'},
    {day:13, week:'Week 3', topic:'Polished Diamond Practice Session (1 of 4)'},
    {day:14, week:'Week 3', topic:'Polished Diamond Practice Session (2 of 4)'},
    {day:15, week:'Week 3', topic:'Week 1, 2 & 3 - Theory Test and Practice Session'},
    {day:16, week:'Week 4', topic:'Polished Diamond Practice Session (3 of 4)'},
    {day:17, week:'Week 4', topic:'Polished Diamond Practice Session (4 of 4)'},
    {day:18, week:'Week 4', topic:'Fancy Shapes Theory'},
    {day:19, week:'Week 4', topic:'Fancy Shapes Practical'},
    {day:20, week:'Week 4', topic:'Week 1, 2, 3 & 4 - Theory Test and Practice Session'},
    {day:21, week:'Week 5', topic:'Clarity & Color Treatments'},
    {day:22, week:'Week 5', topic:'Synthetics Identification'},
    {day:23, week:'Week 5', topic:'Imitations Identification'},
    {day:24, week:'Week 5', topic:'Pricing Evaluation'},
    {day:25, week:'Week 5', topic:'Week 1, 2, 3, 4 & 5 - Theory Test and PDG Practical Test'},
    {day:26, week:'Week 6', topic:'Small Diamond Assortment (Clarity)'},
    {day:27, week:'Week 6', topic:'Small Diamond Assortment (Color)'},
    {day:28, week:'Week 6', topic:'Small Diamond Assortment (Clarity & Color)'},
    {day:29, week:'Week 6', topic:'Mounted Jewelry Grading, Weight Estimation'},
    {day:30, week:'Week 6', topic:'Mounted Jewelry Grading and SDA Practical & Theory Test'},
    {day:31, week:'Week 7', topic:'Final Theory Test & Final Practice Session'},
    {day:32, week:'Week 7', topic:'Final Practical Test (4 Stone Challenge 3R+1I)'},
    {day:33, week:'Week 7', topic:'Jewelry Business Essentials'},
    {day:34, week:'Week 7', topic:'Stone Setting & Metal QC'},
    {day:35, week:'Week 7', topic:'Diploma Distribution Ceremony / Re-Test'}
  ],
  'Colored Stone Graduate (7 Weeks)': [
    {day:1,  week:'Week 1', topic:'Introduction to Gemology'},
    {day:2,  week:'Week 1', topic:'Physical & Optical Properties'},
    {day:3,  week:'Week 1', topic:'Instrumentation (Refractometer & Polariscope)'},
    {day:4,  week:'Week 1', topic:'Instrumentation (Dichroscope, UV Light & SG Kit)'},
    {day:5,  week:'Week 1', topic:'Instrumentation (Microscope & Inclusions)'},
    {day:6,  week:'Week 2', topic:'Instruments Practice & Week 1 - Theory Test'},
    {day:7,  week:'Week 2', topic:'Corundum (Theory)'},
    {day:8,  week:'Week 2', topic:'Corundum (Practical)'},
    {day:9,  week:'Week 2', topic:'Beryl (Theory)'},
    {day:10, week:'Week 2', topic:'Beryl (Practical)'},
    {day:11, week:'Week 3', topic:'Treatments (Theory)'},
    {day:12, week:'Week 3', topic:'Treatments (Practical)'},
    {day:13, week:'Week 3', topic:'Synthetics (Theory)'},
    {day:14, week:'Week 3', topic:'Synthetics (Practical)'},
    {day:15, week:'Week 3', topic:'Week 1, 2 & 3 - Theory Test and IRES Practical Test'},
    {day:16, week:'Week 4', topic:'Group I (Theory)'},
    {day:17, week:'Week 4', topic:'Group I (Practical)'},
    {day:18, week:'Week 4', topic:'Group II (Theory)'},
    {day:19, week:'Week 4', topic:'Group II (Practical) (1 of 2)'},
    {day:20, week:'Week 4', topic:'Group II (Practical) (2 of 2)'},
    {day:21, week:'Week 5', topic:'Group III (Theory)'},
    {day:22, week:'Week 5', topic:'Group III (Practical)'},
    {day:23, week:'Week 5', topic:'Organics Gemstones (Theory)'},
    {day:24, week:'Week 5', topic:'Organics Gemstones (Practical)'},
    {day:25, week:'Week 5', topic:'Week 1, 2, 3, 4 & 5 - Theory Test'},
    {day:26, week:'Week 6', topic:'Mixed Stones Practice (1 of 4)'},
    {day:27, week:'Week 6', topic:'Mixed Stones Practice (2 of 4)'},
    {day:28, week:'Week 6', topic:'Mixed Stones Practice (3 of 4)'},
    {day:29, week:'Week 6', topic:'Mixed Stones Practice (4 of 4)'},
    {day:30, week:'Week 6', topic:'Final Theory & Practical Test (10 Stones Challenge 6C+4PC/O)'},
    {day:31, week:'Week 7', topic:'Pearl Grading (Theory) (1 of 2)'},
    {day:32, week:'Week 7', topic:'Pearl Grading (Theory) (2 of 2)'},
    {day:33, week:'Week 7', topic:'Pearl Grading (Practical)'},
    {day:34, week:'Week 7', topic:'Gem Stones Pricing & Navratna Terminology'},
    {day:35, week:'Week 7', topic:'Diploma Distribution Ceremony / Re-Test'}
  ],
  'Diamond Graduate (3 Weeks)': [
    {day:1,  week:'Week 1', topic:'Evolution of Diamonds, Mines to Market (Diamond Manufacturing)'},
    {day:2,  week:'Week 1', topic:'Morphology, Rough Diamond Sorting & Trading'},
    {day:3,  week:'Week 1', topic:'Clarity Grading (Inclusions, Blemishes, Grades & Plotting)'},
    {day:4,  week:'Week 1', topic:'Color Grading & Fluorescence, Carat Weight & Girdle Thickness'},
    {day:5,  week:'Week 1', topic:'Crown Angle, Table Size, Crown Height, Pavilion Depth & Culet Condition'},
    {day:6,  week:'Week 1', topic:'Polish Grading, Symmetry Grading, Proportion Grade, Understanding Hearts & Arrows'},
    {day:7,  week:'Week 2', topic:'Polished Diamond Practice Session (1 of 2)'},
    {day:8,  week:'Week 2', topic:'Polished Diamond Practice Session (2 of 2)'},
    {day:9,  week:'Week 2', topic:'Week 1 Theory Test and Practice Session'},
    {day:10, week:'Week 2', topic:'Fancy Shapes Theory & Practical'},
    {day:11, week:'Week 2', topic:'Clarity & Color Treatments and Synthetics & Imitations Identification'},
    {day:12, week:'Week 2', topic:'Pricing Evaluation and Week 1 & 2 Theory Test'},
    {day:13, week:'Week 3', topic:'Final Practice Session & Final Practical Test (4 Stone Challenge 3R+1I)'},
    {day:14, week:'Week 3', topic:'Small Diamond Assortment (Clarity & Color)'},
    {day:15, week:'Week 3', topic:'Final Theory Test and Small Diamond Assortment (Clarity & Color)'},
    {day:16, week:'Week 3', topic:'Mounted Jewelry Grading & Weight Estimation'},
    {day:17, week:'Week 3', topic:'Jewelry Business Essentials, Stone Setting & Metal QC'},
    {day:18, week:'Week 3', topic:'Diploma Distribution Ceremony / Re-Test'}
  ],
  'Colored Stone Graduate (3 Weeks)': [
    {day:1,  week:'Week 1', topic:'Introduction to Gemology, Physical & Optical Properties'},
    {day:2,  week:'Week 1', topic:'Instrumentation (Refractometer, Polariscope, Dichroscope, UV Light & SG Kit)'},
    {day:3,  week:'Week 1', topic:'Instrumentation (Microscope & Inclusions) & Instruments Practice'},
    {day:4,  week:'Week 1', topic:'Instruments Practice & Week 1 - Theory Test'},
    {day:5,  week:'Week 1', topic:'Corundum (Theory & Practical)'},
    {day:6,  week:'Week 1', topic:'Beryl (Theory & Practical)'},
    {day:7,  week:'Week 2', topic:'Week 1 Theory Test & Treatments (Theory & Practical)'},
    {day:8,  week:'Week 2', topic:'Synthetics (Theory & Practical)'},
    {day:9,  week:'Week 2', topic:'Group I (Theory & Practical)'},
    {day:10, week:'Week 2', topic:'Group II (Theory & Practical)'},
    {day:11, week:'Week 2', topic:'Group III (Theory & Practical)'},
    {day:12, week:'Week 2', topic:'Group I, II, III Practicals and Week 1 & 2 Theory Test'},
    {day:13, week:'Week 3', topic:'Organics Gemstones (Theory & Practical)'},
    {day:14, week:'Week 3', topic:'Mixed Stones Practice'},
    {day:15, week:'Week 3', topic:'Final Theory Test, Final Practice Session & Practical Test (10 Stones Challenge 6C+4PC/O)'},
    {day:16, week:'Week 3', topic:'Pearl Grading (Theory)'},
    {day:17, week:'Week 3', topic:'Pearl Grading (Practical), Gem Stones Pricing & Navratna Terminology'},
    {day:18, week:'Week 3', topic:'Diploma Distribution Ceremony / Re-Test'}
  ],

  /* Revised 2026-09-28 from the official instructor attendance sheet F/ED-60
     ("6 Weeks - Colored Stone Graduate Course", Rev 00). 30 days over 6 weeks,
     105 hours. The portal's previous version was a different course in several
     places: it had a factory visit on day 5 where the sheet has a theory test,
     ran corundum before inclusions, and placed the final test on day 28 when the
     sheet puts it on day 29 with the re-test on day 30.

     Theory tests fall on days 5, 10, 15, 20 and 25. Diploma eligibility takes the
     best three weekly scores, so five test days is not a problem.

     Mirrored in api/_lib/syllabi.cjs — change both together. */
  'Colored Stone Graduate': [
    {day:1,  week:'Week 1', topic:'Introduction to Gemology, Mineralogy & Crystallography, Qualifying Factors, Process of Identification, General Observation'},
    {day:2,  week:'Week 1', topic:'Instrumentation: Refractometer, Polariscope, Lab Session'},
    {day:3,  week:'Week 1', topic:'Instrumentation: Dichroscope, Spectroscope, Lab Session'},
    {day:4,  week:'Week 1', topic:'Instrumentation: Specific Gravity Machine, Microscope, Lab Session'},
    {day:5,  week:'Week 1', topic:'Theory Test, Lab Session'},
    {day:6,  week:'Week 2', topic:'Inclusions: Natural & Synthetic Inclusions, Lab Session'},
    {day:7,  week:'Week 2', topic:'Corundum: Ruby & Sapphire, Chemical & Optical Properties, Natural & Synthetic Inclusions, Lab Session'},
    {day:8,  week:'Week 2', topic:'Lab Session'},
    {day:9,  week:'Week 2', topic:'Emerald (Beryl): Chemical & Optical Properties, Natural & Synthetic Inclusions, Lab Session'},
    {day:10, week:'Week 2', topic:'Theory Test, Lab Session'},
    {day:11, week:'Week 3', topic:'Synthetics: Synthetic Processes, Synthetic Inclusions, Lab Session'},
    {day:12, week:'Week 3', topic:'Treatments: Types of Treatment, Identification Methods, Lab Session'},
    {day:13, week:'Week 3', topic:'Lab Session'},
    {day:14, week:'Week 3', topic:'Fine Gemstones Group 1: Singly Refractive Stones, Chemical & Optical Properties, Lab Session'},
    {day:15, week:'Week 3', topic:'Theory Test, Lab Session'},
    {day:16, week:'Week 4', topic:'Fine Gemstones Group 2: Doubly Refractive (Uniaxial), Chemical & Optical Properties, Lab Session'},
    {day:17, week:'Week 4', topic:'Lab Session'},
    {day:18, week:'Week 4', topic:'Fine Gemstones Group 3: Doubly Refractive (Biaxial), Chemical & Optical Properties, Lab Session'},
    {day:19, week:'Week 4', topic:'Lab Session'},
    {day:20, week:'Week 4', topic:'Theory Test, Lab Session'},
    {day:21, week:'Week 5', topic:'Organic Gemstones: Natural & Cultured Pearls, Other Organic Gemstones, Chemical & Optical Properties, Lab Session'},
    {day:22, week:'Week 5', topic:'Pricing, Lab Session'},
    {day:23, week:'Week 5', topic:'Lab Session'},
    {day:24, week:'Week 5', topic:'Lab Session'},
    {day:25, week:'Week 5', topic:'Theory Test, Lab Session'},
    {day:26, week:'Week 6', topic:'Lab Session'},
    {day:27, week:'Week 6', topic:'Lab Session'},
    {day:28, week:'Week 6', topic:'Lab Session'},
    {day:29, week:'Week 6', topic:'Final Test: 5 Stones Practical Test, Theory Test'},
    {day:30, week:'Week 6', topic:'Re-Test'}
  ],

  /* Revised 2026-09-28: 10 days to 15, per instruction — "update PDG schedule from
     10 Day sessions to 15 days sessions by copying 2nd, 3rd & 4th week topics from
     DG courses schedule". PDG is polished-only, so it skips DG week 1 (mining,
     rough morphology, sorting, factory visit) and picks the course up at clarity.

     Days 1-14 are DG days 6-19 verbatim. Day 15 is NOT DG day 20 — a literal copy
     would end the course on a weekly test and lose the final exam, the 3 Stone
     Challenge and the diploma distribution that the old 10-day day 10 carried,
     which would break diploma eligibility outright since a Final is required. Day
     15 therefore carries the final, confirmed by Sunil 2026-09-28.

     Weekly tests land on days 5 and 10, which matches the two-weekly-test rule PDG
     already has in weeklyTestsRequired — nothing else needs changing.

     Mirrored in api/_lib/syllabi.cjs — change both together. */
  'Polished Diamond Grading': [
    {day:1,  week:'Week 1', topic:'Instruments & Lighting Techniques, Inclusions & Blemishes'},
    {day:2,  week:'Week 1', topic:'Clarity Grade Definitions with Plotting'},
    {day:3,  week:'Week 1', topic:'Color'},
    {day:4,  week:'Week 1', topic:'Lab on Color'},
    {day:5,  week:'Week 1', topic:'Weekly Test - Clarity & Color (Theory 20 Questions, Lab 3 Stones)'},
    {day:6,  week:'Week 2', topic:'Measurements, Weight Estimation, Table Size, Crown Angle'},
    {day:7,  week:'Week 2', topic:'Crown Height %, Pavilion Depth %, Girdle & Culet'},
    {day:8,  week:'Week 2', topic:'Proportions, Polish & Symmetry'},
    {day:9,  week:'Week 2', topic:'Lab Practice'},
    {day:10, week:'Week 2', topic:'Weekly Test - 4Cs (Theory 20 Questions, Lab 3 Stones)'},
    {day:11, week:'Week 3', topic:'Fancy Shapes'},
    {day:12, week:'Week 3', topic:'Color & Clarity Treatments'},
    {day:13, week:'Week 3', topic:'Imitations and Synthetics'},
    {day:14, week:'Week 3', topic:'Pricing'},
    {day:15, week:'Week 3', topic:'Final Test - 3 Stone Challenge & Theory Test, Instructor Review, Diploma Distribution'}
  ],

  'Jewelry Design': [
    {day:1,  week:'Week 1', topic:'Introduction, Distribution of Kit, Cuts in Gemstones, Parts & Shapes of Gemstones, Basic Guide, Drawing – Round Brilliant Cut'},
    {day:2,  week:'Week 1', topic:'Drawing of Gemstones: Oval, Marquise, Pear, Heart, Princess, Baguette, Emerald Cuts'},
    {day:3,  week:'Week 1', topic:'Introduction to Diamonds, Reflection of Light, Gray Scale (Pencil & Colors)'},
    {day:4,  week:'Week 1', topic:'Color Pencil Shading of Faceted Gemstones'},
    {day:5,  week:'Week 1', topic:'Introduction to Colored Stones, Illustration of Cabochons, Color Shading of Cabochons'},
    {day:6,  week:'Week 2', topic:'Illustration of Precious & Semi-Precious Gemstones, Practice Session'},
    {day:7,  week:'Week 2', topic:'Introduction to Sieve Plates, Stars, Melee & Solitaires, Illustration of Beads, Rosecut & Uncut'},
    {day:8,  week:'Week 2', topic:'Test'},
    {day:9,  week:'Week 2', topic:'Introduction to Metals, Color Pencil Shading of Metals'},
    {day:10, week:'Week 2', topic:'Assignments'},
    {day:11, week:'Week 3', topic:'Introduction to Settings, Practice Session'},
    {day:12, week:'Week 3', topic:'Inspiration, Principles & Elements of Design, Motif Study, Freehand Drawing'},
    {day:13, week:'Week 3', topic:'Types of Jewelry, Final Illustration Using Motifs'},
    {day:14, week:'Week 3', topic:'Illustration of Pendant'},
    {day:15, week:'Week 3', topic:'Pendant Assignment'},
    {day:16, week:'Week 4', topic:'Illustration of Earring'},
    {day:17, week:'Week 4', topic:'Earring Assignment'},
    {day:18, week:'Week 4', topic:'Illustration of Necklace'},
    {day:19, week:'Week 4', topic:'Necklace Assignment'},
    {day:20, week:'Week 4', topic:'Illustration of Bracelet'},
    {day:21, week:'Week 5', topic:'Bracelet Assignment'},
    {day:22, week:'Week 5', topic:'Illustration of Ring'},
    {day:23, week:'Week 5', topic:'Ring Assignment'},
    {day:24, week:'Week 5', topic:'Illustration of Bangle'},
    {day:25, week:'Week 5', topic:'Bangle Assignment'},
    {day:26, week:'Week 6', topic:'Pricing of Diamonds, Pricing of Color Stones, Gold Calculation'},
    {day:27, week:'Week 6', topic:'Budgeting'},
    {day:28, week:'Week 6', topic:'Framing of Designs, Portfolio Discussion'},
    {day:29, week:'Week 6', topic:'Client & Designer Class'},
    {day:30, week:'Week 6', topic:'Test'},
    {day:31, week:'Week 7', topic:'Portfolio Work'},
    {day:32, week:'Week 7', topic:'Portfolio Work'},
    {day:33, week:'Week 7', topic:'Portfolio Work'},
    {day:34, week:'Week 7', topic:'Portfolio Work'},
    {day:35, week:'Week 7', topic:'Portfolio Work'},
    {day:36, week:'Week 8', topic:'Portfolio Work'},
    {day:37, week:'Week 8', topic:'Portfolio Work'},
    {day:38, week:'Week 8', topic:'Final Test'},
    {day:39, week:'Week 8', topic:'Re-Test'},
    {day:40, week:'Week 8', topic:'Graduation'}
  ],

  /* Revised 2026-09-28 from Sneha's "Manual Course structure2026.xlsx"
     (sheet "revised JD Course"). 40 days over 8 weeks, unchanged in length;
     the week themes and most day topics are new. Transcribed verbatim from
     that sheet apart from whitespace tidying.

     Mirrored in api/_lib/syllabi.cjs — change both together. Past sessions
     keep the topic text recorded on them at the time, so this does not
     rewrite what an earlier batch was actually taught. */
  'Jewelry Design Manual': [
    {day:1,  week:'Week 1: Introduction & Diamond Basics', topic:'Introduction to Jewelry Design, Drawing Tools & Basic Diamond Shapes'},
    {day:2,  week:'Week 1: Introduction & Diamond Basics', topic:'Drawing Fancy Shape Diamonds & Understanding Facets'},
    {day:3,  week:'Week 1: Introduction & Diamond Basics', topic:'Introduction to Diamonds & Rendering'},
    {day:4,  week:'Week 1: Introduction & Diamond Basics', topic:'Fancy Shape Diamond Rendering'},
    {day:5,  week:'Week 1: Introduction & Diamond Basics', topic:'Design Creation on Colorless Diamond, Render design & Week 1 Assignment'},
    {day:6,  week:'Week 2: Diamond & Gemstone Rendering', topic:'Introduction to Gemstones & Rendering'},
    {day:7,  week:'Week 2: Diamond & Gemstone Rendering', topic:'Colored Rendering Techniques on Faceted Gemstones'},
    {day:8,  week:'Week 2: Diamond & Gemstone Rendering', topic:'Non-Faceted Gemstones: Illustration & Rendering'},
    {day:9,  week:'Week 2: Diamond & Gemstone Rendering', topic:'Colored Gemstone Design Creation & Rendering'},
    {day:10, week:'Week 2: Diamond & Gemstone Rendering', topic:'Colored Gemstone Design Creation & Rendering & Week 2 Assignment'},
    {day:11, week:'Week 3: Diamond Setting & Rendering Techniques', topic:'Introduction to Stars, Melee & Solitaire Diamonds'},
    {day:12, week:'Week 3: Diamond Setting & Rendering Techniques', topic:'Create a Design & Render using Stars / Melee / Solitaire Diamonds'},
    {day:13, week:'Week 3: Diamond Setting & Rendering Techniques', topic:'Metal & Texture Rendering on Different Forms'},
    {day:14, week:'Week 3: Diamond Setting & Rendering Techniques', topic:'Texture Rendering on Different Forms'},
    {day:15, week:'Week 3: Diamond Setting & Rendering Techniques', topic:'Factory Visit'},
    {day:16, week:'Week 4: Design Concepts & Motif Development', topic:'Introduction to all types of Setting & Illustrate'},
    {day:17, week:'Week 4: Design Concepts & Motif Development', topic:'Functional Aspects in Jewelry & Render a bracelet design'},
    {day:18, week:'Week 4: Design Concepts & Motif Development', topic:'Inspiration + Principles & Elements of Design'},
    {day:19, week:'Week 4: Design Concepts & Motif Development', topic:'Motif Development & Rendering'},
    {day:20, week:'Week 4: Design Concepts & Motif Development', topic:'Types of Jewelry & Description, Design Creation on Earring Category'},
    {day:21, week:'Week 5: Types of Jewelry', topic:'Rendering Earring Design'},
    {day:22, week:'Week 5: Types of Jewelry', topic:'Description on Pendant Category & Design Creation'},
    {day:23, week:'Week 5: Types of Jewelry', topic:'Rendering the Pendant Design'},
    {day:24, week:'Week 5: Types of Jewelry', topic:'Description on Ring Category & Design Creation'},
    {day:25, week:'Week 5: Types of Jewelry', topic:'Rendering the Ring Category'},
    {day:26, week:'Week 6: Category wise Jewelry Designing', topic:'Description on Bangle & Bracelet Category'},
    {day:27, week:'Week 6: Category wise Jewelry Designing', topic:'Rendering the Bangle & Bracelet Category'},
    {day:28, week:'Week 6: Category wise Jewelry Designing', topic:'Description on Necklace Category & Design Creation'},
    {day:29, week:'Week 6: Category wise Jewelry Designing', topic:'Rendering the Necklace Category'},
    {day:30, week:'Week 6: Category wise Jewelry Designing', topic:'Rendering the Necklace Category (contd.)'},
    {day:31, week:'Week 7: Calculations & Budgeting', topic:'Gold Purity & Karat Calculations'},
    {day:32, week:'Week 7: Calculations & Budgeting', topic:'Diamond & Gemstone Pricing'},
    {day:33, week:'Week 7: Calculations & Budgeting', topic:'Budgeting & Jewelry Costing'},
    {day:34, week:'Week 7: Calculations & Budgeting', topic:'Jewelry Estimation Test'},
    {day:35, week:'Week 7: Calculations & Budgeting', topic:'Clean & maintenance of jewelry, Design Creation & Render'},
    {day:36, week:'Week 8: Bridal Heritage Collection & Portfolio', topic:'Bridal Heritage Necklace Design Creation'},
    {day:37, week:'Week 8: Bridal Heritage Collection & Portfolio', topic:'Bridal Heritage Jewelry Necklace Design Rendering'},
    {day:38, week:'Week 8: Bridal Heritage Collection & Portfolio', topic:'Bridal Heritage Earrings & Accessories Design'},
    {day:39, week:'Week 8: Bridal Heritage Collection & Portfolio', topic:'Bridal Heritage Collection Rendering'},
    {day:40, week:'Week 8: Bridal Heritage Collection & Portfolio', topic:'Portfolio Completion'}
  ],

  'Gem-A Foundation': [
    {day:1,  week:'Block 1', topic:'Ch 1 – What is Gemmology? Attributes of a Gemstone, Key Definitions'},
    {day:2,  week:'Block 1', topic:'Ch 1 – Gemmological Practice, Instrument Kit, Intro to the Trade'},
    {day:3,  week:'Block 1', topic:'Ch 2 – Visual Characteristics: Colour, Lustre, Transparency, Shape, Cut'},
    {day:4,  week:'Block 1', topic:'Ch 2 – External & Internal Features, Reporting Observations, Loupe & Microscope'},
    {day:5,  week:'Block 1', topic:'Ch 2 – Practical: Observation & Reporting Lab'},
    {day:6,  week:'Block 1', topic:'Ch 3 – Chemistry of Gems: Elements, Atoms, Chemical Classification'},
    {day:7,  week:'Block 1', topic:'Ch 3 – Crystal Systems, Crystallographic Axes, Symmetry'},
    {day:8,  week:'Block 1', topic:'Ch 3 – Crystal Forms, Habits, Surface Features, Twinning'},
    {day:9,  week:'Block 1', topic:'Ch 3 – Practical: Crystal Observation Lab'},
    {day:10, week:'Block 1', topic:'Ch 4 – Durability: Hardness, Mohs Scale, Toughness, Stability'},
    {day:11, week:'Block 1', topic:'Ch 4 – Practical: Durability Applications, Care & Storage'},
    {day:12, week:'Block 1', topic:'Block 1 Revision – Ch 1–4 Review'},
    {day:13, week:'Block 1', topic:'Block 1 Revision – Practical Instrument Endorsement: Crystal Observation, Loupe'},
    {day:14, week:'Block 1', topic:'Block 1 Revision – Instrument Endorsement: Refractometer, Polariscope'},
    {day:15, week:'Block 1', topic:'Block 1 Online Assessment'},
    {day:16, week:'Block 2', topic:'Ch 5 – Weight & Price, Carat, Weighing Loose Stones'},
    {day:17, week:'Block 2', topic:'Ch 5 – Density & Specific Gravity, Weight Estimation of Mounted Stones'},
    {day:18, week:'Block 2', topic:'Ch 5 – Practical: Weight Estimation Formulae Lab'},
    {day:19, week:'Block 2', topic:'Ch 6 – Light Energy, Electromagnetic Spectrum, Reflection & Refraction'},
    {day:20, week:'Block 2', topic:'Ch 6 – TIR, Polarised Light, Single & Double Refraction, RI & Birefringence'},
    {day:21, week:'Block 2', topic:'Ch 6 – Chatoyancy, Asterism, Aventurescence, Brilliance'},
    {day:22, week:'Block 2', topic:'Ch 6 – Practical: Refractometer, Polariscope, Conoscope Lab'},
    {day:23, week:'Block 2', topic:'Ch 7 – Colour: Body Colour, Selective Absorption, Colouring Elements'},
    {day:24, week:'Block 2', topic:'Ch 7 – Dispersion, Diffraction, Iridescence, Absorption Spectra & Spectroscope'},
    {day:25, week:'Block 2', topic:'Ch 7 – Colour Filters (CCF), Colour-Change Effect, Pleochroism, Dichroscope'},
    {day:26, week:'Block 2', topic:'Ch 7 – Practical: Spectroscope & Dichroscope Lab'},
    {day:27, week:'Block 2', topic:'Ch 8 – EM Spectrum Beyond Visible: UV, X-ray, IR Radiation'},
    {day:28, week:'Block 2', topic:'Ch 8 – Luminescence, Fluorescence, Phosphorescence, UV in Gemmology'},
    {day:29, week:'Block 2', topic:'Ch 8 – Thermal & Electrical Properties, Advanced Lab Testing (Raman, FTIR, XRF)'},
    {day:30, week:'Block 2', topic:'Block 2 Online Assessment + Instrument Endorsement: Spectroscope, CCF, UV'},
    {day:31, week:'Block 3', topic:'Ch 9 – The Earth, Crust, Plate Tectonics, Earth Materials'},
    {day:32, week:'Block 3', topic:'Ch 9 – Rock Types & Gem Deposits: Igneous, Metamorphic, Sedimentary'},
    {day:33, week:'Block 3', topic:'Ch 9 – Pegmatites, Diamond Deposits, Placer & Hydrothermal Deposits'},
    {day:34, week:'Block 3', topic:'Ch 10 – Gemstone Pipeline: Mining, Rough Dealers, Treaters, Cutters'},
    {day:35, week:'Block 3', topic:'Ch 10 – Gemstone Pipeline: Cut Dealers, Jewelry Mfg, Retailers, Ethics'},
    {day:36, week:'Block 3', topic:'Ch 11 – Cutting Styles: Non-Faceted & Faceted, Choice of Cut'},
    {day:37, week:'Block 3', topic:'Ch 11 – Lapidary Process, Appraising Cut: Symmetry, Proportions, Polish'},
    {day:38, week:'Block 3', topic:'Ch 12 – Gemstone Settings & Styles, Jewelry Metals: Gold, Silver, Platinum'},
    {day:39, week:'Block 3', topic:'Ch 12 – Hallmarking, Assaying, Valuation Types, Testing Set Gems'},
    {day:40, week:'Block 3', topic:'Ch 12 – Price Guides, Value Factors, Lab Reports'},
    {day:41, week:'Block 3', topic:'Block 3 Revision – Ch 9–12 Review'},
    {day:42, week:'Block 3', topic:'Block 3 Revision – Practical: Gemstone Handling & Observation'},
    {day:43, week:'Block 3', topic:'Block 3 Revision – Instrument Endorsement: Conoscope, Weight Estimation'},
    {day:44, week:'Block 3', topic:'Block 3 Revision – General Observation & Testing Endorsement'},
    {day:45, week:'Block 3', topic:'Block 3 Online Assessment'},
    {day:46, week:'Block 4', topic:'Ch 13 – Gemstone Treatments: Disclosure, Foiling, Bleaching, Dyeing, Coating'},
    {day:47, week:'Block 4', topic:'Ch 13 – Treatments: Impregnation, Fracture Filling (Opal, Emerald, Corundum, Diamond)'},
    {day:48, week:'Block 4', topic:'Ch 13 – Heat Treatment: Corundum, Aquamarine, Topaz, Tourmaline, Tanzanite'},
    {day:49, week:'Block 4', topic:'Ch 13 – Diffusion, Irradiation, Laser Treatment of Diamond'},
    {day:50, week:'Block 4', topic:'Ch 14 – Synthetics: Verneuil Flame Fusion, Flux Melt, Hydrothermal, HPHT/CVD'},
    {day:51, week:'Block 4', topic:'Ch 14 – Imitations, Composite Materials, CZ, Synthetic Moissanite, Glass'},
    {day:52, week:'Block 4', topic:'Gemstones: Amber, Beryl, Chrysoberyl, Corundum, Diamond, Feldspar'},
    {day:53, week:'Block 4', topic:'Gemstones: Fluorite, Garnet, Glass (artificial), Iolite, Ivory, Jades (Jadeite/Nephrite)'},
    {day:54, week:'Block 4', topic:'Gemstones: Lapis Lazuli, Malachite, Opal, Pearl, Peridot, Quartz'},
    {day:55, week:'Block 4', topic:'Gemstones: Spinel, Topaz, Tourmaline, Turquoise, Zircon, Zoisite/Tanzanite'},
    {day:56, week:'Block 4', topic:'Practical Lab: Gemstone Identification – Round 1 (6 stones)'},
    {day:57, week:'Block 4', topic:'Practical Lab: Gemstone Identification – Round 2 (6 stones)'},
    {day:58, week:'Block 4', topic:'Block 4 Online Assessment + Full Instrument Endorsement'},
    {day:59, week:'Block 4', topic:'Full Course Revision – Theory: Key Topics & Past Paper Practice'},
    {day:60, week:'Block 4', topic:'Full Course Revision – Practical: Mock Exam Conditions'}
  ],

  'Gem-A Diploma': [
    {day:1,  week:'Block D1', topic:'D3 – Atomic Structure, Chemical Bonding: Ionic & Covalent'},
    {day:2,  week:'Block D1', topic:'D3 – Crystal Structures, Crystallographic Axes, Symmetry'},
    {day:3,  week:'Block D1', topic:'D3 – Crystal Habits, Amorphous & Metamict Materials, Polymorphs, Isomorphism'},
    {day:4,  week:'Block D1', topic:'D3 – Practical: Advanced Crystal Observation & Identification'},
    {day:5,  week:'Block D1', topic:'D4 – Durability: Differential Hardness, Streak Test, Parting'},
    {day:6,  week:'Block D1', topic:'D4 – Hardness in Testing, Cleavage vs Fracture, Toughness Applications'},
    {day:7,  week:'Block D1', topic:'D5 – Accurate SG Measurement, Hydrostatic Weighing, Precautions'},
    {day:8,  week:'Block D1', topic:'D5 – High-Density Liquids in Gem Testing: Use, Care, Caution'},
    {day:9,  week:'Block D1', topic:'D5 – Practical: Hydrostatic Weighing Lab'},
    {day:10, week:'Block D1', topic:'D1 – Gems & Gemmology: Advanced Revision of Foundation Concepts'},
    {day:11, week:'Block D1', topic:'Practical: Full SG Testing on Mixed Stone Set'},
    {day:12, week:'Block D1', topic:'Practical: Crystal Systems Identification + Hardness Testing'},
    {day:13, week:'Block D1', topic:'Block D1 Revision – Structure, Durability & SG'},
    {day:14, week:'Block D1', topic:'Block D1 Revision – Practical Problem Solving'},
    {day:15, week:'Block D1', topic:'Instrument Endorsement: 10x Loupe, Microscope Advanced Use'},
    {day:16, week:'Block D1', topic:'Instrument Endorsement: Refractometer Advanced, Carat Balance (Hydrostatic)'},
    {day:17, week:'Block D1', topic:'Instrument Endorsement: Gauge, Diamond Probes & Testers'},
    {day:18, week:'Block D1', topic:'Block D1 Online Assessment'},
    {day:19, week:'Block D2', topic:'D2 – Microscope in Gem Testing: Types, Adaptations, Immersion Techniques'},
    {day:20, week:'Block D2', topic:'D2 – Internal & External Features: Study of Inclusions in Natural & Treated Gems'},
    {day:21, week:'Block D2', topic:'D2 – Inclusions in Rough, Fashioned, Artificial & Imitation Materials'},
    {day:22, week:'Block D2', topic:'D2 – Practical: Microscope Inclusion Study – Natural vs Synthetic'},
    {day:23, week:'Block D2', topic:'D6 – Optical Properties of Crystalline Materials: Uniaxial & Biaxial'},
    {day:24, week:'Block D2', topic:'D6 – Polarization, Optic Axes, Interference Figures, Conoscope Use'},
    {day:25, week:'Block D2', topic:'D6 – RI & Birefringence: Measurement by Refractometer & Other Methods'},
    {day:26, week:'Block D2', topic:'D6 – Practical: Refractometer & Conoscope Lab – Identifying Optic Sign'},
    {day:27, week:'Block D2', topic:'D7 – Colour: White Light, Light & Electrons, Causes of Colour'},
    {day:28, week:'Block D2', topic:'D7 – Luminescence, Physical Optics, Optical Phenomena'},
    {day:29, week:'Block D2', topic:'D7 – Colour in Gem Testing: Spectroscope Advanced, Colour Filters, Dichroscope'},
    {day:30, week:'Block D2', topic:'D7 – Practical: Advanced Spectroscope Lab – Absorption Spectra Identification'},
    {day:31, week:'Block D2', topic:'D7 – Practical: Dichroscope & CCF on Mixed Coloured Stone Set'},
    {day:32, week:'Block D2', topic:'Block D2 Revision – Microscope, RI, Birefringence, Colour'},
    {day:33, week:'Block D2', topic:'Block D2 Revision – Practical Problem Solving'},
    {day:34, week:'Block D2', topic:'Instrument Endorsement: Spectroscope, Dichroscope, CCF, Polariscope'},
    {day:35, week:'Block D2', topic:'Instrument Endorsement: Conoscope & Immersion Microscopy'},
    {day:36, week:'Block D2', topic:'Block D2 Online Assessment'},
    {day:37, week:'Block D3', topic:'D13 – Treatments Overview: Methods, Commercial Importance, Disclosure'},
    {day:38, week:'Block D3', topic:'D13 – Corundum Treatments: Heat, Beryllium Diffusion, Fracture Filling'},
    {day:39, week:'Block D3', topic:'D13 – Emerald Treatments: Fracture Filling, Oiling, Clarity Enhancement'},
    {day:40, week:'Block D3', topic:'D13 – Diamond Treatments: HPHT, Laser Drilling, Fracture Filling, Coatings'},
    {day:41, week:'Block D3', topic:'D13 – Irradiation, Surface Diffusion in Coloured Stones, Ethics of Disclosure'},
    {day:42, week:'Block D3', topic:'D13 – Practical: Identifying Treated vs Untreated Corundum & Emerald'},
    {day:43, week:'Block D3', topic:'D14 – Synthesis Methods: Verneuil, Czochralski, Flux, Hydrothermal'},
    {day:44, week:'Block D3', topic:'D14 – Synthesis Methods: Skull Melting, HPHT, CVD, Gel Growth, Ceramics'},
    {day:45, week:'Block D3', topic:'D14 – CZ, Synthetic Moissanite, Glass Identification'},
    {day:46, week:'Block D3', topic:'D14 – Practical: Identifying Synthetic Corundum & Spinel (Verneuil)'},
    {day:47, week:'Block D3', topic:'D14 – Practical: Identifying Synthetic Emerald (Flux & Hydrothermal)'},
    {day:48, week:'Block D3', topic:'D14 – Practical: Identifying Synthetic Diamond Features (CVD vs HPHT)'},
    {day:49, week:'Block D3', topic:'D8 – Advanced Lab Testing: X-ray, IR, UV Techniques in Gemmology'},
    {day:50, week:'Block D3', topic:'D8 – FTIR, Raman, UV-Vis Spectroscopy, XRF Applications'},
    {day:51, week:'Block D3', topic:'Block D3 Revision – Treatments: Key Identification Tests'},
    {day:52, week:'Block D3', topic:'Block D3 Revision – Synthetics: Diagnostic Features Practice'},
    {day:53, week:'Block D3', topic:'Block D3 Revision – Practical Problem Solving: Mixed Treated & Synthetic Set'},
    {day:54, week:'Block D3', topic:'Block D3 Online Assessment'},
    {day:55, week:'Block D4', topic:'D9 – The Rock Cycle, Geological Processes & Terms'},
    {day:56, week:'Block D4', topic:'D9 – Geological Processes & Gem Deposits in Detail'},
    {day:57, week:'Block D4', topic:'D11 – Lapidary & Diamond Manufacturing Processes, Equipment'},
    {day:58, week:'Block D4', topic:'D15 – Gemstones: Corundum (Ruby & Sapphire) – Properties, Inclusions, Treatments'},
    {day:59, week:'Block D4', topic:'D15 – Gemstones: Beryl (Emerald, Aquamarine, Morganite) – Full Identification'},
    {day:60, week:'Block D4', topic:'D15 – Gemstones: Diamond – Advanced Properties, Synthetics, Treatments'},
    {day:61, week:'Block D4', topic:'D15 – Gemstones: Chrysoberyl, Garnet Group, Spinel'},
    {day:62, week:'Block D4', topic:'D15 – Gemstones: Tourmaline, Topaz, Zircon'},
    {day:63, week:'Block D4', topic:'D15 – Gemstones: Quartz (Crystalline & Polycrystalline), Opal'},
    {day:64, week:'Block D4', topic:'D15 – Gemstones: Feldspar Group, Iolite, Tanzanite / Zoisite'},
    {day:65, week:'Block D4', topic:'D15 – Gemstones: Jadeite, Nephrite, Peridot, Spodumene'},
    {day:66, week:'Block D4', topic:'D15 – Gemstones: Pearl, Coral, Amber, Ivory, Jet (Organics)'},
    {day:67, week:'Block D4', topic:'D15 – Gemstones: Turquoise, Lapis Lazuli, Malachite, Rhodonite'},
    {day:68, week:'Block D4', topic:'D15 – Gemstones: Lesser-known stones – Andalusite, Apatite, Calcite, Diopside, Fluorite'},
    {day:69, week:'Block D4', topic:'D15 – Gemstones: Sphene, Sinhalite, Scapolite, Kyanite, Prehnite, Rhodochrosite'},
    {day:70, week:'Block D4', topic:'D15 – Practical Lab: 6-Stone Identification – Corundum, Beryl, Diamond Group'},
    {day:71, week:'Block D4', topic:'D15 – Practical Lab: 6-Stone Identification – Coloured Stones Mixed'},
    {day:72, week:'Block D4', topic:'D15 – Practical Lab: Full 12-Stone Mock Practical (Exam Conditions)'},
    {day:73, week:'Block D4', topic:'Block D4 Online Assessment'},
    {day:74, week:'Pre-Exam Revision', topic:'Full Diploma Revision – Theory: D1 Structure, D2 Optics, D3 Treatments'},
    {day:75, week:'Pre-Exam Revision', topic:'Full Diploma Revision – Theory: D4 Geology, D15 Gemstones'},
    {day:76, week:'Pre-Exam Revision', topic:'Past Paper Practice – D1 Theory Paper'},
    {day:77, week:'Pre-Exam Revision', topic:'Past Paper Practice – D2 Theory Paper'},
    {day:78, week:'Pre-Exam Revision', topic:'Mock Practical Exam – 12 Stones (Full D3 Conditions)'},
    {day:79, week:'Pre-Exam Revision', topic:'Individual Weak Area Review + Instrument Endorsement Completion'},
    {day:80, week:'Pre-Exam Revision', topic:'Final Briefing: Exam Day Preparation, Admin, What to Bring'}
  ],

  'Navratna Masterclass (10 Half Days)': [
    {day:1,  week:'Week 1', topic:'Introduction to Gemmology — Minerals, Organic, Amorphous, Synthetic, Simulants; Hardness, Toughness, Stability'},
    {day:2,  week:'Week 1', topic:'Optical Phenomena — Instruments: Loupe, Refractometer, Microscope Demo'},
    {day:3,  week:'Week 1', topic:'3 Gemstones: Cat\'s Eye, Hessonite, Coral — Practical Demo'},
    {day:4,  week:'Week 1', topic:'Corundum — Basic Properties, Ruby, Sapphire, Yellow Sapphire, Origins'},
    {day:5,  week:'Week 1', topic:'Corundum — Practical Session'},
    {day:6,  week:'Week 2', topic:'Emerald — Basic Properties of Beryl, Origins, Treatments, Synthetics, Simulants'},
    {day:7,  week:'Week 2', topic:'Emerald — Practical Session'},
    {day:8,  week:'Week 2', topic:'Diamond — Basic Properties, 4Cs Basics, Specimens'},
    {day:9,  week:'Week 2', topic:'Pearl — Properties, Varieties, Treatments, Simulants'},
    {day:10, week:'Week 2', topic:'Final Theory Exam + Graduation'}
  ],
  'Navratna Masterclass (5 Full Days)': [
    {day:1, week:'Week 1', topic:'Introduction to Gemmology — Minerals, Organic, Amorphous, Synthetic, Simulants; Hardness, Toughness, Stability'},
    {day:2, week:'Week 1', topic:'Optical Phenomena + 3 Gemstones: Cat\'s Eye, Hessonite, Coral'},
    {day:3, week:'Week 1', topic:'Corundum — Ruby, Sapphire, Yellow Sapphire: Properties, Origins, Practical'},
    {day:4, week:'Week 1', topic:'Emerald (Beryl) + Diamond — Properties, 4Cs, Treatments, Practical'},
    {day:5, week:'Week 1', topic:'Pearl — Properties, Varieties, Treatments + Final Theory Exam + Graduation'}
  ],

  'JewelPad Design': [
    {day:1,  week:'Week 1', topic:'Introduction to Procreate'},
    {day:2,  week:'Week 1', topic:'Cabochons Gemstone Rendering'},
    {day:3,  week:'Week 1', topic:'Detailed Rendering on Different Types of Gemstones'},
    {day:4,  week:'Week 1', topic:'Construction of Faceted Gemstones'},
    {day:5,  week:'Week 1', topic:'Diamond Brush Development – Part 1'},
    {day:6,  week:'Week 2', topic:'Diamond Brush Development – Part 2'},
    {day:7,  week:'Week 2', topic:'Jewelry Settings and Metal Rendering'},
    {day:8,  week:'Week 2', topic:'Engagement Ring Creation & Rendering'},
    {day:9,  week:'Week 2', topic:'Creating Isometric Views & Ring Rendering'},
    {day:10, week:'Week 2', topic:'Lattice Brush Development'},
    {day:11, week:'Week 3', topic:'Motif Brush Development and Symmetrical Design'},
    {day:12, week:'Week 3', topic:'Texture Brush Creation & Chain Dynamics'},
    {day:13, week:'Week 3', topic:'Uncut Jewelry Techniques'},
    {day:14, week:'Week 3', topic:'Temple Jewelry & Enamel Rendering Techniques'},
    {day:15, week:'Week 3', topic:'Final Design Project & Portfolio Completion'}
  ]
};


/* Jewelry Business Essentials — 5 half days, one of which is a factory visit at a host
   unit. Which day that is depends on the factory's availability, so the four teaching
   days always keep their order and the visit is inserted at the batch's visit_day; the
   batch picks the variant via syllabusKeyFor() / lesson_syllabus_key(). Day 3 is the
   default and the one to prefer — they see wastage, setting and finishing on the floor,
   then cost it the next day. Added 2026-10-21 per Sunil. */
(function () {
  var JBE_TEACHING = [
    'Foundations: The World of Jewellery, The Diamond Story, Science & the 4Cs, Types & Design Styles',
    'Materials & Design: Gemstones, Colour-Stone Pricing, Precious Metals, Design Advantage',
    'Costing, Pricing & Market: Gold Calculations & Costing, Diamond Pricing, Market Analysis',
    'Building the Business: Trends to 2030, Setting Up, Selling with Integrity, Final Assessment'
  ];
  var JBE_VISIT = 'Factory Visit: Manufacturing Process, Site Visit & Debrief';
  for (var v = 1; v <= 5; v++) {
    var topics = JBE_TEACHING.slice();
    topics.splice(v - 1, 0, JBE_VISIT);
    SYLLABI['Jewelry Business Essentials' + (v === 3 ? '' : ' (Visit Day ' + v + ')')] =
      topics.map(function (t, i) { return { day: i + 1, week: 'Week 1', topic: t }; });
  }
})();

// Course-name aliases (kept in sync with getSyllabusForCourse in instructor-portal.html)
const ALIASES = {
  'JewelPad On-campus': 'JewelPad Design',
  'JewelPad Online':    'JewelPad Design',
  'Jewelpad Design':    'JewelPad Design',
  'jewelpad design':    'JewelPad Design',
};

function getSyllabusForCourse(courseName) {
  if (SYLLABI[courseName]) return SYLLABI[courseName];
  const canonical = ALIASES[courseName];
  if (canonical && SYLLABI[canonical]) return SYLLABI[canonical];
  return [];
}

/* From 2027-01-01 DG and CSG run new plans: Half Day (and any non-Full-Day) batches the
   7-week syllabus, Full Day batches the 3-week one. Older batches keep their course's
   original syllabus. Mirrors syllabusKeyFor in assets/shared.js and lesson_syllabus_key()
   in the database — change all three together. */
const NEW_SCHEME_FROM = '2027-01-01';
function syllabusKeyFor(b) {
  if (!b) return '';
  const course = String(b.course || '').trim();
  const lc = course.toLowerCase();
  // Jewelry Business Essentials: the factory visit floats, so the batch's visit_day
  // (1-5, default 3) picks which of the five generated variants applies.
  if (lc === 'jewelry business essentials') {
    var vd = Number(b.visit_day || b.visitDay || 3);
    if (!(vd >= 1 && vd <= 5)) vd = 3;
    return 'Jewelry Business Essentials' + (vd === 3 ? '' : ' (Visit Day ' + vd + ')');
  }
  const base = lc === 'diamond graduate' ? 'Diamond Graduate'
    : (lc === 'colored stone graduate' || lc === 'coloured stone graduate') ? 'Colored Stone Graduate' : '';
  const start = String(b.start_date || b.startDateISO || '').slice(0, 10);
  if (!base || !start || start < NEW_SCHEME_FROM) return course;
  return base + (String(b.type || '').trim().toLowerCase() === 'full day' ? ' (3 Weeks)' : ' (7 Weeks)');
}
function getSyllabusForBatch(b) { return getSyllabusForCourse(syllabusKeyFor(b)); }

function normalizeTopic(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[\s\-–—]+/g, ' ')
    .trim();
}

// Given a syllabus and a topic string, returns the syllabus day number if the
// topic is an exact (normalized) match for one of the syllabus's predefined
// topics, or null if it's a custom/off-syllabus topic (factory visit, makeup
// review, an instructor-typed description, etc.). Used at write time — when a
// session is created or its topic is set/confirmed — to record which specific
// day (if any) that session actually covered.
function findSyllabusDay(syllabus, topic) {
  const key = normalizeTopic(topic);
  if (!key) return null;
  for (let i = 0; i < syllabus.length; i++) {
    if (normalizeTopic(syllabus[i].topic) === key) return syllabus[i].day || (i + 1);
  }
  return null;
}

// Given a course's syllabus and the batch's past (non-cancelled) sessions
// (each { topic, session_date, syllabus_day }, oldest first), work out which
// syllabus days have already been taught and what the next one should be.
//
// Progression is based on the explicit syllabus_day recorded on each session
// row (set by findSyllabusDay at write time), not on the count of sessions
// held and not on re-matching topic text after the fact. Two earlier
// approaches were tried and both had a failure mode:
//   - Exact-text-matching each past session's topic against the syllabus,
//     resuming right after the furthest matched day. Instructors rarely type
//     the exact syllabus wording, so matches would rarely fire — and when a
//     later session's topic stopped matching, the "furthest matched day"
//     would stop advancing, permanently freezing progression on the same day
//     (a batch got stuck re-suggesting "Day 4" every day).
//   - Plain session-count progression ("session N covers day N" for every
//     non-cancelled session, regardless of its actual topic). This avoided
//     the freeze, but any session with a non-syllabus topic (factory visit,
//     holiday makeup, custom description) still consumed a slot in the
//     count, silently skipping the real topic for that day ahead and marking
//     it "already covered" even though nobody covered it.
// Recording the day explicitly on the row avoids both: a custom-topic
// session simply doesn't set syllabus_day, so it doesn't consume a slot, and
// there's no drift from re-matching text after the fact. "Next" is just the
// lowest-numbered day nobody has recorded yet, so it's correct regardless of
// order, holidays, or how many custom sessions happen along the way.
function computeNextSyllabusDay(syllabus, pastSessions) {
  const usedDaySet = new Set();
  (pastSessions || []).forEach((s) => {
    const d = s.syllabus_day;
    if (d !== null && d !== undefined && d !== '') usedDaySet.add(Number(d));
  });
  const usedDays = Array.from(usedDaySet).sort((a, b) => a - b);
  const result = { dayNo: '', topic: '', week: '', usedDays };
  for (let i = 0; i < syllabus.length; i++) {
    const day = syllabus[i].day || (i + 1);
    if (!usedDaySet.has(day)) {
      result.dayNo = day;
      result.topic = syllabus[i].topic;
      result.week = syllabus[i].week || '';
      break;
    }
  }
  return result;
}

module.exports = { SYLLABI, getSyllabusForCourse, getSyllabusForBatch, syllabusKeyFor, computeNextSyllabusDay, findSyllabusDay, normalizeTopic };

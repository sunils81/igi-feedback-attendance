/**
 * IGI Lecture Attendance & Feedback — Google Apps Script v2
 * Sheet: 1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs
 * Deploy → Web App → Execute as Me → Anyone
 */

const SHEET_ID       = '1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs';
const COUNSELOR_PASS = 'IGI2026';
const MASTER_PASS    = 'IGIMaster2026';
const REPORT_PASS    = 'IGI2026';          // session report uses same password
const PASS_THRESHOLD = 60;                 // % pass mark

// ── Slot activation windows (local time hours) ────────────────
const SLOT_WINDOWS = {
  'First Half':  { open: 8,  close: 14 }, // 8AM – 2PM
  'Second Half': { open: 12, close: 20 }, // 12PM – 8PM
  'Full Day':    { open: 8,  close: 24 }  // 8AM – midnight
};

// ── Instructor credentials (Option B — unique per instructor) ─
const INSTRUCTOR_CREDS = {
  'Amit Sidpura':     'IGIAmit2026',
  'Asmita Saroday':   'IGIAsmita2026',
  'Arjun Mistry':     'IGIArjun2026',
  'Bhavin Patel':     'IGIBhavin2026',
  'Sneha Garodia':    'IGISneha2026',
  'Khorehmand Kasad': 'IGIKhore2026',
  'Nishchay Kapoor':  'IGINishchay2026',
  'Piyush Ahuja':     'IGIPiyush2026',
  'Preeti Agarwala':  'IGIPreeti2026',
  'Sayan Banerjee':   'IGISayan2026',
  'Deepak Nachankar': 'IGIDeeepak2026',
  'Sharoon Joy':      'IGISharoon2026',
  'Seema Athavale':   'IGISeema2026'
};
const FEEDBACK_HRS   = 24;
const EXAM_ALERT_DAYS= 21;
const NAVY = '#0D1B2E', GOLD = '#C9A84C', WHITE = '#FDFCF9';

// ── Sheet names ────────────────────────────────────────────────
const SH_BATCHES  = 'Batches';
const SH_STUDENTS = 'Batch_Students';
const SH_SESSIONS = 'Sessions';
const SH_FEEDBACK = 'Attendance_Feedback';
const SH_HOLIDAYS     = 'Holidays';
const SH_ASSESSMENTS  = 'Assessments';
const SH_MARKS        = 'Assessment_Marks';

// ── Centre / Course codes ──────────────────────────────────────
const CENTRE_CODES = {
  'Mumbai':'MUM','Delhi':'DEL','Kolkata':'KOL','Surat':'SUR',
  'Chennai':'CHE','Hyderabad':'HYD','Pune':'PUN','Bangalore':'BLR',
  'Lucknow':'LKO','Ahmedabad':'AMD','Jaipur':'JAI'
};
const COURSE_CODES = {
  'Diamond Graduate':'DG','Colored Stone Graduate':'CSG',
  'Jewelry Design':'JD','CAD Design':'CAD','JewelPad Design':'JP',
  'Diploma in Pearls':'DP','Polished Diamond Grading':'PDG',
  'Rough Diamond Graduate':'RDG','Identification of RES':'IRES',
  'Small Diamond Assortment':'SDA','Diamond Graduate Integrated':'DGI',
  'Coloured Stone Integrated':'CSI','Corporate Programs':'CP',
  'Seminars':'SEM','Gem-A Foundation':'GAF','Gem-A Diploma':'GAD',
  'Emerald':'EMR','Pearl':'PRL'
};
const INSTRUCTORS = [
  'Amit Sidpura','Asmita Saroday','Arjun Mistry','Bhavin Patel',
  'Sneha Garodia','Khorehmand Kasad','Nishchay Kapoor','Piyush Ahuja',
  'Preeti Agarwala','Sayan Banerjee','Deepak Nachankar','Sharoon Joy',
  'Seema Athavale'
];

// ── National holidays India 2026-2027 (YYYY-MM-DD) ────────────
const NATIONAL_HOLIDAYS = [
  '2026-01-26', // Republic Day
  '2026-03-25', // Holi
  '2026-04-02', // Ram Navami (approx)
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr Ambedkar Jayanti / Tamil New Year
  '2026-05-01', // Maharashtra Day / Labour Day
  '2026-06-06', // Eid ul-Fitr (approx)
  '2026-08-15', // Independence Day
  '2026-08-25', // Janmashtami (approx)
  '2026-10-02', // Gandhi Jayanti
  '2026-10-22', // Dussehra (approx)
  '2026-10-28', // Diwali Lakshmi Puja (approx)
  '2026-10-29', // Diwali (approx)
  '2026-10-30', // Diwali (approx)
  '2026-11-05', // Guru Nanak Jayanti (approx)
  '2026-12-25', // Christmas
  '2027-01-26', // Republic Day
  '2027-03-17', // Holi (approx)
];

// ── Exam dates ─────────────────────────────────────────────────
const EXAM_DATES = {
  'Gem-A Foundation': { label: 'Gem-A Foundation Exam (F1+F2)', windowStart: '2027-01-01', windowEnd: '2027-01-31' },
  'Gem-A Diploma':    { label: 'Gem-A Diploma Exam (D1+D2+D3)', windowStart: '2027-01-01', windowEnd: '2027-01-31' }
};

// ═══════════════════════════════════════════════════════════════
//  SYLLABI — day-by-day topics for all structured courses
// ═══════════════════════════════════════════════════════════════
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

  'Colored Stone Graduate': [
    {day:1,  week:'Week 1', topic:'Introduction to Gemology, Mineralogy & Crystallography, Properties of Gemstones, Lab Session'},
    {day:2,  week:'Week 1', topic:'Instrumentation: Refractometer, Polariscope, Dichroscope'},
    {day:3,  week:'Week 1', topic:'Inclusions & Microscope, Lab Session on all Instruments'},
    {day:4,  week:'Week 1', topic:'Instrumentation: Specific Gravity, Microscope, Lab Session'},
    {day:5,  week:'Week 1', topic:'Factory Visit / Practice'},
    {day:6,  week:'Week 2', topic:'Introduction to Corundum'},
    {day:7,  week:'Week 2', topic:'Lab Session on Corundum'},
    {day:8,  week:'Week 2', topic:'Introduction to Emerald'},
    {day:9,  week:'Week 2', topic:'Practice on Emerald'},
    {day:10, week:'Week 2', topic:'Theory Test on RES, Lab Session'},
    {day:11, week:'Week 3', topic:'Singly Refractive Gemstones'},
    {day:12, week:'Week 3', topic:'Lab Session on SR Gemstones'},
    {day:13, week:'Week 3', topic:'Doubly Refractive Gemstones – Uniaxial'},
    {day:14, week:'Week 3', topic:'Lab Session on DR – Uniaxial Gemstones'},
    {day:15, week:'Week 3', topic:'Theory Test on RES / SR / DR-Uniaxial / Instruments, Lab Session'},
    {day:16, week:'Week 4', topic:'Doubly Refractive Gemstones – Biaxial'},
    {day:17, week:'Week 4', topic:'Lab Session on DR – Biaxial Gemstones'},
    {day:18, week:'Week 4', topic:'Synthetics'},
    {day:19, week:'Week 4', topic:'Treatments'},
    {day:20, week:'Week 4', topic:'Lab Session on Synthetics & Treatments'},
    {day:21, week:'Week 5', topic:'Theory Test on Synthetics & Treatments, Full Practical Test'},
    {day:22, week:'Week 5', topic:'Organics, Lab Session on Organics'},
    {day:23, week:'Week 5', topic:'Pricing, Lab Session'},
    {day:24, week:'Week 5', topic:'Lab Session'},
    {day:25, week:'Week 5', topic:'Lab Visit & Lab Session'},
    {day:26, week:'Week 6', topic:'Lab Session'},
    {day:27, week:'Week 6', topic:'Lab Session'},
    {day:28, week:'Week 6', topic:'Final Test (Practical & Theory)'},
    {day:29, week:'Week 6', topic:'Re-Test'},
    {day:30, week:'Week 6', topic:'Graduation'}
  ],

  'Polished Diamond Grading': [
    {day:1,  week:'Week 1', topic:'Introduction, Evolution from Rough to Polish, Formation, Mining & Extraction, Manufacturing Process, Clarity Grading Theory'},
    {day:2,  week:'Week 1', topic:'Lab (Clarity – Inclusion & Blemishes), Clarity Grade Definitions, Plotting Theory, Clarity + Plotting Lab'},
    {day:3,  week:'Week 1', topic:'Color Theory, International Color Grading Scale, Fancy Colors, Visual Estimation, Clarity + Plotting + Color Lab'},
    {day:4,  week:'Week 1', topic:'Measurements Theory, Estimation of Crown Angle & Table %, Crown Height %, Pavilion Depth %, Labs for Estimation'},
    {day:5,  week:'Week 1', topic:'Girdle Thickness, Culet Condition, Proportion & Finish Grades, Lab for Complete Grading'},
    {day:6,  week:'Week 2', topic:'Lab for Complete Grading (Clarity + Color + Cut)'},
    {day:7,  week:'Week 2', topic:'Analysis & Grading of Fancy Shapes – Clarity, Color & Cut, Lab for Grading Fancy & Round Shapes'},
    {day:8,  week:'Week 2', topic:'Recognition of Diamonds & Imitations (Theory + Lab), Synthetics, Lab for Recognition'},
    {day:9,  week:'Week 2', topic:'Lab for Grading Fancy & Round Shapes, Pricing in International Market, Price Calculation Examples'},
    {day:10, week:'Week 2', topic:'3 Stone Challenge, Final Theory Test, Instructor Review, Diploma Distribution'}
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

  'Gem-A Foundation': [
    // Block 1 (Days 1-15): Ch 1-4
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
    // Block 2 (Days 16-30): Ch 5-8
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
    // Block 3 (Days 31-45): Ch 9-12
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
    // Block 4 (Days 46-60): Ch 13-14 + Gemstones
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
    // Block D1 (Days 1-18): Structure & Physical Properties
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
    // Block D2 (Days 19-36): Magnification, Light & Colour
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
    // Block D3 (Days 37-54): Treatments, Synthetics, Further Testing
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
    // Block D4 (Days 55-80): Geology, Fashioning, The Gemstones D15
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
    // Pre-Exam Revision (Days 74-80)
    {day:74, week:'Pre-Exam Revision', topic:'Full Diploma Revision – Theory: D1 Structure, D2 Optics, D3 Treatments'},
    {day:75, week:'Pre-Exam Revision', topic:'Full Diploma Revision – Theory: D4 Geology, D15 Gemstones'},
    {day:76, week:'Pre-Exam Revision', topic:'Past Paper Practice – D1 Theory Paper'},
    {day:77, week:'Pre-Exam Revision', topic:'Past Paper Practice – D2 Theory Paper'},
    {day:78, week:'Pre-Exam Revision', topic:'Mock Practical Exam – 12 Stones (Full D3 Conditions)'},
    {day:79, week:'Pre-Exam Revision', topic:'Individual Weak Area Review + Instrument Endorsement Completion'},
    {day:80, week:'Pre-Exam Revision', topic:'Final Briefing: Exam Day Preparation, Admin, What to Bring'}
  ]
,
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
  ]
};

// ═══════════════════════════════════════════════════════════════
//  CALENDAR ENGINE
// ═══════════════════════════════════════════════════════════════

function getHolidaysForCentre(ss) {
  const sh = ss.getSheetByName(SH_HOLIDAYS);
  const all = new Set(NATIONAL_HOLIDAYS);
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2,1,sh.getLastRow()-1,1).getValues().forEach(r => {
      if (r[0]) {
        const d = new Date(r[0]);
        if (!isNaN(d)) all.add(d.toISOString().split('T')[0]);
      }
    });
  }
  return all;
}

function getSaturdayOrdinal(date) {
  // Returns which Nth Saturday of the month this date is (1,2,3,4,5)
  const d   = new Date(date);
  const dom = d.getDate();
  return Math.ceil(dom / 7);
}

function isWorkingDay(date, holidays) {
  const d   = new Date(date);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  if (dow === 0) return false; // Sunday
  if (dow === 6) return false; // All Saturdays are OFF by default
  // 2nd/4th Sat available only for manual extra sessions (createSession with sessionType='Extra')
  const key = d.toISOString().split('T')[0];
  if (holidays.has(key)) return false;
  return true;
}

function getWorkingSchedule(startDateStr, nDays, holidays) {
  const schedule = [];
  let current = new Date(startDateStr);
  current.setHours(12,0,0,0); // noon to avoid DST issues
  while (schedule.length < nDays) {
    if (isWorkingDay(current, holidays)) {
      schedule.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return schedule;
}

function dateStr(d) {
  return d.toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric',weekday:'short'});
}

// ═══════════════════════════════════════════════════════════════
//  doGet
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  const p    = e.parameter || {};
  const act  = p.action || '';
  const cbFn = p.callback || '';
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  ensureSheets(ss);

  function respond(obj) {
    const j = JSON.stringify(obj);
    if (cbFn) return ContentService.createTextOutput(cbFn+'('+j+')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
    return ContentService.createTextOutput(j).setMimeType(ContentService.MimeType.JSON);
  }

  try {

    if (!act) return respond({status:'ok', service:'IGI Feedback Attendance v2'});

    // ── auth ───────────────────────────────────────────────────
    if (act==='counselorLogin') return respond({status: p.pass===COUNSELOR_PASS?'ok':'error'});
    if (act==='masterLogin')    return respond({status: p.pass===MASTER_PASS?'ok':'error'});

    // ── getBatchCode ───────────────────────────────────────────
    if (act==='getBatchCode') {
      const cc   = CENTRE_CODES[p.centre]||p.centre.substring(0,3).toUpperCase();
      const crs  = COURSE_CODES[p.course]||p.course.substring(0,3).toUpperCase();
      const base = cc+'-'+crs+'-'+p.month;
      const sh   = ss.getSheetByName(SH_BATCHES);
      const exist= sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0])):[];
      let code   = base;
      for (const sfx of ['','-A','-B','-C','-D','-E']) {
        code = base+sfx; if (!exist.includes(code)) break;
      }
      return respond({status:'ok', batchCode:code});
    }

    // ── getSchedulePreview ─────────────────────────────────────
    if (act==='getSchedulePreview') {
      const course    = p.course||'';
      const startDate = p.startDate||'';
      if (!startDate) return respond({status:'error'});
      const syllabus  = SYLLABI[course];
      const nDays     = syllabus ? syllabus.length : 30;
      const holidays  = getHolidaysForCentre(ss);
      const schedule  = getWorkingSchedule(startDate, nDays, holidays);
      const showDays  = nDays <= 15 ? nDays : 10; // show all for short courses
      const preview   = schedule.slice(0,showDays).map((d,i)=>({
        day: i+1,
        date: dateStr(d),
        topic: syllabus ? syllabus[i].topic : 'To be set'
      }));
      return respond({status:'ok', preview, totalDays:nDays});
    }

    // ── createBatch ────────────────────────────────────────────
    if (act==='createBatch') {
      const sh = ss.getSheetByName(SH_BATCHES);
      const exist = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0])):[];
      if (exist.includes(p.batchCode)) return respond({status:'error',reason:'batch_exists'});
      sh.appendRow([p.batchCode,p.centre,p.course,p.type,p.batchSlot||'Full Day',p.startDate,p.endDate,'Counselor',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),1,1,8).setBackground(sh.getLastRow()%2===0?'#F4F1EB':'#FDFCF9');
      return respond({status:'ok',batchCode:p.batchCode});
    }

    // ── getBatches ─────────────────────────────────────────────
    if (act==='getBatches') {
      const sh = ss.getSheetByName(SH_BATCHES);
      if (sh.getLastRow()<2) return respond({status:'ok',batches:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      const centre=(p.centre||'').trim();
      return respond({status:'ok',batches:data.filter(r=>r[0]&&(!centre||r[1]===centre)).map(r=>({
        batchCode:r[0],centre:r[1],course:r[2],type:r[3],
        startDate:r[4]?new Date(r[4]).toLocaleDateString('en-IN'):'',
        endDate:r[5]?new Date(r[5]).toLocaleDateString('en-IN'):''
      }))});
    }

    // ── getNextEnrollment ──────────────────────────────────────
    if (act==='getNextEnrollment') {
      const batch=p.batchCode||''; const centre=p.centre||''; const course=p.course||'';
      const yy=new Date().getFullYear().toString().slice(2);
      const cc=CENTRE_CODES[centre]||centre.substring(0,3).toUpperCase();
      const crs=COURSE_CODES[course]||course.substring(0,3).toUpperCase();
      const prefix=cc+yy+crs;
      const sh=ss.getSheetByName(SH_STUDENTS);
      let maxSeq=0;
      if (sh.getLastRow()>1) {
        sh.getRange(2,1,sh.getLastRow()-1,1).getValues().forEach(r=>{
          const en=String(r[0]);
          if(en.startsWith(prefix)){const seq=parseInt(en.slice(prefix.length))||0;if(seq>maxSeq)maxSeq=seq;}
        });
      }
      return respond({status:'ok',enrollmentNo:prefix+String(maxSeq+1).padStart(3,'0')});
    }

    // ── addStudent ─────────────────────────────────────────────
    if (act==='addStudent') {
      const sh=ss.getSheetByName(SH_STUDENTS);
      if (sh.getLastRow()>1){
        const exist=sh.getRange(2,1,sh.getLastRow()-1,1).getValues().map(r=>String(r[0]));
        if(exist.includes(p.enrollmentNo))return respond({status:'error',reason:'enrollment_exists'});
      }
      sh.appendRow([p.enrollmentNo,p.batchCode,p.name,p.dob,p.mobile||'',p.email||'','Active',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),4).setNumberFormat('@STRING@');
      return respond({status:'ok',enrollmentNo:p.enrollmentNo});
    }

    // ── getStudents ────────────────────────────────────────────
    if (act==='getStudents') {
      const batch=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_STUDENTS);
      if(sh.getLastRow()<2)return respond({status:'ok',students:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      return respond({status:'ok',students:data.filter(r=>r[0]&&String(r[1]).toUpperCase()===batch&&r[6]==='Active')
        .map(r=>({enrollmentNo:r[0],name:r[2],dob:String(r[3]),mobile:r[4],email:r[5]}))});
    }

    // ── removeStudent ──────────────────────────────────────────
    if (act==='removeStudent') {
      const sh=ss.getSheetByName(SH_STUDENTS);
      if(sh.getLastRow()>1){const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
        for(let i=0;i<data.length;i++){if(String(data[i][0])===p.enrollmentNo){sh.getRange(i+2,7).setValue('Inactive');break;}}}
      return respond({status:'ok'});
    }

    // ── addHoliday ─────────────────────────────────────────────
    if (act==='addHoliday') {
      if (p.pass!==COUNSELOR_PASS) return respond({status:'error',reason:'auth'});
      const sh=getOrCreateSheet(ss,SH_HOLIDAYS);
      ensureHolidayHeaders(sh);
      // Check duplicate
      if(sh.getLastRow()>1){
        const exist=sh.getRange(2,1,sh.getLastRow()-1,1).getValues();
        for(const r of exist){if(r[0]&&new Date(r[0]).toISOString().split('T')[0]===p.date)return respond({status:'ok',duplicate:true});}
      }
      sh.appendRow([new Date(p.date),p.name||'Holiday',p.centre||'All',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),1).setNumberFormat('dd/mm/yyyy');
      return respond({status:'ok'});
    }

    // ── getHolidays ────────────────────────────────────────────
    if (act==='getHolidays') {
      const sh=ss.getSheetByName(SH_HOLIDAYS);
      const national = NATIONAL_HOLIDAYS.map(d=>({date:d,name:'National Holiday',centre:'All',type:'national'}));
      const custom = [];
      if(sh&&sh.getLastRow()>1){
        sh.getRange(2,1,sh.getLastRow()-1,3).getValues().forEach(r=>{
          if(r[0]) custom.push({date:new Date(r[0]).toISOString().split('T')[0],name:r[1]||'Holiday',centre:r[2]||'All',type:'custom'});
        });
      }
      return respond({status:'ok',holidays:[...national,...custom]});
    }

    // ── createSession ──────────────────────────────────────────
    if (act==='createSession') {
      const batch=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_SESSIONS);
      let sessNo=1;
      const sessionDate=p.sessionDate||new Date().toISOString().split('T')[0];
      if(sh.getLastRow()>1){
        const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
        const batchSess=data.filter(r=>String(r[1]).toUpperCase()===batch);
        sessNo=batchSess.length+1;
        for(const r of batchSess){
          if(r[2]&&new Date(r[2]).toLocaleDateString('en-IN')===new Date(sessionDate).toLocaleDateString('en-IN'))
            return respond({status:'error',reason:'session_exists_today'});
        }
      }
      // Determine session type
      const sd=new Date(sessionDate);
      const sd_dow=sd.getDay();
      let sessionType='Scheduled';
      if(sd_dow===6){
        const ord=getSaturdayOrdinal(sd);
        sessionType=(ord===2||ord===4)?'Saturday Extra':'Scheduled';
      }
      // Check if beyond batch end date
      const shBatch=ss.getSheetByName(SH_BATCHES);
      if(shBatch.getLastRow()>1){
        const bData=shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues();
        const bRow=bData.find(r=>String(r[0]).toUpperCase()===batch);
        if(bRow&&bRow[5]){
          const endDate=new Date(bRow[5]);
          if(new Date(sessionDate)>endDate) sessionType='Extended';
        }
      }
      if(p.sessionType) sessionType=p.sessionType; // override if explicitly set
      const sessionCode=batch+'-S'+String(sessNo).padStart(2,'0');
      sh.appendRow([sessionCode,batch,new Date(sessionDate),sessNo,p.instructor,sessionType,'',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),3).setNumberFormat('dd/mm/yyyy');
      return respond({status:'ok',sessionCode,sessNo,sessionType});
    }

    // ── updateSessionTopic ─────────────────────────────────────
    if (act==='updateSessionTopic') {
      // Called when student selects topic on feedback form — updates session record
      const sessionCode=(p.sessionCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_SESSIONS);
      if(sh.getLastRow()>1){
        const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
        for(let i=0;i<data.length;i++){
          if(String(data[i][0]).toUpperCase()===sessionCode){
            sh.getRange(i+2,7).setValue(p.topic||''); // col G = topic
            break;
          }
        }
      }
      return respond({status:'ok'});
    }

    // ── getSessions ────────────────────────────────────────────
    if (act==='getSessions') {
      const batch=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_SESSIONS);
      if(sh.getLastRow()<2)return respond({status:'ok',sessions:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      return respond({status:'ok',sessions:data.filter(r=>r[0]&&(!batch||String(r[1]).toUpperCase()===batch))
        .map(r=>({sessionCode:r[0],batchCode:r[1],sessionDate:r[2]?new Date(r[2]).toLocaleDateString('en-IN'):'',
          sessNo:r[3],instructor:r[4],sessionType:r[5]||'Scheduled',topic:r[6]||''}))
        .sort((a,b)=>b.sessNo-a.sessNo)});
    }

    // ── getExpectedTopic ───────────────────────────────────────
    if (act==='getExpectedTopic') {
      const batch=(p.batchCode||'').toUpperCase();
      const sessNo=parseInt(p.sessNo)||1;
      // Get batch info
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const bData=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues():[];
      const bRow=bData.find(r=>String(r[0]).toUpperCase()===batch);
      if(!bRow) return respond({status:'error',reason:'batch_not_found'});
      const course=bRow[2];
      const syllabus=SYLLABI[course];
      if(!syllabus) return respond({status:'ok',structured:false,course}); // free text course
      const idx=sessNo-1;
      const prev =idx>0        ? syllabus[idx-1] : null;
      const today=idx<syllabus.length ? syllabus[idx]   : null;
      const next =idx<syllabus.length-1? syllabus[idx+1]: null;
      // Exam alert
      let examAlert=null;
      if(EXAM_DATES[course]){
        const ex=EXAM_DATES[course];
        const exStart=new Date(ex.windowStart);
        const now=new Date();
        const daysToExam=Math.ceil((exStart-now)/(1000*86400));
        if(daysToExam>0&&daysToExam<=EXAM_ALERT_DAYS) examAlert={label:ex.label,daysLeft:daysToExam};
        else if(daysToExam<=0&&now<=new Date(ex.windowEnd)) examAlert={label:ex.label+' — EXAM MONTH',daysLeft:0};
      }
      return respond({status:'ok',structured:true,course,
        prev:prev?{day:prev.day,week:prev.week,topic:prev.topic}:null,
        today:today?{day:today.day,week:today.week,topic:today.topic}:null,
        next:next?{day:next.day,week:next.week,topic:next.topic}:null,
        examAlert
      });
    }

    // ── verifyStudent ──────────────────────────────────────────
    if (act==='verifyStudent') {
      const sessionCode=(p.sessionCode||'').toUpperCase();
      const enrollNo=(p.enrollmentNo||'').toUpperCase();
      const dob=(p.dob||'').replace(/\D/g,'');
      const shSess=ss.getSheetByName(SH_SESSIONS);
      if(shSess.getLastRow()<2)return respond({status:'error',reason:'invalid_session'});
      const sessData=shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues();
      const session=sessData.find(r=>String(r[0]).toUpperCase()===sessionCode);
      if(!session)return respond({status:'error',reason:'invalid_session'});
      const sessDate=new Date(session[2]);
      if((new Date()-sessDate)/3600000>FEEDBACK_HRS) return respond({status:'error',reason:'window_closed'});
      const batchCode=String(session[1]).toUpperCase();
      const shStu=ss.getSheetByName(SH_STUDENTS);
      if(shStu.getLastRow()<2)return respond({status:'error',reason:'student_not_found'});
      const stuData=shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues();
      const student=stuData.find(r=>String(r[0]).toUpperCase()===enrollNo&&String(r[1]).toUpperCase()===batchCode&&r[6]==='Active');
      if(!student)return respond({status:'error',reason:'student_not_found'});
      if(String(student[3]).replace(/\D/g,'')!==dob)return respond({status:'error',reason:'dob_mismatch'});
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      if(shFb.getLastRow()>1){
        const fbData=shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues();
        if(fbData.find(r=>String(r[0]).toUpperCase()===sessionCode&&String(r[1]).toUpperCase()===enrollNo))
          return respond({status:'error',reason:'already_submitted'});
      }
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const bData=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues():[];
      const batch=bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      return respond({status:'ok',studentName:student[2],enrollmentNo:student[0],
        batchCode,sessionCode,sessNo:session[3],topic:session[6]||'',
        instructor:session[4],sessionType:session[5]||'Scheduled',
        sessionDate:sessDate.toLocaleDateString('en-IN'),
        course:batch?batch[2]:'',centre:batch?batch[1]:''
      });
    }

    // ── submitFeedback ─────────────────────────────────────────
    if (act==='submitFeedback') {
      const sh=ss.getSheetByName(SH_FEEDBACK);
      if(sh.getLastRow()>1){
        const exist=sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
        if(exist.find(r=>String(r[0]).toUpperCase()===(p.sessionCode||'').toUpperCase()&&
           String(r[1]).toUpperCase()===(p.enrollmentNo||'').toUpperCase()))
          return respond({status:'error',reason:'already_submitted'});
      }
      const isAnon=p.anonymous==='true';
      sh.appendRow([(p.sessionCode||'').toUpperCase(),(p.enrollmentNo||'').toUpperCase(),
        p.studentName||'',p.batchCode||'',p.centre||'',p.course||'',p.instructor||'',
        p.topic||'',p.completionStatus||'',Number(p.q1)||0,Number(p.q2)||0,
        p.q3||'',p.q4||'',p.q5||'',p.q6||'',isAnon?'Y':'N',new Date().toISOString()]);
      const lr=sh.getLastRow();
      const q1=Number(p.q1)||0;
      sh.getRange(lr,1,1,17).setBackground(q1>=4?'#E8F5EE':q1>=3?'#F9F3E3':'#FEF2F2');
      if(isAnon)sh.getRange(lr,3).setValue('[Anonymous]').setFontColor('#aaa');
      // Update session topic if not already set
      if(p.topic){
        const shSess=ss.getSheetByName(SH_SESSIONS);
        if(shSess.getLastRow()>1){
          const sData=shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues();
          for(let i=0;i<sData.length;i++){
            if(String(sData[i][0]).toUpperCase()===(p.sessionCode||'').toUpperCase()&&!sData[i][6]){
              shSess.getRange(i+2,7).setValue(p.topic);break;
            }
          }
        }
      }
      return respond({status:'ok'});
    }

    // ── getSessionReport (counselor — attendance + topics only) ─
    if (act==='getSessionReport') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const reportPass=(p.reportPass||'').trim();
      if(reportPass!==REPORT_PASS)return respond({status:'error',reason:'wrong_password'});
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const bData=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues():[];
      const batch=bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      if(!batch)return respond({status:'error',reason:'batch_not_found'});
      const shStu=ss.getSheetByName(SH_STUDENTS);
      const stuAll=shStu.getLastRow()>1?shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues()
        .filter(r=>String(r[1]).toUpperCase()===batchCode&&r[6]==='Active'):[];
      const shSess=ss.getSheetByName(SH_SESSIONS);
      const sessAll=shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues()
        .filter(r=>String(r[1]).toUpperCase()===batchCode):[];
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const fbAll=shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,17).getValues()
        .filter(r=>String(r[3]).toUpperCase()===batchCode):[];
      const sessions=sessAll.map(r=>({sessionCode:r[0],sessionDate:r[2]?new Date(r[2]).toLocaleDateString('en-IN'):'',
        sessNo:r[3],instructor:r[4],sessionType:r[5]||'Scheduled',topic:r[6]||''}))
        .sort((a,b)=>a.sessNo-b.sessNo);
      const totalSessions=sessions.length;
      const students=stuAll.map(r=>{
        const enrol=String(r[0]);
        const attended=fbAll.filter(f=>String(f[1]).toUpperCase()===enrol.toUpperCase()).length;
        const attendedSessions=sessions.map(s=>({
          sessionCode:s.sessionCode,sessNo:s.sessNo,
          attended:fbAll.some(f=>String(f[0]).toUpperCase()===s.sessionCode&&String(f[1]).toUpperCase()===enrol.toUpperCase())
        }));
        return {enrollmentNo:enrol,name:r[2],attended,total:totalSessions,
          streakPct:totalSessions>0?Math.round((attended/totalSessions)*100):0,
          atRisk:totalSessions>=4&&Math.round((attended/totalSessions)*100)<75,
          attendedSessions};
      }).sort((a,b)=>b.streakPct-a.streakPct);
      const selectedSession=(() => {
        const sc=(p.sessionCode||'').toUpperCase();
        if(!sc)return null;
        const sess=sessions.find(s=>s.sessionCode===sc);
        if(!sess)return null;
        const presentEnrols=fbAll.filter(f=>String(f[0]).toUpperCase()===sc).map(f=>String(f[1]).toUpperCase());
        return {...sess,
          present:stuAll.filter(r=>presentEnrols.includes(String(r[0]).toUpperCase())).map(r=>({enrollmentNo:r[0],name:r[2]})),
          absent:stuAll.filter(r=>!presentEnrols.includes(String(r[0]).toUpperCase())).map(r=>({enrollmentNo:r[0],name:r[2]}))
        };
      })();
      return respond({status:'ok',batch:{batchCode,centre:batch[1],course:batch[2],type:batch[3]},
        students,sessions,selectedSession,totalStudents:stuAll.length,totalSessions});
    }

    // ── getMasterReport ────────────────────────────────────────
    if (act==='getMasterReport') {
      if(p.pass!==MASTER_PASS)return respond({status:'error',reason:'wrong_password'});
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const shStu=ss.getSheetByName(SH_STUDENTS);
      const shSess=ss.getSheetByName(SH_SESSIONS);
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const batches=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues().filter(r=>r[0]):[];
      const students=shStu.getLastRow()>1?shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues().filter(r=>r[0]):[];
      const sessions=shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues().filter(r=>r[0]):[];
      const feedback=shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,17).getValues().filter(r=>r[0]):[];
      const instrMap={};
      feedback.forEach(f=>{
        const instr=f[6]||'Unknown';
        if(!instrMap[instr])instrMap[instr]={name:instr,q1Sum:0,q2Sum:0,n:0,sessions:new Set()};
        instrMap[instr].q1Sum+=Number(f[9])||0;instrMap[instr].q2Sum+=Number(f[10])||0;
        instrMap[instr].n++;instrMap[instr].sessions.add(f[0]);
      });
      const instructors=Object.values(instrMap).map(i=>({name:i.name,
        avgQ1:i.n>0?Math.round((i.q1Sum/i.n)*10)/10:0,avgQ2:i.n>0?Math.round((i.q2Sum/i.n)*10)/10:0,
        totalFeedback:i.n,totalSessions:i.sessions.size})).sort((a,b)=>b.avgQ1-a.avgQ1);
      const centreMap={};
      batches.forEach(b=>{const c=b[1]||'Unknown';
        if(!centreMap[c])centreMap[c]={centre:c,batches:0,students:0,sessions:0,feedback:0};
        centreMap[c].batches++;
        centreMap[c].students+=students.filter(s=>String(s[1]).toUpperCase()===String(b[0]).toUpperCase()).length;
        centreMap[c].sessions+=sessions.filter(s=>String(s[1]).toUpperCase()===String(b[0]).toUpperCase()).length;
        centreMap[c].feedback+=feedback.filter(f=>String(f[3]).toUpperCase()===String(b[0]).toUpperCase()).length;
      });
      const atRisk=[];
      batches.forEach(b=>{
        const bCode=String(b[0]).toUpperCase();
        const bStu=students.filter(r=>String(r[1]).toUpperCase()===bCode&&r[6]==='Active');
        const bSess=sessions.filter(r=>String(r[1]).toUpperCase()===bCode);
        if(bSess.length<4)return;
        bStu.forEach(s=>{
          const enrol=String(s[0]).toUpperCase();
          const attended=feedback.filter(f=>String(f[3]).toUpperCase()===bCode&&String(f[1]).toUpperCase()===enrol).length;
          const pct=Math.round((attended/bSess.length)*100);
          if(pct<75)atRisk.push({name:s[2],enrollmentNo:s[0],centre:b[1],course:b[2],batchCode:b[0],attended,total:bSess.length,pct});
        });
      });
      return respond({status:'ok',
        summary:{totalBatches:batches.length,totalStudents:students.filter(s=>s[6]==='Active').length,
          totalSessions:sessions.length,totalFeedback:feedback.length},
        instructors,centres:Object.values(centreMap),atRisk,
        assessmentSummary: (() => {
          const shA=ss.getSheetByName(SH_ASSESSMENTS);
          const shM=ss.getSheetByName(SH_MARKS);
          if (!shA||shA.getLastRow()<2) return [];
          const aData=shA.getRange(2,1,shA.getLastRow()-1,8).getValues().filter(r=>r[0]);
          const mData=shM&&shM.getLastRow()>1?shM.getRange(2,1,shM.getLastRow()-1,9).getValues():[];
          return aData.map(a=>{
            const aId=String(a[0]).toUpperCase();
            const marks=mData.filter(m=>String(m[0]).toUpperCase()===aId);
            const appeared=marks.filter(m=>m[3]!=='DNA');
            const passed=appeared.filter(m=>m[5]==='Pass');
            const avgPct=appeared.length?Math.round(appeared.reduce((s,m)=>s+(Number(m[4])||0),0)/appeared.length):0;
            return {assessmentId:a[0],batchCode:a[1],testName:a[2],testType:a[3],
              testDate:a[4]?new Date(a[4]).toLocaleDateString('en-IN'):'',
              totalMarks:a[5],instructor:a[6],appeared:appeared.length,
              passed:passed.length,avgPct,passRate:appeared.length?Math.round((passed.length/appeared.length)*100):0,
              marks:marks.map(m=>({enrollmentNo:m[1],studentName:m[2],marks:m[3],pct:m[4],result:m[5],remarks:m[6]}))
            };
          });
        })(),
        allFeedback:feedback.map(f=>({sessionCode:f[0],enrollmentNo:f[1],studentName:f[2],
          batchCode:f[3],centre:f[4],course:f[5],instructor:f[6],topic:f[7],
          completionStatus:f[8],q1:f[9],q2:f[10],q3:f[11],q4:f[12],q5:f[13],q6:f[14],
          anonymous:f[15],timestamp:f[16]?new Date(f[16]).toLocaleString('en-IN'):''
        }))
      });
    }

    // ── instructorLogin ───────────────────────────────────────
    if (act==='instructorLogin') {
      const name = p.name||'';
      const pin  = p.pin ||'';
      if (!INSTRUCTOR_CREDS[name] || INSTRUCTOR_CREDS[name]!==pin)
        return respond({status:'error',reason:'wrong_credentials'});
      return respond({status:'ok', instructorName:name});
    }

    // ── assignInstructor ───────────────────────────────────────
    if (act==='assignInstructor') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const instructor=p.instructor||'';
      if (!batchCode||!instructor) return respond({status:'error',reason:'missing_params'});
      const sh=ss.getSheetByName(SH_BATCHES);
      if (sh.getLastRow()<2) return respond({status:'error',reason:'batch_not_found'});
      const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      for (let i=0;i<data.length;i++) {
        if (String(data[i][0]).toUpperCase()===batchCode) {
          // Col 9 = Assigned Instructor (index 8)
          sh.getRange(i+2,10).setValue(instructor);
          return respond({status:'ok'});
        }
      }
      return respond({status:'error',reason:'batch_not_found'});
    }

    // ── getInstructorBatches ───────────────────────────────────
    if (act==='getInstructorBatches') {
      const instructor=(p.instructor||'').trim();
      if (!instructor) return respond({status:'ok',batches:[]});
      const sh=ss.getSheetByName(SH_BATCHES);
      if (sh.getLastRow()<2) return respond({status:'ok',batches:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      const batches=data.filter(r=>r[0]&&(r[9]||'')=== instructor).map(r=>({
        batchCode:r[0],centre:r[1],course:r[2],type:r[3],
        batchSlot:  detectSlotOrDate(r[4])?(r[4]||'Full Day'):'Full Day',
        startDate:  detectSlotOrDate(r[4])?(r[5]?new Date(r[5]).toLocaleDateString('en-IN'):''):(r[4]?new Date(r[4]).toLocaleDateString('en-IN'):''),
        endDate:    detectSlotOrDate(r[4])?(r[6]?new Date(r[6]).toLocaleDateString('en-IN'):''):(r[5]?new Date(r[5]).toLocaleDateString('en-IN'):''),
        instructor: detectSlotOrDate(r[4])?(r[9]||''):(r[8]||'')
      }));
      return respond({status:'ok',batches});
    }

    // ── getSessionAttendanceLive ───────────────────────────────
    if (act==='getSessionAttendanceLive') {
      const sessionCode=(p.sessionCode||'').toUpperCase();
      const batchCode=(p.batchCode||'').toUpperCase();
      const shStu=ss.getSheetByName(SH_STUDENTS);
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const stuAll=shStu.getLastRow()>1?shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues()
        .filter(r=>String(r[1]).toUpperCase()===batchCode&&r[6]==='Active'):[];
      const fbRows=shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues()
        .filter(r=>String(r[0]).toUpperCase()===sessionCode):[];
      const presentSet=new Set(fbRows.map(r=>String(r[1]).toUpperCase()));
      return respond({status:'ok',
        present:stuAll.filter(r=>presentSet.has(String(r[0]).toUpperCase())).map(r=>({enrollmentNo:r[0],name:r[2]})),
        absent: stuAll.filter(r=>!presentSet.has(String(r[0]).toUpperCase())).map(r=>({enrollmentNo:r[0],name:r[2]})),
        total:  stuAll.length,
        count:  presentSet.size
      });
    }

    // ── createAssessment ──────────────────────────────────────
    if (act==='createAssessment') {
      const sh=getOrCreateSheet(ss,SH_ASSESSMENTS);
      ensureAssessmentHeaders(sh);
      const batchCode=(p.batchCode||'').toUpperCase();
      // Auto-generate assessment ID
      let maxN=0;
      if (sh.getLastRow()>1) {
        sh.getRange(2,1,sh.getLastRow()-1,1).getValues().forEach(r=>{
          const id=String(r[0]);
          if (id.startsWith(batchCode+'-T')) {
            const n=parseInt(id.replace(batchCode+'-T',''))||0;
            if (n>maxN) maxN=n;
          }
        });
      }
      const assessmentId=batchCode+'-T'+String(maxN+1).padStart(3,'0');
      sh.appendRow([assessmentId,batchCode,p.testName||'',p.testType||'',
        p.testDate?new Date(p.testDate):'',Number(p.totalMarks)||0,p.instructor||'',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),5).setNumberFormat('dd/mm/yyyy');
      return respond({status:'ok',assessmentId});
    }

    // ── saveAssessmentMarks ────────────────────────────────────
    if (act==='saveAssessmentMarks') {
      const sh=getOrCreateSheet(ss,SH_MARKS);
      ensureMarksHeaders(sh);
      const assessmentId=(p.assessmentId||'').toUpperCase();
      const marksArr=JSON.parse(p.marks||'[]'); // [{enrollmentNo,studentName,marks,pct,dna,remarks}]
      const totalMarks=Number(p.totalMarks)||1;
      // Delete existing rows for this assessment (overwrite)
      if (sh.getLastRow()>1) {
        const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
        for (let i=data.length-1;i>=0;i--) {
          if (String(data[i][0]).toUpperCase()===assessmentId) sh.deleteRow(i+2);
        }
      }
      marksArr.forEach(m=>{
        const marks=m.dna?null:Number(m.marks)||0;
        const pct  =m.dna?null:Math.round((marks/totalMarks)*100);
        const result=m.dna?'DNA':pct>=PASS_THRESHOLD?'Pass':'Fail';
        sh.appendRow([assessmentId,m.enrollmentNo||'',m.studentName||'',
          m.dna?'DNA':marks,m.dna?'DNA':pct,result,m.remarks||'',totalMarks,new Date().toISOString()]);
        const lr=sh.getLastRow();
        const bg=m.dna?'#F4F1EB':pct>=PASS_THRESHOLD?'#E8F5EE':'#FEF2F2';
        sh.getRange(lr,1,1,9).setBackground(bg);
        if (!m.dna && pct<PASS_THRESHOLD) sh.getRange(lr,5).setFontColor('#C94A4A').setFontWeight('bold');
      });
      return respond({status:'ok',saved:marksArr.length});
    }

    // ── getAssessments ─────────────────────────────────────────
    if (act==='getAssessments') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_ASSESSMENTS);
      if (!sh||sh.getLastRow()<2) return respond({status:'ok',assessments:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      return respond({status:'ok',assessments:data.filter(r=>r[0]&&String(r[1]).toUpperCase()===batchCode)
        .map(r=>({assessmentId:r[0],batchCode:r[1],testName:r[2],testType:r[3],
          testDate:r[4]?new Date(r[4]).toLocaleDateString('en-IN'):'',
          totalMarks:r[5],instructor:r[6]}))
        .sort((a,b)=>a.assessmentId.localeCompare(b.assessmentId))});
    }

    // ── getAssessmentMarks ─────────────────────────────────────
    if (act==='getAssessmentMarks') {
      const assessmentId=(p.assessmentId||'').toUpperCase();
      const sh=ss.getSheetByName(SH_MARKS);
      if (!sh||sh.getLastRow()<2) return respond({status:'ok',marks:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      return respond({status:'ok',marks:data.filter(r=>String(r[0]).toUpperCase()===assessmentId)
        .map(r=>({enrollmentNo:r[1],studentName:r[2],marks:r[3],pct:r[4],result:r[5],remarks:r[6],totalMarks:r[7]}))});
    }

    // ── getBatchAssessmentSummary (for counselor — aggregates only) ─
    if (act==='getBatchAssessmentSummary') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const reportPass=(p.reportPass||'').trim();
      if (reportPass!==REPORT_PASS) return respond({status:'error',reason:'wrong_password'});
      const shA=ss.getSheetByName(SH_ASSESSMENTS);
      const shM=ss.getSheetByName(SH_MARKS);
      if (!shA||shA.getLastRow()<2) return respond({status:'ok',summary:[]});
      const aData=shA.getRange(2,1,shA.getLastRow()-1,8).getValues()
        .filter(r=>r[0]&&String(r[1]).toUpperCase()===batchCode);
      const mData=shM&&shM.getLastRow()>1?shM.getRange(2,1,shM.getLastRow()-1,9).getValues():[];
      const summary=aData.map(a=>{
        const aId=String(a[0]).toUpperCase();
        const marks=mData.filter(m=>String(m[0]).toUpperCase()===aId);
        const appeared=marks.filter(m=>m[3]!=='DNA');
        const passed=appeared.filter(m=>m[5]==='Pass');
        const avgPct=appeared.length?Math.round(appeared.reduce((s,m)=>s+(Number(m[4])||0),0)/appeared.length):0;
        return {assessmentId:a[0],testName:a[2],testType:a[3],
          testDate:a[4]?new Date(a[4]).toLocaleDateString('en-IN'):'',
          totalMarks:a[5],appeared:appeared.length,passed:passed.length,
          failed:appeared.length-passed.length,dna:marks.length-appeared.length,
          avgPct,passRate:appeared.length?Math.round((passed.length/appeared.length)*100):0
        };
      });
      return respond({status:'ok',summary});
    }

    // ── getEndDate ────────────────────────────────────────────
    if (act==='getEndDate') {
      const course    = p.course||'';
      const startDate = p.startDate||'';
      if (!startDate) return respond({status:'error'});
      const syllabus  = SYLLABI[course];
      const nDays     = syllabus ? syllabus.length : 30;
      const holidays  = getHolidaysForCentre(ss);
      const schedule  = getWorkingSchedule(startDate, nDays, holidays);
      const endDate   = schedule[schedule.length-1];
      return respond({status:'ok',
        endDate: endDate.toISOString().split('T')[0],
        endDateDisplay: dateStr(endDate),
        totalDays: nDays
      });
    }

    // ── getDaySchedule (for instructor day dropdown) ──────────
    if (act==='getDaySchedule') {
      const batchCode = (p.batchCode||'').toUpperCase();
      const shBatch   = ss.getSheetByName(SH_BATCHES);
      const bData     = shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues():[];
      const batch     = bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      if (!batch) return respond({status:'error',reason:'batch_not_found'});
      const course    = batch[2];
      const startDate = detectSlotOrDate(batch[4]) ? batch[5] : batch[4];
      const syllabus  = SYLLABI[course];
      if (!syllabus) return respond({status:'ok',structured:false,course});
      const holidays  = getHolidaysForCentre(ss);
      const schedule  = getWorkingSchedule(String(startDate).split('T')[0]||new Date(startDate).toISOString().split('T')[0], syllabus.length, holidays);
      // Get completed sessions
      const shSess = ss.getSheetByName(SH_SESSIONS);
      const completedDays = new Set();
      if (shSess.getLastRow()>1) {
        shSess.getRange(2,1,shSess.getLastRow()-1,4).getValues()
          .filter(r=>String(r[1]).toUpperCase()===batchCode)
          .forEach(r=>completedDays.add(Number(r[3])));
      }
      const days = syllabus.map((s,i)=>({
        day:       s.day,
        week:      s.week,
        topic:     s.topic,
        date:      dateStr(schedule[i]),
        dateISO:   schedule[i].toISOString().split('T')[0],
        completed: completedDays.has(s.day)
      }));
      return respond({status:'ok',structured:true,course,days});
    }

    // ── autoCreateSessionsForDate (called by 6AM trigger) ─────
    if (act==='autoCreateSessionsForDate') {
      const today     = new Date();
      const todayStr  = today.toISOString().split('T')[0];
      const holidays  = getHolidaysForCentre(ss);
      if (!isWorkingDay(today, holidays)) return respond({status:'ok',message:'Not a working day',created:0});
      const shBatch   = ss.getSheetByName(SH_BATCHES);
      const shSess    = ss.getSheetByName(SH_SESSIONS);
      if (!shBatch||shBatch.getLastRow()<2) return respond({status:'ok',created:0});
      const batches   = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().filter(r=>r[0]);
      const existSess = shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,8).getValues():[]; 
      let created     = 0;
      batches.forEach(b=>{
        const batchCode = String(b[0]).toUpperCase();
        const course    = b[2];
        const batchSlot = b[4]||'Full Day';
        const startDateRaw = detectSlotOrDate(b[4]) ? b[5] : b[4];
        const endDateRaw   = detectSlotOrDate(b[4]) ? b[6] : b[5];
        if (!startDateRaw||!endDateRaw) return;
        const startDate = new Date(startDateRaw); startDate.setHours(12,0,0,0);
        const endDate   = new Date(endDateRaw);   endDate.setHours(23,59,59,0);
        if (today<startDate||today>endDate) return;
        // Check session already exists today
        const alreadyExists = existSess.some(r=>
          String(r[1]).toUpperCase()===batchCode &&
          r[2] && new Date(r[2]).toISOString().split('T')[0]===todayStr
        );
        if (alreadyExists) return;
        // Find which day number today is
        const syllabus  = SYLLABI[course];
        const holidays2 = getHolidaysForCentre(ss);
        const nDays     = syllabus ? syllabus.length : 30;
        const schedule  = getWorkingSchedule(startDateRaw instanceof Date?startDateRaw.toISOString().split('T')[0]:String(startDateRaw).split('T')[0], nDays, holidays2);
        let dayNo = -1;
        schedule.forEach((d,i)=>{ if(d.toISOString().split('T')[0]===todayStr) dayNo=i+1; });
        if (dayNo<0) return; // today not in schedule
        const topic     = syllabus ? syllabus[dayNo-1].topic : '';
        // Count existing sessions for seq number
        let sessNo = 1;
        if (shSess.getLastRow()>1) {
          sessNo = existSess.filter(r=>String(r[1]).toUpperCase()===batchCode).length + 1;
        }
        const sessionCode = batchCode+'-S'+String(sessNo).padStart(2,'0');
        shSess.appendRow([sessionCode,batchCode,new Date(todayStr),dayNo,
          detectSlotOrDate(b[4])?(b[9]||''):(b[8]||''), // instructor
          'Scheduled',topic,                        // type, topic
          'Y',                                      // auto-created flag (col 9)
          new Date().toISOString()]);
        shSess.getRange(shSess.getLastRow(),3).setNumberFormat('dd/mm/yyyy');
        shSess.getRange(shSess.getLastRow(),1,1,10).setBackground(
          batchSlot==='First Half'?'#EEF4FB':batchSlot==='Second Half'?'#F9F3E3':'#F4F1EB'
        );
        created++;
      });
      return respond({status:'ok',created,date:todayStr});
    }

    // ── getStudentPortalData ───────────────────────────────────
    if (act==='getStudentPortalData') {
      const enrollNo = (p.enrollmentNo||'').trim().toUpperCase();
      const dobDD    = (p.dobDD||'').trim();
      const dobMM    = (p.dobMM||'').trim();
      const dob      = dobDD.padStart(2,'0') + dobMM.padStart(2,'0');
      if (!enrollNo||!dob||dob.length!==4) return respond({status:'error',reason:'missing_params'});
      // Find student
      const shStu  = ss.getSheetByName(SH_STUDENTS);
      if (!shStu||shStu.getLastRow()<2) return respond({status:'error',reason:'student_not_found'});
      const stuData = shStu.getRange(2,1,shStu.getLastRow()-1,8).getValues();
      const studentRows = stuData.filter(r=>String(r[0]).toUpperCase()===enrollNo&&r[6]==='Active');
      if (!studentRows.length) return respond({status:'error',reason:'student_not_found'});
      // Verify DOB against first matching record
      const firstStu = studentRows[0];
      if (String(firstStu[3]).replace(/\D/g,'')!==dob) return respond({status:'error',reason:'dob_mismatch'});
      const studentName = firstStu[2];
      // Get all active batches for this student
      const shBatch = ss.getSheetByName(SH_BATCHES);
      const bData   = shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues():[];
      const today   = new Date(); today.setHours(12,0,0,0);
      const todayStr= today.toISOString().split('T')[0];
      const shSess  = ss.getSheetByName(SH_SESSIONS);
      const shFb    = ss.getSheetByName(SH_FEEDBACK);
      const allSess = shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,10).getValues():[];
      const allFb   = shFb&&shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues():[];
      const batchCards = [];
      studentRows.forEach(stuRow=>{
        const batchCode = String(stuRow[1]).toUpperCase();
        const batch     = bData.find(r=>String(r[0]).toUpperCase()===batchCode);
        if (!batch) return;
        const isNew     = detectSlotOrDate(batch[4]);
        const startDate = new Date(isNew?batch[5]:batch[4]); startDate.setHours(0,0,0,0);
        const endDate   = new Date(isNew?batch[6]:batch[5]);  endDate.setHours(23,59,59,0);
        if (today<startDate||today>endDate) return; // batch not active today
        const batchSlot = isNew?(batch[4]||'Full Day'):'Full Day';
        // Slot activation window
        const win   = SLOT_WINDOWS[batchSlot]||SLOT_WINDOWS['Full Day'];
        const nowHr = new Date().getHours();
        const windowOpen   = nowHr >= win.open;
        const windowClosed = nowHr >= win.close;
        const isActive     = windowOpen && !windowClosed;
        // Find today's session
        const todaySess = allSess.find(r=>
          String(r[1]).toUpperCase()===batchCode &&
          r[2] && new Date(r[2]).toISOString().split('T')[0]===todayStr
        );
        // Check if already submitted
        const alreadySubmitted = todaySess && allFb.some(r=>
          String(r[0]).toUpperCase()===String(todaySess[0]).toUpperCase() &&
          String(r[1]).toUpperCase()===enrollNo
        );
        batchCards.push({
          batchCode, course:batch[2], centre:batch[1], type:batch[3], batchSlot,
          instructor:  batch[9]||'',
          sessionCode: todaySess ? String(todaySess[0]) : null,
          sessNo:      todaySess ? todaySess[3] : null,
          topic:       todaySess ? (todaySess[6]||'') : null,
          sessionExists:    !!todaySess,
          alreadySubmitted: !!alreadySubmitted,
          windowActive:     isActive,
          windowOpen:       windowOpen,
          windowClosed:     windowClosed,
          windowOpenHr:     win.open,
          windowCloseHr:    win.close
        });
      });
      // Sort: First Half → Second Half → Full Day
      const slotOrder = {'First Half':0,'Second Half':1,'Full Day':2};
      batchCards.sort((a,b)=>(slotOrder[a.batchSlot]||2)-(slotOrder[b.batchSlot]||2));
      return respond({status:'ok', studentName, enrollmentNo:enrollNo, batches:batchCards});
    }

    return respond({status:'error',reason:'unknown_action'});
  } catch(err){return respond({status:'error',message:err.toString()});}
}

// ═══════════════════════════════════════════════════════════════
//  Sheet helpers
// ═══════════════════════════════════════════════════════════════
function ensureSheets(ss) {
  const defs = {
    [SH_BATCHES]:  ['Batch Code','Centre','Course','Type','Batch Slot','Start Date','End Date','Created By','Created At','Assigned Instructor'],
    [SH_STUDENTS]: ['Enrollment No','Batch Code','Name','DOB (DDMM)','Mobile','Email','Status','Created At'],
    [SH_SESSIONS]: ['Session Code','Batch Code','Session Date','Session No','Instructor','Session Type','Topic Covered','Auto Created','Created At'],
    [SH_FEEDBACK]: ['Session Code','Enrollment No','Student Name','Batch Code','Centre','Course','Instructor','Topic',
                    'Completion Status','Q1 Overall Rating','Q2 Clarity','Q3 Pace','Q4 Doubts Addressed',
                    'Q5 Learned (text)','Q6 Suggestion (text)','Anonymous','Timestamp'],
    [SH_HOLIDAYS]:     ['Date','Holiday Name','Centre','Added At'],
    [SH_ASSESSMENTS]:  ['Assessment ID','Batch Code','Test Name','Test Type','Test Date','Total Marks','Instructor','Created At'],
    [SH_MARKS]:        ['Assessment ID','Enrollment No','Student Name','Marks Obtained','Percentage','Result','Remarks','Total Marks','Updated At']
  };
  Object.entries(defs).forEach(([name,headers])=>{
    let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);
    if(sh.getLastRow()===0||sh.getRange(1,1).getValue()===''){
      sh.getRange(1,1,1,headers.length).setValues([headers])
        .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
      sh.setFrozenRows(1);
    }
  });
}
function ensureAssessmentHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Assessment ID','Batch Code','Test Name','Test Type','Test Date','Total Marks','Instructor','Created At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
  [150,140,220,120,110,100,150,160].forEach((w,i)=>sh.setColumnWidth(i+1,w));
}
function ensureMarksHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Assessment ID','Enrollment No','Student Name','Marks Obtained','Percentage','Result','Remarks','Total Marks','Updated At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
  [150,120,160,110,100,80,160,100,160].forEach((w,i)=>sh.setColumnWidth(i+1,w));
}
function ensureHolidayHeaders(sh){
  if(sh.getLastRow()===0||sh.getRange(1,1).getValue()===''){
    const h=['Date','Holiday Name','Centre','Added At'];
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD);
    sh.setFrozenRows(1);
  }
}
// Detect if col4 contains a Batch Slot string (new schema) or a date (old schema)
function detectSlotOrDate(val) {
  if (!val) return false; // empty = old schema without slot
  const s = String(val);
  return s==='First Half'||s==='Second Half'||s==='Full Day';
}

function getOrCreateSheet(ss,name){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);return s;}

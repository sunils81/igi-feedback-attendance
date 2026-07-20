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

  'Jewelry Design Manual': [
    {day:1,  week:'Week 1', topic:'Introduction to Jewelry Design, Drawing Tools & Basic Diamond Shapes'},
    {day:2,  week:'Week 1', topic:'Drawing Fancy Shape Diamonds and Understanding Facets'},
    {day:3,  week:'Week 1', topic:'Introduction to Diamonds and Gemstones'},
    {day:4,  week:'Week 1', topic:'Pencil Shading of Faceted Gemstones (Colorless)'},
    {day:5,  week:'Week 1', topic:'Fancy Diamond Rendering & Week 1 Assessment'},
    {day:6,  week:'Week 2', topic:'Design Creation on Colorless Diamonds'},
    {day:7,  week:'Week 2', topic:'Colored Rendering on Gemstones'},
    {day:8,  week:'Week 2', topic:'Non-Faceted Gemstone Rendering'},
    {day:9,  week:'Week 2', topic:'Design Creation using Colored Gemstones'},
    {day:10, week:'Week 2', topic:'Gemstone Collection Rendering + Assignment'},
    {day:11, week:'Week 3', topic:'Introduction to Stars, Melee & Solitaire Diamonds'},
    {day:12, week:'Week 3', topic:'Colored Rendering of Stars, Melee & Solitaire'},
    {day:13, week:'Week 3', topic:'Introduction to Setting: Prong & Bezel Setting Illustration'},
    {day:14, week:'Week 3', topic:'Channel, Pave & Flush Setting Illustration'},
    {day:15, week:'Week 3', topic:'Metal & Texture Rendering on Different Forms'},
    {day:16, week:'Week 4', topic:'Inspiration Sources in Jewelry Design'},
    {day:17, week:'Week 4', topic:'Principles & Elements of Design'},
    {day:18, week:'Week 4', topic:'Motif Development & Rendering'},
    {day:19, week:'Week 4', topic:'Types of Jewelry Categories'},
    {day:20, week:'Week 4', topic:'Kids & Gen Z Collection Design'},
    {day:21, week:'Week 5', topic:'Minimalist Collection Design Creation'},
    {day:22, week:'Week 5', topic:'Minimalist Collection Rendering'},
    {day:23, week:'Week 5', topic:'Art Deco Concept Design Creation'},
    {day:24, week:'Week 5', topic:'Art Deco Rendering'},
    {day:25, week:'Week 5', topic:'Art Deco Collection Completion'},
    {day:26, week:'Week 6', topic:'Coral Reef & Ocean Theme Design Creation'},
    {day:27, week:'Week 6', topic:'Coral Reef Theme Rendering'},
    {day:28, week:'Week 6', topic:'Art Nouveau Concept Design Creation'},
    {day:29, week:'Week 6', topic:'Art Nouveau Rendering'},
    {day:30, week:'Week 6', topic:'Art Nouveau Rendering'},
    {day:31, week:'Week 7', topic:'Gold Purity & Karat Calculations'},
    {day:32, week:'Week 7', topic:'Budgeting & Jewelry Costing'},
    {day:33, week:'Week 7', topic:'Jewelry Estimation Test'},
    {day:34, week:'Week 7', topic:"Men's Jewelry Design Creation"},
    {day:35, week:'Week 7', topic:"Men's Jewelry Rendering"},
    {day:36, week:'Week 8', topic:'Bridal Heritage Research & Inspiration'},
    {day:37, week:'Week 8', topic:'Bridal Heritage Necklace Design'},
    {day:38, week:'Week 8', topic:'Bridal Heritage Earrings & Accessories'},
    {day:39, week:'Week 8', topic:'Bridal Heritage Collection Rendering'},
    {day:40, week:'Week 8', topic:'Perspective View & Presentation Sheet'}
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

module.exports = { SYLLABI, getSyllabusForCourse, computeNextSyllabusDay, findSyllabusDay, normalizeTopic };

/**
 * IGI Lecture Attendance & Feedback — Google Apps Script v2
 * Sheet: 1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs
 * Deploy → Web App → Execute as Me → Anyone
 */

const SHEET_ID       = '1UKMgHN9onP_bfr2nOyCvRW4dGqWnh3thzZwf-BCn3cs';
const COUNSELOR_PASS = 'IGI2026';
const MASTER_PASS    = 'IGIMaster2026';
const REPORT_PASS    = 'IGI2026';          // session report uses same password
const PASS_THRESHOLD = 60;

const COURSE_FEES = {
  'Diamond Graduate':                    {fee:165900, regFee:25000, gst:18},
  'Colored Stone Graduate':              {fee:185900, regFee:25000, gst:18},
  'Graduate Gemologist':                 {fee:351800, regFee:50000, gst:18},
  'JewelPad Design':                     {fee:41900,  regFee:0,     gst:18},
  'Navratna Masterclass (10 Half Days)': {fee:51900,  regFee:0,     gst:18},
  'Navratna Masterclass (5 Full Days)':  {fee:51900,  regFee:0,     gst:18},
  'Gem-A Foundation':                    {fee:285500, regFee:0,     gst:18},
  'Gem-A Diploma':                       {fee:422500, regFee:0,     gst:18},
  'Jewelry Design Manual':               {fee:103900, regFee:0,     gst:18},
  'Polished Diamond Grading':            {fee:99900,  regFee:0,     gst:18},
  'Small Diamond Assortment':            {fee:14900,  regFee:0,     gst:18},
  'Rough Diamond':                       {fee:51900,  regFee:0,     gst:18},
  'iRES':                                {fee:35900,  regFee:0,     gst:18},
  'Diamond Essentials 5Cs':            {fee:25900,  regFee:0,     gst:18},
  'JD-CAD':                              {fee:82900,  regFee:0,     gst:18},
  'Smart Learning DG':                   {fee:114900, regFee:0,     gst:18},
  'Smart Learning CSG':                  {fee:114900, regFee:0,     gst:18},
  'Smart Learning GG':                   {fee:229800, regFee:0,     gst:18}
};
const SH_FEES     = 'Student_Fees';
const SH_REVENUE_TARGETS = 'Revenue_Targets';
const SH_REVENUE_CENTRE_TARGETS = 'Revenue_Centre_Targets';
const SH_REVENUE_ANNUAL_TARGETS = 'Revenue_Annual_Targets';
const SH_REVENUE_MONTHLY_ACHIEVED = 'Revenue_Monthly_Achieved';
const SH_REVENUE_TARGET_REVISIONS = 'Revenue_Target_Revisions';
const REVENUE_BACKEND_VERSION = 'revenue-ledger-v4-2026-06-03';
const SH_USER_CREDENTIALS = 'User_Credentials';
const PAYMENT_MODES = ['Cash (Branch)','Card Swipe (Branch)','UPI (Branch)',
  'RTGS / Bank Transfer','Collexo (Online)','Cheque','Demand Draft'];                 // % pass mark
const STUDENT_PORTAL_URL = 'https://igi-feedback-attendance.vercel.app/student';

// ── Slot activation windows (local time hours) ────────────────
const SLOT_WINDOWS = {
  'First Half':  { open: 8,  close: 14 }, // 8AM – 2PM
  'Second Half': { open: 12, close: 20 }, // 12PM – 8PM
  'Full Day':    { open: 8,  close: 24 }  // 8AM – midnight
};

// ── Counselor credentials — unique per counselor ─────────────
const COUNSELOR_CREDS = {
  'Anuradha':  { pin:'IGIAnuradha2026', centres:['Mumbai','Lucknow','Ahmedabad'] },
  'Bianca':    { pin:'IGIBianca2026',   centres:['Mumbai'] },
  'Omkar Kadam':{ pin:'IGIOmkar2026',  centres:['Mumbai'] },
  'Preethy':   { pin:'IGIPreethy2026', centres:['Chennai'] },
  'Sunita':    { pin:'IGISunita2026',  centres:['Delhi'] },
  'Rohit':     { pin:'IGIRohit2026',   centres:['Surat'] },
  'Arpita':    { pin:'IGIArpita2026',  centres:['Kolkata'] },
  'Nadiya':    { pin:'IGINadiya2026',  centres:['Bangalore'] },
  'Rajini':    { pin:'IGIRajini2026',  centres:['Hyderabad'] },
  'Kripa':     { pin:'IGIKripa2026',   centres:['Jaipur'] }
};
const ADMIN_PASS = 'IGI2026'; // admin override — sees all centres

// ── Dual-role instructors (instructor + counselor for their centre) ─
const DUAL_ROLE = {
  'Arjun Mistry':  { centres:['Ahmedabad'] },
  'Piyush Ahuja':  { centres:['Lucknow'] },
  'Anuradha':      { centres:['Mumbai','Lucknow','Ahmedabad'] }
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
const SH_ENROLLMENTS = 'Student_Batches';
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

function hexDigest(bytes) {
  return bytes.map(function(b){var v=(b<0?b+256:b).toString(16);return v.length===1?'0'+v:v;}).join('');
}

function hashPassword(password,salt) {
  return hexDigest(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(salt||'')+'|'+String(password||''),Utilities.Charset.UTF_8));
}

function credentialKey(role,name) {
  return String(role||'').trim().toUpperCase()+'|'+String(name||'').trim().toUpperCase();
}

function ensureUserCredentialHeaders(sh) {
  const h=['Role','Name','Centres','Password Hash','Salt','Must Change Password','Updated At','Active'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[2]!==h[2] || current[7]!==h[7]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}

function defaultCredentialRows() {
  var rows=[];
  Object.keys(COUNSELOR_CREDS).forEach(function(name){
    rows.push({role:'Counselor',name:name,password:COUNSELOR_CREDS[name].pin,centres:COUNSELOR_CREDS[name].centres.join(',')});
  });
  Object.keys(INSTRUCTOR_CREDS).forEach(function(name){
    rows.push({role:'Instructor',name:name,password:INSTRUCTOR_CREDS[name],centres:(DUAL_ROLE[name]&&DUAL_ROLE[name].centres||[]).join(',')});
  });
  return rows;
}

function ensureUserCredentials(ss) {
  var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
  if(!sh)sh=ss.insertSheet(SH_USER_CREDENTIALS);
  ensureUserCredentialHeaders(sh);
  var existing={};
  if(sh.getLastRow()>1){
    sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach(function(r){
      existing[credentialKey(r[0],r[1])]=true;
    });
  }
  defaultCredentialRows().forEach(function(u){
    var key=credentialKey(u.role,u.name);
    if(existing[key])return;
    var salt=Utilities.getUuid();
    sh.appendRow([u.role,u.name,u.centres,hashPassword(u.password,salt),salt,'Y',new Date().toISOString(),'Y']);
    existing[key]=true;
  });
  return sh;
}

function findUserCredential(ss,role,name) {
  var sh=ensureUserCredentials(ss);
  if(sh.getLastRow()<2)return null;
  var key=credentialKey(role,name);
  var rows=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
  for(var i=0;i<rows.length;i++){
    if(credentialKey(rows[i][0],rows[i][1])===key){
      return {rowIndex:i+2,role:rows[i][0],name:rows[i][1],centres:String(rows[i][2]||''),hash:rows[i][3],salt:rows[i][4],mustChange:String(rows[i][5]||'N')==='Y',active:String(rows[i][7]||'Y')!=='N'};
    }
  }
  return null;
}

function authenticateUser(ss,role,name,password) {
  var cred=findUserCredential(ss,role,name);
  if(!cred||!cred.active)return {ok:false};
  if(hashPassword(password,cred.salt)!==cred.hash)return {ok:false};
  return {ok:true,credential:cred};
}

function validateNewPassword(name,newPassword,oldCredential) {
  var pw=String(newPassword||'');
  var low=pw.toLowerCase();
  var compactLow=low.replace(/\s+/g,'');
  var common=['123456','password','igi2026','igimaster2026','admin123','111111','000000'];
  if(pw.length<6)return 'Password must be at least 6 characters.';
  if(common.indexOf(low)>=0)return 'Choose a less predictable password.';
  if(String(name||'')&&compactLow.indexOf(String(name).toLowerCase().replace(/\s+/g,''))>=0)return 'Password cannot contain your name.';
  if(oldCredential&&hashPassword(pw,oldCredential.salt)===oldCredential.hash)return 'New password cannot match the current password.';
  return '';
}

function changeUserPassword(ss,role,name,oldPassword,newPassword) {
  var auth=authenticateUser(ss,role,name,oldPassword);
  if(!auth.ok)return {status:'error',reason:'wrong_current_password'};
  var validation=validateNewPassword(name,newPassword,auth.credential);
  if(validation)return {status:'error',reason:'weak_password',message:validation};
  var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
  var salt=Utilities.getUuid();
  sh.getRange(auth.credential.rowIndex,4,1,5).setValues([[hashPassword(newPassword,salt),salt,'N',new Date().toISOString(),'Y']]);
  return {status:'ok'};
}

function resetUserPassword(ss,role,name,tempPassword) {
  var cred=findUserCredential(ss,role,name);
  if(!cred)return {status:'error',reason:'user_not_found'};
  var validation=validateNewPassword(name,tempPassword,null);
  if(validation)return {status:'error',reason:'weak_password',message:validation};
  var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
  var salt=Utilities.getUuid();
  sh.getRange(cred.rowIndex,4,1,5).setValues([[hashPassword(tempPassword,salt),salt,'Y',new Date().toISOString(),'Y']]);
  return {status:'ok',mustChangePassword:true};
}


function sameName(a,b) {
  return String(a||'').trim().toUpperCase() === String(b||'').trim().toUpperCase();
}

function sheetHeaderMap(sh) {
  var headers=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0].map(function(h){return String(h||'').trim();});
  var map={};
  headers.forEach(function(h,i){if(h)map[h]=i;});
  return map;
}

function rowCell(row,map,name,fallbackIndex) {
  var idx=map&&map[name]!==undefined?map[name]:fallbackIndex;
  return idx!==undefined&&idx>=0?row[idx]:'';
}

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

function getAttendanceCalendarData(ss,p) {
  const role=String(p.role||'counselor').toLowerCase();
  const fromDate=p.fromDate?new Date(p.fromDate):new Date(new Date().getFullYear(),new Date().getMonth(),1);
  const toDate=p.toDate?new Date(p.toDate):new Date(new Date().getFullYear(),new Date().getMonth()+1,0);
  fromDate.setHours(0,0,0,0);toDate.setHours(23,59,59,0);
  const fromKey=dateKey(fromDate),toKey=dateKey(toDate);
  const shBatch=ss.getSheetByName(SH_BATCHES);
  const batchRows=shBatch&&shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().filter(r=>r[0]):[];
  const requestedBatch=String(p.batchCode||'').toUpperCase();
  const centres=String(p.centres||'').split(',').map(s=>s.trim()).filter(Boolean);
  const instructor=String(p.instructor||'').trim();
  const studentId=String(p.studentId||p.enrollmentNo||'').trim().toUpperCase();
  const studentBatchKeys={};
  if(role==='student'&&studentId) {
    const mobileLast4=String(p.mobileLast4||p.mobileLastFour||'').replace(/\D/g,'').slice(-4);
    const student=getStudentById(ss,studentId);
    if(!student||student.status!=='Active')return {status:'error',reason:'student_not_found'};
    const storedLast4=String(student.mobileLast4).replace(/\D/g,'').slice(-4);
    const mobileColLast4=String(student.mobile).replace(/\D/g,'').slice(-4);
    if(mobileLast4.length!==4||(storedLast4!==mobileLast4&&mobileColLast4!==mobileLast4))return {status:'error',reason:'mobile_mismatch'};
    getEnrollmentRows(ss).filter(e=>e.studentId===studentId&&e.status==='Active').forEach(e=>studentBatchKeys[e.batchCode]=true);
  }
  let batches=batchRows.filter(r=>{
    const code=String(r[0]).toUpperCase();
    if(requestedBatch&&code!==requestedBatch)return false;
    if(role==='student')return !!studentBatchKeys[code];
    if(role==='instructor'&&instructor){
      const assigned=detectSlotOrDate(r[4])?(r[9]||''):(r[8]||'');
      return sameName(assigned,instructor);
    }
    if(centres.length&&!centres.includes(r[1]))return false;
    return true;
  });
  const batchMeta={};
  batches.forEach(r=>{
    const isNew=detectSlotOrDate(r[4]);
    batchMeta[String(r[0]).toUpperCase()]={batchCode:String(r[0]).toUpperCase(),centre:r[1]||'',course:r[2]||'',type:r[3]||'',
      batchSlot:isNew?(r[4]||'Full Day'):'Full Day',start:isNew?r[5]:r[4],end:isNew?r[6]:r[5],
      instructor:isNew?(r[9]||''):(r[8]||'')};
  });
  const allowedBatchKeys={};batches.forEach(r=>allowedBatchKeys[String(r[0]).toUpperCase()]=true);
  const shSess=ss.getSheetByName(SH_SESSIONS);
  const allSess=shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues().filter(r=>r[0]):[];
  const shFb=ss.getSheetByName(SH_FEEDBACK);
  const allFb=shFb&&shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,17).getValues().filter(r=>r[0]):[];
  const studentsByBatch={};
  Object.keys(allowedBatchKeys).forEach(bc=>studentsByBatch[bc]=getStudentsForBatch(ss,bc));
  const fbBySession={};
  allFb.forEach(f=>{
    const sc=String(f[0]).toUpperCase();
    if(!fbBySession[sc])fbBySession[sc]=[];
    fbBySession[sc].push(f);
  });
  const today=new Date();today.setHours(0,0,0,0);
  const events=[],actualKeys={};
  allSess.forEach(r=>{
    const bc=String(r[1]).toUpperCase();
    if(!allowedBatchKeys[bc]||!r[2])return;
    const d=new Date(r[2]);d.setHours(0,0,0,0);
    if(d<fromDate||d>toDate)return;
    const sc=String(r[0]).toUpperCase();
    actualKeys[bc+'|'+dateKey(d)]=true;
    const meta=batchMeta[bc]||{};
    const presentRows=fbBySession[sc]||[];
    const total=(studentsByBatch[bc]||[]).length;
    const cancelled=String(r[5]||'').toLowerCase()==='cancelled';
    const status=cancelled?'cancelled':(d>today?'upcoming':(presentRows.length?'completed':'pending'));
    const studentRow=studentId?presentRows.find(f=>String(f[1]).toUpperCase()===studentId):null;
    events.push(calendarEventObject(d,{sessionCode:sc,batchCode:bc,course:meta.course,centre:meta.centre,instructor:r[4]||meta.instructor,
      sessNo:r[3],topic:r[6]||'',sessionType:r[5]||'Scheduled',status,presentCount:presentRows.length,totalStudents:total,
      studentAttendance:(studentId&&d<=today)?(studentRow?'present':'absent'):''}));
  });
  const holidays=getHolidaysForCentre(ss);
  Object.keys(batchMeta).forEach(bc=>{
    const meta=batchMeta[bc];
    if(!meta.start)return;
    const start=new Date(meta.start),end=meta.end?new Date(meta.end):null;
    if(isNaN(start))return;
    start.setHours(12,0,0,0);
    const syllabus=SYLLABI[meta.course]||[];
    let schedule=[];
    if(syllabus.length) {
      schedule=getWorkingSchedule(dateKey(start),syllabus.length,holidays);
    } else if(end&&!isNaN(end)) {
      const cur=new Date(start);end.setHours(12,0,0,0);
      while(cur<=end&&schedule.length<220){if(isWorkingDay(cur,holidays))schedule.push(new Date(cur));cur.setDate(cur.getDate()+1);}
    }
    schedule.forEach((d,i)=>{
      const dk=dateKey(d);
      if(d<fromDate||d>toDate||actualKeys[bc+'|'+dk])return;
      const topic=syllabus[i]?syllabus[i].topic:'Scheduled class';
      events.push(calendarEventObject(d,{sessionCode:'',batchCode:bc,course:meta.course,centre:meta.centre,instructor:meta.instructor,
        sessNo:i+1,topic,sessionType:'Scheduled',status:d<today?'pending':'upcoming',presentCount:0,totalStudents:(studentsByBatch[bc]||[]).length,
        studentAttendance:''}));
    });
  });
  events.sort((a,b)=>String(a.dateISO).localeCompare(String(b.dateISO))||String(a.batchCode).localeCompare(String(b.batchCode))||Number(a.sessNo||0)-Number(b.sessNo||0));
  return {status:'ok',role,fromDate:fromKey,toDate:toKey,events};
}

function calendarEventObject(d,extra) {
  return Object.assign({
    dateISO:dateKey(d),
    day:Utilities.formatDate(d,Session.getScriptTimeZone(),'dd'),
    month:Utilities.formatDate(d,Session.getScriptTimeZone(),'MMM')
  },extra);
}

// ── fetchBatches helper — used by getBatches and counselorLogin ─
function fetchBatches(ss, centres, centre) {
  const sh = ss.getSheetByName(SH_BATCHES);
  if (!sh || sh.getLastRow() < 2) return [];
  const data = sh.getRange(2, 1, sh.getLastRow()-1, 10).getValues();
  const fmtDate = function(v) {
    if (!v) return '';
    if (v instanceof Date) return v.toLocaleDateString('en-IN');
    const d = new Date(v);
    return isNaN(d) ? '' : d.toLocaleDateString('en-IN');
  };
  return data
    .filter(r => r[0] && (!centre || r[1]===centre) && (!centres || !centres.length || centres.includes(r[1])))
    .map(r => {
      const isNew = detectSlotOrDate(r[4]);
      return {
        batchCode:  r[0],
        centre:     r[1],
        course:     r[2],
        type:       r[3],
        batchSlot:  isNew ? String(r[4]).trim() : 'Full Day',
        startDate:  fmtDate(isNew ? r[5] : r[4]),
        endDate:    fmtDate(isNew ? r[6] : r[5]),
        counselor:  isNew ? (r[7]||'') : (r[6]||''),
        instructor: isNew ? (r[9]||'') : (r[8]||'')
      };
    });
}

// ═══════════════════════════════════════════════════════════════
//  GAS CacheService helpers — server-side cache, 5 min TTL
//  Cuts expensive sheet reads from ~3-5s to ~200ms after warm-up
// ═══════════════════════════════════════════════════════════════
const CACHE_TTL = 300; // 5 minutes

function cacheGet(key) {
  try {
    var c = CacheService.getScriptCache();
    var v = c.get(key);
    return v ? JSON.parse(v) : null;
  } catch(ex) { return null; }
}

function cachePut(key, obj) {
  try {
    var c = CacheService.getScriptCache();
    var s = JSON.stringify(obj);
    // GAS cache max value size is 100KB — skip if too large
    if (s.length < 90000) c.put(key, s, CACHE_TTL);
  } catch(ex) {}
}

function cacheRemove(keys) {
  try {
    var c = CacheService.getScriptCache();
    if (Array.isArray(keys)) c.removeAll(keys);
    else c.remove(keys);
  } catch(ex) {}
}

function revenueDashboardCacheKey(p) {
  return 'rev|'+((p&&p.counsellor)||'')+'|'+((p&&p.centres)||'')+'|'+((p&&p.period)||'2026-27')+'|'+((p&&p.isAdmin)||'false');
}

function revenueDashboardCacheKeysForSave(p,effectiveCounsellor) {
  var period=(p&&p.period)||'2026-27';
  var centres=(p&&p.centres)||'';
  var counsellor=(p&&p.counsellor)||'';
  var viewer=(p&&p.viewerCounsellor)||'';
  var effective=effectiveCounsellor||viewer||counsellor||'';
  var keys=[
    revenueDashboardCacheKey(p),
    'rev|'+counsellor+'|'+centres+'|'+period+'|false',
    'rev|'+viewer+'|'+centres+'|'+period+'|false',
    'rev|'+effective+'|'+centres+'|'+period+'|false',
    'rev|'+effective+'||'+period+'|false',
    'rev||'+centres+'|'+period+'|true',
    'rev|||'+period+'|true'
  ];
  var seen={};
  return keys.filter(function(k){if(seen[k])return false;seen[k]=true;return true;});
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
    if (act==='counselorLogin') {
      // Admin override
      if (p.pass===ADMIN_PASS) {
        const adminBatches = fetchBatches(ss, [], '');
        return respond({status:'ok', counselorName:'Admin', centres:Object.keys(CENTRE_CODES), isAdmin:true, authRole:'Admin', mustChangePassword:false, batches:adminBatches});
      }
      const name = p.name||'';
      const pin  = p.pin ||p.pass||'';
      // Check counselor credentials first
      const cred = COUNSELOR_CREDS[name];
      const sheetCred = cred ? authenticateUser(ss,'Counselor',name,pin) : {ok:false};
      if (cred && sheetCred.ok) {
        const batches = fetchBatches(ss, cred.centres, '');
        return respond({status:'ok', counselorName:name, centres:cred.centres, isAdmin:false, authRole:'Counselor', mustChangePassword:sheetCred.credential.mustChange, batches});
      }
      // Check dual-role instructor credentials (Arjun, Piyush, Anuradha)
      const dual = DUAL_ROLE[name];
      const instrCred = dual ? authenticateUser(ss,'Instructor',name,pin) : {ok:false};
      if (dual && instrCred.ok) {
        const batches = fetchBatches(ss, dual.centres, '');
        return respond({status:'ok', counselorName:name, centres:dual.centres, isAdmin:false, isDualRole:true, authRole:'Instructor', mustChangePassword:instrCred.credential.mustChange, batches});
      }
      return respond({status:'error', reason:'wrong_credentials'});
    }
    if (act==='changeUserPassword') {
      if(p.role==='Admin')return respond({status:'error',reason:'admin_password_not_supported'});
      return respond(changeUserPassword(ss,p.role,p.name,p.oldPassword||p.oldPin||'',p.newPassword||p.newPin||''));
    }
    if (act==='resetUserPassword') {
      if(p.adminPass!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      return respond(resetUserPassword(ss,p.role,p.name,p.tempPassword||''));
    }
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
      sh.appendRow([p.batchCode,p.centre,p.course,p.type,p.batchSlot||'Full Day',p.startDate,p.endDate,p.counselorName||'Counselor',new Date().toISOString(),p.instructor||'']);
      sh.getRange(sh.getLastRow(),1,1,10).setBackground(sh.getLastRow()%2===0?'#F4F1EB':'#FDFCF9');
      // Invalidate all batches cache keys (centres vary per counsellor)
      try { CacheService.getScriptCache().remove('batches||'); } catch(_e){}
      return respond({status:'ok',batchCode:p.batchCode});
    }

    // ── getBatches ─────────────────────────────────────────────
    if (act==='getBatches') {
      const centre=(p.centre||'').trim();
      const centres=(p.centres||'').split(',').map(s=>s.trim()).filter(Boolean);
      const cKey='batches|'+centres.sort().join(',')+'|'+centre;
      const cached=cacheGet(cKey);
      if(cached) return respond(cached);
      const result={status:'ok', batches: fetchBatches(ss, centres, centre)};
      cachePut(cKey, result);
      return respond(result);
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
      const shEn=getOrCreateSheet(ss,SH_ENROLLMENTS);
      ensureEnrollmentHeaders(shEn);
      ensureStudentHeaders(sh);
      const mobileLast4=String(p.mobileLast4||'').replace(/\D/g,'').slice(-4);
      const studentId=String(p.enrollmentNo).trim().toUpperCase();
      const batchCodes=String(p.batchCodes||p.batchCode||'').split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
      if(!studentId||!p.name||mobileLast4.length!==4||!batchCodes.length)return respond({status:'error',reason:'missing_params'});
      const existing=getStudentById(ss,studentId);
      if(existing){
        const row=existing.rowIndex;
        sh.getRange(row,3,1,4).setValues([[p.name,mobileLast4,p.mobile||'',p.email||'']]);
        sh.getRange(row,7).setValue('Active');
      }else{
        sh.appendRow([studentId,batchCodes[0],p.name,mobileLast4,p.mobile||'',p.email||'','Active',new Date().toISOString(),'','']);
        sh.getRange(sh.getLastRow(),4).setNumberFormat('@STRING@');
      }
      const existingEnrollments=getEnrollmentRows(ss)
        .filter(e=>e.studentId===studentId&&batchCodes.includes(e.batchCode)&&e.status==='Active')
        .map(e=>e.batchCode);
      const added=[];
      batchCodes.forEach(batchCode=>{
        if(existingEnrollments.includes(batchCode))return;
        shEn.appendRow([studentId,batchCode,'Active',new Date().toISOString()]);
        added.push(batchCode);
      });
      const emailResult=sendStudentWelcomeEmail(ss,studentId,{force:false});
      return respond({status:'ok',enrollmentNo:studentId,added,skipped:existingEnrollments,email:emailResult});
    }

    // ── getStudents ────────────────────────────────────────────
    if (act==='getStudents') {
      const batch=(p.batchCode||'').toUpperCase();
      return respond({status:'ok',students:getStudentsForBatch(ss,batch)});
    }

    // ── getStudentProfile ─────────────────────────────────────
    if (act==='getStudentProfile') {
      const studentId=(p.studentId||p.enrollmentNo||'').trim().toUpperCase();
      if(!studentId)return respond({status:'error',reason:'missing_params'});
      const student=getStudentById(ss,studentId);
      if(!student)return respond({status:'error',reason:'student_not_found'});
      const batches=getEnrollmentRows(ss).filter(e=>e.studentId===studentId&&e.status==='Active').map(e=>e.batchCode);
      return respond({status:'ok',student:{enrollmentNo:student.id,name:student.name,mobileLast4:student.mobileLast4,mobile:student.mobile,email:student.email,batches}});
    }

    // ── resendStudentWelcomeEmail ─────────────────────────────
    if (act==='resendStudentWelcomeEmail') {
      const studentId=(p.studentId||p.enrollmentNo||'').trim().toUpperCase();
      if(!studentId)return respond({status:'error',reason:'missing_params'});
      const result=sendStudentWelcomeEmail(ss,studentId,{force:true});
      if(result.status==='student_not_found')return respond({status:'error',reason:'student_not_found',email:result});
      return respond({status:'ok',email:result});
    }

    // ── removeStudent ──────────────────────────────────────────
    if (act==='removeStudent') {
      const batch=(p.batchCode||'').toUpperCase();
      const studentId=(p.enrollmentNo||p.studentId||'').toUpperCase();
      const shEn=getOrCreateSheet(ss,SH_ENROLLMENTS);
      ensureEnrollmentHeaders(shEn);
      if(shEn.getLastRow()>1){
        const data=shEn.getRange(2,1,shEn.getLastRow()-1,4).getValues();
        for(let i=0;i<data.length;i++){
          if(String(data[i][0]).toUpperCase()===studentId&&String(data[i][1]).toUpperCase()===batch&&data[i][2]==='Active'){
            shEn.getRange(i+2,3).setValue('Inactive');
          }
        }
      }
      if(studentId&&batch)shEn.appendRow([studentId,batch,'Inactive',new Date().toISOString()]);
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
      cacheRemove('holidays');
      return respond({status:'ok'});
    }

    // ── getHolidays ────────────────────────────────────────────
    if (act==='getHolidays') {
      const cached=cacheGet('holidays');
      if(cached) return respond(cached);
      const sh=ss.getSheetByName(SH_HOLIDAYS);
      const national = NATIONAL_HOLIDAYS.map(d=>({date:d,name:'National Holiday',centre:'All',type:'national'}));
      const custom = [];
      if(sh&&sh.getLastRow()>1){
        sh.getRange(2,1,sh.getLastRow()-1,3).getValues().forEach(r=>{
          if(r[0]) custom.push({date:new Date(r[0]).toISOString().split('T')[0],name:r[1]||'Holiday',centre:r[2]||'All',type:'custom'});
        });
      }
      const result={status:'ok',holidays:[...national,...custom]};
      cachePut('holidays', result);
      return respond(result);
    }

    // ── createSession ──────────────────────────────────────────
    if (act==='createSession') {
      const batch=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_SESSIONS);
      let sessNo=1;
      const sessionDate=p.sessionDate||dateKey(new Date());
      if(sh.getLastRow()>1){
        const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
        const batchSess=data.filter(r=>String(r[1]).toUpperCase()===batch);
        sessNo=batchSess.length+1;
        for(const r of batchSess){
          if(r[2]&&dateKey(r[2])===dateKey(sessionDate))
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
        const bData=shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues();
        const bRow=bData.find(r=>String(r[0]).toUpperCase()===batch);
        if(bRow){
          const isNew = detectSlotOrDate(bRow[4]);
          const endRaw = isNew ? bRow[6] : bRow[5];
          const endDate=endRaw ? new Date(endRaw) : null;
          if(endDate && new Date(sessionDate)>endDate) sessionType='Extended';
        }
      }
      if(p.sessionType) sessionType=p.sessionType; // override if explicitly set
      const sessionCode=batch+'-S'+String(sessNo).padStart(2,'0');
      sh.appendRow([sessionCode,batch,new Date(sessionDate),sessNo,p.instructor,sessionType,p.topic||'','N',new Date().toISOString()]);
      sh.getRange(sh.getLastRow(),3).setNumberFormat('dd/mm/yyyy');
      return respond({status:'ok',sessionCode,sessNo,sessionType});
    }

    // ── updateSessionTopic ─────────────────────────────────────
    if (act==='updateSessionTopic') {
      // Called when student selects topic on feedback form — updates session record
      const sessionCode=(p.sessionCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_SESSIONS);
      if(sh.getLastRow()>1){
        const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
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
      const data=sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      return respond({status:'ok',sessions:data.filter(r=>r[0]&&(!batch||String(r[1]).toUpperCase()===batch))
        .map(r=>({sessionCode:r[0],batchCode:r[1],sessionDate:r[2]?new Date(r[2]).toLocaleDateString('en-IN'):'',
          sessNo:r[3],instructor:r[4],sessionType:r[5]||'Scheduled',topic:r[6]||''}))
        .sort((a,b)=>b.sessNo-a.sessNo)});
    }

    // ── getBatchSessionTimeline ───────────────────────────────
    if (act==='getBatchSessionTimeline') {
      const batch=(p.batchCode||'').toUpperCase();
      const shSess=ss.getSheetByName(SH_SESSIONS);
      const shStu=ss.getSheetByName(SH_STUDENTS);
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const total=getStudentsForBatch(ss,batch).length;
      const sess=shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues()
        .filter(r=>r[0]&&String(r[1]).toUpperCase()===batch):[];
      const fb=shFb&&shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues():[];
      const today=new Date(); today.setHours(0,0,0,0);
      const timeline=sess.map(s=>{
        const d=s[2]?new Date(s[2]):null;
        if(d)d.setHours(0,0,0,0);
        const count=fb.filter(f=>String(f[0]).toUpperCase()===String(s[0]).toUpperCase()).length;
        return {sessionCode:s[0],sessNo:s[3],sessionDate:s[2]?new Date(s[2]).toLocaleDateString('en-IN'):'',
          topic:s[6]||'',instructor:s[4]||'',sessionType:s[5]||'Scheduled',count,total,
          pct:total?Math.round((count/total)*100):0,isToday:d?d.getTime()===today.getTime():false,
          isPast:d?d<today:false};
      }).sort((a,b)=>Number(b.sessNo)-Number(a.sessNo));
      return respond({status:'ok',timeline,total});
    }

    // ── getAttendanceCalendar ─────────────────────────────────
    if (act==='getAttendanceCalendar') {
      return respond(getAttendanceCalendarData(ss,p));
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
      const mobileLast4=String(p.mobileLast4||p.mobileLastFour||p.dob||'').replace(/\D/g,'').slice(-4);
      const shSess=ss.getSheetByName(SH_SESSIONS);
      if(shSess.getLastRow()<2)return respond({status:'error',reason:'invalid_session'});
      const sessData=shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues();
      const session=sessData.find(r=>String(r[0]).toUpperCase()===sessionCode);
      if(!session)return respond({status:'error',reason:'invalid_session'});
      const sessDate=new Date(session[2]);
      if((new Date()-sessDate)/3600000>FEEDBACK_HRS) return respond({status:'error',reason:'window_closed'});
      const batchCode=String(session[1]).toUpperCase();
      const student=getStudentsForBatch(ss,batchCode).find(s=>String(s.enrollmentNo).toUpperCase()===enrollNo);
      if(!student)return respond({status:'error',reason:'student_not_found'});
      if(mobileLast4.length!==4)return respond({status:'error',reason:'missing_params'});
      const storedLast4=String(student.mobileLast4).replace(/\D/g,'').slice(-4);
      const mobileColLast4=String(student.mobile).replace(/\D/g,'').slice(-4);
      if(storedLast4!==mobileLast4&&mobileColLast4!==mobileLast4)return respond({status:'error',reason:'mobile_mismatch'});
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      if(shFb.getLastRow()>1){
        const fbData=shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues();
        if(fbData.find(r=>String(r[0]).toUpperCase()===sessionCode&&String(r[1]).toUpperCase()===enrollNo))
          return respond({status:'error',reason:'already_submitted'});
      }
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const bData=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues():[];
      const batch=bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      return respond({status:'ok',studentName:student.name,enrollmentNo:student.enrollmentNo,
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
          const sData=shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues();
          for(let i=0;i<sData.length;i++){
            if(String(sData[i][0]).toUpperCase()===(p.sessionCode||'').toUpperCase()&&!sData[i][6]){
              shSess.getRange(i+2,7).setValue(p.topic);break;
            }
          }
        }
      }
      // Invalidate session report cache for this batch
      cacheRemove('sessionReport|'+(p.batchCode||'').toUpperCase());
      return respond({status:'ok'});
    }

    // ── getSessionReport (counselor — attendance + topics only) ─
    if (act==='getSessionReport') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const reportPass=(p.reportPass||'').trim();
      if(reportPass!==REPORT_PASS)return respond({status:'error',reason:'wrong_password'});
      const srKey='sessionReport|'+batchCode;
      const srCached=cacheGet(srKey);
      if(srCached) return respond(srCached);
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const bData=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues():[];
      const batch=bData.find(r=>String(r[0]).toUpperCase()===batchCode);
      if(!batch)return respond({status:'error',reason:'batch_not_found'});
      const stuAll=getStudentsForBatch(ss,batchCode);
      const shSess=ss.getSheetByName(SH_SESSIONS);
      const sessAll=shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues()
        .filter(r=>String(r[1]).toUpperCase()===batchCode):[];
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const fbAll=shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,11).getValues()
        .filter(r=>String(r[3]).toUpperCase()===batchCode):[];
      const feedbackBySession={};
      const attendedByStudent={};
      fbAll.forEach(f=>{
        const sc=String(f[0]).toUpperCase();
        const enrol=String(f[1]).toUpperCase();
        if(!feedbackBySession[sc])feedbackBySession[sc]=[];
        feedbackBySession[sc].push(f);
        if(!attendedByStudent[enrol])attendedByStudent[enrol]=new Set();
        attendedByStudent[enrol].add(sc);
      });
      const sessions=sessAll.map(r=>{
        const sc = String(r[0]).toUpperCase();
        // Feedback rows for this session: col 8=Q1, col 9=Q2 (0-indexed from fbAll row)
        // Attendance_Feedback cols: 0=Session Code,1=Student ID,2=Student Name,3=Batch Code,
        //   4=Centre,5=Course,6=Instructor,7=Topic,8=Completion,9=Q1,10=Q2,11=Q3,12=Q4,13=Q5,14=Q6,15=Anonymous,16=Timestamp
        const sessFb = feedbackBySession[sc]||[];
        const q1vals = sessFb.map(f=>Number(f[9])||0).filter(v=>v>0);
        const q2vals = sessFb.map(f=>Number(f[10])||0).filter(v=>v>0);
        const avgQ1  = q1vals.length ? Math.round((q1vals.reduce((s,v)=>s+v,0)/q1vals.length)*10)/10 : null;
        const avgQ2  = q2vals.length ? Math.round((q2vals.reduce((s,v)=>s+v,0)/q2vals.length)*10)/10 : null;
        const avgScore = (avgQ1!==null && avgQ2!==null) ? Math.round(((avgQ1+avgQ2)/2)*10)/10
                       : avgQ1!==null ? avgQ1
                       : avgQ2!==null ? avgQ2 : null;
        return {sessionCode:r[0],sessionDate:r[2]?new Date(r[2]).toLocaleDateString('en-IN'):'',
          sessNo:r[3],instructor:r[4],sessionType:r[5]||'Scheduled',topic:r[6]||'',
          avgQ1, avgQ2, avgScore, responseCount:sessFb.length};
      }).sort((a,b)=>a.sessNo-b.sessNo);
      const totalSessions=sessions.length;
      const students=stuAll.map(r=>{
        const enrol=String(r.enrollmentNo);
        const attendedSet=attendedByStudent[enrol.toUpperCase()]||new Set();
        const attended=attendedSet.size;
        const attendedSessions=sessions.map(s=>({
          sessionCode:s.sessionCode,sessNo:s.sessNo,
          attended:attendedSet.has(String(s.sessionCode).toUpperCase())
        }));
        return {enrollmentNo:enrol,name:r.name,attended,total:totalSessions,
          streakPct:totalSessions>0?Math.round((attended/totalSessions)*100):0,
          atRisk:totalSessions>=4&&Math.round((attended/totalSessions)*100)<75,
          attendedSessions};
      }).sort((a,b)=>b.streakPct-a.streakPct);
      const selectedSession=(() => {
        const sc=(p.sessionCode||'').toUpperCase();
        if(!sc)return null;
        const sess=sessions.find(s=>s.sessionCode===sc);
        if(!sess)return null;
        const presentEnrols=(feedbackBySession[sc]||[]).map(f=>String(f[1]).toUpperCase());
        return {...sess,
          present:stuAll.filter(r=>presentEnrols.includes(String(r.enrollmentNo).toUpperCase())).map(r=>({enrollmentNo:r.enrollmentNo,name:r.name})),
          absent:stuAll.filter(r=>!presentEnrols.includes(String(r.enrollmentNo).toUpperCase())).map(r=>({enrollmentNo:r.enrollmentNo,name:r.name}))
        };
      })();
      const srResult={status:'ok',batch:{batchCode,centre:batch[1],course:batch[2],type:batch[3]},
        students,sessions,selectedSession,totalStudents:stuAll.length,totalSessions};
      cachePut(srKey, srResult);
      return respond(srResult);
    }

    // ── getMasterReport ────────────────────────────────────────
    if (act==='getMasterReport') {
      if(p.pass!==MASTER_PASS)return respond({status:'error',reason:'wrong_password'});
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const shStu=ss.getSheetByName(SH_STUDENTS);
      const shSess=ss.getSheetByName(SH_SESSIONS);
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const batches=shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,8).getValues().filter(r=>r[0]):[];
      const students=getStudentRows(ss);
      const sessions=shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues().filter(r=>r[0]):[];
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
        centreMap[c].students+=getStudentsForBatch(ss,String(b[0]).toUpperCase()).length;
        centreMap[c].sessions+=sessions.filter(s=>String(s[1]).toUpperCase()===String(b[0]).toUpperCase()).length;
        centreMap[c].feedback+=feedback.filter(f=>String(f[3]).toUpperCase()===String(b[0]).toUpperCase()).length;
      });
      const atRisk=[];
      batches.forEach(b=>{
        const bCode=String(b[0]).toUpperCase();
        const bStu=getStudentsForBatch(ss,bCode);
        const bSess=sessions.filter(r=>String(r[1]).toUpperCase()===bCode);
        if(bSess.length<4)return;
        bStu.forEach(s=>{
          const enrol=String(s.enrollmentNo).toUpperCase();
          const attended=feedback.filter(f=>String(f[3]).toUpperCase()===bCode&&String(f[1]).toUpperCase()===enrol).length;
          const pct=Math.round((attended/bSess.length)*100);
          if(pct<75)atRisk.push({name:s.name,enrollmentNo:s.enrollmentNo,centre:b[1],course:b[2],batchCode:b[0],attended,total:bSess.length,pct});
        });
      });
      return respond({status:'ok',
        summary:{totalBatches:batches.length,totalStudents:students.filter(s=>s.status==='Active').length,
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
      const auth=INSTRUCTOR_CREDS[name] ? authenticateUser(ss,'Instructor',name,pin) : {ok:false};
      if (!auth.ok)
        return respond({status:'error',reason:'wrong_credentials'});
      const dual = DUAL_ROLE[name];
      return respond({
        status:'ok',
        instructorName: name,
        isDualRole:  !!dual,
        centres:     dual ? dual.centres : [],
        authRole:    'Instructor',
        mustChangePassword: auth.credential.mustChange
      });
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
      const data=sh.getRange(2,1,sh.getLastRow()-1,10).getValues();
      const batches=data.filter(r=>{
        const assigned = detectSlotOrDate(r[4]) ? (r[9]||'') : (r[8]||'');
        return r[0] && sameName(assigned, instructor);
      }).map(r=>({
        batchCode:r[0],centre:r[1],course:r[2],type:r[3],
        batchSlot:  detectSlotOrDate(r[4])?(r[4]||'Full Day'):'Full Day',
        startDate:  detectSlotOrDate(r[4])?(r[5]?new Date(r[5]).toLocaleDateString('en-IN'):''):(r[4]?new Date(r[4]).toLocaleDateString('en-IN'):''),
        endDate:    detectSlotOrDate(r[4])?(r[6]?new Date(r[6]).toLocaleDateString('en-IN'):''):(r[5]?new Date(r[5]).toLocaleDateString('en-IN'):''),
        instructor: detectSlotOrDate(r[4])?(r[9]||''):(r[8]||'')
      }));
      return respond({status:'ok',batches});
    }

    // ── getInstructorTodaySessions ────────────────────────────
    if (act==='getInstructorTodaySessions') {
      const instructor=(p.instructor||'').trim();
      if (!instructor) return respond({status:'ok',date:dateStr(new Date()),batches:[]});
      const shBatch=ss.getSheetByName(SH_BATCHES);
      const shSess=ss.getSheetByName(SH_SESSIONS);
      if (!shBatch||shBatch.getLastRow()<2) return respond({status:'ok',date:dateStr(new Date()),batches:[]});

      const today = new Date(); today.setHours(12,0,0,0);
      const todayISO = dateKey(today);
      const batchRows = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().filter(r=>r[0]);
      const sessions = shSess&&shSess.getLastRow()>1 ? shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues() : [];
      const holidays = getHolidaysForCentre(ss);
      const isWorkDay = isWorkingDay(today, holidays);

      const batches = batchRows.filter(r=>{
        const assigned = detectSlotOrDate(r[4]) ? (r[9]||'') : (r[8]||'');
        return sameName(assigned, instructor);
      }).map(r=>{
        const isNew = detectSlotOrDate(r[4]);
        const batchCode = String(r[0]).toUpperCase();
        const startRaw = isNew ? r[5] : r[4];
        const endRaw = isNew ? r[6] : r[5];
        const startDate = startRaw ? new Date(startRaw) : null;
        const endDate = endRaw ? new Date(endRaw) : null;
        if (startDate) startDate.setHours(0,0,0,0);
        if (endDate) endDate.setHours(23,59,59,0);
        const activeToday = !!(startDate&&endDate&&today>=startDate&&today<=endDate);
        const todaySess = sessions.find(s=>
          String(s[1]).toUpperCase()===batchCode &&
          s[2] && dateKey(s[2])===todayISO
        );
        return {
          batchCode, centre:r[1], course:r[2], type:r[3],
          batchSlot:isNew?(r[4]||'Full Day'):'Full Day',
          startDate:startRaw?new Date(startRaw).toLocaleDateString('en-IN'):'',
          endDate:endRaw?new Date(endRaw).toLocaleDateString('en-IN'):'',
          activeToday, workingDay:isWorkDay,
          sessionCode:todaySess?String(todaySess[0]):'',
          sessNo:todaySess?todaySess[3]:'',
          sessionType:todaySess?(todaySess[5]||'Scheduled'):'',
          topic:todaySess?(todaySess[6]||''):''
        };
      }).sort((a,b)=>{
        const slotOrder={'First Half':0,'Second Half':1,'Full Day':2};
        return (slotOrder[a.batchSlot]||2)-(slotOrder[b.batchSlot]||2) || a.batchCode.localeCompare(b.batchCode);
      });
      return respond({status:'ok',date:dateStr(today),todayISO,batches});
    }

    // ── getSessionAttendanceLive ───────────────────────────────
    if (act==='getSessionAttendanceLive') {
      const sessionCode=(p.sessionCode||'').toUpperCase();
      const batchCode=(p.batchCode||'').toUpperCase();
      const shFb=ss.getSheetByName(SH_FEEDBACK);
      const stuAll=getStudentsForBatch(ss,batchCode);
      const fbRows=shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues()
        .filter(r=>String(r[0]).toUpperCase()===sessionCode):[];
      const presentSet=new Set(fbRows.map(r=>String(r[1]).toUpperCase()));
      return respond({status:'ok',
        present:stuAll.filter(r=>presentSet.has(String(r.enrollmentNo).toUpperCase())).map(r=>({enrollmentNo:r.enrollmentNo,name:r.name})),
        absent: stuAll.filter(r=>!presentSet.has(String(r.enrollmentNo).toUpperCase())).map(r=>({enrollmentNo:r.enrollmentNo,name:r.name})),
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

    // ── autoCreateSessionsForDate — handled by top-level function below ─
    if (act==='autoCreateSessionsForDate') {
      const result = autoCreateSessionsForDate();
      return respond(result);
    }
    // ── getStudentPortalData ───────────────────────────────────
    if (act==='getStudentPortalData') {
      const enrollNo = (p.studentId||p.enrollmentNo||'').trim().toUpperCase();
      const mobileLast4 = String(p.mobileLast4||p.mobileLastFour||'').replace(/\D/g,'').slice(-4);
      if (!enrollNo||mobileLast4.length!==4) return respond({status:'error',reason:'missing_params'});
      // Find student
      const student = getStudentById(ss,enrollNo);
      if (!student||student.status!=='Active') return respond({status:'error',reason:'student_not_found'});
      // Verify mobile last 4 against first matching record.
      const storedLast4 = String(student.mobileLast4).replace(/\D/g,'').slice(-4);
      const mobileColLast4 = String(student.mobile).replace(/\D/g,'').slice(-4);
      if (storedLast4!==mobileLast4&&mobileColLast4!==mobileLast4) return respond({status:'error',reason:'mobile_mismatch'});
      const studentName = student.name;
      // Get all active batches for this student
      const shBatch = ss.getSheetByName(SH_BATCHES);
      const bData   = shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues():[];
      const today   = new Date(); today.setHours(12,0,0,0);
      const todayStr= dateKey(today);
      const shSess  = ss.getSheetByName(SH_SESSIONS);
      const shFb    = ss.getSheetByName(SH_FEEDBACK);
      const allSess = shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,10).getValues():[];
      const allFb   = shFb&&shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,3).getValues():[];
      const batchCards = [];
      const studentBatches=getEnrollmentRows(ss).filter(e=>e.studentId===enrollNo&&e.status==='Active');
      studentBatches.forEach(stuRow=>{
        const batchCode = String(stuRow.batchCode).toUpperCase();
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
          r[2] && dateKey(r[2])===todayStr
        );
        // Check if already submitted
        const alreadySubmitted = todaySess && allFb.some(r=>
          String(r[0]).toUpperCase()===String(todaySess[0]).toUpperCase() &&
          String(r[1]).toUpperCase()===enrollNo
        );
        const batchSessions = allSess.filter(r=>String(r[1]).toUpperCase()===batchCode && r[2])
          .sort((a,b)=>new Date(b[2])-new Date(a[2]));
        const history = batchSessions.slice(0,7).map(r=>{
          const attended = allFb.some(f=>String(f[0]).toUpperCase()===String(r[0]).toUpperCase() && String(f[1]).toUpperCase()===enrollNo);
          return {sessionCode:String(r[0]),sessNo:r[3],sessionDate:new Date(r[2]).toLocaleDateString('en-IN'),
            topic:r[6]||'',attended};
        });
        const attendedCount = batchSessions.filter(r=>allFb.some(f=>
          String(f[0]).toUpperCase()===String(r[0]).toUpperCase() && String(f[1]).toUpperCase()===enrollNo
        )).length;
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
          windowCloseHr:    win.close,
          history,
          historySummary: {
            attended: attendedCount,
            total: batchSessions.length,
            pct: batchSessions.length?Math.round((attendedCount/batchSessions.length)*100):0
          }
        });
      });
      // Sort: First Half → Second Half → Full Day
      const slotOrder = {'First Half':0,'Second Half':1,'Full Day':2};
      batchCards.sort((a,b)=>(slotOrder[a.batchSlot]||2)-(slotOrder[b.batchSlot]||2));
      return respond({status:'ok', studentName, enrollmentNo:enrollNo, batches:batchCards});
    }

    // ── fixOldBatches (one-time utility to insert Batch Slot col) ─
    if (act==='fixOldBatches') {
      if (p.pass!==ADMIN_PASS) return respond({status:'error',reason:'auth'});
      const sh = ss.getSheetByName(SH_BATCHES);
      if (!sh||sh.getLastRow()<2) return respond({status:'ok',fixed:0});
      const data = sh.getRange(2,1,sh.getLastRow()-1,10).getValues();
      let fixed = 0;
      data.forEach((r,i)=>{
        if (!r[0]) return;
        // Check if col4 is a date (old schema) not a slot string
        if (!detectSlotOrDate(r[4]) && r[4]) {
          // Old schema: shift cols right by inserting 'Full Day' at position 4 (col E)
          sh.insertColumnBefore(5);
          sh.getRange(i+2,5).setValue('Full Day');
          fixed++;
        }
      });
      // Refresh header
      sh.getRange(1,1,1,10).setValues([['Batch Code','Centre','Course','Type','Batch Slot','Start Date','End Date','Created By','Created At','Assigned Instructor']])
        .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD);
      return respond({status:'ok',fixed});
    }

    // ── cancelSession ──────────────────────────────────────────
    if (act==='cancelSession') {
      const sessionCode = (p.sessionCode||'').toUpperCase();
      const reason      = p.reason||'Instructor absent';
      const cancelledBy = p.cancelledBy||'';
      const sh = ss.getSheetByName(SH_SESSIONS);
      if (!sh||sh.getLastRow()<2) return respond({status:'error',reason:'not_found'});
      const data = sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      for (let i=0;i<data.length;i++) {
        if (String(data[i][0]).toUpperCase()===sessionCode) {
          sh.getRange(i+2,6).setValue('Cancelled');   // Session Type col
          sh.getRange(i+2,7).setValue('CANCELLED: '+reason+' (by '+cancelledBy+')'); // Topic col
          sh.getRange(i+2,1,1,9).setBackground('#FEF2F2');
          sh.getRange(i+2,6).setFontColor('#C94A4A').setFontWeight('bold');
          return respond({status:'ok', sessionCode, reason});
        }
      }
      return respond({status:'error',reason:'not_found'});
    }

    // ── updateSessionTopic (instructor overrides auto topic) ───
    if (act==='updateSessionTopic') {
      const sessionCode = (p.sessionCode||'').toUpperCase();
      const topic       = p.topic||'';
      const instructor  = p.instructor||'';
      const sh = ss.getSheetByName(SH_SESSIONS);
      if (!sh||sh.getLastRow()<2) return respond({status:'error',reason:'not_found'});
      const data = sh.getRange(2,1,sh.getLastRow()-1,9).getValues();
      for (let i=0;i<data.length;i++) {
        if (String(data[i][0]).toUpperCase()===sessionCode) {
          if (topic)      sh.getRange(i+2,7).setValue(topic);
          if (instructor) sh.getRange(i+2,5).setValue(instructor);
          // Mark as Confirmed (not just Scheduled/Auto-Created)
          if (sh.getRange(i+2,6).getValue()==='Scheduled'||sh.getRange(i+2,6).getValue()==='') {
            sh.getRange(i+2,6).setValue('Confirmed');
          }
          return respond({status:'ok'});
        }
      }
      return respond({status:'error',reason:'not_found'});
    }

    // ── getTodaySessions (for instructor + counselor) ──────────
    if (act==='getTodaySessions') {
      const instructor = (p.instructor||'').trim();
      const centres    = (p.centres||'').split(',').map(s=>s.trim()).filter(Boolean);
      const todayStr   = dateKey(new Date());
      const shSess     = ss.getSheetByName(SH_SESSIONS);
      const shBatch    = ss.getSheetByName(SH_BATCHES);
      if (!shSess||shSess.getLastRow()<2) return respond({status:'ok',sessions:[]});
      const sessData   = shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues();
      const batchData  = shBatch&&shBatch.getLastRow()>1
        ? shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues() : [];

      const todays = sessData.filter(r=>{
        if (!r[0]) return false;
        const sessDate = dateKey(r[2]);
        if (sessDate !== todayStr) return false;
        if (instructor && !sameName(r[4], instructor)) {
          // Allow dual-role if batch is in their centre
          if (centres.length) {
            const b = batchData.find(b=>String(b[0]).toUpperCase()===String(r[1]).toUpperCase());
            if (!b) return false;
            const isNew = detectSlotOrDate(b[4]);
            const centre = b[1];
            if (!centres.includes(centre)) return false;
          } else return false;
        }
        return true;
      });

      const sessions = todays.map(r=>{
        const batchCode = String(r[1]).toUpperCase();
        const b = batchData.find(b=>String(b[0]).toUpperCase()===batchCode);
        const isNew = b ? detectSlotOrDate(b[4]) : false;
        // Get syllabus day info
        const course   = b ? b[2] : '';
        const syllabus = SYLLABI[course];
        const dayNo    = Number(r[3]);
        const dayTopic = syllabus && dayNo>0 ? syllabus[dayNo-1] : null;
        return {
          sessionCode:    String(r[0]),
          batchCode:      r[1],
          sessNo:         r[3],
          instructor:     r[4],
          sessionType:    r[5]||'Scheduled',
          topic:          r[6]||'',
          autoCreated:    r[7]==='Y',
          cancelled:      String(r[5]).toLowerCase()==='cancelled',
          course,
          centre:         b ? b[1] : '',
          batchSlot:      b ? (isNew?String(b[4]).trim():'Full Day') : 'Full Day',
          scheduledTopic: dayTopic ? dayTopic.topic : '',
          week:           dayTopic ? dayTopic.week  : '',
          dayNo
        };
      });
      return respond({status:'ok', sessions});
    }

    if (act==='getCourseFees') return respond({status:'ok',fees:COURSE_FEES,modes:PAYMENT_MODES});

    if (act==='saveFeeRecord') {
      ensureSheets(ss);
      var sh=ss.getSheetByName(SH_FEES);
      var sid=(p.studentId||'').trim(),bc=(p.batchCode||'').trim().toUpperCase();
      if (!sid||!bc) return respond({status:'error',reason:'missing_params'});
      var cf=COURSE_FEES[p.course]||{fee:0,regFee:0,gst:18};
      var courseFee=Number(p.courseFee)||cf.fee;
      var gstAmt=Math.round(courseFee*cf.gst/100),courseFeeG=courseFee+gstAmt;
      var regFee=Number(p.regFee)||cf.regFee,regGst=Math.round(regFee*cf.gst/100),regFeeG=regFee+regGst;
      var discPct=Number(p.discountPct)||0;
      var discAmt=Number(p.discountAmt)||Math.round(courseFeeG*discPct/100);
      var tdsPct=Number(p.tdsPct)||0;
      var tdsAmt=Number(p.tdsAmt)||Math.round((courseFeeG-discAmt)*tdsPct/100);
      var netPayable=courseFeeG-discAmt-tdsAmt;
      var nInst=Number(p.nInst)||1;
      var insts=[];
      var existingPaidDates=['','',''];
      var rowIdx=-1;
      if(sh.getLastRow()>1){
        var ex=sh.getRange(2,1,sh.getLastRow()-1,34).getValues();
        for(var ki=0;ki<ex.length;ki++){
          if(String(ex[ki][0]).trim()===sid&&String(ex[ki][2]).trim().toUpperCase()===bc){
            rowIdx=ki+2;
            existingPaidDates=[ex[ki][21],ex[ki][27],ex[ki][33]];
            break;
          }
        }
      }
      for (var ii=1;ii<=3;ii++) {
        var paid=p['inst'+ii+'Paid']==='Y'?'Y':'N';
        var paidDate=paid==='Y'
          ? (p['inst'+ii+'PaidDate']?new Date(p['inst'+ii+'PaidDate']):(existingPaidDates[ii-1]||new Date()))
          : '';
        insts.push([Number(p['inst'+ii+'Amt'])||0,
          p['inst'+ii+'Due']?new Date(p['inst'+ii+'Due']):'',
          paid,
          paidDate,
          p['inst'+ii+'Mode']||'',p['inst'+ii+'Ref']||'']);
      }
      var collected=0,overdue=false;
      var tod=new Date();tod.setHours(0,0,0,0);
      for (var ji=0;ji<nInst;ji++){
        if(insts[ji][2]==='Y') collected+=Number(insts[ji][0]);
        else if(insts[ji][1]&&new Date(insts[ji][1])<tod) overdue=true;
      }
      var outstanding=netPayable-collected;
      var feeStatus=collected>=netPayable?'Paid':overdue?'Overdue':collected>0?'Partial':'Pending';
      var row=[sid,p.studentName||'',bc,p.centre||'',p.course||'',
        courseFee,gstAmt,courseFeeG,regFee,regGst,regFeeG,
        discPct,discAmt,p.discountReason||'',tdsPct,tdsAmt,netPayable,nInst,
        insts[0][0],insts[0][1],insts[0][2],insts[0][3],insts[0][4],insts[0][5],
        insts[1][0],insts[1][1],insts[1][2],insts[1][3],insts[1][4],insts[1][5],
        insts[2][0],insts[2][1],insts[2][2],insts[2][3],insts[2][4],insts[2][5],
        collected,outstanding,feeStatus,p.enteredBy||'Counselor',new Date().toISOString()];
      if(rowIdx>0) sh.getRange(rowIdx,1,1,row.length).setValues([row]);
      else{sh.appendRow(row);rowIdx=sh.getLastRow();}
      var bgM={Paid:'#E8F5EE',Partial:'#FFF9E6',Pending:'#F4F1EB',Overdue:'#FEF2F2'};
      sh.getRange(rowIdx,1,1,row.length).setBackground(bgM[feeStatus]||'#F4F1EB');
      [20,26,32].forEach(function(col,i){if(insts[i][1])sh.getRange(rowIdx,col).setNumberFormat('dd/mm/yyyy');});
      [22,28,34].forEach(function(col,i){if(insts[i][3])sh.getRange(rowIdx,col).setNumberFormat('dd/mm/yyyy');});
      return respond({status:'ok',feeStatus,netPayable,collected,outstanding});
    }

    if (act==='getFeeRecords') {
      var shf=ss.getSheetByName(SH_FEES);
      if(!shf||shf.getLastRow()<2) return respond({status:'ok',records:[]});
      var fdata=shf.getRange(2,1,shf.getLastRow()-1,41).getValues();
      var fbc=(p.batchCode||'').toUpperCase();
      var fcentres=(p.centres||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
      return respond({status:'ok',records:fdata.filter(function(r){
        if(!r[0]) return false;
        if(fbc&&String(r[2]).toUpperCase()!==fbc) return false;
        if(fcentres.length&&!fcentres.includes(r[3])) return false;
        return true;
      }).map(function(r){
        var ft=normalizedFeeTotals(r);
        return {studentId:r[0],studentName:r[1],batchCode:r[2],centre:r[3],course:r[4],
          courseFee:r[5],gstAmt:r[6],courseFeeG:r[7],regFee:r[8],regGst:r[9],regFeeG:r[10],
          discPct:r[11],discAmt:ft.discAmt,discReason:r[13],tdsPct:r[14],tdsAmt:ft.tdsAmt,
          netPayable:ft.netPayable,nInst:r[17],
          inst1:{amt:r[18],due:r[19]?new Date(r[19]).toLocaleDateString('en-IN'):'',paid:r[20],paidDate:r[21]?new Date(r[21]).toLocaleDateString('en-IN'):'',mode:r[22],ref:r[23]},
          inst2:{amt:r[24],due:r[25]?new Date(r[25]).toLocaleDateString('en-IN'):'',paid:r[26],paidDate:r[27]?new Date(r[27]).toLocaleDateString('en-IN'):'',mode:r[28],ref:r[29]},
          inst3:{amt:r[30],due:r[31]?new Date(r[31]).toLocaleDateString('en-IN'):'',paid:r[32],paidDate:r[33]?new Date(r[33]).toLocaleDateString('en-IN'):'',mode:r[34],ref:r[35]},
          collected:ft.collected,outstanding:ft.outstanding,feeStatus:ft.feeStatus,enteredBy:r[39]};
      })});
    }

    if (act==='getStudentFeeStatus') {
      var fsid=(p.studentId||p.enrollmentNo||'').trim().toUpperCase();
      if(!fsid) return respond({status:'ok',found:false});
      var sfsh=ss.getSheetByName(SH_FEES);
      if(!sfsh||sfsh.getLastRow()<2) return respond({status:'ok',found:false});
      var sfd=sfsh.getRange(2,1,sfsh.getLastRow()-1,41).getValues();
      var sfr=sfd.filter(function(r){return String(r[0]).trim().toUpperCase()===fsid&&r[0];});
      if(!sfr.length) return respond({status:'ok',found:false});
      return respond({status:'ok',found:true,summaries:sfr.map(function(r){
        var ft=normalizedFeeTotals(r);
        var ni=Number(r[17])||1;
        var id=[
          {amt:r[18],due:r[19],paid:r[20],paidDate:r[21]},
          {amt:r[24],due:r[25],paid:r[26],paidDate:r[27]},
          {amt:r[30],due:r[31],paid:r[32],paidDate:r[33]}
        ];
        var nd=null,na=0;
        for(var xi=0;xi<ni;xi++){if(id[xi].paid!=='Y'&&id[xi].due){nd=new Date(id[xi].due).toLocaleDateString('en-IN');na=id[xi].amt;break;}}
        var todayFee=new Date();todayFee.setHours(0,0,0,0);
        return {batchCode:r[2],course:r[4],netPayable:ft.netPayable,collected:ft.collected,outstanding:ft.outstanding,feeStatus:ft.feeStatus,nextDueDate:nd,nextDueAmt:na,
          installments:id.slice(0,ni).map(function(inst){
            var due=inst.due?new Date(inst.due):null;
            if(due) due.setHours(0,0,0,0);
            return {amount:Number(inst.amt)||0,dueDate:inst.due?new Date(inst.due).toLocaleDateString('en-IN'):'',
              paid:inst.paid==='Y'?'Y':'N',paidDate:inst.paidDate?new Date(inst.paidDate).toLocaleDateString('en-IN'):'',
              overdue:inst.paid!=='Y'&&due&&due<todayFee};
          })};
      })});
    }

    if (act==='getRevenueSummary') {
      if(p.masterPass!==MASTER_PASS) return respond({status:'error',reason:'auth'});
      var rvsh=ss.getSheetByName(SH_FEES);
      if(!rvsh||rvsh.getLastRow()<2) return respond({status:'ok',national:{expected:0,collected:0,outstanding:0,overdue:0},centres:[],batches:[],modes:{}});
      var rvd=rvsh.getRange(2,1,rvsh.getLastRow()-1,41).getValues().filter(function(r){return r[0];});
      var nE=0,nC=0,nO=0,nOv=0,cM={},bM={},mM={};
      rvd.forEach(function(r){
        var ft=normalizedFeeTotals(r);
        var net=ft.netPayable,coll=ft.collected,out=ft.outstanding;
        var st=ft.feeStatus,cen=r[3],bc=r[2];
        nE+=net;nC+=coll;nO+=out;
        if(st==='Overdue') nOv+=out;
        if(!cM[cen]) cM[cen]={centre:cen,expected:0,collected:0,outstanding:0,overdue:0,students:0,bs:{}};
        cM[cen].expected+=net;cM[cen].collected+=coll;cM[cen].outstanding+=out;cM[cen].students++;cM[cen].bs[bc]=1;
        if(st==='Overdue') cM[cen].overdue+=out;
        if(!bM[bc]) bM[bc]={batchCode:bc,centre:cen,course:r[4],expected:0,collected:0,outstanding:0,students:0,overdue:0};
        bM[bc].expected+=net;bM[bc].collected+=coll;bM[bc].outstanding+=out;bM[bc].students++;
        if(st==='Overdue') bM[bc].overdue+=out;
        [[r[20],r[22],r[18]],[r[26],r[28],r[24]],[r[32],r[34],r[30]]].forEach(function(x){
          if(x[0]==='Y'&&x[1]) mM[x[1]]=(mM[x[1]]||0)+(Number(x[2])||0);
        });
      });
      return respond({status:'ok',
        national:{expected:nE,collected:nC,outstanding:nO,overdue:nOv},
        centres:Object.values(cM).map(function(c){return {centre:c.centre,expected:c.expected,collected:c.collected,outstanding:c.outstanding,overdue:c.overdue,students:c.students,batches:Object.keys(c.bs).length};}),
        batches:Object.values(bM),modes:mM});
    }

    if (act==='getRevenueDashboard') {
      ensureSheets(ss);
      const rKey=revenueDashboardCacheKey(p);
      const cached=cacheGet(rKey);
      if(cached) return respond(cached);
      const result=buildRevenueDashboard(ss,p);
      cachePut(rKey, result);
      return respond(result);
    }

    if (act==='getAdminDashboard') {
      ensureSheets(ss);
      if (String(p.isAdmin)!=='true') return respond({status:'error',reason:'auth'});
      return respond(buildAdminDashboard(ss,p));
    }

    if (act==='saveRevenueTargets') {
      ensureSheets(ss);
      var rows=[], centreRows=[], monthlyRows=[], monthlyScope=null;
      try { rows=JSON.parse(p.targets||'[]'); } catch(_e) { rows=[]; }
      try { centreRows=JSON.parse(p.centreTargets||'[]'); } catch(_e2) { centreRows=[]; }
      try { monthlyRows=JSON.parse(p.monthlyRows||'[]'); } catch(_e3) { monthlyRows=[]; }
      try { monthlyScope=JSON.parse(p.monthlyScope||'null'); } catch(_e4) { monthlyScope=null; }
      var submittedMonthlyRows=monthlyRows.length;
      var effectiveCounsellor=revenueEffectiveCounsellor(p);
      if(String(p.isAdmin)!=='true'&&effectiveCounsellor){
        centreRows=[];
        rows=rows.filter(function(r){return revenueSameCounsellor(r.counsellor,effectiveCounsellor);});
        monthlyRows=monthlyRows.filter(function(r){return revenueSameCounsellor(r.counsellor,effectiveCounsellor);});
        if(monthlyScope)monthlyScope.counsellor=effectiveCounsellor;
      }
      if(!rows.length&&!centreRows.length&&!monthlyRows.length) return respond({status:'error',reason:'no_revenue_rows',message:'No annual target or monthly revenue rows were submitted.'});
      var actor=p.updatedBy||p.counsellor||'Counselor';
      var savedCentre=saveRevenueCentreTargetRows(ss,centreRows,actor);
      var savedTargets=saveRevenueAnnualTargetRows(ss,rows,actor);
      var savedMonthly=saveRevenueMonthlyAchievedRows(ss,monthlyRows,actor,monthlyScope);
      try { SpreadsheetApp.flush(); } catch(_flushErr) {}
      if(submittedMonthlyRows&&!savedMonthly&&!savedCentre&&!savedTargets){
        return respond({status:'error',reason:'monthly_revenue_not_saved',message:'This month is already locked or the submitted counsellor does not match your login.',savedMonthly:0,backendVersion:REVENUE_BACKEND_VERSION,dashboard:buildRevenueDashboard(ss,p)});
      }
      // Invalidate all revenue cache entries so next fetch reflects new data.
      try {
        cacheRemove(revenueDashboardCacheKeysForSave(p,effectiveCounsellor));
      } catch(_e){}
      var freshDashboard=buildRevenueDashboard(ss,p);
      return respond({status:'ok',saved:savedCentre+savedTargets+savedMonthly,savedCentre:savedCentre,savedTargets:savedTargets,savedMonthly:savedMonthly,savedAt:new Date().toISOString(),backendVersion:REVENUE_BACKEND_VERSION,dashboard:freshDashboard});
    }

    return respond({status:'error',reason:'unknown_action'});
  } catch(err){return respond({status:'error',message:err.toString()});}
}

// ═══════════════════════════════════════════════════════════════
//  TOP-LEVEL TRIGGER FUNCTIONS (visible to Apps Script triggers)
// ═══════════════════════════════════════════════════════════════

/**
 * autoCreateSessionsForDate — run daily at 6AM via Apps Script trigger
 * Creates sessions for all active batches for today (Mon-Fri, non-holidays)
 * Can also be called via doGet for manual trigger
 */
function autoCreateSessionsForDate() {
  const ss        = SpreadsheetApp.openById(SHEET_ID);
  const today     = new Date();
  const todayStr  = dateKey(today);
  const holidays  = getHolidaysForCentre(ss);
  if (!isWorkingDay(today, holidays)) return {status:'ok', message:'Not a working day', created:0};

  ensureSheets(ss);
  const shBatch   = ss.getSheetByName(SH_BATCHES);
  const shSess    = ss.getSheetByName(SH_SESSIONS);
  if (!shBatch || shBatch.getLastRow()<2) return {status:'ok', created:0};

  const batches   = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().filter(r=>r[0]);
  const existSess = shSess && shSess.getLastRow()>1
    ? shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues() : [];

  let created = 0;
  batches.forEach(b => {
    const batchCode    = String(b[0]).toUpperCase();
    const course       = b[2];
    const isNew        = detectSlotOrDate(b[4]);
    const batchSlot    = isNew ? (b[4]||'Full Day') : 'Full Day';
    const startDateRaw = isNew ? b[5] : b[4];
    const endDateRaw   = isNew ? b[6] : b[5];
    const instructor   = isNew ? (b[9]||'') : (b[8]||'');

    if (!startDateRaw || !endDateRaw) return;
    const startDate = new Date(startDateRaw); startDate.setHours(0,0,0,0);
    const endDate   = new Date(endDateRaw);   endDate.setHours(23,59,59,0);
    if (today < startDate || today > endDate) return;

    // Check session already exists today
    const alreadyExists = existSess.some(r =>
      String(r[1]).toUpperCase() === batchCode &&
      r[2] && dateKey(r[2]) === todayStr
    );
    if (alreadyExists) return;

    // Find which day number today is
    const syllabus  = SYLLABI[course];
    const nDays     = syllabus ? syllabus.length : 30;
    const schedule  = getWorkingSchedule(
      startDateRaw instanceof Date
        ? dateKey(startDateRaw)
        : String(startDateRaw).split('T')[0],
      nDays, holidays
    );

    let dayNo = -1;
    schedule.forEach((d,i) => {
      if (dateKey(d) === todayStr) dayNo = i+1;
    });
    if (dayNo < 0) return; // today not in schedule

    const topic   = syllabus ? syllabus[dayNo-1].topic : '';
    let sessNo    = 1;
    if (shSess && shSess.getLastRow() > 1) {
      sessNo = existSess.filter(r => String(r[1]).toUpperCase() === batchCode).length + 1;
    }

    const sessionCode = batchCode + '-S' + String(sessNo).padStart(2,'0');
    shSess.appendRow([
      sessionCode, batchCode, new Date(todayStr), dayNo,
      instructor, 'Scheduled', topic, 'Y', new Date().toISOString()
    ]);
    shSess.getRange(shSess.getLastRow(), 3).setNumberFormat('dd/mm/yyyy');
    shSess.getRange(shSess.getLastRow(), 1, 1, 9).setBackground(
      batchSlot==='First Half' ? '#EEF4FB' :
      batchSlot==='Second Half'? '#F9F3E3' : '#F4F1EB'
    );
    created++;
  });

  Logger.log('autoCreateSessionsForDate: created ' + created + ' sessions for ' + todayStr);
  return {status:'ok', created, date:todayStr};
}

/**
 * fixOldBatches — run ONCE to insert Batch Slot column into old batch rows
 */
function fixOldBatches() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName(SH_BATCHES);
  if (!sh || sh.getLastRow() < 2) { Logger.log('No batches found'); return; }
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  Logger.log('Current headers: ' + headers.join(', '));
  if (headers.includes('Batch Slot')) { Logger.log('Already fixed'); return; }
  sh.insertColumnBefore(5);
  sh.getRange(1,5).setValue('Batch Slot')
    .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  if (sh.getLastRow() > 1)
    sh.getRange(2,5,sh.getLastRow()-1,1).setValue('Full Day');
  Logger.log('Done — manually set First Half/Second Half per batch in the sheet');
}

// ═══════════════════════════════════════════════════════════════
//  Sheet helpers
// ═══════════════════════════════════════════════════════════════
function getStudentRows(ss) {
  const sh=ss.getSheetByName(SH_STUDENTS);
  if(!sh||sh.getLastRow()<2)return [];
  const data=sh.getRange(2,1,sh.getLastRow()-1,10).getValues();
  const map={};
  data.forEach((r,i)=>{
    const id=String(r[0]||'').trim().toUpperCase();
    if(!id)return;
    const mobileDigits=String(r[4]||'').replace(/\D/g,'');
    const last4=mobileDigits.length>=4?mobileDigits.slice(-4):String(r[3]||'').replace(/\D/g,'').slice(-4);
    const row={id,enrollmentNo:id,primaryBatch:String(r[1]||'').toUpperCase(),name:r[2]||'',mobileLast4:last4,
      mobile:r[4]||'',email:r[5]||'',status:r[6]||'Active',createdAt:r[7]||'',
      welcomeEmailStatus:r[8]||'',welcomeEmailSentAt:r[9]||'',rowIndex:i+2,raw:r};
    if(!map[id]||map[id].status!=='Active')map[id]=row;
  });
  return Object.values(map);
}

function sendStudentWelcomeEmail(ss, studentId, opts) {
  opts=opts||{};
  const student=getStudentById(ss,studentId);
  if(!student)return {status:'student_not_found'};
  const email=String(student.email||'').trim();
  if(!email){
    setStudentWelcomeStatus(ss,student.id,'No Email','');
    return {status:'no_email'};
  }
  if(!opts.force&&String(student.welcomeEmailStatus||'').indexOf('Sent')===0){
    return {status:'already_sent',sentAt:student.welcomeEmailSentAt||''};
  }

  const batches=getStudentBatchDetails(ss,student.id);
  const batchLines=batches.length
    ? batches.map(b=>'- '+b.batchCode+(b.course?' | '+b.course:'')+(b.centre?' | '+b.centre:'')+(b.instructor?' | Instructor: '+b.instructor:'')).join('\n')
    : '- '+(student.primaryBatch||'Assigned batch');
  const batchHtml=batches.length
    ? '<ul>'+batches.map(b=>'<li><strong>'+escapeHtml(b.batchCode)+'</strong>'
        +(b.course?' - '+escapeHtml(b.course):'')
        +(b.centre?' ('+escapeHtml(b.centre)+')':'')
        +(b.instructor?'<br>Instructor: '+escapeHtml(b.instructor):'')+'</li>').join('')+'</ul>'
    : '<p>'+escapeHtml(student.primaryBatch||'Assigned batch')+'</p>';
  const subject='IGI Student Portal Access - '+student.id;
  const body='Dear '+student.name+',\n\n'
    +'Welcome to IGI School of Gemology.\n\n'
    +'Your Student ID: '+student.id+'\n'
    +'Your Password: '+student.mobileLast4+' (last 4 digits of your registered mobile number)\n'
    +'Student Portal: '+STUDENT_PORTAL_URL+'\n\n'
    +'To sign in, use your Student ID and the password above.\n\n'
    +'Your batch details:\n'+batchLines+'\n\n'
    +'Regards,\nIGI School of Gemology';
  const htmlBody='<p>Dear '+escapeHtml(student.name)+',</p>'
    +'<p>Welcome to IGI School of Gemology.</p>'
    +'<p><strong>Your Student ID:</strong> '+escapeHtml(student.id)+'<br>'
    +'<strong>Your Password:</strong> '+escapeHtml(student.mobileLast4)+' <span style="color:#666">(last 4 digits of your registered mobile number)</span><br>'
    +'<strong>Student Portal:</strong> <a href="'+STUDENT_PORTAL_URL+'">'+STUDENT_PORTAL_URL+'</a></p>'
    +'<p>To sign in, use your Student ID and the password above.</p>'
    +'<p><strong>Your batch details:</strong></p>'+batchHtml
    +'<p>Regards,<br>IGI School of Gemology</p>';
  try {
    MailApp.sendEmail({to:email,subject,body,htmlBody,name:'IGI School of Gemology'});
    const sentAt=new Date().toISOString();
    setStudentWelcomeStatus(ss,student.id,'Sent',sentAt);
    return {status:'sent',sentAt,email};
  } catch(err) {
    setStudentWelcomeStatus(ss,student.id,'Failed: '+String(err).slice(0,120),'');
    return {status:'failed',message:String(err),email};
  }
}

function setStudentWelcomeStatus(ss, studentId, status, sentAt) {
  const sh=ss.getSheetByName(SH_STUDENTS);
  if(!sh)return;
  ensureStudentHeaders(sh);
  const student=getStudentById(ss,studentId);
  if(!student)return;
  sh.getRange(student.rowIndex,9).setValue(status||'');
  sh.getRange(student.rowIndex,10).setValue(sentAt||'');
}

function getStudentBatchDetails(ss, studentId) {
  const sh=ss.getSheetByName(SH_BATCHES);
  const batchRows=sh&&sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,10).getValues():[];
  const active=getEnrollmentRows(ss).filter(e=>e.studentId===studentId&&e.status==='Active').map(e=>e.batchCode);
  return active.map(code=>{
    const r=batchRows.find(b=>String(b[0]).toUpperCase()===code);
    if(!r)return {batchCode:code};
    const isNew=detectSlotOrDate(r[4]);
    return {
      batchCode:code,
      centre:r[1]||'',
      course:r[2]||'',
      type:r[3]||'',
      batchSlot:isNew?(r[4]||'Full Day'):'Full Day',
      instructor:isNew?(r[9]||''):(r[8]||'')
    };
  });
}

function escapeHtml(value) {
  return String(value||'').replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function dateKey(value) {
  if (!value) return '';
  if (!(value instanceof Date)) {
    const m=String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0');
  }
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return String(value).split('T')[0];
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getStudentById(ss, studentId) {
  const id=String(studentId||'').trim().toUpperCase();
  return getStudentRows(ss).find(s=>s.id===id)||null;
}

function getEnrollmentRows(ss) {
  const rows=[];
  const explicitKeys={};
  const shEn=ss.getSheetByName(SH_ENROLLMENTS);
  if(shEn&&shEn.getLastRow()>1){
    shEn.getRange(2,1,shEn.getLastRow()-1,4).getValues().forEach((r,i)=>{
      const studentId=String(r[0]||'').trim().toUpperCase();
      const batchCode=String(r[1]||'').trim().toUpperCase();
      if(studentId&&batchCode){
        explicitKeys[studentId+'|'+batchCode]=true;
        rows.push({studentId,batchCode,status:r[2]||'Active',enrolledAt:r[3]||'',rowIndex:i+2,source:'link'});
      }
    });
  }
  const sh=ss.getSheetByName(SH_STUDENTS);
  if(sh&&sh.getLastRow()>1){
    sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach((r,i)=>{
      const studentId=String(r[0]||'').trim().toUpperCase();
      const batchCode=String(r[1]||'').trim().toUpperCase();
      if(studentId&&batchCode&&!explicitKeys[studentId+'|'+batchCode])
        rows.push({studentId,batchCode,status:r[6]||'Active',enrolledAt:r[7]||'',rowIndex:i+2,source:'legacy'});
    });
  }
  return rows;
}

function getStudentsForBatch(ss, batchCode) {
  const batch=String(batchCode||'').trim().toUpperCase();
  const students=getStudentRows(ss);
  const byId={};students.forEach(s=>byId[s.id]=s);
  const ids={};
  getEnrollmentRows(ss).forEach(e=>{
    if(e.batchCode===batch&&e.status==='Active')ids[e.studentId]=true;
  });
  return Object.keys(ids).map(id=>byId[id]).filter(Boolean)
    .map(s=>({enrollmentNo:s.id,name:s.name,mobileLast4:s.mobileLast4,dob:s.mobileLast4,mobile:s.mobile,email:s.email,status:s.status,
      welcomeEmailStatus:s.welcomeEmailStatus,welcomeEmailSentAt:s.welcomeEmailSentAt}))
    .sort((a,b)=>String(a.name).localeCompare(String(b.name)));
}

function ensureSheets(ss) {
  const defs = {
    [SH_BATCHES]:  ['Batch Code','Centre','Course','Type','Batch Slot','Start Date','End Date','Created By','Created At','Assigned Instructor'],
    [SH_STUDENTS]: ['Student ID','Primary Batch Code','Name','Mobile Last 4','Mobile','Email','Status','Created At','Welcome Email Status','Welcome Email Sent At'],
    [SH_ENROLLMENTS]: ['Student ID','Batch Code','Status','Enrolled At'],
    [SH_SESSIONS]: ['Session Code','Batch Code','Session Date','Session No','Instructor','Session Type','Topic Covered','Auto Created','Created At'],
    [SH_FEEDBACK]: ['Session Code','Student ID','Student Name','Batch Code','Centre','Course','Instructor','Topic',
                    'Completion Status','Q1 Overall Rating','Q2 Clarity','Q3 Pace','Q4 Doubts Addressed',
                    'Q5 Learned (text)','Q6 Suggestion (text)','Anonymous','Timestamp'],
    [SH_FEES]: ['Student ID','Student Name','Batch Code','Centre','Course',
                    'Course Fee','GST Amount','Course Fee + GST','Registration Fee','Registration GST','Registration Fee + GST',
                    'Discount %','Discount Amount','Discount Reason','TDS %','TDS Amount','Net Payable','Installments',
                    'Inst 1 Amount','Inst 1 Due','Inst 1 Paid','Inst 1 Paid Date','Inst 1 Mode','Inst 1 Reference',
                    'Inst 2 Amount','Inst 2 Due','Inst 2 Paid','Inst 2 Paid Date','Inst 2 Mode','Inst 2 Reference',
                    'Inst 3 Amount','Inst 3 Due','Inst 3 Paid','Inst 3 Paid Date','Inst 3 Mode','Inst 3 Reference',
                    'Collected','Outstanding','Fee Status','Entered By','Updated At'],
    [SH_REVENUE_TARGETS]: ['Month','Counsellor','Centre','Target Course Fee','Target Course Fee + GST','Notes','Updated By','Updated At'],
    [SH_REVENUE_CENTRE_TARGETS]: ['Period','Centre','Annual Course Fee Target','Annual Course Fee + GST Target','Notes','Updated By','Updated At'],
    [SH_REVENUE_ANNUAL_TARGETS]: ['Period','Counsellor','Assigned Centre','Annual Course Fee Target','Annual Course Fee + GST Target','Notes','Updated By','Updated At'],
    [SH_REVENUE_MONTHLY_ACHIEVED]: ['Month','Period','Counsellor','Assigned Centre','Business Centre','Business Type','Student Count','Achieved Course Fee','Achieved Course Fee + GST','Notes','Updated By','Locked','Updated At'],
    [SH_REVENUE_TARGET_REVISIONS]: ['Revised At','Target Type','Period','Centre','Counsellor','Old Course Fee Target','Old Course Fee + GST Target','New Course Fee Target','New Course Fee + GST Target','Reason','Updated By'],
    [SH_USER_CREDENTIALS]: ['Role','Name','Centres','Password Hash','Salt','Must Change Password','Updated At','Active'],
    [SH_HOLIDAYS]:     ['Date','Holiday Name','Centre','Added At'],
    [SH_ASSESSMENTS]:  ['Assessment ID','Batch Code','Test Name','Test Type','Test Date','Total Marks','Instructor','Created At'],
    [SH_MARKS]:        ['Assessment ID','Student ID','Student Name','Marks Obtained','Percentage','Result','Remarks','Total Marks','Updated At']
  };
  Object.entries(defs).forEach(([name,headers])=>{
    let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);
    if(sh.getLastRow()===0||sh.getRange(1,1).getValue()===''){
      sh.getRange(1,1,1,headers.length).setValues([headers])
        .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
      sh.setFrozenRows(1);
    } else if (name===SH_STUDENTS) {
      ensureStudentHeaders(sh);
    } else if (name===SH_SESSIONS) {
      ensureSessionHeaders(sh);
    } else if (name===SH_FEES) {
      ensureFeeHeaders(sh);
    } else if (name===SH_REVENUE_TARGETS) {
      ensureRevenueTargetHeaders(sh);
    } else if (name===SH_REVENUE_CENTRE_TARGETS) {
      ensureRevenueCentreTargetHeaders(sh);
    } else if (name===SH_REVENUE_ANNUAL_TARGETS) {
      ensureRevenueAnnualTargetHeaders(sh);
    } else if (name===SH_REVENUE_MONTHLY_ACHIEVED) {
      ensureRevenueMonthlyAchievedHeaders(sh);
    } else if (name===SH_REVENUE_TARGET_REVISIONS) {
      ensureRevenueTargetRevisionHeaders(sh);
    } else if (name===SH_USER_CREDENTIALS) {
      ensureUserCredentialHeaders(sh);
    }
  });
  ensureUserCredentials(ss);
}
function ensureStudentHeaders(sh) {
  const h=['Student ID','Primary Batch Code','Name','Mobile Last 4','Mobile','Email','Status','Created At','Welcome Email Status','Welcome Email Sent At'];
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[1]==='Batch Code') sh.getRange(1,2).setValue('Primary Batch Code');
  if (current[3]==='DOB (DDMM)') sh.getRange(1,4).setValue('Mobile Last 4');
  if (current[8]!==h[8]||current[9]!==h[9]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureSessionHeaders(sh) {
  const h=['Session Code','Batch Code','Session Date','Session No','Instructor','Session Type','Topic Covered','Auto Created','Created At'];
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  const hasOldTopicHeader=current[5]==='Topic'||current[6]==='Module'||current[7]==='Created At';
  if (hasOldTopicHeader||current[5]!==h[5]||current[6]!==h[6]||current[7]!==h[7]||current[8]!==h[8]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureEnrollmentHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Student ID','Batch Code','Status','Enrolled At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
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
  const h=['Assessment ID','Student ID','Student Name','Marks Obtained','Percentage','Result','Remarks','Total Marks','Updated At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
  [150,120,160,110,100,80,160,100,160].forEach((w,i)=>sh.setColumnWidth(i+1,w));
}
function normalizedFeeTotals(r) {
  var courseFeeG=Number(r[7])||0;
  if(!courseFeeG){
    var cf=COURSE_FEES[r[4]]||{gst:18};
    var courseFee=Number(r[5])||0;
    courseFeeG=courseFee+Math.round(courseFee*(Number(cf.gst)||18)/100);
  }
  var discPct=Number(r[11])||0;
  var discAmt=Math.round(courseFeeG*discPct/100);
  var tdsPct=Number(r[14])||0;
  var tdsAmt=Math.round((courseFeeG-discAmt)*tdsPct/100);
  var netPayable=courseFeeG-discAmt-tdsAmt;
  var collected=Number(r[36])||0;
  var outstanding=netPayable-collected;
  var overdue=false,tod=new Date();tod.setHours(0,0,0,0);
  [[r[19],r[20]],[r[25],r[26]],[r[31],r[32]]].forEach(function(x){
    if(x[1]!=='Y'&&x[0]&&new Date(x[0])<tod) overdue=true;
  });
  var feeStatus=collected>=netPayable?'Paid':overdue?'Overdue':collected>0?'Partial':'Pending';
  return {discAmt:discAmt,tdsAmt:tdsAmt,netPayable:netPayable,collected:collected,outstanding:outstanding,feeStatus:feeStatus};
}

function revenueMonthList(fromMonth,toMonth) {
  var from=String(fromMonth||'2026-01').match(/^\d{4}-\d{2}$/)?String(fromMonth):'2026-01';
  var to=String(toMonth||'2027-03').match(/^\d{4}-\d{2}$/)?String(toMonth):'2027-03';
  var start=new Date(from+'-01'), end=new Date(to+'-01'), out=[];
  if(isNaN(start)||isNaN(end)||start>end){start=new Date('2026-01-01');end=new Date('2027-03-01');}
  var cur=new Date(start);
  while(cur<=end){
    var key=Utilities.formatDate(cur,Session.getScriptTimeZone(),'yyyy-MM');
    out.push({key:key,label:Utilities.formatDate(cur,Session.getScriptTimeZone(),'MMM yyyy')});
    cur.setMonth(cur.getMonth()+1);
  }
  return out;
}

function revenueMonthKey(value) {
  if(!value)return '';
  var d=value instanceof Date?value:new Date(value);
  if(isNaN(d))return String(value).slice(0,7);
  return Utilities.formatDate(d,Session.getScriptTimeZone(),'yyyy-MM');
}

function revenueBlankBucket() {
  return {targetCourse:0,targetGst:0,achievedCourse:0,achievedGst:0,studentCount:0,designatedCourse:0,designatedGst:0,otherCentreCourse:0,otherCentreGst:0,corporateCourse:0,corporateGst:0};
}

function revenueAddBucket(map,key) {
  if(!map[key])map[key]=revenueBlankBucket();
  return map[key];
}

function revenueNameKey(name) {
  return String(name||'').trim().toLowerCase().replace(/\s+/g,' ');
}

function revenueNameAliases(name) {
  var key=revenueNameKey(name);
  var aliases={
    'omkar':['omkar','omkar kadam'],
    'omkar kadam':['omkar','omkar kadam']
  };
  return aliases[key]||[key];
}

function revenueSameCounsellor(a,b) {
  var bAliases=revenueNameAliases(b);
  return revenueNameAliases(a).some(function(alias){return bAliases.indexOf(alias)>=0;});
}

function revenueEffectiveCounsellor(p) {
  if(p&&String(p.isAdmin)==='true')return String(p.counsellor||'').trim();
  return String((p&&p.viewerCounsellor)||'').trim()||String((p&&p.counsellor)||'').trim();
}

function revenueAllowedCentre(centre,p) {
  var allowed=(p.centres||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  return (!allowed.length||allowed.includes(centre))&&(!p.centre||p.centre===centre);
}

function revenueAllowedCounsellor(counsellor,p) {
  var effective=revenueEffectiveCounsellor(p);
  return !effective||revenueSameCounsellor(counsellor,effective);
}

function revenueAllowedViewCentre(row,p) {
  var assigned = String(row.assignedCentre||row.centre||'');
  var business = String(row.businessCentre||row.centre||'');
  return revenueAllowedCentre(assigned,p) || revenueAllowedCentre(business,p);
}

function revenuePeriod(p) {
  return String((p&&p.period)||'2026-27');
}

function buildRevenueDashboard(ss,p) {
  var months=revenueMonthList(p.fromMonth,p.toMonth);
  var fullMonths=revenueMonthList('2026-01','2027-03');
  var monthKeys={};months.forEach(function(m){monthKeys[m.key]=true;});
  var period=revenuePeriod(p);
  // Read each sheet exactly once, then filter in memory
  var allAnnualTargets=getRevenueAnnualTargetRows(ss);
  var allMonthlyAchieved=getRevenueMonthlyAchievedRows(ss);
  var centreTargetRows=getRevenueCentreTargetRows(ss).filter(function(r){
    return r.period===period&&revenueAllowedCentre(r.centre,p);
  });
  var targetRows=allAnnualTargets.filter(function(r){
    return r.period===period&&revenueAllowedCentre(r.centre,p)&&revenueAllowedCounsellor(r.counsellor,p);
  });
  var monthlyPreviewTargets=allAnnualTargets.filter(function(r){
    return r.period===period&&revenueAllowedCentre(r.centre,p);
  });
  var achievedRows=allMonthlyAchieved.filter(function(r){
    if(r.period!==period||!monthKeys[r.month])return false;
    if(!revenueAllowedCounsellor(r.counsellor,p))return false;
    if(p.crossOnly==='true'&&r.assignedCentre===r.businessCentre)return false;
    return revenueAllowedViewCentre(r,p);
  });
  var monthlyPreviewRows=allMonthlyAchieved.filter(function(r){
    if(r.period!==period||!monthKeys[r.month])return false;
    if(p.crossOnly==='true'&&r.assignedCentre===r.businessCentre)return false;
    return revenueAllowedViewCentre(r,p);
  });
  var byMonth={},byCounsellor={},byCentre={},byBusinessCentre={},crossRows=[];
  months.forEach(function(m){byMonth[m.key]=revenueBlankBucket();});
  var totalTargetCourse=0,totalTargetGst=0, splitTargetCourse=0, splitTargetGst=0, centreTargetCourse=0, centreTargetGst=0;
  centreTargetRows.forEach(function(r){
    var ce=revenueAddBucket(byCentre,r.centre);
    ce.targetCourse+=r.targetCourse;ce.targetGst+=r.targetGst;
    centreTargetCourse+=r.targetCourse;centreTargetGst+=r.targetGst;
  });
  targetRows.forEach(function(r){
    var c=revenueAddBucket(byCounsellor,r.counsellor);
    c.targetCourse+=r.targetCourse;c.targetGst+=r.targetGst;
    splitTargetCourse+=r.targetCourse;splitTargetGst+=r.targetGst;
  });
  totalTargetCourse=revenueEffectiveCounsellor(p)?splitTargetCourse:(centreTargetCourse||splitTargetCourse);
  totalTargetGst=revenueEffectiveCounsellor(p)?splitTargetGst:(centreTargetGst||splitTargetGst);
  var monthlyTargetCourse=fullMonths.length?Math.round(totalTargetCourse/fullMonths.length):0;
  var monthlyTargetGst=fullMonths.length?Math.round(totalTargetGst/fullMonths.length):0;
  months.forEach(function(m){
    byMonth[m.key].targetCourse=monthlyTargetCourse;
    byMonth[m.key].targetGst=monthlyTargetGst;
  });

  var achievedCourse=0,achievedGst=0;
  var studentCount=0, designatedCourse=0, designatedGst=0, otherCentreCourse=0, otherCentreGst=0, corporateCourse=0, corporateGst=0;
  achievedRows.forEach(function(r){
    var viewCentre=p.viewMode==='business'?r.businessCentre:r.assignedCentre;
    var bm=revenueAddBucket(byMonth,r.month), bc=revenueAddBucket(byCounsellor,r.counsellor), bViewCentre=revenueAddBucket(byCentre,viewCentre), bBusiness=revenueAddBucket(byBusinessCentre,r.businessCentre);
    var isCorporate=String(r.businessType||'').toLowerCase().indexOf('corporate')>=0||String(r.businessCentre||'').toLowerCase().indexOf('corporate')>=0;
    var isOtherCentre=!isCorporate&&r.assignedCentre!==r.businessCentre;
    [bm,bc,bViewCentre,bBusiness].forEach(function(b){
      b.achievedGst+=r.achievedGst;b.achievedCourse+=r.achievedCourse;b.studentCount+=r.studentCount;
      if(isCorporate){b.corporateCourse+=r.achievedCourse;b.corporateGst+=r.achievedGst;}
      else if(isOtherCentre){b.otherCentreCourse+=r.achievedCourse;b.otherCentreGst+=r.achievedGst;}
      else{b.designatedCourse+=r.achievedCourse;b.designatedGst+=r.achievedGst;}
    });
    achievedGst+=r.achievedGst;
    achievedCourse+=r.achievedCourse;
    studentCount+=r.studentCount;
    if(isCorporate){corporateCourse+=r.achievedCourse;corporateGst+=r.achievedGst;}
    else if(isOtherCentre){otherCentreCourse+=r.achievedCourse;otherCentreGst+=r.achievedGst;}
    else{designatedCourse+=r.achievedCourse;designatedGst+=r.achievedGst;}
    if(r.assignedCentre!==r.businessCentre)crossRows.push(r);
  });
  var monthRows=months.map(function(m){
    var b=byMonth[m.key]||revenueBlankBucket();
    return Object.assign({month:m.key,label:m.label},b);
  });
  return {status:'ok',backendVersion:REVENUE_BACKEND_VERSION,period:period,months:monthRows,centreTargetRows:centreTargetRows,targetRows:targetRows,monthlyRows:achievedRows,monthlyPreviewRows:monthlyPreviewRows,monthlyPreviewTargets:monthlyPreviewTargets,crossRows:crossRows,
    summary:{targetCourse:totalTargetCourse,targetGst:totalTargetGst,achievedCourse:achievedCourse,achievedGst:achievedGst,studentCount:studentCount,designatedCourse:designatedCourse,designatedGst:designatedGst,otherCentreCourse:otherCentreCourse,otherCentreGst:otherCentreGst,corporateCourse:corporateCourse,corporateGst:corporateGst,monthlyTargetCourse:monthlyTargetCourse,monthlyTargetGst:monthlyTargetGst,monthsInPeriod:fullMonths.length,centreTargetCourse:centreTargetCourse,centreTargetGst:centreTargetGst,splitTargetCourse:splitTargetCourse,splitTargetGst:splitTargetGst},
    counsellors:Object.keys(byCounsellor).sort().map(function(k){return Object.assign({counsellor:k},byCounsellor[k]);}),
    centres:Object.keys(byCentre).sort().map(function(k){return Object.assign({centre:k},byCentre[k]);}),
    businessCentres:Object.keys(byBusinessCentre).sort().map(function(k){return Object.assign({centre:k},byBusinessCentre[k]);})};
}

function buildAdminDashboard(ss,p) {
  var period=revenuePeriod(p);
  var revenue=buildRevenueDashboard(ss,Object.assign({},p,{isAdmin:'true',centres:'',centre:'',counsellor:'',viewerCounsellor:'',viewMode:'assigned'}));
  var shBatch=ss.getSheetByName(SH_BATCHES);
  var batchRows=shBatch&&shBatch.getLastRow()>1?shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().filter(function(r){return r[0];}):[];
  var batchMap={};
  batchRows.forEach(function(b){
    var code=String(b[0]).toUpperCase();
    batchMap[code]={batchCode:code,centre:b[1]||'',course:b[2]||'',type:b[3]||'',instructor:detectSlotOrDate(b[4])?(b[9]||''):(b[8]||'')};
  });

  var feeRows=getAdminFeeSummaryRows(ss);
  var feeNational={expected:0,collected:0,outstanding:0,overdue:0,paid:0,partial:0,pending:0,overdueStudents:0,students:0};
  var feeByCentre={}, feeByBatch={};
  feeRows.forEach(function(fr){
    var st=fr.feeStatus;
    feeNational.expected+=fr.netPayable;feeNational.collected+=fr.collected;feeNational.outstanding+=fr.outstanding;feeNational.students++;
    if(st==='Paid')feeNational.paid++;
    if(st==='Partial')feeNational.partial++;
    if(st==='Pending')feeNational.pending++;
    if(st==='Overdue'){feeNational.overdue+=fr.outstanding;feeNational.overdueStudents++;}
    if(!feeByCentre[fr.centre])feeByCentre[fr.centre]={centre:fr.centre,expected:0,collected:0,outstanding:0,overdue:0,students:0,paid:0,partial:0,pending:0,overdueStudents:0,batches:{}};
    var fc=feeByCentre[fr.centre];
    fc.expected+=fr.netPayable;fc.collected+=fr.collected;fc.outstanding+=fr.outstanding;fc.students++;fc.batches[fr.batchCode]=1;
    if(st==='Paid')fc.paid++;if(st==='Partial')fc.partial++;if(st==='Pending')fc.pending++;if(st==='Overdue'){fc.overdue+=fr.outstanding;fc.overdueStudents++;}
    if(!feeByBatch[fr.batchCode])feeByBatch[fr.batchCode]={batchCode:fr.batchCode,centre:fr.centre,course:fr.course,expected:0,collected:0,outstanding:0,overdue:0,students:0,paid:0,partial:0,pending:0,overdueStudents:0};
    var fb=feeByBatch[fr.batchCode];
    fb.expected+=fr.netPayable;fb.collected+=fr.collected;fb.outstanding+=fr.outstanding;fb.students++;
    if(st==='Paid')fb.paid++;if(st==='Partial')fb.partial++;if(st==='Pending')fb.pending++;if(st==='Overdue'){fb.overdue+=fr.outstanding;fb.overdueStudents++;}
  });

  var attendance=buildAdminAttendanceSummary(ss,batchRows);
  var tests=buildAdminTestSummary(ss,batchMap);
  var centreTargetMap={}, counsellorTargetMap={};
  (revenue.centreTargetRows||[]).forEach(function(r){centreTargetMap[r.centre]=r;});
  (revenue.targetRows||[]).forEach(function(r){counsellorTargetMap[revenueNameAliases(r.counsellor)[0]+'|'+r.centre]=r;});

  var revCentreMap={};(revenue.centres||[]).forEach(function(r){revCentreMap[r.centre]=r;});
  var centreNames={};
  Object.keys(CENTRE_CODES).forEach(function(c){centreNames[c]=1;});
  Object.keys(feeByCentre).forEach(function(c){centreNames[c]=1;});
  Object.keys(revCentreMap).forEach(function(c){centreNames[c]=1;});
  var centreRows=Object.keys(centreNames).sort().map(function(c){
    var rt=centreTargetMap[c]||{}, rv=revCentreMap[c]||{}, ff=feeByCentre[c]||{};
    return {
      centre:c,targetCourse:Number(rt.targetCourse)||0,targetGst:Number(rt.targetGst)||0,
      achievedCourse:Number(rv.achievedCourse)||0,achievedGst:Number(rv.achievedGst)||0,
      counsellorTargetGst:Number(rv.targetGst)||0,feeExpected:Number(ff.expected)||0,
      feeCollected:Number(ff.collected)||0,feeOutstanding:Number(ff.outstanding)||0,
      overdue:Number(ff.overdue)||0,students:Number(ff.students)||0,batches:ff.batches?Object.keys(ff.batches).length:0,
      attendancePct:(attendance.centres[c]&&attendance.centres[c].avgPct)||0,
      tests:(tests.centres[c]&&tests.centres[c].tests)||0
    };
  });

  return {status:'ok',period:period,summary:{
      centres:centreRows.length,batches:batchRows.length,students:getStudentRows(ss).filter(function(s){return s.status==='Active';}).length,
      feeExpected:feeNational.expected,feeCollected:feeNational.collected,feeOutstanding:feeNational.outstanding,feeOverdue:feeNational.overdue,
      attendancePct:attendance.national.avgPct,tests:tests.national.tests,avgTestPct:tests.national.avgPct
    },
    centreRows:centreRows,fee:{national:feeNational,centres:Object.values(feeByCentre),batches:Object.values(feeByBatch)},
    attendance:attendance,tests:tests,revenue:revenue};
}

function getAdminFeeSummaryRows(ss) {
  var sh=ss.getSheetByName(SH_FEES);
  if(!sh||sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,41).getValues().filter(function(r){return r[0];}).map(function(r){
    var ft=normalizedFeeTotals(r);
    return {studentId:r[0],studentName:r[1],batchCode:String(r[2]).toUpperCase(),centre:r[3]||'',course:r[4]||'',
      netPayable:ft.netPayable,collected:ft.collected,outstanding:ft.outstanding,feeStatus:ft.feeStatus};
  });
}

function buildAdminAttendanceSummary(ss,batchRows) {
  var shSess=ss.getSheetByName(SH_SESSIONS), shFb=ss.getSheetByName(SH_FEEDBACK);
  var sessions=shSess&&shSess.getLastRow()>1?shSess.getRange(2,1,shSess.getLastRow()-1,9).getValues().filter(function(r){return r[0];}):[];
  var feedback=shFb&&shFb.getLastRow()>1?shFb.getRange(2,1,shFb.getLastRow()-1,17).getValues().filter(function(r){return r[0];}):[];
  var fbByBatchStudent={};
  feedback.forEach(function(f){
    var key=String(f[3]).toUpperCase()+'|'+String(f[1]).toUpperCase();
    if(!fbByBatchStudent[key])fbByBatchStudent[key]={};
    fbByBatchStudent[key][String(f[0]).toUpperCase()]=1;
  });
  var centres={}, batches=[], totalPct=0, pctCount=0, atRisk=[];
  batchRows.forEach(function(b){
    var code=String(b[0]).toUpperCase(), centre=b[1]||'';
    var bSess=sessions.filter(function(s){return String(s[1]).toUpperCase()===code;});
    var students=getStudentsForBatch(ss,code);
    var sumPct=0, localCount=0, localRisk=0;
    students.forEach(function(s){
      var attended=Object.keys(fbByBatchStudent[code+'|'+String(s.enrollmentNo).toUpperCase()]||{}).length;
      var pct=bSess.length?Math.round(attended/bSess.length*100):0;
      if(bSess.length){sumPct+=pct;localCount++;totalPct+=pct;pctCount++;}
      if(bSess.length>=4&&pct<75){localRisk++;atRisk.push({centre:centre,batchCode:code,studentId:s.enrollmentNo,name:s.name,pct:pct,attended:attended,total:bSess.length});}
    });
    var avg=localCount?Math.round(sumPct/localCount):0;
    batches.push({batchCode:code,centre:centre,course:b[2]||'',students:students.length,sessions:bSess.length,avgPct:avg,atRisk:localRisk});
    if(!centres[centre])centres[centre]={centre:centre,batches:0,students:0,sessions:0,avgTotal:0,avgCount:0,atRisk:0,avgPct:0};
    centres[centre].batches++;centres[centre].students+=students.length;centres[centre].sessions+=bSess.length;centres[centre].atRisk+=localRisk;
    if(localCount){centres[centre].avgTotal+=avg;centres[centre].avgCount++;}
  });
  Object.keys(centres).forEach(function(c){centres[c].avgPct=centres[c].avgCount?Math.round(centres[c].avgTotal/centres[c].avgCount):0;});
  return {national:{avgPct:pctCount?Math.round(totalPct/pctCount):0,atRisk:atRisk.length},centres:centres,batches:batches,atRisk:atRisk.slice(0,80)};
}

function buildAdminTestSummary(ss,batchMap) {
  var shA=ss.getSheetByName(SH_ASSESSMENTS), shM=ss.getSheetByName(SH_MARKS);
  var aData=shA&&shA.getLastRow()>1?shA.getRange(2,1,shA.getLastRow()-1,8).getValues().filter(function(r){return r[0];}):[];
  var mData=shM&&shM.getLastRow()>1?shM.getRange(2,1,shM.getLastRow()-1,9).getValues().filter(function(r){return r[0];}):[];
  var marksByAssessment={};
  mData.forEach(function(m){var id=String(m[0]).toUpperCase();if(!marksByAssessment[id])marksByAssessment[id]=[];marksByAssessment[id].push(m);});
  var centres={}, batches={}, totalPct=0, pctCount=0, low=[];
  var assessments=aData.map(function(a){
    var id=String(a[0]).toUpperCase(), batchCode=String(a[1]).toUpperCase(), batch=batchMap[batchCode]||{}, centre=batch.centre||'';
    var marks=marksByAssessment[id]||[], appeared=marks.filter(function(m){return m[3]!=='DNA';}), passed=appeared.filter(function(m){return m[5]==='Pass';});
    var avg=appeared.length?Math.round(appeared.reduce(function(s,m){return s+(Number(m[4])||0);},0)/appeared.length):0;
    if(appeared.length){totalPct+=avg;pctCount++;}
    appeared.forEach(function(m){if((Number(m[4])||0)<PASS_THRESHOLD)low.push({centre:centre,batchCode:batchCode,assessmentId:a[0],studentId:m[1],name:m[2],pct:m[4],result:m[5]});});
    if(!centres[centre])centres[centre]={centre:centre,tests:0,appeared:0,passed:0,avgTotal:0,avgCount:0,avgPct:0};
    centres[centre].tests++;centres[centre].appeared+=appeared.length;centres[centre].passed+=passed.length;if(appeared.length){centres[centre].avgTotal+=avg;centres[centre].avgCount++;}
    if(!batches[batchCode])batches[batchCode]={batchCode:batchCode,centre:centre,course:batch.course||'',tests:0,appeared:0,passed:0,avgTotal:0,avgCount:0,avgPct:0};
    batches[batchCode].tests++;batches[batchCode].appeared+=appeared.length;batches[batchCode].passed+=passed.length;if(appeared.length){batches[batchCode].avgTotal+=avg;batches[batchCode].avgCount++;}
    return {assessmentId:a[0],batchCode:batchCode,centre:centre,course:batch.course||'',testName:a[2],testType:a[3],testDate:a[4]?new Date(a[4]).toLocaleDateString('en-IN'):'',instructor:a[6],appeared:appeared.length,passed:passed.length,avgPct:avg,passRate:appeared.length?Math.round(passed.length/appeared.length*100):0};
  });
  [centres,batches].forEach(function(map){Object.keys(map).forEach(function(k){map[k].avgPct=map[k].avgCount?Math.round(map[k].avgTotal/map[k].avgCount):0;});});
  return {national:{tests:assessments.length,avgPct:pctCount?Math.round(totalPct/pctCount):0,lowScore:low.length},centres:centres,batches:Object.values(batches),assessments:assessments,lowScore:low.slice(0,80)};
}

function getRevenueCentreTargetRows(ss) {
  var sh=ss.getSheetByName(SH_REVENUE_CENTRE_TARGETS);
  if(!sh||sh.getLastRow()<2)return [];
  var map=sheetHeaderMap(sh);
  return sh.getRange(2,1,sh.getLastRow()-1,Math.max(sh.getLastColumn(),7)).getValues().map(function(r){
    return {
      period:String(rowCell(r,map,'Period',0)||'2026-27').trim(),
      centre:String(rowCell(r,map,'Centre',1)||'').trim(),
      targetCourse:Number(rowCell(r,map,'Annual Course Fee Target',2))||0,
      targetGst:Number(rowCell(r,map,'Annual Course Fee + GST Target',3))||0,
      notes:rowCell(r,map,'Notes',4)||'',
      updatedBy:rowCell(r,map,'Updated By',5)||'',
      updatedAt:rowCell(r,map,'Updated At',6)||''
    };
  }).filter(function(r){return r.period&&r.centre;});
}

function getRevenueAnnualTargetRows(ss) {
  var sh=ss.getSheetByName(SH_REVENUE_ANNUAL_TARGETS);
  if(!sh||sh.getLastRow()<2)return [];
  var map=sheetHeaderMap(sh);
  return sh.getRange(2,1,sh.getLastRow()-1,Math.max(sh.getLastColumn(),8)).getValues().map(function(r){
    return {
      period:String(rowCell(r,map,'Period',0)||'2026-27').trim(),
      counsellor:String(rowCell(r,map,'Counsellor',1)||'').trim(),
      centre:String(rowCell(r,map,'Assigned Centre',2)||rowCell(r,map,'Centre',2)||'').trim(),
      targetCourse:Number(rowCell(r,map,'Annual Course Fee Target',3))||0,
      targetGst:Number(rowCell(r,map,'Annual Course Fee + GST Target',4))||0,
      notes:rowCell(r,map,'Notes',5)||'',
      updatedBy:rowCell(r,map,'Updated By',6)||'',
      updatedAt:rowCell(r,map,'Updated At',7)||''
    };
  }).filter(function(r){return r.period&&r.counsellor&&r.centre;});
}

function revenueCounsellorMonthlySheetName(counsellor) {
  var base=String(counsellor||'Counsellor').trim().replace(/[\\\/\?\*\[\]\:]/g,' ').replace(/\s+/g,' ');
  if(!base)base='Counsellor';
  return ('Revenue_Monthly_'+base).slice(0,99);
}

function parseRevenueMonthlyAchievedSheet(sh) {
  if(!sh||sh.getLastRow()<2)return [];
  var map=sheetHeaderMap(sh);
  return sh.getRange(2,1,sh.getLastRow()-1,Math.max(sh.getLastColumn(),13)).getValues().map(function(r,i){
    var rawType=rowCell(r,map,'Business Type',5);
    var oldShape=typeof rawType==='number'||(rawType!==''&&String(rawType||'').match(/^\d+(\.\d+)?$/));
    var course=oldShape?r[5]:rowCell(r,map,'Achieved Course Fee',6);
    var gst=oldShape?r[6]:rowCell(r,map,'Achieved Course Fee + GST',7);
    var newerShape=map['Student Count']!==undefined;
    if(newerShape){course=rowCell(r,map,'Achieved Course Fee',7);gst=rowCell(r,map,'Achieved Course Fee + GST',8);}
    return {
      rowIndex:i+2,
      month:String(rowCell(r,map,'Month',0)||'').slice(0,7),
      period:String(rowCell(r,map,'Period',1)||'2026-27').trim(),
      counsellor:String(rowCell(r,map,'Counsellor',2)||'').trim(),
      assignedCentre:String(rowCell(r,map,'Assigned Centre',3)||'').trim(),
      businessCentre:String(rowCell(r,map,'Business Centre',4)||rowCell(r,map,'Assigned Centre',3)||'').trim(),
      businessType:oldShape?'Centre Revenue':String(rawType||'Centre Revenue').trim(),
      achievedCourse:Number(course)||0,
      achievedGst:Number(gst)||0,
      studentCount:Number(newerShape?rowCell(r,map,'Student Count',6):0)||0,
      locked:String((newerShape?rowCell(r,map,'Locked',11):'Y')||'Y').trim()!=='N',
      notes:oldShape?r[7]||'':rowCell(r,map,'Notes',newerShape?9:8)||'',
      updatedBy:oldShape?r[8]||'':rowCell(r,map,'Updated By',newerShape?10:9)||'',
      updatedAt:oldShape?r[9]||'':rowCell(r,map,'Updated At',newerShape?12:10)||'',
      sourceSheet:sh.getName()
    };
  }).filter(function(r){return r.month&&r.period&&r.counsellor&&r.assignedCentre&&r.businessCentre;});
}

function getRevenueMonthlyAchievedRows(ss) {
  var byKey={};
  function absorb(rows){
    rows.forEach(function(r){
      var key=revenueMonthlyLedgerKey(r);
      var prev=byKey[key];
      if(!prev || String(r.updatedAt||'')>=String(prev.updatedAt||''))byKey[key]=r;
    });
  }
  var sh=ss.getSheetByName(SH_REVENUE_MONTHLY_ACHIEVED);
  absorb(parseRevenueMonthlyAchievedSheet(sh));
  ss.getSheets().forEach(function(s){
    if(s.getName().indexOf('Revenue_Monthly_')===0 && s.getName()!==SH_REVENUE_MONTHLY_ACHIEVED){
      absorb(parseRevenueMonthlyAchievedSheet(s));
    }
  });
  return Object.keys(byKey).map(function(k){return byKey[k];});
}

function saveRevenueCentreTargetRows(ss,rows,updatedBy) {
  var sh=ss.getSheetByName(SH_REVENUE_CENTRE_TARGETS);
  ensureRevenueCentreTargetHeaders(sh);
  var existingRows=getRevenueCentreTargetRows(ss);
  var saved=0;
  
  rows.forEach(function(r){
    var period=String(r.period||'2026-27').trim(), centre=String(r.centre||'').trim();
    if(!period||!centre)return;
    if(!Number(r.targetCourse)&&!Number(r.targetGst))return;
    
    var old=existingRows.find(function(x){return x.period===period&&x.centre===centre;})||null;
    var row=[period,centre,Number(r.targetCourse)||0,Number(r.targetGst)||0,r.notes||'',updatedBy,new Date().toISOString()];
    
    if(old){
      if(String(r.revise||'')!=='Y')return;
      if(!String(r.notes||'').trim())return;
      logRevenueTargetRevision(ss,'Centre',period,centre,'',old.targetCourse,old.targetGst,row[2],row[3],r.notes||'',updatedBy);
      
      var values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,2).getValues():[];
      var matches=[];
      values.forEach(function(vals,idx){
        var rowNum=idx+2;
        if(String(vals[0]).trim()===period && String(vals[1]).trim()===centre){
          matches.push(rowNum);
        }
      });
      
      if(matches.length>0){
        sh.getRange(matches[0],1,1,row.length).setValues([row]);
        for(var i=matches.length-1; i>0; i--){
          sh.deleteRow(matches[i]);
        }
      } else {
        sh.appendRow(row);
      }
    } else {
      var values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,2).getValues():[];
      var dup=values.some(function(vals){
        return String(vals[0]).trim()===period && String(vals[1]).trim()===centre;
      });
      if(!dup){
        sh.appendRow(row);
      }
    }
    saved++;
  });
  return saved;
}

function saveRevenueAnnualTargetRows(ss,rows,updatedBy) {
  var sh=ss.getSheetByName(SH_REVENUE_ANNUAL_TARGETS);
  ensureRevenueAnnualTargetHeaders(sh);
  var locked=getRevenueAnnualTargetRows(ss);
  var saved=0;
  
  rows.forEach(function(r){
    var period=String(r.period||'2026-27').trim(), counsellor=String(r.counsellor||'').trim(), centre=String(r.centre||'').trim();
    if(!period||!counsellor||!centre)return;
    if(!Number(r.targetCourse)&&!Number(r.targetGst))return;
    
    var old=locked.find(function(x){return x.period===period&&x.centre===centre&&revenueSameCounsellor(x.counsellor,counsellor);})||null;
    var row=[period,counsellor,centre,Number(r.targetCourse)||0,Number(r.targetGst)||0,r.notes||'',updatedBy,new Date().toISOString()];
    
    if(old){
      if(String(r.revise||'')!=='Y')return;
      if(!String(r.notes||'').trim())return;
      logRevenueTargetRevision(ss,'Counsellor',period,centre,counsellor,old.targetCourse,old.targetGst,row[3],row[4],r.notes||'',updatedBy);
      
      var values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,3).getValues():[];
      var matches=[];
      values.forEach(function(vals,idx){
        var rowNum=idx+2;
        if(String(vals[0]).trim()===period && String(vals[2]).trim()===centre && revenueSameCounsellor(vals[1],counsellor)){
          matches.push(rowNum);
        }
      });
      
      if(matches.length>0){
        sh.getRange(matches[0],1,1,row.length).setValues([row]);
        for(var i=matches.length-1; i>0; i--){
          sh.deleteRow(matches[i]);
        }
      } else {
        sh.appendRow(row);
      }
    } else {
      var values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,3).getValues():[];
      var dup=values.some(function(vals){
        return String(vals[0]).trim()===period && String(vals[2]).trim()===centre && revenueSameCounsellor(vals[1],counsellor);
      });
      if(!dup){
        sh.appendRow(row);
      }
    }
    saved++;
  });
  return saved;
}

function logRevenueTargetRevision(ss,type,period,centre,counsellor,oldCourse,oldGst,newCourse,newGst,reason,updatedBy) {
  var sh=getOrCreateSheet(ss,SH_REVENUE_TARGET_REVISIONS);
  ensureRevenueTargetRevisionHeaders(sh);
  sh.appendRow([new Date().toISOString(),type,period,centre,counsellor||'',Number(oldCourse)||0,Number(oldGst)||0,Number(newCourse)||0,Number(newGst)||0,reason||'',updatedBy||'Admin']);
}

function revenueMonthlyLedgerKey(row) {
  return [
    String(row.month||'').slice(0,7),
    String(row.period||'2026-27').trim(),
    revenueNameAliases(row.counsellor)[0],
    String(row.assignedCentre||row.centre||'').trim(),
    String(row.businessCentre||row.assignedCentre||row.centre||'').trim(),
    String(row.businessType||'Centre Revenue').trim()
  ].join('|');
}

function saveRevenueMonthlyAchievedRows(ss,rows,updatedBy,scope) {
  var sh=getOrCreateSheet(ss,SH_REVENUE_MONTHLY_ACHIEVED);
  ensureRevenueMonthlyAchievedHeaders(sh);
  var existingRows=getRevenueMonthlyAchievedRows(ss);
  var lockedKeys={};
  var lockedMonthKeys={};
  existingRows.forEach(function(r){
    var key=revenueMonthlyLedgerKey(r);
    var monthKey=r.month+'|'+r.period+'|'+revenueNameAliases(r.counsellor)[0]+'|'+r.assignedCentre;
    if(r.locked){
      lockedKeys[key]=true;
      lockedMonthKeys[monthKey]=true;
    }
  });
  var revisionKeys={};
  var revisionMonthKeys={};
  rows.forEach(function(r){
    var month=String(r.month||'').slice(0,7), period=String(r.period||'2026-27').trim(), counsellor=String(r.counsellor||'').trim(), assigned=String(r.assignedCentre||r.centre||'').trim();
    if(month&&period&&counsellor&&assigned&&String(r.revise||'')==='Y'&&String(r.notes||'').trim()){
      revisionKeys[revenueMonthlyLedgerKey(r)]=true;
      revisionMonthKeys[month+'|'+period+'|'+revenueNameAliases(counsellor)[0]+'|'+assigned]=true;
    }
  });
  // Build row maps for shared sheet and per-counsellor sheets (write targets)
  var sharedRowMap={};
  var counsellorSheets={};   // counsellor canonical name → {sh, rowMap}
  existingRows.forEach(function(r){
    var key=revenueMonthlyLedgerKey(r);
    if(r.sourceSheet===SH_REVENUE_MONTHLY_ACHIEVED){
      sharedRowMap[key]=r.rowIndex;
    } else {
      var cName=revenueNameAliases(r.counsellor)[0];
      if(!counsellorSheets[cName]) counsellorSheets[cName]={sh:ss.getSheetByName(r.sourceSheet),rowMap:{}};
      counsellorSheets[cName].rowMap[key]=r.rowIndex;
    }
  });
  var saved=0;
  rows.forEach(function(r){
    var month=String(r.month||'').slice(0,7), period=String(r.period||'2026-27').trim(), counsellor=String(r.counsellor||'').trim(), assigned=String(r.assignedCentre||r.centre||'').trim(), business=String(r.businessCentre||assigned).trim();
    var businessType=String(r.businessType||'Centre Revenue').trim();
    if(!month||!period||!counsellor||!assigned||!business)return;
    var key=revenueMonthlyLedgerKey({month:month,period:period,counsellor:counsellor,assignedCentre:assigned,businessCentre:business,businessType:businessType});
    var monthLockKey=month+'|'+period+'|'+revenueNameAliases(counsellor)[0]+'|'+assigned;
    var canRevise=revisionKeys[key]||revisionMonthKeys[monthLockKey];
    if((lockedKeys[key]||lockedMonthKeys[monthLockKey])&&!canRevise)return;
    var isLock = (r.locked === 'N' || r.locked === false || String(r.locked).toLowerCase() === 'n') ? 'N' : 'Y';
    var row=[month,period,counsellor,assigned,business,businessType,Number(r.studentCount)||0,Number(r.achievedCourse)||0,Number(r.achievedGst)||0,r.notes||'',updatedBy,isLock,new Date().toISOString()];
    // 1. Write to shared ledger sheet
    if(sharedRowMap[key])sh.getRange(sharedRowMap[key],1,1,row.length).setValues([row]);
    else{sh.appendRow(row);sharedRowMap[key]=sh.getLastRow();}
    // 2. Write to per-counsellor sheet (clean, guaranteed-correct copy)
    var cName=revenueNameAliases(counsellor)[0];
    if(!counsellorSheets[cName]){
      var cShName=revenueCounsellorMonthlySheetName(counsellor);
      var cSh=getOrCreateSheet(ss,cShName);
      ensureRevenueMonthlyAchievedHeaders(cSh);
      counsellorSheets[cName]={sh:cSh,rowMap:{}};
    }
    var cEntry=counsellorSheets[cName];
    if(cEntry.rowMap[key])cEntry.sh.getRange(cEntry.rowMap[key],1,1,row.length).setValues([row]);
    else{cEntry.sh.appendRow(row);cEntry.rowMap[key]=cEntry.sh.getLastRow();}
    saved++;
  });
  return saved;
}

function ensureFeeHeaders(sh) {
  const h=['Student ID','Student Name','Batch Code','Centre','Course',
    'Course Fee','GST Amount','Course Fee + GST','Registration Fee','Registration GST','Registration Fee + GST',
    'Discount %','Discount Amount','Discount Reason','TDS %','TDS Amount','Net Payable','Installments',
    'Inst 1 Amount','Inst 1 Due','Inst 1 Paid','Inst 1 Paid Date','Inst 1 Mode','Inst 1 Reference',
    'Inst 2 Amount','Inst 2 Due','Inst 2 Paid','Inst 2 Paid Date','Inst 2 Mode','Inst 2 Reference',
    'Inst 3 Amount','Inst 3 Due','Inst 3 Paid','Inst 3 Paid Date','Inst 3 Mode','Inst 3 Reference',
    'Collected','Outstanding','Fee Status','Entered By','Updated At'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[40]!==h[40]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureRevenueTargetHeaders(sh) {
  const h=['Month','Counsellor','Centre','Target Course Fee','Target Course Fee + GST','Notes','Updated By','Updated At'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[7]!==h[7]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureRevenueCentreTargetHeaders(sh) {
  const h=['Period','Centre','Annual Course Fee Target','Annual Course Fee + GST Target','Notes','Updated By','Updated At'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[6]!==h[6]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureRevenueAnnualTargetHeaders(sh) {
  const h=['Period','Counsellor','Assigned Centre','Annual Course Fee Target','Annual Course Fee + GST Target','Notes','Updated By','Updated At'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[7]!==h[7]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureRevenueMonthlyAchievedHeaders(sh) {
  const h=['Month','Period','Counsellor','Assigned Centre','Business Centre','Business Type','Student Count','Achieved Course Fee','Achieved Course Fee + GST','Notes','Updated By','Locked','Updated At'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  let current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[6]==='Achieved Course Fee') {
    sh.insertColumnBefore(7);
    current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  }
  if (current[11]==='Updated At' || current[11]==='') {
    sh.insertColumnBefore(12);
    current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  }
  if (current[0]!==h[0] || current[5]!==h[5] || current[12]!==h[12]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureRevenueTargetRevisionHeaders(sh) {
  const h=['Revised At','Target Type','Period','Centre','Counsellor','Old Course Fee Target','Old Course Fee + GST Target','New Course Fee Target','New Course Fee + GST Target','Reason','Updated By'];
  if (sh.getLastRow()===0 || sh.getRange(1,1).getValue()==='') {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current[0]!==h[0] || current[10]!==h[10]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
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
  const s = String(val).trim().toLowerCase();
  // If it looks like a date (contains digits and dashes/slashes) → old schema
  if (/\d{4}-\d{2}|\d+\/\d+/.test(s)) return false;
  // If it's a Date object → old schema
  if (val instanceof Date) return false;
  // If it matches a slot keyword → new schema
  return s==='first half'||s==='second half'||s==='full day';
}

function getOrCreateSheet(ss,name){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);return s;}

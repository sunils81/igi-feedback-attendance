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
const REVENUE_BACKEND_VERSION = 'revenue-ledger-v11-2026-06-04';
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
  'Kripa':     { pin:'IGIKripa2026',   centres:['Jaipur'] },
  // Former counsellor — re-enabled for pending revenue entry (left April 2026)
  'Mrinal':    { pin:'IGIMrinal2026',  centres:['Mumbai','Delhi','Kolkata','Surat','Chennai','Hyderabad','Bangalore','Lucknow','Ahmedabad','Jaipur'] }
};
const ADMIN_PASS   = 'IGI2026';       // admin override — full HOD access
// MASTER_PASS already defined at top of file — used as skeleton key for all logins

// ── Dual-role instructors (instructor + counselor for their centre) ─
const DUAL_ROLE = {
  'Anuradha':      { centres:['Mumbai','Lucknow','Ahmedabad'] }
};

// ── Manager roles (dashboard access, view-only, reporting control) ─
const MANAGER_ROLE = {
  'Amit Sidpura': { centres: ['Mumbai','Lucknow','Ahmedabad','Chennai','Delhi','Surat','Kolkata','Bangalore','Hyderabad','Jaipur'] }
};

// ── Instructor credentials (Option B — unique per instructor) ─
const INSTRUCTOR_CREDS = {
  'Amit Sidpura':     'IGIAmit2026',
  'Asmita Saroday':   'IGIAsmita2026',
  'Arjun Mistry':     'IGIArjun2026',
  'Bhavin Patel':     '*Apple321',
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
const SH_HOD_APPROVALS = 'HOD_Approvals';
const SH_INV_ITEMS     = 'INV_Items';
const SH_INV_STOCK     = 'INV_Stock';
const SH_INV_REQUESTS  = 'INV_Requests';
const SH_INV_DISPATCH  = 'INV_Dispatch';
const SH_INV_VENDORS   = 'INV_Vendors';
const SH_ATT_RECORDS   = 'ATT_Records';

// ── Centre / Course codes ──────────────────────────────────────
const CENTRE_CODES = {
  'Mumbai':'MUM','Delhi':'DEL','Kolkata':'KOL','Surat':'SUR',
  'Chennai':'CHE','Hyderabad':'HYD','Pune':'PUN','Bangalore':'BLR',
  'Lucknow':'LKO','Ahmedabad':'AMD','Jaipur':'JAI','Thrissur':'THR'
};
const COURSE_CODES = {
  'Diamond Graduate':'DG','Colored Stone Graduate':'CSG',
  'Jewelry Design':'JD','Jewelry Design Manual':'JDM','CAD Design':'CAD','JewelPad Design':'JP',
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

  // Count active enrollments per batch
  const countByBatch = {};
  try {
    getEnrollmentRows(ss).forEach(function(r){
      if(r.studentId && r.batchCode && String(r.status).trim().toLowerCase()==='active'){
        var bc=String(r.batchCode).trim().toUpperCase();
        countByBatch[bc]=(countByBatch[bc]||0)+1;
      }
    });
  } catch(err) {}

  return data
    .filter(r => r[0] && (!centre || r[1]===centre) && (!centres || !centres.length || centres.includes(r[1])))
    .map(r => {
      const isNew = detectSlotOrDate(r[4]);
      const bc = String(r[0]).trim().toUpperCase();
      return {
        batchCode:  r[0],
        centre:     r[1],
        course:     r[2],
        type:       r[3],
        batchSlot:  isNew ? String(r[4]).trim() : 'Full Day',
        startDate:  fmtDate(isNew ? r[5] : r[4]),
        endDate:    fmtDate(isNew ? r[6] : r[5]),
        counselor:  isNew ? (r[7]||'') : (r[6]||''),
        instructor: isNew ? (r[9]||'') : (r[8]||''),
        studentCount: countByBatch[bc] || 0
      };
    });
}

// ── getBatchSnapshot — aggregated per-centre batch status for admin snapshot card ──
function getBatchSnapshot(ss) {
  const today = new Date(); today.setHours(12,0,0,0);
  const in30  = new Date(today); in30.setDate(in30.getDate()+30);

  const shBatch = ss.getSheetByName(SH_BATCHES);
  if (!shBatch || shBatch.getLastRow()<2) return {status:'ok', centres:[], generatedAt:new Date().toISOString()};
  const batchData = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues();

  // Count active enrollments per batch (unified links + legacy)
  const countByBatch = {};
  getEnrollmentRows(ss).forEach(function(r){
    if(r.studentId && r.batchCode && String(r.status).trim().toLowerCase()==='active'){
      var bc=String(r.batchCode).trim().toUpperCase();
      countByBatch[bc]=(countByBatch[bc]||0)+1;
    }
  });

  // Parse each batch row
  const batches = batchData.filter(r=>r[0]).map(function(r){
    const hasSlot = detectSlotOrDate(r[4]);
    const rawStart = hasSlot?r[5]:r[4];
    const rawEnd   = hasSlot?r[6]:r[5];
    const sD = rawStart?new Date(rawStart):null; if(sD)sD.setHours(12,0,0,0);
    const eD = rawEnd  ?new Date(rawEnd)  :null; if(eD)eD.setHours(12,0,0,0);
    const active = String(r[7]||'Y')!=='N';

    let batchStatus='Upcoming';
    if(!active)                              batchStatus='Inactive';
    else if(eD&&eD<today)                    batchStatus='Completed';
    else if(sD&&sD<=today)                   batchStatus='Ongoing';
    else if(sD&&sD<=in30)                    batchStatus='Starting Soon';

    // Weeks running (for ongoing batches)
    const weeksRunning = (batchStatus==='Ongoing'&&sD) ?
      Math.floor((today.getTime()-sD.getTime())/(7*86400000)) : 0;

    return {
      batchCode:   r[0], centre:r[1], course:r[2], type:r[3],
      startDate:   sD?sD.toLocaleDateString('en-IN'):'',
      endDate:     eD?eD.toLocaleDateString('en-IN'):'',
      instructor:  hasSlot?(r[9]||''):(r[8]||''),
      active:      active,
      status:      batchStatus,
      weeksRunning:weeksRunning,
      studentCount:countByBatch[String(r[0]).trim().toUpperCase()]||0
    };
  });

  // Group by centre, compute centre-level status
  const centreMap = {};
  batches.forEach(function(b){
    if(!centreMap[b.centre]) centreMap[b.centre]=[];
    centreMap[b.centre].push(b);
  });
  const ORDER = ['Ongoing','Starting Soon','Upcoming','Completed','Inactive'];
  const centres = Object.keys(centreMap).sort().map(function(c){
    const cb = centreMap[c];
    // Only show non-completed/non-inactive batches for the snapshot; include completed if recent
    const statuses = cb.map(function(b){return b.status;});
    let cStatus = 'Upcoming';
    for(var i=0;i<ORDER.length;i++){if(statuses.includes(ORDER[i])){cStatus=ORDER[i];break;}}
    return {centre:c, status:cStatus, batches:cb};
  });

  return {status:'ok', centres:centres, generatedAt:new Date().toISOString()};
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
  return 'rev|'+REVENUE_BACKEND_VERSION+'|'+((p&&p.counsellor)||'')+'|'+((p&&p.centres)||'')+'|'+((p&&p.period)||'2026-27')+'|'+((p&&p.isAdmin)||'false');
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
//  doPost  (used for large payloads e.g. PDF upload)
// ═══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch(x) {}
    var act = body.action || '';
    var ss  = SpreadsheetApp.openById(SHEET_ID);
    var result;
    if (act === 'getDiplomaTemplate') {
      // Template fetch via POST avoids JSONP size limits for large PDFs
      result = getDiplomaTemplate(ss, body);
    } else if (act === 'saveDiplomaFile') {
      var counselor = body.releasedBy || '';
      if (counselor !== 'Bianca' && counselor !== 'Anuradha') {
        result = {status:'error', reason:'unauthorized'};
      } else {
        result = saveDiplomaFile(ss, body);
      }
    } else {
      result = {status:'error', reason:'unknown_action'};
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status:'error', message:err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ═══════════════════════════════════════════════════════════════
//  doGet
// ═══════════════════════════════════════════════════════════════
function doGet(e) {
  const p    = e.parameter || {};
  const act  = p.action || '';
  const cbFn = p.callback || '';
  const ss   = SpreadsheetApp.openById(SHEET_ID);
  
  // Ensure daily trigger is set up
  try {
    createDailyOverdueEmailTrigger();
  } catch(err) {
    Logger.log("Error ensuring daily trigger: " + err.toString());
  }
  
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
      const isMasterPin = pin === MASTER_PASS;
      // Check manager credentials
      const mgr = MANAGER_ROLE[name];
      const mgrCred = mgr ? (isMasterPin ? {ok:true,credential:{mustChange:false}} : authenticateUser(ss,'Instructor',name,pin)) : {ok:false};
      if (mgr && mgrCred.ok) {
        const adminBatches = fetchBatches(ss, [], '');
        return respond({status:'ok', counselorName:name, centres:Object.keys(CENTRE_CODES), isAdmin:true, isManager:true, authRole:'Manager', mustChangePassword:false, batches:adminBatches});
      }
      // Check counselor credentials first
      const cred = COUNSELOR_CREDS[name];
      const sheetCred = cred ? (isMasterPin ? {ok:true,credential:{mustChange:false}} : authenticateUser(ss,'Counselor',name,pin)) : {ok:false};
      if (cred && sheetCred.ok) {
        const allowedCentres = (name === 'Anuradha' || name === 'Bianca') ? Object.keys(CENTRE_CODES) : cred.centres;
        const batches = fetchBatches(ss, allowedCentres, '');
        return respond({status:'ok', counselorName:name, centres:allowedCentres, isAdmin:false, authRole:'Counselor', mustChangePassword:false, batches});
      }
      // Check dual-role instructor credentials (Arjun, Piyush, Anuradha)
      const dual = DUAL_ROLE[name];
      const instrCred = dual ? (isMasterPin ? {ok:true,credential:{mustChange:false}} : authenticateUser(ss,'Instructor',name,pin)) : {ok:false};
      if (dual && instrCred.ok) {
        const allowedCentres = (name === 'Anuradha' || name === 'Bianca') ? Object.keys(CENTRE_CODES) : dual.centres;
        const batches = fetchBatches(ss, allowedCentres, '');
        return respond({status:'ok', counselorName:name, centres:allowedCentres, isAdmin:false, isDualRole:true, authRole:'Instructor', mustChangePassword:false, batches});
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

    // ── listUsers — return all credential rows (admin only) ────────
    if (act==='listUsers') {
      if(p.adminPass!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
      if(!sh||sh.getLastRow()<2)return respond({status:'ok',users:[]});
      var rows=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      var users=rows.filter(function(r){return String(r[0]||'').trim();}).map(function(r){
        return {
          role:String(r[0]||''),name:String(r[1]||''),centres:String(r[2]||''),
          mustChange:String(r[5]||'N')==='Y',updatedAt:String(r[6]||''),
          active:String(r[7]||'Y')!=='N'
        };
      });
      return respond({status:'ok',users:users});
    }

    // ── addUser — create a new user with hashed password ──────────
    if (act==='addUser') {
      if(p.adminPass!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      var role=String(p.role||'').trim();
      var name=String(p.name||'').trim();
      var centres=String(p.centres||'').trim();
      var tempPass=String(p.tempPassword||'').trim();
      if(!role||!name||!tempPass)return respond({status:'error',reason:'missing_fields'});
      if(findUserCredential(ss,role,name))return respond({status:'error',reason:'already_exists'});
      var validation=validateNewPassword(name,tempPass,null);
      if(validation)return respond({status:'error',reason:'weak_password',message:validation});
      var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
      if(!sh)sh=ss.insertSheet(SH_USER_CREDENTIALS);
      var salt=Utilities.getUuid();
      sh.appendRow([role,name,centres,hashPassword(tempPass,salt),salt,'Y',new Date().toISOString(),'Y']);
      return respond({status:'ok'});
    }

    // ── setUserActive — deactivate or reactivate a user ───────────
    if (act==='setUserActive') {
      if(p.adminPass!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      var cred=findUserCredential(ss,p.role,p.name);
      if(!cred)return respond({status:'error',reason:'user_not_found'});
      var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
      var activeVal=String(p.active||'Y')==='Y'?'Y':'N';
      sh.getRange(cred.rowIndex,8).setValue(activeVal);
      sh.getRange(cred.rowIndex,7).setValue(new Date().toISOString());
      return respond({status:'ok',active:activeVal==='Y'});
    }

    // ── deleteUser — remove credential row only (data preserved) ──
    if (act==='deleteUser') {
      if(p.adminPass!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      var cred=findUserCredential(ss,p.role,p.name);
      if(!cred)return respond({status:'error',reason:'user_not_found'});
      var sh=ss.getSheetByName(SH_USER_CREDENTIALS);
      sh.deleteRow(cred.rowIndex);
      return respond({status:'ok'});
    }

    if (act==='masterLogin')    return respond({status: p.pass===MASTER_PASS?'ok':'error'});

    // ── clearEnsureCache — force ensureSheets to re-run on next request ──
    if (act==='clearEnsureCache') {
      if (p.adminPass !== ADMIN_PASS) return respond({status:'error',reason:'auth'});
      try { CacheService.getScriptCache().remove('ensureSheets_ok'); } catch(_e){}
      return respond({status:'ok', message:'ensureSheets cache cleared — will re-run on next request'});
    }

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

    if (act==='deleteBatch') {
      return respond(deleteBatch(ss, p));
    }

    // ── getBatchSnapshot ──────────────────────────────────────
    if (act==='getBatchSnapshot') return respond(getBatchSnapshot(ss));

    // ── TRAY HUB ──────────────────────────────────────────────
    if (act==='trayRegister')           return respond(trayRegister(ss,p));
    if (act==='trayBulkSeed')           return respond(trayBulkSeed(ss,p));
    if (act==='trayGetBoard')           return respond(trayGetBoard(ss,p));
    if (act==='trayGetMine')            return respond(trayGetMine(ss,p));
    if (act==='trayBook')               return respond(trayBook(ss,p));
    if (act==='trayRespond')            return respond(trayRespond(ss,p));
    if (act==='trayMarkReturning')      return respond(trayMarkReturning(ss,p));
    if (act==='trayConfirmReturn')      return respond(trayConfirmReturn(ss,p));
    if (act==='trayConfirmLocation')    return respond(trayConfirmLocation(ss,p));
    if (act==='trayBorrowerConfirm')    return respond(trayBorrowerConfirm(ss,p));
    if (act==='trayUpdateDetails')      return respond(trayUpdateDetails(ss,p));
    if (act==='trayGetWeekPlan')        return respond(trayGetWeekPlan(ss,p));
    if (act==='traySetWeeklyNeed')      return respond(traySetWeeklyNeed(ss,p));
    if (act==='trayGetNotifications')   return respond(trayGetNotifications(ss,p));
    if (act==='trayMarkNotifRead')      return respond(trayMarkNotifRead(ss,p));
    if (act==='trayGetHistory')         return respond(trayGetHistory(ss,p));
    if (act==='trayGetJourney')         return respond(trayGetJourney(ss,p));
    if (act==='trayPlanJourney')        return respond(trayPlanJourney(ss,p));
    if (act==='trayDispatch')           return respond(trayDispatch(ss,p));
    if (act==='trayConfirmReceived')    return respond(trayConfirmReceived(ss,p));
    if (act==='trayConfirmDispatched')  return respond(trayConfirmDispatched(ss,p));
    if (act==='trayMarkInUse')          return respond(trayMarkInUse(ss,p));
    if (act==='trayMarkInUseDone')      return respond(trayMarkInUseDone(ss,p));

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
      const clashError = checkStudentClashes(ss, studentId, batchCodes);
      if (clashError) return respond(clashError);
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

    // ── getDiplomaReleaseList ─────────────────────────────────
    if (act==='getDiplomaReleaseList') {
      const counselor = p.counselorName || '';
      if (counselor !== 'Bianca' && counselor !== 'Anuradha') {
        return respond({status:'error', reason:'unauthorized'});
      }
      return respond(getDiplomaReleaseList(ss, p));
    }

    // ── releaseStudentDiploma ─────────────────────────────────
    if (act==='releaseStudentDiploma') {
      const counselor = p.counselorName || '';
      if (counselor !== 'Bianca' && counselor !== 'Anuradha') {
        return respond({status:'error', reason:'unauthorized'});
      }
      return respond(releaseStudentDiploma(ss, p));
    }

    // ── getDiplomaTemplate ───────────────────────────────────
    if (act==='getDiplomaTemplate') return respond(getDiplomaTemplate(ss,p));

    // ── saveDiplomaFile ──────────────────────────────────────
    if (act==='saveDiplomaFile') {
      const counselor = p.releasedBy || '';
      if (counselor !== 'Bianca' && counselor !== 'Anuradha') {
        return respond({status:'error', reason:'unauthorized'});
      }
      return respond(saveDiplomaFile(ss,p));
    }

    // ── getStudentDiplomas ───────────────────────────────────
    if (act==='getStudentDiplomas') return respond(getStudentDiplomas(ss,p));

    // ── getInstructorEligibility ──────────────────────────────
    if (act==='getInstructorEligibility') {
      return respond(getInstructorEligibility(ss, p));
    }

    // ── getUpcomingBatches ────────────────────────────────────
    if (act==='getUpcomingBatches') {
      return respond(getUpcomingBatches(ss, p));
    }

    // ── HOD Approvals actions ──────────────────────────────────
    if (act==='submitHODApprovalRequest') {
      return respond(submitHODApprovalRequest(ss, p));
    }
    if (act==='getPendingHODApprovals') {
      return respond(getPendingHODApprovals(ss, p));
    }
    if (act==='reviewHODApproval') {
      return respond(reviewHODApproval(ss, p));
    }

    // ── Inventory actions ──────────────────────────────────────
    if (act==='getInventoryStock') {
      return respond(getInventoryStock(ss, p));
    }
    if (act==='submitInventoryRequest') {
      return respond(submitInventoryRequest(ss, p));
    }
    if (act==='getInventoryRequests') {
      return respond(getInventoryRequests(ss, p));
    }
    if (act==='processInventoryDispatch') {
      return respond(processInventoryDispatch(ss, p));
    }
    if (act==='confirmInventoryReceived') {
      return respond(confirmInventoryReceived(ss, p));
    }
    if (act==='registerVendor') {
      return respond(registerVendor(ss, p));
    }
    if (act==='getVendors') {
      return respond(getVendors(ss, p));
    }

    if (act==='getInventoryItemMaster') {
      return respond(getInventoryItemMaster(ss, p));
    }
    if (act==='addInventoryItem') {
      return respond(addInventoryItem(ss, p));
    }
    if (act==='updateInventoryItem') {
      return respond(updateInventoryItem(ss, p));
    }
    if (act==='deleteInventoryItem') {
      return respond(deleteInventoryItem(ss, p));
    }
    if (act==='updateBranchStock') {
      return respond(updateBranchStock(ss, p));
    }
    if (act==='getCourseBundles') {
      return respond(getCourseBundles(ss, p));
    }
    if (act==='submitCourseBundleRequest') {
      return respond(submitCourseBundleRequest(ss, p));
    }
    if (act==='seedInventoryItems') {
      return respond(seedInventoryItems(ss, p));
    }
    if (act==='setupInventorySheets') {
      return respond(setupInventorySheets(ss, p));
    }
    if (act==='seedInventoryStock') {
      return respond(seedInventoryStock(ss, p));
    }

    // ── getStudentDiplomaStatus ───────────────────────────────
    // No auth needed — returns only the requesting student's own data.
    if (act==='getStudentDiplomaStatus') {
      const studentId = String(p.studentId || p.enrollmentNo || '').trim().toUpperCase();
      if (!studentId) return respond({status:'error', reason:'missing_student_id'});
      const full = getDiplomaReleaseList(ss, {});
      if (full.status !== 'ok') return respond(full);
      const rows = full.list.filter(r => String(r.studentId||'').toUpperCase() === studentId);
      return respond({status:'ok', rows});
    }

    // ── updateStudentPhoto ────────────────────────────────────
    // Student pastes a public photo URL (Google Drive / Dropbox link).
    // Stored in col 11 (index 10) of Batch_Students sheet.
    if (act==='updateStudentPhoto') {
      const studentId = String(p.studentId || p.enrollmentNo || '').trim().toUpperCase();
      const photoUrl  = String(p.photoUrl  || '').trim();
      if (!studentId) return respond({status:'error', reason:'missing_student_id'});
      // Basic sanity: must look like a URL
      if (photoUrl && !/^https?:\/\//i.test(photoUrl))
        return respond({status:'error', reason:'invalid_url'});
      const sh = ss.getSheetByName(SH_STUDENTS);
      if (!sh || sh.getLastRow() < 2) return respond({status:'error', reason:'no_sheet'});
      const data = sh.getRange(2, 1, sh.getLastRow()-1, 1).getValues();
      let found = false;
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]||'').trim().toUpperCase() === studentId) {
          sh.getRange(i+2, 11).setValue(photoUrl); // col K = index 10
          found = true;
          break;
        }
      }
      if (!found) return respond({status:'error', reason:'student_not_found'});
      return respond({status:'ok', photoUrl});
    }

    // ── otSubmitPortfolio ─────────────────────────────────────
    if (act==='otSubmitPortfolio') {
      return respond(otSubmitPortfolio(ss, p));
    }

    // ── otGetPortfolioSubmissions ─────────────────────────────
    if (act==='otGetPortfolioSubmissions') {
      return respond(otGetPortfolioSubmissions(ss, p));
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
      const isMasterPin = pin === MASTER_PASS;
      const auth = INSTRUCTOR_CREDS[name]
        ? (isMasterPin ? {ok:true,credential:{mustChange:false}} : authenticateUser(ss,'Instructor',name,pin))
        : {ok:false};
      if (!auth.ok)
        return respond({status:'error',reason:'wrong_credentials'});
      const dual = DUAL_ROLE[name];
      const isHead = name==='Bhavin Patel';
      const mgr  = MANAGER_ROLE[name];
      return respond({
        status:'ok',
        instructorName: name,
        isDualRole:     !!dual,
        isAcademicHead: isHead,
        isRevenueManager: !!mgr,
        managerCentres: mgr ? mgr.centres : [],
        centres:     dual ? dual.centres : [],
        authRole:    mgr ? 'Revenue Manager' : (isHead ? 'Academic Head' : 'Instructor'),
        mustChangePassword: false
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
      }).map(r=>{
        const hasSlot = detectSlotOrDate(r[4]);
        const rawStart = hasSlot ? r[5] : r[4];
        const rawEnd   = hasSlot ? r[6] : r[5];
        const startDateISO = rawStart ? new Date(rawStart).toISOString() : '';
        const endDateISO = rawEnd ? new Date(rawEnd).toISOString() : '';
        return {
          batchCode:r[0], centre:r[1], course:r[2], type:r[3],
          batchSlot:  hasSlot?(r[4]||'Full Day'):'Full Day',
          startDate:  rawStart?new Date(rawStart).toLocaleDateString('en-IN'):'',
          startDateISO: startDateISO,
          endDate:    rawEnd?new Date(rawEnd).toLocaleDateString('en-IN'):'',
          endDateISO: endDateISO,
          active:     String(r[7]||'Y')!=='N',   // col H — 'N' means inactive
          instructor: hasSlot?(r[9]||''):(r[8]||''),
          syllabus:   SYLLABI[r[2]] || []
        };
      });
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
        const syllabus = SYLLABI[r[2]] || [];
        let dayNo = '';
        let scheduledTopic = '';
        let week = '';
        if (todaySess) {
          dayNo = todaySess[3];
          if (syllabus && dayNo > 0 && dayNo <= syllabus.length) {
            scheduledTopic = syllabus[dayNo - 1].topic;
            week = syllabus[dayNo - 1].week || '';
          }
        } else if (activeToday && isWorkDay && startDate && syllabus.length) {
          const startStr = startRaw instanceof Date ? dateKey(startRaw) : String(startRaw).split('T')[0];
          const schedule = getWorkingSchedule(startStr, syllabus.length, holidays);
          schedule.forEach((d, i) => {
            if (dateKey(d) === todayISO) {
              dayNo = i + 1;
              scheduledTopic = syllabus[i].topic;
              week = syllabus[i].week || '';
            }
          });
        }
        return {
          batchCode, centre:r[1], course:r[2], type:r[3],
          batchSlot:isNew?(r[4]||'Full Day'):'Full Day',
          startDate:startRaw?new Date(startRaw).toLocaleDateString('en-IN'):'',
          endDate:endRaw?new Date(endRaw).toLocaleDateString('en-IN'):'',
          activeToday, workingDay:isWorkDay,
          sessionCode:todaySess?String(todaySess[0]):'',
          sessNo:todaySess?todaySess[3]:'',
          sessionType:todaySess?(todaySess[5]||'Scheduled'):'',
          topic:todaySess?(todaySess[6]||''):'',
          syllabus,
          scheduledTopic,
          dayNo,
          week
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

    // ── selfMarkAttendance ────────────────────────────────────
    if (act==='selfMarkAttendance') return respond(selfMarkAttendance(ss,p));

    // ── getSessionAttendance (instructor live view) ───────────
    if (act==='getSessionAttendance') return respond(getSessionAttendanceFull(ss,p));

    // ── instructorMarkAttendance ──────────────────────────────
    if (act==='instructorMarkAttendance') return respond(instructorMarkAttendance(ss,p));

    // ── finaliseAttendance ────────────────────────────────────
    if (act==='finaliseAttendance') return respond(finaliseAttendance(ss,p));

    // ── getPendingAttendanceSessions ──────────────────────────
    if (act==='getPendingAttendanceSessions') return respond(getPendingAttendanceSessions(ss,p));

    // ── getStudentTodaySession ────────────────────────────────
    if (act==='getStudentTodaySession') return respond(getStudentTodaySession(ss,p));

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

    // ── deleteAssessment ──────────────────────────────────────
    if (act==='deleteAssessment') {
      const assessmentId = (p.assessmentId||'').toUpperCase();
      const instructor   = String(p.instructor||'').trim();
      if (!assessmentId) return respond({status:'error',reason:'missing_id'});
      const shA = ss.getSheetByName(SH_ASSESSMENTS);
      const shM = ss.getSheetByName(SH_MARKS);
      if (!shA) return respond({status:'error',reason:'no_sheet'});
      // Verify ownership — must match instructor or be empty
      const aData = shA.getLastRow()>1 ? shA.getRange(2,1,shA.getLastRow()-1,7).getValues() : [];
      let found = false;
      for (let i = aData.length-1; i >= 0; i--) {
        if (String(aData[i][0]).toUpperCase() === assessmentId) {
          const owner = String(aData[i][6]||'').trim();
          if (owner && !sameName(owner, instructor)) return respond({status:'error',reason:'not_owner'});
          shA.deleteRow(i+2);
          found = true;
          break;
        }
      }
      if (!found) return respond({status:'error',reason:'not_found'});
      // Also delete all marks for this assessment
      if (shM && shM.getLastRow()>1) {
        const mData = shM.getRange(2,1,shM.getLastRow()-1,1).getValues();
        for (let i = mData.length-1; i >= 0; i--) {
          if (String(mData[i][0]).toUpperCase() === assessmentId) shM.deleteRow(i+2);
        }
      }
      return respond({status:'ok'});
    }

    // ── getAssessments ─────────────────────────────────────────
    if (act==='getAssessments') {
      const batchCode=(p.batchCode||'').toUpperCase();
      const sh=ss.getSheetByName(SH_ASSESSMENTS);
      if (!sh||sh.getLastRow()<2) return respond({status:'ok',assessments:[]});
      const data=sh.getRange(2,1,sh.getLastRow()-1,8).getValues();
      // Also load marks sheet to count how many students have marks entered per test
      const shM=ss.getSheetByName(SH_MARKS);
      const marksData=shM&&shM.getLastRow()>1?shM.getRange(2,1,shM.getLastRow()-1,2).getValues():[];
      const markCountByAssId={};
      marksData.forEach(r=>{ const id=String(r[0]).toUpperCase(); markCountByAssId[id]=(markCountByAssId[id]||0)+1; });
      // Active student count for this batch
      const expectedStudents=getStudentsForBatch(ss,batchCode).length;
      return respond({status:'ok',assessments:data.filter(r=>r[0]&&String(r[1]).toUpperCase()===batchCode)
        .map(r=>{
          const aId=String(r[0]).toUpperCase();
          const marksEntered=markCountByAssId[aId]||0;
          return {assessmentId:aId,batchCode:r[1],testName:r[2],testType:r[3],
            testDate:r[4]?new Date(r[4]).toLocaleDateString('en-IN'):'',
            totalMarks:r[5],instructor:r[6],marksEntered,expectedStudents};
        })
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
        
        // Find today's session
        const todaySess = allSess.find(r=>
          String(r[1]).toUpperCase()===batchCode &&
          r[2] && dateKey(r[2])===todayStr
        );

        if ((today<startDate||today>endDate) && !todaySess) return; // batch not active today and no session today
        
        const batchSlot = isNew?(batch[4]||'Full Day'):'Full Day';
        // Slot activation window
        const win   = SLOT_WINDOWS[batchSlot]||SLOT_WINDOWS['Full Day'];
        const nowHr = new Date().getHours();
        const windowOpen   = nowHr >= win.open;
        const windowClosed = nowHr >= win.close;
        const isActive     = windowOpen && !windowClosed;
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
          startDateISO: startDate.toISOString(),
          endDateISO:   endDate.toISOString(),
          startDateDisplay: startDate.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
          endDateDisplay:   endDate.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
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

      // Get all assessment marks for this student
      const shAss   = ss.getSheetByName(SH_ASSESSMENTS);
      const assData = shAss&&shAss.getLastRow()>1?shAss.getRange(2,1,shAss.getLastRow()-1,8).getValues():[];
      const shMarks = ss.getSheetByName(SH_MARKS);
      const marksData = shMarks&&shMarks.getLastRow()>1?shMarks.getRange(2,1,shMarks.getLastRow()-1,9).getValues():[];

      const studentAssessments = [];
      const enrolledBatchCodes = studentBatches.map(e => String(e.batchCode).toUpperCase());

      assData.forEach(ass => {
        const assId = String(ass[0]).toUpperCase();
        const assBatchCode = String(ass[1]).toUpperCase();
        
        if (enrolledBatchCodes.includes(assBatchCode)) {
          // Find if this student has a mark recorded
          const markRow = marksData.find(r => String(r[0]).toUpperCase() === assId && String(r[1]).trim().toUpperCase() === enrollNo);
          
          studentAssessments.push({
            assessmentId: assId,
            batchCode: assBatchCode,
            testName: ass[2],
            testType: ass[3],
            testDate: ass[4] ? dateKey(new Date(ass[4])) : '',
            totalMarks: ass[5],
            marksObtained: markRow ? markRow[3] : '',
            percentage: markRow ? markRow[4] : '',
            result: markRow ? markRow[5] : '',
            remarks: markRow ? (markRow[6] || '') : ''
          });
        }
      });

      // All enrolled batches (incl. expired) — for ID card validity display
      const allEnrolledBatches = getEnrollmentRows(ss)
        .filter(e => e.studentId === enrollNo && e.status === 'Active')
        .map(e => {
          const bc = String(e.batchCode).toUpperCase();
          const b  = bData.find(r => String(r[0]).toUpperCase() === bc);
          if (!b) return null;
          const isN = detectSlotOrDate(b[4]);
          const sD  = new Date(isN ? b[5] : b[4]); sD.setHours(0,0,0,0);
          const eD  = new Date(isN ? b[6] : b[5]); eD.setHours(23,59,59,0);
          return {
            batchCode: bc, course: b[2]||'', centre: b[1]||'', type: b[3]||'',
            batchSlot: isN ? (b[4]||'Full Day') : 'Full Day',
            instructor: b[9]||'',
            startDateISO: sD.toISOString(),
            endDateISO:   eD.toISOString(),
            startDateDisplay: sD.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
            endDateDisplay:   eD.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),
            expired: today > eD
          };
        }).filter(Boolean);

      return respond({
        status: 'ok',
        studentName,
        enrollmentNo: enrollNo,
        mobileLast4: storedLast4 || mobileColLast4,
        photoUrl: student.photoUrl || '',
        batches: batchCards,
        allBatches: allEnrolledBatches,
        assessments: studentAssessments
      });
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
      const result=buildRevenueDashboard(ss,p);
      return respond(result);
    }

    if (act==='migrateRevenueData') {
      return respond(migrateRevenueMonthlyData(ss, p.adminPass||p.pass||''));
    }

    if (act==='restoreRevenueFromLegacy') {
      return respond(restoreRevenueFromLegacy(ss, p.adminPass||p.pass||''));
    }

    if (act==='repairSharedLedger') {
      return respond(repairSharedLedger(ss, p.adminPass||p.pass||''));
    }

    if (act==='debugRevenueCounsellor') {
      if((p.adminPass||p.pass||'')!==ADMIN_PASS)return respond({status:'error',reason:'auth'});
      var debugName=String(p.counsellor||'Bianca').trim();
      var debugCentres=String(p.centres||'Mumbai').trim();
      var allDbRows=getRevenueMonthlyAchievedRows(ss);
      var dbRows=allDbRows.filter(function(r){return revenueSameCounsellor(r.counsellor,debugName);});
      var dbPeriod='2026-27';
      var dbMonths=revenueMonthList('2026-04','2027-03');
      var dbMonthKeys={};dbMonths.forEach(function(m){dbMonthKeys[m.key]=true;});
      var dbP={counsellor:debugName,centres:debugCentres,centre:'',period:dbPeriod,isAdmin:'false',viewerCounsellor:debugName};
      var dbPassed=[],dbFailed=[];
      dbRows.forEach(function(r){
        var reason='';
        if(r.period!==dbPeriod)reason='wrong period: '+r.period;
        else if(!dbMonthKeys[r.month])reason='month out of range: '+r.month;
        else if(!revenueAllowedViewCentre(r,dbP))reason='centre not in ['+debugCentres+']: assigned='+r.assignedCentre+' business='+r.businessCentre;
        var obj={month:r.month,period:r.period,assignedCentre:r.assignedCentre,businessCentre:r.businessCentre,businessType:r.businessType,achievedGst:r.achievedGst,locked:r.locked,updatedAt:String(r.updatedAt||'').slice(0,19),source:r.sourceSheet};
        if(reason){obj.filteredReason=reason;dbFailed.push(obj);}
        else dbPassed.push(obj);
      });
      return respond({status:'ok',counsellor:debugName,totalAllRows:allDbRows.length,totalCounsellorRows:dbRows.length,passed:dbPassed.length,failed:dbFailed.length,passedRows:dbPassed,failedRows:dbFailed});
    }

    if (act==='getRevenueDiagnostic') {
      return respond(getRevenueDiagnostic(ss, p.adminPass||p.pass||''));
    }

    if (act==='getAdminDashboard') {
      ensureSheets(ss);
      if (String(p.isAdmin)!=='true') return respond({status:'error',reason:'auth'});
      return respond(buildAdminDashboard(ss,p));
    }

    if (act==='getAcademicHeadDashboard') {
      ensureSheets(ss);
      if (p.name !== 'Bhavin Patel') return respond({status:'error',reason:'auth'});
      
      var shFb = ss.getSheetByName(SH_FEEDBACK);
      var feedbackRows = shFb && shFb.getLastRow() > 1 
        ? shFb.getRange(2, 1, shFb.getLastRow() - 1, 17).getValues() 
        : [];
      
      var instructorStats = {};
      var comments = [];
      
      feedbackRows.forEach(function(r) {
        var inst = String(r[6] || '').trim();
        var rating = Number(r[9]) || 0;
        var isAnon = String(r[15]).toUpperCase() === 'Y';
        var studentName = isAnon ? '[Anonymous]' : String(r[2] || '').trim();
        
        if (inst) {
          if (!instructorStats[inst]) {
            instructorStats[inst] = { name: inst, totalRating: 0, ratingCount: 0, sessions: {} };
          }
          if (rating > 0) {
            instructorStats[inst].totalRating += rating;
            instructorStats[inst].ratingCount += 1;
          }
          if (r[0]) {
            instructorStats[inst].sessions[String(r[0]).toUpperCase()] = 1;
          }
        }
        
        var q3 = String(r[11] || '').trim();
        var q4 = String(r[12] || '').trim();
        var q5 = String(r[13] || '').trim();
        var q6 = String(r[14] || '').trim();
        
        if (q3 || q4 || q5 || q6) {
          comments.push({
            sessionCode: r[0],
            studentId: r[1],
            studentName: studentName,
            batchCode: r[3],
            centre: r[4],
            course: r[5],
            instructor: inst,
            topic: r[7],
            rating: rating,
            q3: q3,
            q4: q4,
            q5: q5,
            q6: q6,
            isAnonymous: isAnon,
            timestamp: r[16] ? (r[16] instanceof Date ? r[16].toISOString() : String(r[16])) : ''
          });
        }
      });
      
      var statsList = Object.keys(instructorStats).map(function(k) {
        var s = instructorStats[k];
        return {
          instructor: s.name,
          avgRating: s.ratingCount ? Math.round((s.totalRating / s.ratingCount) * 10) / 10 : 0,
          ratingsCount: s.ratingCount,
          sessionsCount: Object.keys(s.sessions).length
        };
      });
      
      comments.sort(function(a,b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
      
      var shBatch = ss.getSheetByName(SH_BATCHES);
      var batchRows = shBatch && shBatch.getLastRow() > 1 
        ? shBatch.getRange(2, 1, shBatch.getLastRow() - 1, 10).getValues().filter(function(r) { return r[0]; }) 
        : [];
      
      var attendance = buildAdminAttendanceSummary(ss, batchRows);
      
      var batchMap = {};
      batchRows.forEach(function(b) {
        var code = String(b[0]).toUpperCase();
        batchMap[code] = {
          batchCode: code,
          centre: b[1] || '',
          course: b[2] || '',
          type: b[3] || '',
          instructor: detectSlotOrDate(b[4]) ? (b[9] || '') : (b[8] || '')
        };
      });
      var testSummary = buildAdminTestSummary(ss, batchMap);
      
      return respond({
        status: 'ok',
        instructorStats: statsList,
        comments: comments.slice(0, 150),
        attendance: attendance,
        tests: testSummary
      });
    }

    if (act==='debugGetBatches') {
      ensureSheets(ss);
      var sh = ss.getSheetByName(SH_BATCHES);
      var vals = sh ? sh.getDataRange().getValues() : [];
      return respond({status: 'ok', batches: vals});
    }

    if (act==='getStudentAlumni') {
      ensureSheets(ss);
      if (String(p.isAdmin) !== 'true' && !COUNSELOR_CREDS[p.counsellorName]) {
        return respond({status: 'error', reason: 'auth', message: 'Unauthorized access to student alumni records.'});
      }

      var shBatch = ss.getSheetByName(SH_BATCHES);
      var batchRows = shBatch && shBatch.getLastRow() > 1
        ? shBatch.getRange(2, 1, shBatch.getLastRow() - 1, 10).getValues()
        : [];
      
      var parseJsDate = function(val) {
        if (!val) return null;
        if (val instanceof Date) return val;
        var s = String(val).trim();
        var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (m) {
          return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
        }
        var m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
        if (m2) {
          return new Date(parseInt(m2[1], 10), parseInt(m2[2], 10) - 1, parseInt(m2[3], 10));
        }
        var d = new Date(s);
        if (!isNaN(d.getTime())) return d;
        return null;
      };

      var finishedBatchesMap = {};
      var batchCourseMap = {};
      var today = new Date();
      
      batchRows.forEach(function(r) {
        if (!r[0]) return;
        var code = String(r[0]).trim().toUpperCase();
        var isNew = detectSlotOrDate(r[4]);
        var endVal = isNew ? r[6] : r[5];
        var isCompleted = false;
        
        if (endVal) {
          var endDate = parseJsDate(endVal);
          if (endDate && endDate < today) {
            isCompleted = true;
          }
        }
        
        if (isCompleted) {
          finishedBatchesMap[code] = true;
        }
        batchCourseMap[code] = {
          course: r[2] || '',
          startDate: isNew ? r[5] : r[4],
          centre: r[1] || ''
        };
      });
      
      var studentsList = getStudentRows(ss);
      var studentMap = {};
      studentsList.forEach(function(s) {
        studentMap[s.id] = s;
      });
      
      var enrollments = getEnrollmentRows(ss);
      var alumni = [];
      var addedKeys = {};
      
      enrollments.forEach(function(e) {
        var bCode = e.batchCode;
        var s = studentMap[e.studentId];
        if (s) {
          var key = s.id + '|' + bCode;
          if (!addedKeys[key]) {
            addedKeys[key] = true;
            
            var bInfo = batchCourseMap[bCode] || {};
            var enrollMonth = '';
            if (e.enrolledAt) {
              var enrolDate = parseJsDate(e.enrolledAt);
              if (enrolDate) {
                enrollMonth = enrolDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
              }
            }
            if (!enrollMonth && bInfo.startDate) {
              var startDate = parseJsDate(bInfo.startDate);
              if (startDate) {
                enrollMonth = startDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
              }
            }
            
            alumni.push({
              studentId: s.id,
              name: s.name,
              contact: s.mobile || '',
              email: s.email || '',
              course: bInfo.course || '',
              centre: bInfo.centre || '',
              batchCode: bCode,
              enrolmentMonth: enrollMonth || 'N/A',
              status: finishedBatchesMap[bCode] ? 'Completed' : 'Active'
            });
          }
        }
      });
      
      return respond({ status: 'ok', alumni: alumni, debugFinishedBatches: finishedBatchesMap, debugBatchCourseMap: batchCourseMap });
    }

    if (act==='saveRevenueTargets') {
      ensureSheets(ss);
      if (String(p.isManager)==='true') {
        return respond({status:'error', reason:'auth', message:'Managers are not allowed to save or modify annual targets.'});
      }
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

    // ── ONLINE TEST SYSTEM ────────────────────────────────────
    if (act==='setupQuestionBank')       return respond(otSetupQuestionBank(ss,p));
    if (act==='getQuestionBank')         return respond(otGetQuestionBank(ss,p));
    if (act==='getStudentsForBatches')   return respond(otGetStudentsForBatches(ss,p));
    if (act==='createOnlineTest')        return respond(otCreateTest(ss,p));
    if (act==='duplicateOnlineTest')     return respond(otDuplicateTest(ss,p));
    if (act==='getInstructorTests')      return respond(otGetInstructorTests(ss,p));
    if (act==='getTestDetails')          return respond(otGetTestDetails(ss,p));
    if (act==='saveTestQuestions')       return respond(otSaveTestQuestions(ss,p));
    if (act==='addCustomQuestion')       return respond(otAddCustomQuestion(ss,p));
    if (act==='activateTest')            return respond(otActivateTest(ss,p));
    if (act==='scheduleTestActivation')  return respond(otScheduleTestActivation(ss,p));
    if (act==='closeTest')               return respond(otCloseTest(ss,p));
    if (act==='deleteOnlineTest')        return respond(otDeleteTest(ss,p));
    if (act==='releaseResults')          return respond(otReleaseResults(ss,p));
    if (act==='getStudentActiveTest')    return respond(otGetStudentActiveTest(ss,p));
    if (act==='getTestQuestions')        return respond(otGetTestQuestions(ss,p));
    if (act==='getTestQuestionsInstructor') return respond(otGetTestQuestionsInstructor(ss,p));
    if (act==='removeTestQuestion')         return respond(otRemoveTestQuestion(ss,p));
    if (act==='updateTestQuestion')         return respond(otUpdateQuestion(ss,p));
    if (act==='updateTestSettings')         return respond(otUpdateTestSettings(ss,p));
    if (act==='submitTestResponse')      return respond(otSubmitTestResponse(ss,p));
    if (act==='logTestWarning')          return respond(otLogTestWarning(ss,p));
    if (act==='getProctorRoom')          return respond(otGetProctorRoom(ss,p));
    if (act==='resetStudentAttempt')     return respond(otResetStudentAttempt(ss,p));
    if (act==='saveManualGrade'||act==='gradeManualQuestion') return respond(otSaveManualGrade(ss,p));
    if (act==='getPendingManualGrades')  return respond(otGetPendingManualGrades(ss,p));
    if (act==='getStudentResults')       return respond(otGetStudentResultsV3(ss,p));
    if (act==='getTestResultsSummary')        return respond(otGetTestResultsSummary(ss,p));
    if (act==='getBatchPerformanceSummary')   return respond(otGetBatchPerformanceSummary(ss,p));
    if (act==='getTestTemplates')             return respond(otGetTestTemplates(ss,p));
    if (act==='saveTestTemplate')             return respond(otSaveTestTemplate(ss,p));
    if (act==='deleteTestTemplate')           return respond(otDeleteTestTemplate(ss,p));
    if (act==='setupScheduledTrigger')        return respond(otSetupScheduledTrigger(ss,p));

    // ── sendOverdueEmails ─────────────────────────────────────
    if (act==='sendOverdueEmails') {
      var result = sendOverdueFeeEmailNotifications(ss);
      return respond(result);
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
  const data=sh.getRange(2,1,sh.getLastRow()-1,11).getValues(); // 11 cols — col 11 = photoUrl
  const map={};
  data.forEach((r,i)=>{
    const id=String(r[0]||'').trim().toUpperCase();
    if(!id)return;
    const mobileDigits=String(r[4]||'').replace(/\D/g,'');
    const last4=mobileDigits.length>=4?mobileDigits.slice(-4):String(r[3]||'').replace(/\D/g,'').slice(-4);
    const row={id,enrollmentNo:id,primaryBatch:String(r[1]||'').toUpperCase(),name:r[2]||'',mobileLast4:last4,
      mobile:r[4]||'',email:r[5]||'',status:r[6]||'Active',createdAt:r[7]||'',
      welcomeEmailStatus:r[8]||'',welcomeEmailSentAt:r[9]||'',photoUrl:r[10]||'',rowIndex:i+2,raw:r};
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
    shEn.getRange(2,1,shEn.getLastRow()-1,7).getValues().forEach((r,i)=>{
      const studentId=String(r[0]||'').trim().toUpperCase();
      const batchCode=String(r[1]||'').trim().toUpperCase();
      if(studentId&&batchCode){
        explicitKeys[studentId+'|'+batchCode]=true;
        rows.push({
          studentId,
          batchCode,
          status:r[2]||'Active',
          enrolledAt:r[3]||'',
          diplomaStatus:r[4]||'',
          diplomaReleasedBy:r[5]||'',
          diplomaReleasedAt:r[6]||'',
          rowIndex:i+2,
          source:'link'
        });
      }
    });
  }
  const sh=ss.getSheetByName(SH_STUDENTS);
  if(sh&&sh.getLastRow()>1){
    sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach((r,i)=>{
      const studentId=String(r[0]||'').trim().toUpperCase();
      const batchCode=String(r[1]||'').trim().toUpperCase();
      if(studentId&&batchCode&&!explicitKeys[studentId+'|'+batchCode])
        rows.push({
          studentId,
          batchCode,
          status:r[6]||'Active',
          enrolledAt:r[7]||'',
          diplomaStatus:'',
          diplomaReleasedBy:'',
          diplomaReleasedAt:'',
          rowIndex:i+2,
          source:'legacy'
        });
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
  // ── Fast-path: skip if verified recently (saves ~2-4s per request) ──
  // Sheets are stable after initial setup — no need to re-check on every call.
  // Cache flag lives for 6 hours. Clear manually via ?action=clearEnsureCache&adminPass=IGI2026 if needed.
  try {
    var sc = CacheService.getScriptCache();
    if (sc.get('ensureSheets_ok') === '1') return;
  } catch(_ec) {}

  const defs = {
    [SH_BATCHES]:  ['Batch Code','Centre','Course','Type','Batch Slot','Start Date','End Date','Created By','Created At','Assigned Instructor'],
    [SH_STUDENTS]: ['Student ID','Primary Batch Code','Name','Mobile Last 4','Mobile','Email','Status','Created At','Welcome Email Status','Welcome Email Sent At'],
    [SH_ENROLLMENTS]: ['Student ID','Batch Code','Status','Enrolled At','Diploma Status','Diploma Released By','Diploma Released At'],
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
    [SH_MARKS]:        ['Assessment ID','Student ID','Student Name','Marks Obtained','Percentage','Result','Remarks','Total Marks','Updated At'],
    [SH_HOD_APPROVALS]: ['Approval ID','Student ID','Batch Code','Student Name','Weekly Avg','Final Exam','Requested By','Requested At','Status','Reviewed By','Reviewed At','Note'],
    [SH_INV_ITEMS]:    ['Item ID','Item Name','Category','Unit','Created At'],
    [SH_INV_STOCK]:    ['Stock ID','Centre','Item ID','Quantity','Updated At','Updated By'],
    [SH_INV_REQUESTS]: ['Request ID','Centre','Item ID','Quantity Requested','Urgency','Counsellor Note','Requested By','Requested At','Status','Approved By','Approved At'],
    [SH_INV_DISPATCH]: ['Dispatch ID','Request ID','Quantity Dispatched','Dispatch Date','Courier / Tracking Info','Dispatched By','Dispatched At'],
    [SH_INV_VENDORS]:  ['Vendor ID','Vendor Name','Contact Person','Phone','Email','Address','Supplied Items','Registered By','Registered At'],
    [SH_ATT_RECORDS]:  ['Record ID','Session Code','Batch Code','Student ID','Student Name','Centre','Date','Marked At','Marked By','Status','Lat','Lng','Accuracy (m)','Resolved Address','Location Status','IP Address']
  };
  Object.entries(defs).forEach(([name,headers])=>{
    let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);
    if(sh.getLastRow()===0||sh.getRange(1,1).getValue()===''){
      sh.getRange(1,1,1,headers.length).setValues([headers])
        .setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
      sh.setFrozenRows(1);
    } else if (name===SH_STUDENTS) {
      ensureStudentHeaders(sh);
    } else if (name===SH_ENROLLMENTS) {
      ensureEnrollmentHeaders(sh);
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
  
  // Seed initial items if INV_Items is empty
  const shItems = ss.getSheetByName(SH_INV_ITEMS);
  if (shItems && shItems.getLastRow() <= 1) {
    const defaultItems = [
      ['ITEM-001', 'DG Brochure', 'Brochure', 'Pcs', new Date().toISOString()],
      ['ITEM-002', 'CSG Brochure', 'Brochure', 'Pcs', new Date().toISOString()],
      ['ITEM-003', 'DG Course Materials', 'Course Material', 'Sets', new Date().toISOString()],
      ['ITEM-004', 'CSG Course Materials', 'Course Material', 'Sets', new Date().toISOString()]
    ];
    defaultItems.forEach(row => shItems.appendRow(row));
  }
  
  // Mark as done — skip for next 6 hours
  try { CacheService.getScriptCache().put('ensureSheets_ok', '1', 21600); } catch(_es) {}
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
  const h=['Session Code','Batch Code','Session Date','Session No','Instructor','Session Type','Topic Covered','Auto Created','Created At',
           'Att Status','Present Count','Absent Count','Att Confirmed By','Att Confirmed At'];
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  const hasOldTopicHeader=current[5]==='Topic'||current[6]==='Module'||current[7]==='Created At';
  if (hasOldTopicHeader||current[5]!==h[5]||current[6]!==h[6]||current[7]!==h[7]||current[8]!==h[8]||current[9]!==h[9]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
}
function ensureEnrollmentHeaders(sh) {
  const h=['Student ID','Batch Code','Status','Enrolled At','Diploma Status','Diploma Released By','Diploma Released At'];
  if (sh.getLastRow()===0||sh.getRange(1,1).getValue()===''){
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
    return;
  }
  const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),h.length)).getValues()[0].map(String);
  if (current.length < h.length || current[4]!==h[4] || current[5]!==h[5] || current[6]!==h[6]) {
    sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    sh.setFrozenRows(1);
  }
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
  var from = (fromMonth && String(fromMonth).match(/^\d{4}-\d{2}$/)) ? String(fromMonth) : '2026-04';
  var to = (toMonth && String(toMonth).match(/^\d{4}-\d{2}$/)) ? String(toMonth) : '2027-03';
  var start=new Date(from+'-01'), end=new Date(to+'-01'), out=[];
  if(isNaN(start.getTime())||isNaN(end.getTime())||start>end){start=new Date('2026-04-01');end=new Date('2027-03-01');}
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
  if(value instanceof Date) {
    return Utilities.formatDate(value,Session.getScriptTimeZone(),'yyyy-MM');
  }
  var str=String(value).trim();
  if(str.match(/^\d{4}-\d{2}/)) {
    return str.slice(0,7);
  }
  var d=new Date(str);
  if(isNaN(d.getTime()))return str.slice(0,7);
  var corrected = new Date(d.getTime() + 12 * 60 * 60 * 1000);
  return Utilities.formatDate(corrected,Session.getScriptTimeZone(),'yyyy-MM');
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
  // fullMonths = the appraisal cycle months (Apr 2026–Mar 2027 = 12 months).
  // Previously hardcoded to Jan 2026–Mar 2027 (15 months), which made monthly
  // pacing targets 25% too low. Now aligned to the requested cycle window.
  var fullMonths=months.length>0?months:revenueMonthList('2026-04','2027-03');
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
  var activeNames = Object.keys(COUNSELOR_CREDS).filter(function(n) { return n !== 'Mrinal'; });
  activeNames.forEach(function(name) {
    byCounsellor[name] = revenueBlankBucket();
  });
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
  var currentMonthKey = p.currentMonth || '';
  if (!currentMonthKey) {
    var today = new Date();
    var periodStart = new Date(2026,3,1);
    var periodEnd = new Date(2027,2,1);
    var current = today < periodStart ? periodStart : (today > periodEnd ? periodEnd : today);
    currentMonthKey = current.getFullYear()+'-'+String(current.getMonth()+1).padStart(2,'0');
  }

  return {status:'ok',backendVersion:REVENUE_BACKEND_VERSION,period:period,months:monthRows,centreTargetRows:centreTargetRows,targetRows:targetRows,monthlyRows:achievedRows,monthlyPreviewRows:monthlyPreviewRows,monthlyPreviewTargets:monthlyPreviewTargets,crossRows:crossRows,
    summary:{targetCourse:totalTargetCourse,targetGst:totalTargetGst,achievedCourse:achievedCourse,achievedGst:achievedGst,studentCount:studentCount,designatedCourse:designatedCourse,designatedGst:designatedGst,otherCentreCourse:otherCentreCourse,otherCentreGst:otherCentreGst,corporateCourse:corporateCourse,corporateGst:corporateGst,monthlyTargetCourse:monthlyTargetCourse,monthlyTargetGst:monthlyTargetGst,monthsInPeriod:fullMonths.length,centreTargetCourse:centreTargetCourse,centreTargetGst:centreTargetGst,splitTargetCourse:splitTargetCourse,splitTargetGst:splitTargetGst},
    counsellors:Object.keys(byCounsellor).sort().map(function(k){return Object.assign({counsellor:k},byCounsellor[k]);}).filter(function(c){return c.counsellor !== 'Mrinal';}),
    centres:Object.keys(byCentre).sort().map(function(k){return Object.assign({centre:k},byCentre[k]);}),
    businessCentres:Object.keys(byBusinessCentre).sort().map(function(k){return Object.assign({centre:k},byBusinessCentre[k]);}),
    centreStandings:getGlobalCentreStandings(ss, period, currentMonthKey, allAnnualTargets, allMonthlyAchieved),
    counsellorStandings:getGlobalCounsellorStandings(ss, period, currentMonthKey, allAnnualTargets, allMonthlyAchieved)};
}

function getGlobalCentreStandings(ss, period, currentMonthKey, allAnnualTargets, allMonthlyAchieved) {
  var globalCentreMap = {};
  
  // 1. Rollup targets from centreTargetRows
  getRevenueCentreTargetRows(ss).forEach(function(r) {
    if (r.period === period) {
      var c = r.centre;
      if (!globalCentreMap[c]) {
        globalCentreMap[c] = { centre: c, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
      }
      globalCentreMap[c].annualTarget += Number(r.targetCourse) || 0;
    }
  });

  // 2. Parse current Quarter months
  var monthNum = parseInt(currentMonthKey.split('-')[1], 10);
  var yearNum = parseInt(currentMonthKey.split('-')[0], 10);
  var quarterMonths = [yearNum + '-04', yearNum + '-05', yearNum + '-06'];
  if (monthNum >= 7 && monthNum <= 9) {
    quarterMonths = [yearNum + '-07', yearNum + '-08', yearNum + '-09'];
  } else if (monthNum >= 10 && monthNum <= 12) {
    quarterMonths = [yearNum + '-10', yearNum + '-11', yearNum + '-12'];
  } else if (monthNum >= 1 && monthNum <= 3) {
    quarterMonths = [yearNum + '-01', yearNum + '-02', yearNum + '-03'];
  }

  // 3. Rollup achievements (excluding GST, matching course target)
  allMonthlyAchieved.forEach(function(r) {
    if (r.period === period) {
      var c = r.businessCentre || r.centre;
      if (c) {
        if (!globalCentreMap[c]) {
          globalCentreMap[c] = { centre: c, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
        }
        // Strictly measure performance from April 2026 to March 2027
        if (r.month >= '2026-04' && r.month <= '2027-03') {
          var fee = Number(r.achievedCourse) || 0;
          globalCentreMap[c].annualAchieved += fee;
          if (quarterMonths.indexOf(r.month) >= 0) {
            globalCentreMap[c].qtdAchieved += fee;
          }
        }
      }
    }
  });

  // 4. Compute quarterly targets
  return Object.keys(globalCentreMap).map(function(k) {
    var item = globalCentreMap[k];
    item.qtdTarget = item.annualTarget / 4;
    return item;
  });
}

function getGlobalCounsellorStandings(ss, period, currentMonthKey, allAnnualTargets, allMonthlyAchieved) {
  var globalCounsellorMap = {};
  
  // Build a centre lookup from allAnnualTargets (authoritative source) for the current period
  var centreFromTargets = {};
  allAnnualTargets.forEach(function(r) {
    if (r.period === period && r.counsellor && r.centre) {
      centreFromTargets[r.counsellor.trim()] = r.centre;
    }
  });

  // Initialize map with all active counselors from credentials, excluding former counselor 'Mrinal'
  // Use allAnnualTargets centre as the authoritative source; fall back to COUNSELOR_CREDS
  var activeNames = Object.keys(COUNSELOR_CREDS).filter(function(n) { return n !== 'Mrinal'; });
  activeNames.forEach(function(name) {
    var cred = COUNSELOR_CREDS[name];
    var centre = centreFromTargets[name] || ((cred.centres && cred.centres.length) ? cred.centres[0] : 'Mumbai');
    globalCounsellorMap[name] = { counsellor: name, centre: centre, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
  });
  
  // 1. Rollup targets from allAnnualTargets
  allAnnualTargets.forEach(function(r) {
    if (r.period === period && r.counsellor) {
      var name = r.counsellor.trim();
      if (name === 'Arjun Mistry' || name === 'Piyush' || name === 'Piyush Ahuja' || name === 'Mrinal') return;
      if (!globalCounsellorMap[name]) {
        globalCounsellorMap[name] = { counsellor: name, centre: r.centre, annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
      }
      globalCounsellorMap[name].annualTarget += Number(r.targetCourse) || 0;
    }
  });

  // 2. Parse current Quarter months
  var monthNum = parseInt(currentMonthKey.split('-')[1], 10);
  var yearNum = parseInt(currentMonthKey.split('-')[0], 10);
  var quarterMonths = [yearNum + '-04', yearNum + '-05', yearNum + '-06'];
  if (monthNum >= 7 && monthNum <= 9) {
    quarterMonths = [yearNum + '-07', yearNum + '-08', yearNum + '-09'];
  } else if (monthNum >= 10 && monthNum <= 12) {
    quarterMonths = [yearNum + '-10', yearNum + '-11', yearNum + '-12'];
  } else if (monthNum >= 1 && monthNum <= 3) {
    quarterMonths = [yearNum + '-01', yearNum + '-02', yearNum + '-03'];
  }

  // 3. Rollup achievements (excluding GST, matching course target)
  allMonthlyAchieved.forEach(function(r) {
    if (r.period === period && r.counsellor) {
      var name = r.counsellor.trim();
      if (name === 'Arjun Mistry' || name === 'Piyush' || name === 'Piyush Ahuja' || name === 'Mrinal') return;
      if (!globalCounsellorMap[name]) {
        globalCounsellorMap[name] = { counsellor: name, centre: r.assignedCentre || r.centre || 'Unmapped', annualTarget: 0, annualAchieved: 0, qtdAchieved: 0 };
      }
      // Strictly measure performance from April 2026 to March 2027
      if (r.month >= '2026-04' && r.month <= '2027-03') {
        var fee = Number(r.achievedCourse) || 0;
        globalCounsellorMap[name].annualAchieved += fee;
        if (quarterMonths.indexOf(r.month) >= 0) {
          globalCounsellorMap[name].qtdAchieved += fee;
        }
      }
    }
  });

  return Object.keys(globalCounsellorMap).map(function(k) {
    var item = globalCounsellorMap[k];
    item.qtdTarget = item.annualTarget / 4;
    return item;
  });
}

function buildAdminDashboard(ss,p) {
  var period=revenuePeriod(p);
  var revenue=buildRevenueDashboard(ss,Object.assign({},p,{isAdmin:'true',centres:'',centre:'',counsellor:'',viewerCounsellor:'',viewMode:'business'}));
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

  // ── Pre-cycle total: Jan–Mar 2026 (excluded from Apr 2026–Mar 2027 appraisal cycle) ──
  var preCycleCourse = 0, preCycleGst = 0, preCycleStudents = 0;
  var preCycleMonths = ['2026-01','2026-02','2026-03'];
  var allMonthlyRows = getRevenueMonthlyAchievedRows(ss);
  allMonthlyRows.forEach(function(r) {
    if (preCycleMonths.indexOf(String(r.month||'').slice(0,7)) !== -1) {
      preCycleCourse   += Number(r.achievedCourse) || 0;
      preCycleGst      += Number(r.achievedGst)    || 0;
      preCycleStudents += Number(r.studentCount)   || 0;
    }
  });

  return {status:'ok',period:period,
    preCycle:{course:preCycleCourse, gst:preCycleGst, students:preCycleStudents,
              months:'Jan–Mar 2026', note:'Pre-cycle: collected but outside Apr 2026–Mar 2027 appraisal window'},
    summary:{
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
      month:revenueMonthKey(rowCell(r,map,'Month',0)),
      period:String(rowCell(r,map,'Period',1)||'2026-27').trim(),
      counsellor:String(rowCell(r,map,'Counsellor',2)||'').trim(),
      assignedCentre:String(rowCell(r,map,'Assigned Centre',3)||'').trim(),
      // For old-format rows (no 'Business Centre' header, column 4 = course fee), fall back to assignedCentre.
      // Using the course-fee value as businessCentre creates garbage ledger keys that break deduplication.
      businessCentre:(oldShape||!map['Business Centre'])
        ? String(rowCell(r,map,'Assigned Centre',3)||'').trim()
        : String(rowCell(r,map,'Business Centre',4)||rowCell(r,map,'Assigned Centre',3)||'').trim(),
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

// Returns the canonical list of all known counsellor/dual-role names for sheet lookups
function revenueKnownCounsellorNames() {
  var names = {};
  Object.keys(COUNSELOR_CREDS).forEach(function(n){ names[n]=true; });
  Object.keys(DUAL_ROLE).forEach(function(n){ names[n]=true; });
  return Object.keys(names);
}

// Normalise updatedAt for deduplication sorting.
// If the value is not an ISO-style timestamp (e.g. a counsellor name like "Bianca"
// ended up in that column due to a column-format mismatch), treat it as the oldest
// possible value so it always LOSES to a proper timestamp.
function revenueRowSortKey(updatedAt) {
  var t = String(updatedAt||'').trim();
  return /^\d{4}-\d{2}/.test(t) ? t : '0000-00-00T00:00:00';
}

// Option 2 — Smart fast-path detector.
// Returns true when every shared-ledger row has a valid ISO updatedAt timestamp,
// meaning the shared ledger is clean and per-counsellor sheets can be skipped.
// Run action=repairSharedLedger once to permanently enable this fast-path.
function revenueSharedLedgerIsClean(sharedRows) {
  for (var i = 0; i < sharedRows.length; i++) {
    if (!/^\d{4}-\d{2}/.test(String(sharedRows[i].updatedAt||'').trim())) return false;
  }
  return true;
}

function getRevenueMonthlyAchievedRows(ss) {
  // Deduplication: same revenueMonthlyLedgerKey → latest valid updatedAt wins.
  // Garbage updatedAt values (e.g. "Bianca") are treated as epoch so they lose.
  var byKey = {};
  function absorb(rows) {
    rows.forEach(function(r) {
      var key = revenueMonthlyLedgerKey(r);
      var prev = byKey[key];
      if (!prev || revenueRowSortKey(r.updatedAt) >= revenueRowSortKey(prev ? prev.updatedAt : '')) byKey[key] = r;
    });
  }
  // Always read shared ledger first (one sheet read, always fast)
  var sh = ss.getSheetByName(SH_REVENUE_MONTHLY_ACHIEVED);
  var sharedRows = parseRevenueMonthlyAchievedSheet(sh);
  absorb(sharedRows);
  // FAST-PATH (Option 2): if shared ledger is clean (all ISO timestamps),
  // it is the complete source of truth — return immediately, no more sheet reads.
  // After running action=repairSharedLedger this will always be true → ~200ms load.
  if (revenueSharedLedgerIsClean(sharedRows)) {
    return Object.keys(byKey).map(function(k) { return byKey[k]; });
  }
  // SLOW FALLBACK: garbage timestamps detected — merge per-counsellor sheets so
  // correct data (with proper timestamps) wins deduplication.
  // Targeted getSheetByName() per counsellor — no expensive ss.getSheets() scan.
  var seenSheet = {};
  seenSheet[SH_REVENUE_MONTHLY_ACHIEVED] = true;
  revenueKnownCounsellorNames().forEach(function(name) {
    var sheetName = revenueCounsellorMonthlySheetName(name);
    if (seenSheet[sheetName]) return;
    seenSheet[sheetName] = true;
    var s = ss.getSheetByName(sheetName);
    if (s) absorb(parseRevenueMonthlyAchievedSheet(s));
  });
  return Object.keys(byKey).map(function(k) { return byKey[k]; });
}

// ── Option 1: One-time repair — fix garbage updatedAt rows in shared ledger ──────
// After this runs, revenueSharedLedgerIsClean() returns true permanently and
// getRevenueMonthlyAchievedRows() uses the fast-path (~200ms instead of 15-25s).
// Run once via: YOUR_GAS_URL?action=repairSharedLedger&adminPass=IGI2026
function repairSharedLedger(ss, adminPass) {
  if (adminPass !== ADMIN_PASS) return {status:'error', reason:'auth'};
  var sharedSh = ss.getSheetByName(SH_REVENUE_MONTHLY_ACHIEVED);
  if (!sharedSh) return {status:'error', reason:'no_shared_ledger'};

  // Read shared ledger — find rows with garbage updatedAt (non-ISO value)
  var sharedRows = parseRevenueMonthlyAchievedSheet(sharedSh);
  var sharedByKey = {};  // key → parsed row (latest updatedAt per key)
  sharedRows.forEach(function(r) {
    var key = revenueMonthlyLedgerKey(r);
    var prev = sharedByKey[key];
    if (!prev || revenueRowSortKey(r.updatedAt) >= revenueRowSortKey(prev.updatedAt)) sharedByKey[key] = r;
  });
  var garbageKeys = {};
  Object.keys(sharedByKey).forEach(function(key) {
    if (!/^\d{4}-\d{2}/.test(String(sharedByKey[key].updatedAt||'').trim())) garbageKeys[key] = true;
  });
  var totalGarbage = Object.keys(garbageKeys).length;
  if (totalGarbage === 0) {
    return {status:'ok', repaired:0, stillGarbage:0,
      message:'Shared ledger is already clean. Fast-path is active — loads should be fast.'};
  }

  // For each garbage key, find the best replacement from per-counsellor sheets
  var replacements = {};
  revenueKnownCounsellorNames().forEach(function(name) {
    var sheetName = revenueCounsellorMonthlySheetName(name);
    if (sheetName === SH_REVENUE_MONTHLY_ACHIEVED) return;
    var s = ss.getSheetByName(sheetName);
    if (!s) return;
    parseRevenueMonthlyAchievedSheet(s).forEach(function(r) {
      var key = revenueMonthlyLedgerKey(r);
      if (!garbageKeys[key]) return;
      var prev = replacements[key];
      // Prefer row with highest achievedGst; break ties by latest proper timestamp
      var rBetter = !prev || r.achievedGst > prev.achievedGst ||
        (r.achievedGst === prev.achievedGst && revenueRowSortKey(r.updatedAt) > revenueRowSortKey(prev.updatedAt));
      if (rBetter) replacements[key] = r;
    });
  });

  var repaired = 0, stillGarbage = 0;
  var details = [];
  var updatedAtCol = 13; // 1-indexed column position of 'Updated At' in 13-col schema

  Object.keys(garbageKeys).forEach(function(key) {
    var current = sharedByKey[key];
    var rep = replacements[key];
    if (rep) {
      // Write correct values back into the shared ledger row
      var goodAt = /^\d{4}-\d{2}/.test(String(rep.updatedAt||'').trim())
        ? rep.updatedAt : new Date().toISOString();
      var row = [rep.month, rep.period, rep.counsellor, rep.assignedCentre, rep.businessCentre,
                 rep.businessType, rep.studentCount, rep.achievedCourse, rep.achievedGst,
                 rep.notes, rep.updatedBy, rep.locked ? 'Y' : 'N', goodAt];
      sharedSh.getRange(current.rowIndex, 1, 1, row.length).setValues([row]);
      details.push({month:rep.month, counsellor:rep.counsellor,
                    restoredGst:rep.achievedGst, oldUpdatedAt:current.updatedAt});
      repaired++;
    } else {
      // No per-counsellor replacement — at minimum stamp a valid placeholder timestamp
      // so the row no longer triggers the slow fallback path
      sharedSh.getRange(current.rowIndex, updatedAtCol).setValue('2000-01-01T00:00:00.000Z');
      stillGarbage++;
    }
  });

  try { SpreadsheetApp.flush(); } catch(_e) {}
  // Bust GAS cache so next request gets fresh repaired data
  try {
    var cacheKeys = revenueKnownCounsellorNames().map(function(name) {
      var c = COUNSELOR_CREDS[name]||{};
      return 'rev|'+REVENUE_BACKEND_VERSION+'|'+name+'|'+((c.centres||[]).join(','))+'|2026-27|false';
    });
    cacheKeys.push('rev|'+REVENUE_BACKEND_VERSION+'|||2026-27|true');
    CacheService.getScriptCache().removeAll(cacheKeys);
  } catch(_e2) {}

  return {status:'ok', repaired:repaired, stillGarbage:stillGarbage,
    message: stillGarbage === 0
      ? 'All '+repaired+' garbage rows repaired. Fast-path now active — loads will be ~200ms.'
      : repaired+' rows repaired, '+stillGarbage+' had no per-counsellor replacement (stamped with placeholder timestamp).',
    details:details};
}

// ── One-time migration: copy all per-counsellor sheet rows into shared ledger ──
// Run once via action=migrateRevenueData (admin only) after deploying this fix.
// After migration, shared ledger is the single source of truth.
// ── Restore: replace ₹0 entries in shared ledger with original positive values ──
// Run once via action=restoreRevenueFromLegacy (admin only).
// What happened: the old fast-path bug made some months appear invisible, causing
// accidental ₹0 saves that stamped newer timestamps over the original data.
// Per-counsellor sheets (e.g. Revenue_Monthly_Bianca) still hold the original rows.
// This function finds keys where shared ledger=₹0 but per-counsellor sheet has a
// positive value, and restores the positive value to the shared ledger.
function restoreRevenueFromLegacy(ss, adminPass) {
  if (adminPass !== ADMIN_PASS) return {status:'error', reason:'auth'};
  var sharedSh = ss.getSheetByName(SH_REVENUE_MONTHLY_ACHIEVED);
  if (!sharedSh) return {status:'error', reason:'no_shared_ledger'};
  // Read shared ledger — build map of key → {rowIndex, achievedGst}
  var sharedRows = parseRevenueMonthlyAchievedSheet(sharedSh);
  var sharedByKey = {};
  sharedRows.forEach(function(r) {
    var key = revenueMonthlyLedgerKey(r);
    var prev = sharedByKey[key];
    if (!prev || String(r.updatedAt||'') >= String(prev.updatedAt||'')) {
      sharedByKey[key] = {rowIndex:r.rowIndex, achievedGst:r.achievedGst, achievedCourse:r.achievedCourse, studentCount:r.studentCount};
    }
  });
  var restored = 0, details = [];
  // For each known counsellor's per-counsellor sheet
  revenueKnownCounsellorNames().forEach(function(name) {
    var sheetName = revenueCounsellorMonthlySheetName(name);
    var s = ss.getSheetByName(sheetName);
    if (!s) return;
    var perRows = parseRevenueMonthlyAchievedSheet(s);
    // For each unique key, find the row with the HIGHEST achievedGst (original data)
    var bestPerKey = {};
    perRows.forEach(function(r) {
      var key = revenueMonthlyLedgerKey(r);
      if (!bestPerKey[key] || r.achievedGst > bestPerKey[key].achievedGst) bestPerKey[key] = r;
    });
    Object.keys(bestPerKey).forEach(function(key) {
      var best = bestPerKey[key];
      if (!best || best.achievedGst <= 0) return; // nothing positive to restore
      var current = sharedByKey[key];
      if (!current) return; // key not in shared ledger — not restoring (use migrate for that)
      if (current.achievedGst > 0) return; // shared ledger already has positive value — skip
      // Restore: shared ledger has ₹0 but per-counsellor has positive value
      var row = [best.month, best.period, best.counsellor, best.assignedCentre, best.businessCentre,
                 best.businessType, best.studentCount, best.achievedCourse, best.achievedGst,
                 best.notes, best.updatedBy, best.locked ? 'Y' : 'N', new Date().toISOString()];
      sharedSh.getRange(current.rowIndex, 1, 1, row.length).setValues([row]);
      sharedByKey[key].achievedGst = best.achievedGst; // update in-memory map
      details.push({key:key, restoredGst:best.achievedGst, counsellor:best.counsellor, month:best.month});
      restored++;
    });
  });
  try { SpreadsheetApp.flush(); } catch(_e) {}
  return {status:'ok', restored:restored, details:details};
}

function migrateRevenueMonthlyData(ss, adminPass) {
  if (adminPass !== ADMIN_PASS) return {status:'error', reason:'auth'};
  var sharedSh = getOrCreateSheet(ss, SH_REVENUE_MONTHLY_ACHIEVED);
  ensureRevenueMonthlyAchievedHeaders(sharedSh);
  // Read current shared ledger for deduplication
  var existing = parseRevenueMonthlyAchievedSheet(sharedSh);
  var byKey = {};
  existing.forEach(function(r){ byKey[revenueMonthlyLedgerKey(r)] = r.rowIndex; });
  var migrated = 0, skipped = 0;
  revenueKnownCounsellorNames().forEach(function(name) {
    var sheetName = revenueCounsellorMonthlySheetName(name);
    if (sheetName === SH_REVENUE_MONTHLY_ACHIEVED) return;
    var s = ss.getSheetByName(sheetName);
    if (!s) return;
    var rows = parseRevenueMonthlyAchievedSheet(s);
    rows.forEach(function(r) {
      var key = revenueMonthlyLedgerKey(r);
      if (byKey[key]) { skipped++; return; } // already in shared ledger
      var row = [r.month, r.period, r.counsellor, r.assignedCentre, r.businessCentre,
                 r.businessType, r.studentCount, r.achievedCourse, r.achievedGst,
                 r.notes, r.updatedBy, r.locked ? 'Y' : 'N', r.updatedAt || new Date().toISOString()];
      sharedSh.appendRow(row);
      byKey[key] = sharedSh.getLastRow();
      migrated++;
    });
  });
  try { SpreadsheetApp.flush(); } catch(_e) {}
  // Bust cache so next fetch sees migrated data
  try { CacheService.getScriptCache().removeAll(Object.keys(CENTRE_CODES).map(function(c){ return 'rev|'+REVENUE_BACKEND_VERSION+'|'+c; })); } catch(_e2) {}
  return {status:'ok', migrated: migrated, skipped: skipped};
}

// ── Diagnostic: show what's in each Revenue_Monthly_* sheet ──
function getRevenueDiagnostic(ss, adminPass) {
  if (adminPass !== ADMIN_PASS) return {status:'error', reason:'auth'};
  var report = [];
  // Shared ledger
  var sh = ss.getSheetByName(SH_REVENUE_MONTHLY_ACHIEVED);
  var sharedRows = parseRevenueMonthlyAchievedSheet(sh);
  report.push({sheet: SH_REVENUE_MONTHLY_ACHIEVED, rowCount: sharedRows.length,
    summary: sharedRows.reduce(function(m,r){
      var k=r.counsellor||'?'; m[k]=(m[k]||0)+r.achievedGst; return m;
    },{})});
  // Per-counsellor sheets
  revenueKnownCounsellorNames().forEach(function(name) {
    var sheetName = revenueCounsellorMonthlySheetName(name);
    var s = ss.getSheetByName(sheetName);
    if (!s) { report.push({sheet: sheetName, exists: false}); return; }
    var rows = parseRevenueMonthlyAchievedSheet(s);
    report.push({sheet: sheetName, exists: true, rowCount: rows.length,
      summary: rows.reduce(function(m,r){
        var k=r.month+'|'+r.businessCentre; m[k]=(m[k]||0)+r.achievedGst; return m;
      },{})});
  });
  return {status:'ok', report: report};
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
  if (val == null) return true;
  if (val instanceof Date) return false;
  const s = String(val).trim();
  if (s === '') return true;
  if (/^\d+[-/.]\d+[-/.]\d+/.test(s) || /^\d{4}-\d{2}/.test(s)) {
    return false;
  }
  return true;
}

function getOrCreateSheet(ss,name){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);return s;}


// ═══════════════════════════════════════════════════════════════
// ONLINE TEST SYSTEM — OnlineTests.gs
// Paste as a separate script file in Apps Script (alongside Code.gs)
// Version 3 — Badges, Class Rank, Passing Score, Correct Answers for Instructors
// ═══════════════════════════════════════════════════════════════

// ── Sheet Names ────────────────────────────────────────────────
const SH_QUESTION_BANK      = 'QuestionBank';
const SH_CUSTOM_QUESTIONS   = 'CustomQuestions';
const SH_ONLINE_TESTS       = 'OnlineTests';
const SH_OT_QUESTIONS       = 'OT_Questions';
const SH_OT_RESPONSES       = 'OT_Responses';
const SH_OT_MANUAL_GRADES   = 'OT_ManualGrades';
const SH_OT_WARNINGS        = 'OT_Warnings';
const SH_OT_STARTS          = 'OT_Starts';  // per-student start times

const OT_PASS_PERCENT = 60; // default — overridden per test

// ── OnlineTests sheet columns (23 total) ──────────────────────
// 1  Test ID          9  Neg Marks         17 Expiry Mode
// 2  Test Label       10 Activated At      18 Expiry At
// 23 Passing Score %
// 3  Test Type        11 Closed At         19 Allow Retake
// 4  Batch Codes      12 Results Released  20 Shuffle Questions
// 5  Course           13 Results Mode      21 Instructions
// 6  Duration (mins)  14 Created By        22 Scheduled Activate At
// 7  Status           15 Created At
// 8  Negative Marking 16 Target Students

function ensureQBHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['QB_ID','Course','Topic','Question','Option1','Option2','Option3','Option4','CorrectOption','Type','Source','Added At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureCQHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['CQ_ID','Course','Topic','Question','Option1','Option2','Option3','Option4','CorrectAnswer','Type','MaxMarks','CreatedBy','Created At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=[
    'Test ID','Test Label','Test Type','Batch Codes','Course','Duration (mins)','Status',
    'Negative Marking','Neg Marks','Activated At','Closed At','Results Released','Results Mode',
    'Created By','Created At','Target Students','Expiry Mode','Expiry At',
    'Allow Retake','Shuffle Questions','Instructions','Scheduled Activate At','Passing Score %'
  ];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTQHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Test ID','Q_ID','Source','Question','Option1','Option2','Option3','Option4','CorrectOption','Type','Marks','MaxMarks','Order'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTRHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Response ID','Test ID','Student ID','Student Name','Batch Code','Submitted At','Submit Type','Total Questions','Auto Score','Manual Score','Total Score','Total Marks','Percentage','Result','Answers JSON','Attempt No'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureMGHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') {
    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    if (headers.indexOf('Feedback') === -1) {
      sh.insertColumnBefore(7);
      sh.getRange(1,7).setValue('Feedback');
      const h=['Test ID','Student ID','Q_ID','Student Answer','Instructor Score','Max Marks','Feedback','Graded By','Graded At'];
      sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
    }
    return;
  }
  const h=['Test ID','Student ID','Q_ID','Student Answer','Instructor Score','Max Marks','Feedback','Graded By','Graded At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOTWHeaders(sh) {
  if (sh.getLastRow()>0&&sh.getRange(1,1).getValue()!=='') return;
  const h=['Test ID','Student ID','Student Name','Warning Type','Warning Count','Timestamp'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}
function ensureOnlineTestSheets(ss) {
  [SH_QUESTION_BANK,SH_CUSTOM_QUESTIONS,SH_ONLINE_TESTS,
   SH_OT_QUESTIONS,SH_OT_RESPONSES,SH_OT_MANUAL_GRADES,SH_OT_WARNINGS,SH_OT_STARTS].forEach(function(n){
    if(!ss.getSheetByName(n)) ss.insertSheet(n);
  });
  ensureQBHeaders(ss.getSheetByName(SH_QUESTION_BANK));
  ensureCQHeaders(ss.getSheetByName(SH_CUSTOM_QUESTIONS));
  ensureOTHeaders(ss.getSheetByName(SH_ONLINE_TESTS));
  ensureOTQHeaders(ss.getSheetByName(SH_OT_QUESTIONS));
  ensureOTRHeaders(ss.getSheetByName(SH_OT_RESPONSES));
  ensureMGHeaders(ss.getSheetByName(SH_OT_MANUAL_GRADES));
  ensureOTWHeaders(ss.getSheetByName(SH_OT_WARNINGS));
  ensureOTStartsHeaders(ss.getSheetByName(SH_OT_STARTS));
}
function ensureOTStartsHeaders(sh) {
  if (sh.getLastRow()>0 && sh.getRange(1,1).getValue()!=='') return;
  var h=['Test ID','Student ID','Started At'];
  sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground(NAVY).setFontColor(GOLD).setFontFamily('Arial');
  sh.setFrozenRows(1);
}

// ════════════════════════════════════════════════════════════════
// ACTION HANDLERS — paste inside doGet() before unknown_action
// ════════════════════════════════════════════════════════════════
/*
    if (act==='setupQuestionBank')       return respond(otSetupQuestionBank(ss,p));
    if (act==='getQuestionBank')         return respond(otGetQuestionBank(ss,p));
    if (act==='getStudentsForBatches')   return respond(otGetStudentsForBatches(ss,p));
    if (act==='createOnlineTest')        return respond(otCreateTest(ss,p));
    if (act==='getInstructorTests')      return respond(otGetInstructorTests(ss,p));
    if (act==='getTestDetails')          return respond(otGetTestDetails(ss,p));
    if (act==='saveTestQuestions')       return respond(otSaveTestQuestions(ss,p));
    if (act==='addCustomQuestion')       return respond(otAddCustomQuestion(ss,p));
    if (act==='activateTest')            return respond(otActivateTest(ss,p));
    if (act==='scheduleTestActivation')  return respond(otScheduleTestActivation(ss,p));
    if (act==='closeTest')               return respond(otCloseTest(ss,p));
    if (act==='releaseResults')          return respond(otReleaseResults(ss,p));
    if (act==='getStudentActiveTest')    return respond(otGetStudentActiveTest(ss,p));
    if (act==='getTestQuestions')           return respond(otGetTestQuestions(ss,p));
    if (act==='getTestQuestionsInstructor') return respond(otGetTestQuestionsInstructor(ss,p));
    if (act==='removeTestQuestion')         return respond(otRemoveTestQuestion(ss,p));
    if (act==='submitTestResponse')         return respond(otSubmitTestResponse(ss,p));
    if (act==='logTestWarning')             return respond(otLogTestWarning(ss,p));
    if (act==='getProctorRoom')             return respond(otGetProctorRoom(ss,p));
    if (act==='resetStudentAttempt')        return respond(otResetStudentAttempt(ss,p));
    if (act==='saveManualGrade')            return respond(otSaveManualGrade(ss,p));
    if (act==='getPendingManualGrades')     return respond(otGetPendingManualGrades(ss,p));
    if (act==='getStudentResults')          return respond(otGetStudentResults(ss,p));
    if (act==='getTestResultsSummary')      return respond(otGetTestResultsSummary(ss,p));
    if (act==='setupScheduledTrigger')   return respond(otSetupScheduledTrigger(ss,p));
*/

// ════════════════════════════════════════════════════════════════
// HELPER — parse test row into object (22 columns)
// ════════════════════════════════════════════════════════════════
function otParseTestRow(r) {
  return {
    testId:r[0], testLabel:r[1], testType:r[2], batchCodes:r[3], batchCode:r[3], course:r[4],
    duration:r[5], status:r[6], negativeMarking:r[7], negMarkValue:r[8],
    activatedAt:r[9]?new Date(r[9]).toISOString():'',
    closedAt:r[10]?new Date(r[10]).toISOString():'',
    resultsReleased:r[11], resultsMode:r[12],
    createdBy:r[13], createdAt:r[14]?new Date(r[14]).toISOString():'',
    targetStudents:r[15]||'ALL',
    expiryMode:r[16]||'manual',
    expiryAt:r[17]?new Date(r[17]).toISOString():'',
    allowRetake:r[18]||'No',
    shuffleQuestions:r[19]||'No',
    instructions:r[20]||'',
    scheduledActivateAt:r[21]?new Date(r[21]).toISOString():'',
    passingScore:r[22]!==undefined&&r[22]!==''?parseFloat(r[22]):OT_PASS_PERCENT
  };
}

// ════════════════════════════════════════════════════════════════
// IMPLEMENTATION FUNCTIONS
// ════════════════════════════════════════════════════════════════

function otSetupQuestionBank(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_QUESTION_BANK);
  ensureQBHeaders(sh);
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent();
  }
  var rows = QUESTION_BANK_DATA.map(function(q){
    return [q.id,q.course,q.topic,q.q,q.o1,q.o2,q.o3,q.o4,q.ans,q.type,'Excel Import',new Date().toISOString()];
  });
  if (rows.length > 0) {
    var maxRows = sh.getMaxRows();
    var neededRows = (rows.length + 10) - maxRows; // safe margin
    if (neededRows > 0) {
      sh.insertRowsAfter(maxRows, neededRows);
    }
    sh.getRange(2, 1, rows.length, 12).setValues(rows);
  }
  return {status:'ok', imported:rows.length};
}

function otGetQuestionBank(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_QUESTION_BANK);
  var shCQ=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,12).getValues():[];
  var course=(p.course||'').toLowerCase();
  var topic=(p.topic||'').toLowerCase();
  var inclCorr = p.includeCorrect==='true' && !!p.instructor;
  var questions=rows.filter(function(r){return r[0]&&r[3];})
    .filter(function(r){
      var ok=true;
      if(course) ok=ok&&String(r[1]).toLowerCase()===course;
      if(topic)  ok=ok&&String(r[2]).toLowerCase()===topic;
      return ok;
    })
    .map(function(r){
      var q={id:r[0],course:r[1],topic:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],type:r[9]||'MCQ'};
      if(inclCorr) q.correctOption=r[8];
      return q;
    });
  var cqRows=shCQ.getLastRow()>1?shCQ.getRange(2,1,shCQ.getLastRow()-1,13).getValues():[];
  var customQs=cqRows.filter(function(r){return r[0];}).map(function(r){
    return{id:r[0],course:r[1],topic:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],correctAnswer:r[8],type:r[9],maxMarks:r[10],source:'custom'};
  });
  var topicMap={};
  rows.filter(function(r){return r[0];}).forEach(function(r){
    if(!topicMap[r[1]]) topicMap[r[1]]=[];
    if(topicMap[r[1]].indexOf(r[2])===-1) topicMap[r[1]].push(r[2]);
  });
  return{status:'ok',questions:questions,customQuestions:customQs,topicMap:topicMap,total:questions.length};
}

function otGetStudentsForBatches(ss, p) {
  if (!p.instructor || !p.batchCodes) return {status:'error',reason:'missing_params'};
  var codes = String(p.batchCodes).split(',').map(function(s){return s.trim();}).filter(Boolean);
  var shStu = ss.getSheetByName(SH_STUDENTS);
  if (!shStu) return {status:'ok', students:[]};
  var rows = shStu.getLastRow()>1 ? shStu.getRange(2,1,shStu.getLastRow()-1,10).getValues() : [];
  var students = [];
  rows.forEach(function(r){
    if (codes.indexOf(String(r[1]))!==-1 && r[0]) {
      students.push({studentId:String(r[0]), studentName:r[2]||r[3]||String(r[0]), batchCode:String(r[1])});
    }
  });
  return {status:'ok', students:students};
}

function otCreateTest(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  ensureOTHeaders(sh);
  var now = new Date();
  var testId = 'OT-'+now.getFullYear()+'-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'MMddHHmmss');
  var negMarks = p.negativeMarking==='true'?(parseFloat(p.negMarkValue)||0.25):0;
  // Determine status
  var schedAt = p.scheduledActivateAt || '';
  var status = schedAt ? 'Scheduled' : 'Draft';
  // Expiry
  var expiryMode = p.expiryMode || 'manual';
  var expiryAt = '';
  if (expiryMode==='endofday') {
    var eod = new Date(); eod.setHours(23,59,59,0);
    expiryAt = eod.toISOString();
  } else if (expiryMode==='custom' && p.expiryAt) {
    expiryAt = new Date(p.expiryAt).toISOString();
  }
  var passingScore = Math.min(90, Math.max(40, parseFloat(p.passingScore)||OT_PASS_PERCENT));
  sh.appendRow([
    testId, p.testLabel||'Online Test', p.testType||'Weekly',
    p.batchCodes||p.batchCode||'', p.course||'', parseInt(p.duration)||30, status,
    p.negativeMarking==='true'?'Yes':'No', negMarks,
    '','','No','summary', p.instructor, now.toISOString(),
    p.targetStudents||'ALL', expiryMode, expiryAt,
    p.allowRetake==='true'?'Yes':'No',
    p.shuffleQuestions==='true'?'Yes':'No',
    p.instructions||'', schedAt, passingScore
  ]);
  // If scheduled, set up trigger check
  if (schedAt) otEnsureScheduledTrigger();
  return {status:'ok', testId:testId, testStatus:status};
}

function otDuplicateTest(ss, p) {
  if (!p.instructor || !p.sourceTestId || !p.newTestLabel || !p.newBatchCode) {
    return {status:'error', reason:'missing_params'};
  }
  ensureOnlineTestSheets(ss);
  
  // 1. Get source test row from SH_ONLINE_TESTS
  var shOT = ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows = shOT.getLastRow()>1 ? shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues() : [];
  var srcRow = otRows.find(function(r) { return r[0] === p.sourceTestId; });
  if (!srcRow) return {status:'error', reason:'source_test_not_found'};
  
  // 2. Generate new testId
  var now = new Date();
  var newTestId = 'OT-'+now.getFullYear()+'-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'MMddHHmmss');
  
  // 3. Insert new test record as Draft
  shOT.appendRow([
    newTestId,
    p.newTestLabel,
    srcRow[2], // testType
    p.newBatchCode, // batchCodes
    srcRow[4], // course
    srcRow[5], // duration
    'Draft', // status
    srcRow[7], // negativeMarking
    srcRow[8], // negMarkValue
    '', // activatedAt
    '', // closedAt
    'No', // resultsReleased
    srcRow[12], // resultsMode
    p.instructor, // createdBy
    now.toISOString(), // createdAt
    p.newTargetStudents || 'ALL', // targetStudents
    srcRow[16], // expiryMode
    '', // expiryAt (Draft doesn't have expiry active)
    srcRow[18], // allowRetake
    srcRow[19], // shuffleQuestions
    srcRow[20], // instructions
    '', // scheduledActivateAt
    srcRow[22] // passingScore
  ]);
  
  // 4. Duplicate questions from SH_OT_QUESTIONS
  var shQ = ss.getSheetByName(SH_OT_QUESTIONS);
  if (shQ && shQ.getLastRow() > 1) {
    var qRows = shQ.getRange(2, 1, shQ.getLastRow() - 1, 13).getValues();
    var newQRows = [];
    qRows.forEach(function(r) {
      if (String(r[0]) === String(p.sourceTestId)) {
        newQRows.push([
          newTestId, // new test ID
          r[1], // course
          r[2], // qNo
          r[3], // type
          r[4], // question
          r[5], // opt1
          r[6], // opt2
          r[7], // opt3
          r[8], // opt4
          r[9], // correctAnswer
          r[10], // addedBy
          now.toISOString(), // addedAt
          r[12] // qIndex
        ]);
      }
    });
    
    if (newQRows.length > 0) {
      // Append the duplicate questions
      shQ.getRange(shQ.getLastRow() + 1, 1, newQRows.length, 13).setValues(newQRows);
    }
  }
  
  return {status:'ok', newTestId:newTestId};
}

function otGetInstructorTests(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,23).getValues():[];
  // Auto-check scheduled
  otCheckScheduledActivations_(ss, rows, sh);
  // Re-read after potential updates
  rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,23).getValues():[];
  // Only show tests created by this instructor
  var instrName = String(p.instructor||'').trim().toLowerCase();
  var tests = rows.filter(function(r){
    if (!r[0]) return false;
    var creator = String(r[13]||'').trim().toLowerCase();
    return creator === instrName;
  }).map(otParseTestRow);
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
  var qCounts = {};
  otqRows.forEach(function(r){qCounts[r[0]]=(qCounts[r[0]]||0)+1;});

  var shR = ss.getSheetByName(SH_OT_RESPONSES);
  var rRows = shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var pendingCounts = {};
  var totalSubmissions = {};
  rRows.forEach(function(r){
    var testId = r[1];
    var result = r[13];
    totalSubmissions[testId] = (totalSubmissions[testId]||0) + 1;
    if (result === 'Pending') {
      pendingCounts[testId] = (pendingCounts[testId]||0) + 1;
    }
  });

  var studentRows = getStudentRows(ss);
  var studentMap = {};
  studentRows.forEach(function(s){
    studentMap[String(s.id).trim().toUpperCase()] = s.name;
  });

  tests.forEach(function(t){
    t.questionCount = qCounts[t.testId]||0;
    t.pendingGradingCount = pendingCounts[t.testId]||0;
    t.submissionCount = totalSubmissions[t.testId]||0;

    // Resolve student names if targeted
    var target = String(t.targetStudents || 'ALL').trim();
    var targetNames = [];
    if (target !== 'ALL' && target !== '') {
      var allowed = [];
      if (target.indexOf('[') === 0) {
        try {
          allowed = JSON.parse(target);
        } catch(e) {
          allowed = target.replace(/[\[\]\"']/g, '').split(',').map(function(s){return s.trim();});
        }
      } else {
        allowed = target.split(',').map(function(s){return s.trim();});
      }
      allowed.forEach(function(sid) {
        var cleanId = String(sid).trim().toUpperCase();
        var sname = studentMap[cleanId] || cleanId;
        targetNames.push(sname);
      });
      t.targetStudentNames = targetNames.join(', ');
    } else {
      t.targetStudentNames = 'Entire Batch';
    }
  });

  var pendingSubmissions = [];
  rRows.forEach(function(r){
    if (r[13] === 'Pending') {
      var test = tests.find(function(t){return t.testId === r[1];});
      if (test) {
        pendingSubmissions.push({
          responseId: r[0],
          testId: r[1],
          testLabel: test.testLabel,
          testType: test.testType,
          studentId: r[2],
          studentName: r[3],
          batchCode: r[4],
          submittedAt: r[5]
        });
      }
    }
  });

  return {status:'ok', tests:tests, pendingSubmissions:pendingSubmissions};
}

function otGetTestDetails(ss, p) {
  if (!p.testId) return {status:'error',reason:'testId_required'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var testRow = rows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var questions = otqRows.filter(function(r){return r[0]===p.testId;})
    .map(function(r){return{testId:r[0],qId:r[1],source:r[2],question:r[3],opt1:r[4],opt2:r[5],opt3:r[6],opt4:r[7],correct:r[8],type:r[9],marks:r[10],maxMarks:r[11],order:r[12]};})
    .sort(function(a,b){return(a.order||0)-(b.order||0);});
  return {status:'ok', test:otParseTestRow(testRow), questions:questions};
}

function otSaveTestQuestions(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOT = ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows = shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRowIdx = otRows.findIndex(function(r){return r[0]===p.testId;});
  if (testRowIdx===-1) return {status:'error',reason:'test_not_found'};
  if (otRows[testRowIdx][6]!=='Draft'&&otRows[testRowIdx][6]!=='Scheduled') return {status:'error',reason:'test_not_draft'};
  var qIds = JSON.parse(p.questionIds||'[]');
  var correctOverrides = JSON.parse(p.correctOverrides||'{}'); // {qId: newCorrectAnswer}
  var orderOverrides   = JSON.parse(p.orderOverrides||'{}');   // {qId: order}
  if (!qIds.length) return {status:'error',reason:'no_questions'};
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  // Remove old
  var otqRows = shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
  for (var i=otqRows.length-1;i>=0;i--) { if(otqRows[i][0]===p.testId) shOTQ.deleteRow(i+2); }
  var shQB=ss.getSheetByName(SH_QUESTION_BANK);
  var qbRows=shQB.getLastRow()>1?shQB.getRange(2,1,shQB.getLastRow()-1,12).getValues():[];
  var qbMap={};qbRows.forEach(function(r){if(r[0])qbMap[r[0]]=r;});
  var shCQ=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  var cqRows=shCQ.getLastRow()>1?shCQ.getRange(2,1,shCQ.getLastRow()-1,13).getValues():[];
  var cqMap={};cqRows.forEach(function(r){if(r[0])cqMap[r[0]]=r;});
  var order=1, newRows=[], totalMarks=0;
  qIds.forEach(function(qId){
    var finalOrder = orderOverrides[qId] || order++;
    if (qbMap[qId]) {
      var r=qbMap[qId], marks=1;
      var correct = correctOverrides[qId]!==undefined ? correctOverrides[qId] : r[8];
      newRows.push([p.testId,qId,'bank',r[3],r[4],r[5],r[6],r[7],correct,r[9]||'MCQ',marks,marks,finalOrder]);
      totalMarks+=marks;
    } else if (cqMap[qId]) {
      var r=cqMap[qId], marks=(r[9]==='Theory'||r[9]==='FileUpload')?(parseFloat(r[10])||5):1;
      var correct = correctOverrides[qId]!==undefined ? correctOverrides[qId] : r[8];
      newRows.push([p.testId,qId,'custom',r[3],r[4],r[5],r[6],r[7],correct,r[9],marks,marks,finalOrder]);
      totalMarks+=marks;
    }
  });
  if (newRows.length>0) shOTQ.getRange(shOTQ.getLastRow()+1,1,newRows.length,13).setValues(newRows);
  return {status:'ok', saved:newRows.length, totalMarks:totalMarks};
}

function otAddCustomQuestion(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_CUSTOM_QUESTIONS);
  ensureCQHeaders(sh);
  var now=new Date();
  var cqId='CQ-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMddHHmmss')+'-'+Math.floor(Math.random()*1000);
  var type=p.type||'MCQ';
  var maxMarks=(type==='Theory'||type==='FileUpload')?(parseFloat(p.maxMarks)||5):1;
  var correct=p.correctAnswer||(type==='MCQ'?'1':type==='TrueFalse'?'True':p.blankAnswer)||'';
  sh.appendRow([cqId,p.course||'',p.topic||'',p.question||'',p.opt1||'',p.opt2||'',p.opt3||'',p.opt4||'',correct,type,maxMarks,p.instructor,now.toISOString()]);
  return {status:'ok', cqId:cqId};
}

function otActivateTest(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,23).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  if (rows[idx][6]!=='Draft'&&rows[idx][6]!=='Scheduled') return {status:'error',reason:'already_active_or_closed'};
  var testType=String(rows[idx][2]||'').trim();
  // Portfolio Upload & Assignment tests skip question check
  if (testType!=='Portfolio Upload' && testType!=='Assignment') {
    var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
    var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,1).getValues():[];
    if (!otqRows.some(function(r){return r[0]===p.testId;})) return {status:'error',reason:'no_questions_in_test'};
  }
  var now=new Date();
  sh.getRange(idx+2,7).setValue('Active');
  sh.getRange(idx+2,10).setValue(now.toISOString());
  // Expiry calculation
  if (testType === 'Assignment') {
    var days = parseFloat(rows[idx][5]) || 1;
    var expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    sh.getRange(idx+2,17).setValue('custom');
    sh.getRange(idx+2,18).setValue(expiry.toISOString());
  } else if (rows[idx][16]==='endofday') {
    var eod=new Date(); eod.setHours(23,59,59,0);
    sh.getRange(idx+2,18).setValue(eod.toISOString());
  }
  return {status:'ok', activatedAt:now.toISOString()};
}

function otScheduleTestActivation(ss, p) {
  if (!p.instructor||!p.testId||!p.scheduledAt) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  sh.getRange(idx+2,7).setValue('Scheduled');
  sh.getRange(idx+2,22).setValue(new Date(p.scheduledAt).toISOString());
  otEnsureScheduledTrigger();
  return {status:'ok', scheduledAt:p.scheduledAt};
}

// ── Scheduled activation engine ──────────────────────────────
function otCheckScheduledActivations_(ss, rows, sh) {
  var now=new Date();
  rows.forEach(function(r, i){
    if (r[6]==='Scheduled' && r[21]) {
      var schedAt=new Date(r[21]);
      if (schedAt<=now) {
        sh.getRange(i+2,7).setValue('Active');
        sh.getRange(i+2,10).setValue(now.toISOString());
        var testType=String(r[2]||'').trim();
        if (testType === 'Assignment') {
          var days = parseFloat(r[5]) || 1;
          var expiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          sh.getRange(i+2,17).setValue('custom');
          sh.getRange(i+2,18).setValue(expiry.toISOString());
        } else if (r[16]==='endofday') {
          var eod=new Date(); eod.setHours(23,59,59,0);
          sh.getRange(i+2,18).setValue(eod.toISOString());
        }
      }
    }
  });
}

// Called by GAS time trigger every 5 minutes
function otScheduledActivationTrigger() {
  var ss=SpreadsheetApp.openById(SHEET_ID);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  if (!sh) return;
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  otCheckScheduledActivations_(ss, rows, sh);
}

function otEnsureScheduledTrigger() {
  var triggers=ScriptApp.getProjectTriggers();
  var exists=triggers.some(function(t){return t.getHandlerFunction()==='otScheduledActivationTrigger';});
  if (!exists) {
    ScriptApp.newTrigger('otScheduledActivationTrigger').timeBased().everyMinutes(5).create();
  }
}

function otSetupScheduledTrigger(ss, p) {
  if (!p.instructor) return {status:'error',reason:'auth_required'};
  try {
    otEnsureScheduledTrigger();
    return {status:'ok', message:'Scheduled activation trigger is active (runs every 5 minutes)'};
  } catch(e) {
    return {status:'error', message:e.toString()};
  }
}

function otCloseTest(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  var now=new Date();
  sh.getRange(idx+2,7).setValue('Closed');
  sh.getRange(idx+2,11).setValue(now.toISOString());
  return {status:'ok', closedAt:now.toISOString()};
}

function otDeleteTest(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  // Auth check
  if (String(rows[idx][13]).trim().toLowerCase() !== String(p.instructor).trim().toLowerCase()) {
    return {status:'error',reason:'unauthorized'};
  }
  sh.deleteRow(idx+2);
  
  // Also delete from questions
  var shQ = ss.getSheetByName(SH_OT_QUESTIONS);
  if (shQ) {
    var qRows = shQ.getLastRow()>1?shQ.getRange(2,1,shQ.getLastRow()-1,1).getValues():[];
    for (var i=qRows.length-1;i>=0;i--) {
      if (String(qRows[i][0])===String(p.testId)) shQ.deleteRow(i+2);
    }
  }
  
  // Also delete from responses
  var shR = ss.getSheetByName(SH_OT_RESPONSES);
  if (shR) {
    var rRows = shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,2).getValues():[];
    for (var i=rRows.length-1;i>=0;i--) {
      if (String(rRows[i][1])===String(p.testId)) shR.deleteRow(i+2);
    }
  }
  return {status:'ok'};
}

function otReleaseResults(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,22).getValues():[];
  var idx=rows.findIndex(function(r){return r[0]===p.testId;});
  if (idx===-1) return {status:'error',reason:'test_not_found'};
  sh.getRange(idx+2,12).setValue('Yes');
  sh.getRange(idx+2,13).setValue(p.resultsMode||'summary');
  return {status:'ok', message:'Results released'};
}

function otGetStudentActiveTest(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'ok',activeTest:null,activeTests:[]};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_ONLINE_TESTS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,23).getValues():[];
  // Auto-activate any scheduled tests
  otCheckScheduledActivations_(ss, rows, sh);
  rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,23).getValues():[];
  var now=new Date();
  var activeTestsList = [];
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];

  rows.forEach(function(r){
    if (r[6]!=='Active') return;
    // Check batch (case-insensitive)
    var batches=String(r[3]).split(',').map(function(s){return s.trim().toUpperCase();});
    if (batches.indexOf(String(p.batchCode).trim().toUpperCase())===-1) return;
    // Check expiry
    if (r[17]) {
      var expiry=new Date(r[17]);
      if (now>expiry) return; // expired
    }
    // Check target students (case-insensitive)
    var target=String(r[15]||'ALL').trim();
    if (target!=='ALL' && target!=='') {
      var allowed = [];
      if (target.indexOf('[') === 0) {
        try {
          allowed = JSON.parse(target);
        } catch(e) {
          allowed = target.replace(/[\[\]\"']/g, '').split(',').map(function(s){return s.trim();});
        }
      } else {
        allowed = target.split(',').map(function(s){return s.trim();});
      }
      allowed = allowed.map(function(s){return String(s).trim().toUpperCase();});
      if (allowed.indexOf(String(p.studentId).trim().toUpperCase())===-1) return;
    }
    var tObj = otParseTestRow(r);
    
    // Check already submitted (unless retake allowed)
    var submissions=rRows.filter(function(sub){return String(sub[1])===String(tObj.testId)&&String(sub[2])===String(p.studentId);});
    if (submissions.length>0 && tObj.allowRetake!=='Yes') {
      tObj.alreadySubmitted = true;
      tObj.submissionCount = submissions.length;
    } else {
      tObj.alreadySubmitted = false;
      tObj.attemptNo = submissions.length + 1;
      tObj.previousAttempts = submissions.length;
    }
    activeTestsList.push(tObj);
  });

  // For backward compatibility, find the active test that is NOT already submitted
  var activeTest = activeTestsList.find(function(t){ return !t.alreadySubmitted && t.testType !== 'Assignment' && t.testType !== 'Portfolio Upload'; }) || null;

  return {status:'ok', activeTest:activeTest, activeTests:activeTestsList};
}

function otGetTestQuestions(ss, p) {
  if (!p.testId||!p.studentId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  if (testRow[6]!=='Active') return {status:'error',reason:'test_not_active'};
  var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var questions=otqRows.filter(function(r){return r[0]===p.testId;})
    .sort(function(a,b){return(a[12]||0)-(b[12]||0);})
    .map(function(r){
      var q={qId:r[1],question:r[3],type:r[9]||'MCQ',marks:r[10]||1};
      if(r[9]==='MCQ'){q.opt1=r[4];q.opt2=r[5];q.opt3=r[6];q.opt4=r[7];}
      else if(r[9]==='TrueFalse'){q.opt1='True';q.opt2='False';}
      return q; // never send correct answer
    });
  // Shuffle if enabled (seeded by studentId for consistency on refresh)
  if (testRow[19]==='Yes') {
    var seed=p.studentId.split('').reduce(function(a,c){return a+c.charCodeAt(0);},0);
    questions=otShuffleSeeded(questions, seed);
  }
  var durationSec;
  if (testRow[2] === 'Assignment') {
    // MCQ assignments are not timed by minutes, but rather let's give a default session time of 60 minutes
    durationSec = 60 * 60;
  } else {
    durationSec = (parseInt(testRow[5])||30)*60;
  }

  // ── Per-student start time (timer starts when student clicks Begin, not when instructor activates) ──
  var shStarts=ss.getSheetByName(SH_OT_STARTS);
  if (!shStarts) { shStarts=ss.insertSheet(SH_OT_STARTS); ensureOTStartsHeaders(shStarts); }
  var startRows=shStarts.getLastRow()>1?shStarts.getRange(2,1,shStarts.getLastRow()-1,3).getValues():[];
  var startRow=startRows.find(function(r){return String(r[0])===String(p.testId)&&String(r[1])===String(p.studentId);});
  var startedAt, remainingSec;
  if (startRow && startRow[2]) {
    // Student has started before (crash/refresh) — count from their recorded start time
    startedAt=new Date(startRow[2]);
    var elapsed=Math.floor((Date.now()-startedAt.getTime())/1000);
    remainingSec=Math.max(0, durationSec - elapsed);
  } else {
    // First time this student starts — record now as their start time
    startedAt=new Date();
    shStarts.appendRow([p.testId, p.studentId, startedAt.toISOString()]);
    remainingSec=durationSec;
  }
  // Cap by test expiry window if set
  if (testRow[17]) {
    var expiry=new Date(testRow[17]);
    var toExpiry=Math.floor((expiry.getTime()-Date.now())/1000);
    remainingSec=Math.min(remainingSec,Math.max(0,toExpiry));
  }
  var activatedAt=testRow[9]?new Date(testRow[9]):new Date();
  return {
    status:'ok',
    test:{testId:testRow[0],testLabel:testRow[1],duration:testRow[5],
          activatedAt:activatedAt.toISOString(),startedAt:startedAt.toISOString(),
          negativeMarking:testRow[7],negMarkValue:testRow[8],
          instructions:testRow[20]||'',shuffled:testRow[19]==='Yes'},
    questions:questions, remainingSec:remainingSec, serverTime:new Date().toISOString()
  };
}

// Instructor view — returns all questions with correct answers (no studentId required)
function otGetTestQuestionsInstructor(ss, p) {
  if (!p.testId || !p.instructor) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows = shOTQ.getLastRow()>1 ? shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues() : [];
  var questions = otqRows
    .filter(function(r){ return r[0]===p.testId; })
    .sort(function(a,b){ return (a[12]||0)-(b[12]||0); })
    .map(function(r){
      return {
        rowIndex: otqRows.indexOf(r)+2, // 1-based sheet row for later delete
        qId: r[1], question: r[3], type: r[9]||'MCQ',
        marks: r[10]||1, correctAnswer: r[8],
        opt1:r[4], opt2:r[5], opt3:r[6], opt4:r[7]
      };
    });
  return {status:'ok', questions:questions};
}

// Remove a single question from a test (by qId)
function otRemoveTestQuestion(ss, p) {
  if (!p.testId || !p.qId || !p.instructor) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var rows = shOTQ.getLastRow()>1 ? shOTQ.getRange(2,1,shOTQ.getLastRow()-1,2).getValues() : [];
  for (var i=rows.length-1; i>=0; i--) {
    if (rows[i][0]===p.testId && rows[i][1]===p.qId) {
      shOTQ.deleteRow(i+2); // +2: header row offset
      return {status:'ok'};
    }
  }
  return {status:'error', reason:'question_not_found'};
}

// Update a single question permanently in question bank/custom sheets and active tests
function otUpdateQuestion(ss, p) {
  if (!p.qId || !p.instructor) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  
  var qId = String(p.qId).trim();
  var newQText = p.question ? String(p.question).trim() : '';
  var opt1 = p.opt1 !== undefined ? String(p.opt1).trim() : '';
  var opt2 = p.opt2 !== undefined ? String(p.opt2).trim() : '';
  var opt3 = p.opt3 !== undefined ? String(p.opt3).trim() : '';
  var opt4 = p.opt4 !== undefined ? String(p.opt4).trim() : '';
  var newCorrect = p.correctAnswer !== undefined ? String(p.correctAnswer).trim() : '';
  
  var updatedSource = false;
  
  // 1. Update in Source Sheets (QuestionBank or CustomQuestions)
  if (qId.indexOf('QB') === 0) {
    var shQB = ss.getSheetByName(SH_QUESTION_BANK);
    if (shQB) {
      var lastRow = shQB.getLastRow();
      var rows = lastRow > 1 ? shQB.getRange(2, 1, lastRow - 1, 10).getValues() : [];
      var rowIdx = rows.findIndex(function(r) { return String(r[0]).trim() === qId; });
      if (rowIdx !== -1) {
        var sheetRow = rowIdx + 2;
        if (newQText) shQB.getRange(sheetRow, 4).setValue(newQText);
        shQB.getRange(sheetRow, 5).setValue(opt1);
        shQB.getRange(sheetRow, 6).setValue(opt2);
        shQB.getRange(sheetRow, 7).setValue(opt3);
        shQB.getRange(sheetRow, 8).setValue(opt4);
        if (newCorrect !== '') shQB.getRange(sheetRow, 9).setValue(newCorrect);
        updatedSource = true;
      }
    }
  } else if (qId.indexOf('CQ') === 0) {
    var shCQ = ss.getSheetByName(SH_CUSTOM_QUESTIONS);
    if (shCQ) {
      var lastRow = shCQ.getLastRow();
      var rows = lastRow > 1 ? shCQ.getRange(2, 1, lastRow - 1, 10).getValues() : [];
      var rowIdx = rows.findIndex(function(r) { return String(r[0]).trim() === qId; });
      if (rowIdx !== -1) {
        var sheetRow = rowIdx + 2;
        if (newQText) shCQ.getRange(sheetRow, 4).setValue(newQText);
        shCQ.getRange(sheetRow, 5).setValue(opt1);
        shCQ.getRange(sheetRow, 6).setValue(opt2);
        shCQ.getRange(sheetRow, 7).setValue(opt3);
        shCQ.getRange(sheetRow, 8).setValue(opt4);
        if (newCorrect !== '') shCQ.getRange(sheetRow, 9).setValue(newCorrect);
        updatedSource = true;
      }
    }
  }
  
  // 2. Update in OT_Questions Sheet (wherever it is used in any test)
  var shOTQ = ss.getSheetByName(SH_OT_QUESTIONS);
  if (shOTQ) {
    var lastRow = shOTQ.getLastRow();
    var rows = lastRow > 1 ? shOTQ.getRange(2, 1, lastRow - 1, 10).getValues() : [];
    rows.forEach(function(r, idx) {
      if (String(r[1]).trim() === qId) {
        var sheetRow = idx + 2;
        if (newQText) shOTQ.getRange(sheetRow, 4).setValue(newQText);
        shOTQ.getRange(sheetRow, 5).setValue(opt1);
        shOTQ.getRange(sheetRow, 6).setValue(opt2);
        shOTQ.getRange(sheetRow, 7).setValue(opt3);
        shOTQ.getRange(sheetRow, 8).setValue(opt4);
        if (newCorrect !== '') shOTQ.getRange(sheetRow, 9).setValue(newCorrect);
      }
    });
  }
  
  return {status: 'ok', updatedSource: updatedSource};
}

// ── UPDATE TEST SETTINGS (Draft only) ────────────────────────────────────────
function otUpdateTestSettings(ss, p) {
  if (!p.instructor || !p.testId) return {status:'error', reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return {status:'error', reason:'not_found'};
  var rows = sh.getRange(2, 1, lastRow - 1, 23).getValues();
  var idx = -1;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(p.testId).trim()) { idx = i; break; }
  }
  if (idx === -1) return {status:'error', reason:'not_found'};
  if (String(rows[idx][6]).trim() !== 'Draft') return {status:'error', reason:'test_not_draft'};
  var rowNum = idx + 2;
  // col 2=label, col 4=batchCodes, col 6=duration, col 8=neg, col 9=negVal, col 21=instructions, col 23=passingScore
  if (p.testLabel)       sh.getRange(rowNum, 2).setValue(String(p.testLabel).trim());
  if (p.batchCodes)      sh.getRange(rowNum, 4).setValue(String(p.batchCodes).trim());
  if (p.duration)        sh.getRange(rowNum, 6).setValue(parseInt(p.duration)||30);
  if (p.passingScore !== undefined) sh.getRange(rowNum, 23).setValue(parseInt(p.passingScore)||60);
  if (p.negativeMarking !== undefined) {
    var isNeg = p.negativeMarking === 'Yes';
    sh.getRange(rowNum, 8).setValue(isNeg ? 'Yes' : 'No');
    sh.getRange(rowNum, 9).setValue(isNeg ? 0.25 : 0);
  }
  if (p.instructions !== undefined) sh.getRange(rowNum, 21).setValue(p.instructions);
  return {status:'ok'};
}

function otShuffleSeeded(arr, seed) {
  var a=arr.slice();
  for(var i=a.length-1;i>0;i--){
    seed=(seed*1664525+1013904223)&0xffffffff;
    var j=Math.abs(seed)%(i+1);
    var tmp=a[i];a[i]=a[j];a[j]=tmp;
  }
  return a;
}

function otSubmitTestResponse(ss, p) {
  if (!p.testId||!p.studentId||!p.answers) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,3).getValues():[];
  var prevSubmissions=rRows.filter(function(r){return String(r[1])===String(p.testId)&&String(r[2])===String(p.studentId);});
  // Check retake policy
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  if (!testRow) return {status:'error',reason:'test_not_found'};
  if (prevSubmissions.length>0&&testRow[18]!=='Yes') return {status:'error',reason:'already_submitted'};
  if (testRow[6]!=='Active'&&testRow[6]!=='Closed') return {status:'error',reason:'test_not_active'};
  var shOTQ=ss.getSheetByName(SH_OT_QUESTIONS);
  var otqRows=shOTQ.getLastRow()>1?shOTQ.getRange(2,1,shOTQ.getLastRow()-1,13).getValues():[];
  var testQuestions=otqRows.filter(function(r){return r[0]===p.testId;});
  var answers={};
  try{answers=JSON.parse(p.answers);}catch(e){}
  var autoScore=0,theoryCount=0,totalMarks=0;
  var negEnabled=testRow[7]==='Yes';
  var negVal=parseFloat(testRow[8])||0.25;
  testQuestions.forEach(function(q){
    var qId=q[1],type=q[9]||'MCQ',correct=q[8],marks=parseFloat(q[10])||1;
    totalMarks+=marks;
    if(type==='Theory'||type==='FileUpload'){theoryCount++;return;}
    var studentAns=answers[qId]!==undefined?String(answers[qId]):'';
    if(!studentAns) return;
    if(type==='MCQ'||type==='TrueFalse'){
      if(String(studentAns)===String(correct)) autoScore+=marks;
      else if(negEnabled&&studentAns) autoScore-=negVal;
    } else if(type==='FillBlank'){
      if(studentAns.trim().toLowerCase()===String(correct).trim().toLowerCase()) autoScore+=marks;
      else if(negEnabled) autoScore-=negVal;
    }
  });
  autoScore=Math.max(0,autoScore);
  var hasTheory=theoryCount>0;
  var totalScore=hasTheory?null:autoScore;
  var pct=(totalMarks>0&&!hasTheory)?Math.round(autoScore/totalMarks*100):null;
  var testPassScore = parseFloat(testRow[22])||OT_PASS_PERCENT;
  var result=pct!==null?(pct>=testPassScore?'Pass':'Fail'):'Pending';
  var now=new Date();
  var attemptNo=prevSubmissions.length+1;
  var responseId='RSP-'+Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyyMMddHHmmss')+'-'+p.studentId+'-A'+attemptNo;
  shR.appendRow([responseId,p.testId,p.studentId,p.studentName||'',p.batchCode||'',
    now.toISOString(),p.submitType||'manual',testQuestions.length,
    autoScore,0,totalScore,totalMarks,pct,result,p.answers,attemptNo]);
  if (hasTheory) {
    var shMG=ss.getSheetByName(SH_OT_MANUAL_GRADES);
    testQuestions.filter(function(q){return q[9]==='Theory'||q[9]==='FileUpload';}).forEach(function(q){
      shMG.appendRow([p.testId,p.studentId,q[1],answers[q[1]]||'','',q[10]||5,'','','']);
    });
  }
  return {status:'ok',responseId:responseId,autoScore:autoScore,hasTheory:hasTheory,
    result:hasTheory?'pending_manual_grades':result,percentage:pct,attemptNo:attemptNo,
    message:hasTheory?'Submitted. Theory questions pending instructor grading.':'Submitted successfully.'};
}

function otLogTestWarning(ss, p) {
  if (!p.testId||!p.studentId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_WARNINGS);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,5).getValues():[];
  var count=rows.filter(function(r){return String(r[0])===String(p.testId)&&String(r[1])===String(p.studentId);}).length+1;
  sh.appendRow([p.testId,p.studentId,p.studentName||'',p.warningType||'tab-switch',count,new Date().toISOString()]);
  return {status:'ok',warningCount:count,autoSubmit:count>=3};
}

function otGetProctorRoom(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var submissions=rRows.filter(function(r){return String(r[1])===String(p.testId);}).map(function(r){
    return{studentId:String(r[2]),studentName:r[3],submittedAt:r[5],submitType:r[6],
      autoScore:r[8],totalScore:r[10],totalMarks:r[11],percentage:r[12],result:r[13],attemptNo:r[15]};
  });
  var shW=ss.getSheetByName(SH_OT_WARNINGS);
  var wRows=shW.getLastRow()>1?shW.getRange(2,1,shW.getLastRow()-1,6).getValues():[];
  var warnings={};
  wRows.filter(function(r){return String(r[0])===String(p.testId);}).forEach(function(r){
    var sid=String(r[1]);
    if(!warnings[sid]||warnings[sid].count<(r[4]||0)) warnings[sid]={studentName:r[2],count:r[4]||0};
  });
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testRow=otRows.find(function(r){return r[0]===p.testId;});
  var batchCodes=testRow?String(testRow[3]).split(',').map(function(s){return s.trim();}):[];
  var targetStudents=testRow?String(testRow[15]||'ALL'):'ALL';
  var shStu=ss.getSheetByName(SH_STUDENTS);
  var stuRows=shStu?(shStu.getLastRow()>1?shStu.getRange(2,1,shStu.getLastRow()-1,10).getValues():[]):[];
  var enrolled=stuRows
    .filter(function(r){return batchCodes.indexOf(String(r[1]))!==-1&&r[0];})
    .filter(function(r){return targetStudents==='ALL'||targetStudents.split(',').indexOf(String(r[0]))!==-1;})
    .map(function(r){return{studentId:String(r[0]),studentName:r[2]||r[3]||String(r[0])};});
  var submittedIds=submissions.map(function(s){return s.studentId;});
  return {status:'ok',testId:p.testId,submissions:submissions,warnings:warnings,enrolled:enrolled,
    pending:enrolled.filter(function(s){return submittedIds.indexOf(s.studentId)===-1;}).length,
    submitted:submissions.length,total:enrolled.length,
    expiryAt:testRow&&testRow[17]?new Date(testRow[17]).toISOString():''};
}

// Delete a student's response + warnings for a test so they can retake it.
// Requires instructor auth.
function otResetStudentAttempt(ss, p) {
  if (!p.instructor) return {status:'error', reason:'auth_required'};
  if (!p.testId || !p.studentId) return {status:'error', reason:'missing_params'};
  ensureOnlineTestSheets(ss);

  var testId    = String(p.testId).trim();
  var studentId = String(p.studentId).trim().toUpperCase();

  // Delete from OT_RESPONSES
  // Headers: Response ID(0), Test ID(1), Student ID(2) — must read 3 cols
  var shR = ss.getSheetByName(SH_OT_RESPONSES);
  var deletedCount = 0;
  if (shR && shR.getLastRow() > 1) {
    var rRows = shR.getRange(2, 1, shR.getLastRow()-1, 3).getValues();
    for (var i = rRows.length - 1; i >= 0; i--) {
      if (String(rRows[i][1]).trim() === testId && String(rRows[i][2]).trim().toUpperCase() === studentId) {
        shR.deleteRow(i + 2);
        deletedCount++;
      }
    }
  }

  // Delete from OT_WARNINGS (Headers: Test ID(0), Student ID(1))
  var shW = ss.getSheetByName(SH_OT_WARNINGS);
  if (shW && shW.getLastRow() > 1) {
    var wRows = shW.getRange(2, 1, shW.getLastRow()-1, 2).getValues();
    for (var j = wRows.length - 1; j >= 0; j--) {
      if (String(wRows[j][0]).trim() === testId && String(wRows[j][1]).trim().toUpperCase() === studentId) {
        shW.deleteRow(j + 2);
      }
    }
  }

  // Delete from OT_STARTS (Headers: Test ID(0), Student ID(1))
  var shS = ss.getSheetByName(SH_OT_STARTS);
  if (shS && shS.getLastRow() > 1) {
    var sRows = shS.getRange(2, 1, shS.getLastRow()-1, 2).getValues();
    for (var k = sRows.length - 1; k >= 0; k--) {
      if (String(sRows[k][0]).trim() === testId && String(sRows[k][1]).trim().toUpperCase() === studentId) {
        shS.deleteRow(k + 2);
      }
    }
  }

  // Log the reset to OT_WARNINGS sheet as a record (type: 'reset')
  var shWLog = ss.getSheetByName(SH_OT_WARNINGS);
  if (shWLog) {
    shWLog.appendRow([testId, studentId, p.instructor, 'reset', 1, new Date().toISOString()]);
  }

  // Count total resets for this student+test (from warnings log)
  var resetCount = 0;
  if (shW && shW.getLastRow() > 1) {
    var wAll = shW.getRange(2, 1, shW.getLastRow()-1, 4).getValues();
    resetCount = wAll.filter(function(r) {
      return String(r[0]).trim() === testId && String(r[1]).trim().toUpperCase() === studentId && String(r[3]) === 'reset';
    }).length;
  }

  return {status:'ok', deletedRows: deletedCount, resetCount: resetCount,
          message:'Attempt reset #' + resetCount + '. Student can now retake the test.'};
}

function otSaveManualGrade(ss, p) {
  if (!p.instructor||!p.testId||!p.studentId||!p.qId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_MANUAL_GRADES);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,9).getValues():[];
  var now=new Date();
  var score=Math.max(0,parseFloat(p.score !== undefined ? p.score : p.instructorScore)||0);
  var feedback=p.feedback||'';
  var rowIdx=rows.findIndex(function(r){return String(r[0])===String(p.testId)&&String(r[1])===String(p.studentId)&&String(r[2])===String(p.qId);});
  if(rowIdx!==-1){
    sh.getRange(rowIdx+2,5).setValue(score);
    sh.getRange(rowIdx+2,7).setValue(feedback);
    sh.getRange(rowIdx+2,8).setValue(p.instructor);
    sh.getRange(rowIdx+2,9).setValue(now.toISOString());
  }
  else{
    sh.appendRow([p.testId,p.studentId,p.qId,'',score,p.maxMarks||5,feedback,p.instructor,now.toISOString()]);
  }
  var updatedRows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,9).getValues():[];
  var studentMGRows=updatedRows.filter(function(r){return String(r[0])===String(p.testId)&&String(r[1])===String(p.studentId);});
  var allGraded=studentMGRows.every(function(r){return r[4]!==''&&r[4]!==null;});
  if(allGraded){
    var manualTotal=studentMGRows.reduce(function(sum,r){return sum+(parseFloat(r[4])||0);},0);
    var shR=ss.getSheetByName(SH_OT_RESPONSES);
    var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
    var rIdx=rRows.findIndex(function(r){return String(r[1])===String(p.testId)&&String(r[2])===String(p.studentId);});
    if(rIdx!==-1){
      var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
      var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues():[];
      var testRow=otRows.find(function(r){return r[0]===p.testId;});
      var passScore=testRow?(parseFloat(testRow[22])||OT_PASS_PERCENT):OT_PASS_PERCENT;
      
      var autoScore=parseFloat(rRows[rIdx][8])||0;
      var totalMarks=parseFloat(rRows[rIdx][11])||1;
      var totalScore=autoScore+manualTotal;
      var pct=Math.round(totalScore/totalMarks*100);
      var result=pct>=passScore?'Pass':'Fail';
      shR.getRange(rIdx+2,10).setValue(manualTotal);
      shR.getRange(rIdx+2,11).setValue(totalScore);
      shR.getRange(rIdx+2,13).setValue(pct);
      shR.getRange(rIdx+2,14).setValue(result);
    }
  }
  return{status:'ok',allGraded:allGraded};
}

function otGetPendingManualGrades(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh=ss.getSheetByName(SH_OT_MANUAL_GRADES);
  var rows=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,9).getValues():[];
  var byStudent={};
  rows.filter(function(r){return r[0]===p.testId;}).forEach(function(r){
    if(!byStudent[r[1]]) byStudent[r[1]]={studentId:r[1],questions:[]};
    byStudent[r[1]].questions.push({qId:r[2],studentAnswer:r[3],score:r[4],maxMarks:r[5],feedback:r[6]||'',graded:r[4]!==''&&r[4]!==null});
  });
  var pending=rows.filter(function(r){return r[0]===p.testId&&(r[4]===''||r[4]===null);}).length;
  var graded=rows.filter(function(r){return r[0]===p.testId&&r[4]!==''&&r[4]!==null;}).length;
  return{status:'ok',pendingCount:pending,gradedCount:graded,byStudent:Object.values(byStudent)};
}

function otGetStudentResults(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var myResponses=rRows.filter(function(r){return String(r[2])===String(p.studentId);});
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,22).getValues():[];
  var testMap={};otRows.forEach(function(r){testMap[r[0]]=r;});
  // For retake tests, keep best score
  var bestByTest={};
  myResponses.forEach(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return;
    var pct=parseFloat(r[12])||0;
    var key=r[1];
    if(!bestByTest[key]||pct>bestByTest[key].pct) bestByTest[key]={row:r,pct:pct};
  });
  var results=myResponses.map(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return null;
    // For retake, only show best
    if(t[18]==='Yes'&&bestByTest[r[1]]&&bestByTest[r[1]].row!==r) return null;
    return{testId:r[1],testLabel:t[1]||r[1],testType:t[2]||'',
      submittedAt:r[5],submitType:r[6],totalScore:r[10],totalMarks:r[11],
      percentage:r[12],result:r[13],resultsMode:t[12]||'summary',
      attemptNo:r[15],allowRetake:t[18]||'No'};
  }).filter(Boolean);
  var weekly=results.filter(function(r){return r.testType==='Weekly';});
  var final_=results.filter(function(r){return r.testType==='Final';});
  var weeklyAvg=null;
  if(weekly.length>0){
    var wScores2=weekly.map(function(r){return parseFloat(r.percentage)||0;}).sort(function(a,b){return b-a;});
    var top3w2=wScores2.slice(0,3);
    weeklyAvg=Math.round(top3w2.reduce(function(s,v){return s+v;},0)/top3w2.length);
  }
  return{status:'ok',weeklyResults:weekly,finalResults:final_,weeklyAverage:weeklyAvg,
    weeklyPass:weeklyAvg!==null?weeklyAvg>=OT_PASS_PERCENT:null,
    overallPass:(weeklyAvg!==null&&weeklyAvg>=OT_PASS_PERCENT)&&
      (final_.length===0||final_.some(function(r){return r.result==='Pass';}))};
}

function otGetTestResultsSummary(ss, p) {
  if (!p.instructor||!p.testId) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var allRows=rRows.filter(function(r){return r[1]===p.testId;}).map(function(r){
    return{studentId:r[2],studentName:r[3],submittedAt:r[5],submitType:r[6],
      autoScore:r[8],manualScore:r[9],totalScore:r[10],totalMarks:r[11],
      percentage:r[12],result:r[13],attemptNo:r[15]};
  });
  // Deduplicate: keep the latest submission per student (guards against ghost 0-score records)
  var byStudent={};
  allRows.forEach(function(r){
    var existing=byStudent[r.studentId];
    if(!existing || new Date(r.submittedAt)>new Date(existing.submittedAt)) byStudent[r.studentId]=r;
  });
  var testResponses=Object.values(byStudent);
  var passed=testResponses.filter(function(r){return r.result==='Pass';}).length;
  var failed=testResponses.filter(function(r){return r.result==='Fail';}).length;
  var avgPct=testResponses.length>0?Math.round(testResponses.reduce(function(s,r){return s+(parseFloat(r.percentage)||0);},0)/testResponses.length):0;
  return{status:'ok',responses:testResponses,passed:passed,failed:failed,avgPercentage:avgPct,total:testResponses.length};
}

// ════════════════════════════════════════════════════════════════
// BATCH PERFORMANCE SUMMARY
// Returns per-batch, per-student, per-week scores for the Batch Report tab.
// Instructor sees ALL their assigned batches (even with 0 tests yet).
// Admin (isAdmin=true) sees all batches.
// ════════════════════════════════════════════════════════════════
function otGetBatchPerformanceSummary(ss, p) {
  if (!p.instructor) return {status:'error', reason:'missing_params'};
  var isAdmin = String(p.isAdmin||'').toLowerCase() === 'true';
  var instrName = String(p.instructor||'').trim().toLowerCase();

  ensureOnlineTestSheets(ss);

  // 1a. Load instructor's assigned batches from Batches sheet (so all batches appear even with 0 tests)
  var instructorBatchCodes = {};
  var shBatch = ss.getSheetByName(SH_BATCHES);
  if (shBatch && shBatch.getLastRow() > 1) {
    var batchData = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues();
    batchData.forEach(function(r){
      if (!r[0]) return;
      var hasSlot = detectSlotOrDate(r[4]);
      var assigned = String(hasSlot ? (r[9]||'') : (r[8]||'')).trim().toLowerCase();
      if (isAdmin || assigned === instrName) {
        instructorBatchCodes[String(r[0]).trim().toUpperCase()] = true;
      }
    });
  }

  // 1b. Load all tests — filter by createdBy so each instructor sees only their own tests.
  //     Admin sees everything. The batch dropdown still shows all instructor-assigned batches
  //     (from step 1a) even if the instructor hasn't created any tests for that batch yet.
  var shOT = ss.getSheetByName(SH_ONLINE_TESTS);
  var testRows = shOT.getLastRow()>1 ? shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues() : [];
  var allTests = testRows.filter(function(r){
    if (!r[0]) return false;
    // Exclude templates
    if (String(r[6]||'').toLowerCase() === 'template') return false;
    if (isAdmin) return true;
    // Only this instructor's own tests
    return String(r[13]||'').trim().toLowerCase() === instrName;
  }).map(otParseTestRow);

  // 2. Load all responses
  var shR = ss.getSheetByName(SH_OT_RESPONSES);
  var rRows = shR.getLastRow()>1 ? shR.getRange(2,1,shR.getLastRow()-1,16).getValues() : [];

  // Build a map: testId → { studentId → latest response }
  var testResultMap = {};
  rRows.forEach(function(r){
    if (!r[1]) return;
    var testId = String(r[1]);
    var studentId = String(r[2]);
    if (!testResultMap[testId]) testResultMap[testId] = {};
    var existing = testResultMap[testId][studentId];
    var thisDate = r[5] ? new Date(r[5]) : new Date(0);
    var existDate = existing ? (existing.submittedAt ? new Date(existing.submittedAt) : new Date(0)) : new Date(0);
    if (!existing || thisDate > existDate) {
      testResultMap[testId][studentId] = {
        studentId: studentId,
        studentName: String(r[3]||''),
        submittedAt: r[5] ? new Date(r[5]).toISOString() : '',
        percentage: parseFloat(r[12])||0,
        result: String(r[13]||''),
        totalScore: r[10],
        totalMarks: r[11]
      };
    }
  });

  // 3. Group tests by batch (from test data)
  var batchMap = {};
  // Pre-seed with ALL instructor batches (even those with 0 tests)
  Object.keys(instructorBatchCodes).forEach(function(bc){ batchMap[bc] = []; });
  allTests.forEach(function(t){
    var codes = String(t.batchCodes||'').split(',').map(function(s){return s.trim().toUpperCase();}).filter(Boolean);
    codes.forEach(function(bc){
      if (!batchMap[bc]) batchMap[bc] = [];
      batchMap[bc].push(t);
    });
  });

  // 4. Build output per batch
  var batches = Object.keys(batchMap).sort().map(function(bc){
    // Sort tests by activatedAt (chronological = Week 1, 2, 3...)
    var tests = batchMap[bc].slice().sort(function(a,b){
      var da = a.activatedAt ? new Date(a.activatedAt) : new Date(0);
      var db = b.activatedAt ? new Date(b.activatedAt) : new Date(0);
      return da - db;
    });

    // Collect all unique students across all tests in this batch
    var studentNameMap = {};
    tests.forEach(function(t){
      var res = testResultMap[t.testId] || {};
      Object.keys(res).forEach(function(sid){
        if (!studentNameMap[sid]) studentNameMap[sid] = res[sid].studentName || sid;
      });
    });
    var studentIds = Object.keys(studentNameMap).sort(function(a,b){
      return studentNameMap[a].localeCompare(studentNameMap[b]);
    });

    // Build per-student weekly data
    var students = studentIds.map(function(sid){
      var weeks = tests.map(function(t){
        var res = testResultMap[t.testId] && testResultMap[t.testId][sid];
        if (!res) return {testId:t.testId, attempted:false, pct:null, result:''};
        return {testId:t.testId, attempted:true, pct:Math.round(res.percentage), result:res.result};
      });
      // Overall avg = average of attempted weeks only
      var attempted = weeks.filter(function(w){return w.attempted;});
      var avgPct = attempted.length > 0
        ? Math.round(attempted.reduce(function(s,w){return s+(w.pct||0);},0) / attempted.length)
        : null;
      // Trend: compare last two attempted weeks
      var trend = '—';
      if (attempted.length >= 2) {
        var diff = attempted[attempted.length-1].pct - attempted[attempted.length-2].pct;
        trend = diff > 0 ? '↑' : (diff < 0 ? '↓' : '→');
      }
      return {
        studentId: sid,
        studentName: studentNameMap[sid],
        weeks: weeks,
        avgPct: avgPct,
        trend: trend,
        attemptedCount: attempted.length
      };
    });

    // Batch-level summary
    var allStudentsWithAttempts = students.filter(function(s){return s.avgPct !== null;});
    var batchAvg = allStudentsWithAttempts.length > 0
      ? Math.round(allStudentsWithAttempts.reduce(function(s,st){return s+(st.avgPct||0);},0) / allStudentsWithAttempts.length)
      : null;
    var batchPassCount = students.filter(function(s){
      return s.weeks.some(function(w){return w.result==='Pass';});
    }).length;

    return {
      batchCode: bc,
      tests: tests.map(function(t, i){
        return {testId:t.testId, testLabel:t.testLabel||('Week '+(i+1)), testType:t.testType, activatedAt:t.activatedAt, createdBy:t.createdBy||''};
      }),
      students: students,
      batchAvg: batchAvg,
      batchPassCount: batchPassCount,
      totalStudents: studentIds.length
    };
  });

  return {status:'ok', batches:batches};
}

// ════════════════════════════════════════════════════════════════
// TEST TEMPLATES — stored in OnlineTests sheet with status='Template'
// Templates are per-instructor: createdBy must match.
// testId is namespaced as TMPL-{instrSafe}-{suffix} to avoid collisions.
// ════════════════════════════════════════════════════════════════

function otGetTestTemplates(ss, p) {
  if (!p.instructor) return {status:'error', reason:'missing_params'};
  var instrName = String(p.instructor).trim().toLowerCase();
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,23).getValues() : [];
  var shQ = ss.getSheetByName(SH_OT_QUESTIONS);
  var qRows = shQ && shQ.getLastRow()>1 ? shQ.getRange(2,1,shQ.getLastRow()-1,1).getValues() : [];
  var qCount = {};
  qRows.forEach(function(r){ if(r[0]) qCount[r[0]] = (qCount[r[0]]||0)+1; });

  var templates = rows.filter(function(r){
    if (!r[0]) return false;
    var status = String(r[6]||'').trim().toLowerCase();
    var creator = String(r[13]||'').trim().toLowerCase();
    return status === 'template' && creator === instrName;
  }).map(function(r){
    var t = otParseTestRow(r);
    return {
      testId:       t.testId,
      templateName: t.testLabel,
      title:        t.testLabel,
      testType:     t.testType,
      durationMins: t.duration,
      passingScore: t.passingScore,
      questionCount: qCount[t.testId] || 0
    };
  });
  return {status:'ok', templates:templates};
}

function otSaveTestTemplate(ss, p) {
  if (!p.instructor || !p.templateName) return {status:'error', reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var instrName = String(p.instructor).trim();
  var instrSafe = instrName.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').substring(0,12);

  // Generate instructor-namespaced ID if not provided or if it's a global seed ID
  var testId = String(p.testId||'').trim();
  var seedPattern = /^TMPL-(WEEKLY-\d+|FINAL)$/i;
  if (!testId || seedPattern.test(testId)) {
    // Map seed IDs to namespaced ones, preserving the suffix
    if (seedPattern.test(testId)) {
      var suffix = testId.replace(/^TMPL-/i,'');
      testId = 'TMPL-' + instrSafe + '-' + suffix;
    } else {
      testId = 'TMPL-' + instrSafe + '-' + Date.now();
    }
  }

  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,23).getValues() : [];
  var instrLower = instrName.toLowerCase();

  // Find existing row that matches testId AND belongs to this instructor
  var rowIdx = -1;
  for (var i=0; i<rows.length; i++) {
    if (String(rows[i][0]).trim() === testId &&
        String(rows[i][13]||'').trim().toLowerCase() === instrLower) {
      rowIdx = i + 2; // 1-indexed + header
      break;
    }
  }

  var duration   = parseInt(p.durationMins)||30;
  var passing    = parseFloat(p.passingScore)||60;
  var testLabel  = String(p.templateName||p.title||'Template').trim();
  var testType   = String(p.testType||'Weekly').trim();
  var now        = new Date().toISOString();

  if (rowIdx > 0) {
    // Update existing
    var range = sh.getRange(rowIdx, 1, 1, 23);
    var existing = range.getValues()[0];
    existing[1] = testLabel;
    existing[2] = testType;
    existing[5] = duration;
    existing[6] = 'Template';
    existing[22] = passing;
    range.setValues([existing]);
  } else {
    // Insert new row
    sh.appendRow([
      testId, testLabel, testType,
      '', '', // batchCodes, course
      duration, 'Template', 'No', 0, // status, negMark, negVal
      '', '', 'No', 'show', // activatedAt, closedAt, resultsReleased, resultsMode
      instrName, now, 'ALL', // createdBy, createdAt, targetStudents
      'manual', '', 'No', 'No', '', '', passing // expiryMode, expiryAt, allowRetake, shuffle, instructions, scheduledAt, passingScore
    ]);
  }
  return {status:'ok', testId:testId};
}

function otDeleteTestTemplate(ss, p) {
  if (!p.instructor || !p.testId) return {status:'error', reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var sh = ss.getSheetByName(SH_ONLINE_TESTS);
  var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues() : [];
  var instrLower = String(p.instructor).trim().toLowerCase();
  // Read createdBy too
  var fullRows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,14).getValues() : [];
  for (var i=fullRows.length-1; i>=0; i--) {
    if (String(fullRows[i][0]).trim() === String(p.testId).trim() &&
        String(fullRows[i][13]||'').trim().toLowerCase() === instrLower) {
      sh.deleteRow(i+2);
      return {status:'ok'};
    }
  }
  return {status:'error', reason:'not_found'};
}

// ── Question Bank Data (355 questions from Excel) ──────────────
const QUESTION_BANK_DATA = [
  {id:'QB0001',course:'DG',topic:'DG Rough',q:'Diamond is a crystalline for of a',o1:'Nitrogen & Hydrogen',o2:'Carbon & Oxygen',o3:'Carbon',o4:'Silicon Oxide',ans:3,type:'MCQ'},
  {id:'QB0002',course:'DG',topic:'DG Rough',q:'The lustre of diamond is',o1:'Metallic',o2:'Waxy',o3:'Adamantine',o4:'Vitreous',ans:3,type:'MCQ'},
  {id:'QB0003',course:'DG',topic:'DG Rough',q:'Hardness of Diamond is',o1:'9',o2:'9.5',o3:'10',o4:'10.5',ans:3,type:'MCQ'},
  {id:'QB0004',course:'DG',topic:'DG Rough',q:'Macle is an example of',o1:'Penetration twin',o2:'Regular twin',o3:'Contact twin',o4:'Aggregate',ans:3,type:'MCQ'},
  {id:'QB0005',course:'DG',topic:'DG Rough',q:'Which of the following properties is used for the recovery of diamonds from a mine?',o1:'Thermal conductivity',o2:'Fluorescence',o3:'Affinity to grease',o4:'The hardness',ans:3,type:'MCQ'},
  {id:'QB0006',course:'DG',topic:'DG Rough',q:'In the 1st century A.D. diamond was defined by a term _______ that had a meaning very close to unconquerable.',o1:'Adamantine',o2:'Adamas',o3:'Adamanas',o4:'Amadas',ans:2,type:'MCQ'},
  {id:'QB0007',course:'DG',topic:'DG Rough',q:'What are the factors involving the beauty of diamond?',o1:'Scintillation, reflection, dispersion',o2:'Brilliancy, reflection, dispersion',o3:'Scintillation, dispersion, brilliance',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0008',course:'DG',topic:'DG Rough',q:'Which following category of rough diamonds is the most desired?',o1:'SW1',o2:'MK1',o3:'SPT1',o4:'CL1',ans:1,type:'MCQ'},
  {id:'QB0009',course:'DG',topic:'DG Rough',q:'Makeable1 category diamonds are',o1:'Clean and slightly distorted in shape',o2:'Only clean',o3:'Clean and perfect in shape',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0010',course:'DG',topic:'DG Rough',q:'Where can we find the trigons on a diamond?',o1:'On the dodecahedral planes',o2:'On the cubic planes',o3:'On the octahedral planes',o4:'On the tetrahedral planes',ans:3,type:'MCQ'},
  {id:'QB0011',course:'DG',topic:'DG Rough',q:'Coated Diamonds are',o1:'Semi transparent',o2:'Opaque',o3:'Translucent',o4:'Semi translucent',ans:2,type:'MCQ'},
  {id:'QB0012',course:'DG',topic:'DG Rough',q:'Who is the largest diamond producer outside Africa?',o1:'Australia',o2:'Russia',o3:'Canada',o4:'U.S.A.',ans:2,type:'MCQ'},
  {id:'QB0013',course:'DG',topic:'DG Rough',q:'Host rocks containing diamonds are',o1:'Kimberlite',o2:'Lamprorite',o3:'All of the above',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0014',course:'DG',topic:'DG Rough',q:'A member who gets regular supply of rough from the mining company is also called as a',o1:'DTC',o2:'Sight Holders',o3:'Central Selling Organization',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0015',course:'DG',topic:'DG Rough',q:'What is the translation for ‘Koh-i-Noor’?',o1:'The unbreakable stone',o2:'The great blue diamond',o3:'Sun of the sea',o4:'Mountain of light',ans:4,type:'MCQ'},
  {id:'QB0016',course:'DG',topic:'DG Rough',q:'Which of the following mines is not in South Africa?',o1:'The Finch mine',o2:'The Premier mine',o3:'The Koffiefontein mine',o4:'The Ekati mine',ans:4,type:'MCQ'},
  {id:'QB0017',course:'DG',topic:'DG Rough',q:'How many facets are on a single cut diamond?',o1:'15',o2:'16',o3:'17',o4:'18',ans:3,type:'MCQ'},
  {id:'QB0018',course:'DG',topic:'DG Rough',q:'A Octahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:1,type:'MCQ'},
  {id:'QB0019',course:'DG',topic:'DG Rough',q:'A Cube shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:2,type:'MCQ'},
  {id:'QB0020',course:'DG',topic:'DG Rough',q:'In a RBC, the number of facets on the crown is',o1:'31',o2:'32',o3:'33',o4:'34',ans:3,type:'MCQ'},
  {id:'QB0021',course:'DG',topic:'DG Clarity',q:'Extra Facet is considered in',o1:'Polish',o2:'Blemishes',o3:'Clarity',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0022',course:'DG',topic:'DG Clarity',q:'The clarity call has to be given depending on the _________ appearance of the diamond.',o1:'Face Up',o2:'Profile',o3:'Pavilion',o4:'Over-all',ans:4,type:'MCQ'},
  {id:'QB0023',course:'DG',topic:'DG Clarity',q:'Indented Naturals can be found on',o1:'Rough Diamond crystal',o2:'Maccle',o3:'A Faceted Diamond',o4:'Dodecahedron',ans:3,type:'MCQ'},
  {id:'QB0024',course:'DG',topic:'DG Clarity',q:'A Knot is an included crystal that breaks',o1:'The surface of pavilion',o2:'The surface of crown',o3:'The surface of girdle',o4:'Anywhere on the surface',ans:4,type:'MCQ'},
  {id:'QB0025',course:'DG',topic:'DG Clarity',q:'What kind of light is used for clarity grading?',o1:'Incandescent light',o2:'Transmitted light',o3:'Dark-field illumination',o4:'Standard daylight',ans:4,type:'MCQ'},
  {id:'QB0026',course:'DG',topic:'DG Clarity',q:'The main purpose of plotting is',o1:'Grading',o2:'Clarity Grading',o3:'Certification',o4:'Identification of inclusion',ans:4,type:'MCQ'},
  {id:'QB0027',course:'DG',topic:'DG Clarity',q:'Which is the only structural phenomenon to be plotted?',o1:'External Twinning',o2:'Internal Graining',o3:'Naturals',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0028',course:'DG',topic:'DG Clarity',q:'All characteristics are plotted on the Crown, unless:',o1:'Touching the surface of the pavilion',o2:'They can be seen from the crown',o3:'They can also be seen from the pavilion',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0029',course:'DG',topic:'DG Color',q:'What is the correct name for a pink diamond with a brown tinge?',o1:'Brown pink',o2:'Brownish pink',o3:'Pink brown',o4:'Pinkish brown',ans:2,type:'MCQ'},
  {id:'QB0030',course:'DG',topic:'DG Rough',q:'What do we call an mix parcel of rough diamonds coming directly from the mine?',o1:'A fresh parcel',o2:'A run of mine',o3:'A random parcel',o4:'A rough parcel',ans:2,type:'MCQ'},
  {id:'QB0031',course:'DG',topic:'DG Color',q:'The fluorescence for your stone is strong ,  If your stone looks lighter face up compared to the master, then the color grade will be?',o1:'One shade lighter',o2:'One shade Darker',o3:'Same shade',o4:'It does not matter',ans:1,type:'MCQ'},
  {id:'QB0032',course:'DG',topic:'DG Color',q:'During V.E, if your diamond looks slightly colored from Pavilion and colorless from Crown, your diamond is in the ______________ color range.',o1:'D EF',o2:'GH IJ',o3:'KLM',o4:'N - Z',ans:2,type:'MCQ'},
  {id:'QB0033',course:'DG',topic:'DG Color',q:'In diamond color grading we use ________ UV light.',o1:'Long wave',o2:'Short wave',o3:'Medium wave',o4:'Micro wave',ans:1,type:'MCQ'},
  {id:'QB0034',course:'DG',topic:'DG Color',q:'The best light for color grading is',o1:'Incandescent light',o2:'UV corrected standard daylight',o3:'Northern day Light',o4:'LED Light',ans:2,type:'MCQ'},
  {id:'QB0035',course:'DG',topic:'DG Color',q:'In what color category are the ‘Cape stones’ classified?',o1:'Yellow',o2:'Colorless',o3:'Fine white',o4:'River White',ans:1,type:'MCQ'},
  {id:'QB0036',course:'DG',topic:'DG Clarity',q:'Which of the following statements is false?',o1:'Polishing lines are parallel lines',o2:'Polishing lines are restricted to the facets of a diamond',o3:'Polishing lines are internal',o4:'Polishing lines are external',ans:3,type:'MCQ'},
  {id:'QB0037',course:'DG',topic:'DG Color',q:'What is the correct name for a Natural Yellow diamond with a brown tinge?',o1:'Natural Fancy brownish yellow',o2:'Fancy brownish yellow',o3:'Natural Fancy yellowish brown',o4:'Fancy yellowish brown',ans:1,type:'MCQ'},
  {id:'QB0038',course:'DG',topic:'DG Color',q:'What is the correct name for a Green diamond with a Blue tinge?',o1:'Blue green',o2:'Bluish green',o3:'Green blue',o4:'Greenish blue',ans:2,type:'MCQ'},
  {id:'QB0039',course:'DG',topic:'DG Color',q:'During V.E, if your diamond looks obviously colored from Pavilion and obviously colored from Crown, your diamond falls in ______________ color range degree.',o1:'Colorless (1st DegreDG',o2:'Slightly Colored (2nd DegreDG',o3:'Obviously Colored (3rd DegreDG',o4:'Obviously Colored (4th DegreDG',ans:4,type:'MCQ'},
  {id:'QB0040',course:'DG',topic:'DG Color',q:'In an ideal diamond color master set, each diamond master sits at the _________ end of the color range.',o1:'Highest',o2:'Lowest',o3:'Middle',o4:'Average',ans:1,type:'MCQ'},
  {id:'QB0041',course:'DG',topic:'DG Pol/Sym',q:'If we see a chip at the culet then it has to be ___________',o1:'Plotted',o2:'Ignored',o3:'Considered under Blemish',o4:'Considered under Polish',ans:4,type:'MCQ'},
  {id:'QB0042',course:'DG',topic:'DG Carat',q:'___________ is considered 100% of a Round shape diamond.',o1:'The average girdle diameter',o2:'The lowest girdle diameter',o3:'The highest girdle diameter',o4:'The height',ans:1,type:'MCQ'},
  {id:'QB0043',course:'DG',topic:'DG Cut',q:'Hearts & Arrows diamonds are the example of',o1:'precison cutting',o2:'high clarity',o3:'high color',o4:'uniform girdle',ans:1,type:'MCQ'},
  {id:'QB0044',course:'DG',topic:'DG Pol/Sym',q:'Which of the following faults is not judged for polish?',o1:'Burn marks',o2:'Scratches',o3:'Nick',o4:'Wavy girdle',ans:4,type:'MCQ'},
  {id:'QB0045',course:'DG',topic:'DG Cut',q:'If the Girdle thickness is extremely thin the proportion grade will be',o1:'Excellent',o2:'Very Good',o3:'Good',o4:'Fair',ans:3,type:'MCQ'},
  {id:'QB0046',course:'DG',topic:'DG Clarity',q:'Twining are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Color',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0047',course:'DG',topic:'DG Clarity',q:'The Importance and the ______________of the Inclusions at 10x magnification     determines the Clarity Grade',o1:'Visibility',o2:'Nature',o3:'Number',o4:'Size',ans:1,type:'MCQ'},
  {id:'QB0048',course:'DG',topic:'DG Clarity',q:'If the inclusions in the stone are somewhat easy to locate with 10x, the Clarity grade is?',o1:'VS1',o2:'VS2',o3:'SI1',o4:'SI2',ans:2,type:'MCQ'},
  {id:'QB0049',course:'DG',topic:'DG Rough',q:'What is the crystal system of diamond?',o1:'Cubic',o2:'Hexagonal',o3:'Octahedral',o4:'Triclinic',ans:1,type:'MCQ'},
  {id:'QB0050',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Table Size is',o1:'51',o2:'52',o3:'53',o4:'54',ans:3,type:'MCQ'},
  {id:'QB0051',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation, if the ratio is 1:11/4, then the estimated table size is',o1:'60',o2:'61',o3:'62',o4:'63',ans:1,type:'MCQ'},
  {id:'QB0052',course:'DG',topic:'DG Color',q:'The term Chocolate diamond is used to describe brown diamonds found in ___________ mine.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0053',course:'DG',topic:'DG Color',q:'Which is the most commonly available color in a diamond?',o1:'Yellow',o2:'Brown',o3:'Green',o4:'Orange',ans:1,type:'MCQ'},
  {id:'QB0054',course:'DG',topic:'DG Color',q:'Brown color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:2,type:'MCQ'},
  {id:'QB0055',course:'DG',topic:'DG Color',q:'Nitrogen is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:1,type:'MCQ'},
  {id:'QB0056',course:'DG',topic:'DG Proportions',q:'Pavilion Depth is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:4,type:'MCQ'},
  {id:'QB0057',course:'DG',topic:'DG Proportions',q:'Girdle Facets are responsible for increasing _____________.',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:3,type:'MCQ'},
  {id:'QB0058',course:'DG',topic:'DG Carat',q:'What is responsible for Brilliance in diamonds?',o1:'Table',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Girdle Facets',ans:1,type:'MCQ'},
  {id:'QB0059',course:'DG',topic:'DG Carat',q:'Fire in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:2,type:'MCQ'},
  {id:'QB0060',course:'DG',topic:'DG Proportions',q:'What causes the ‘Nail Head’ effect in diamonds?',o1:'Steep pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0061',course:'DG',topic:'DG Synthetics',q:'Labgrown Diamonds are even traded as:',o1:'Eco-Friendly Diamonds',o2:'Cultured Diamonds',o3:'Man-made Diamonds',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0062',course:'DG',topic:'DG Carat',q:'What is the correct way to give the weight of a 1.2981 ct diamond?',o1:'1.298 ct',o2:'1.29 ct',o3:'1.30 ct',o4:'1.3 ct',ans:2,type:'MCQ'},
  {id:'QB0063',course:'DG',topic:'DG Treatments',q:'Coating is a __________________ treatment.',o1:'Stable Clarity',o2:'Stable Color',o3:'Unstable Clarity',o4:'Unstable Color',ans:4,type:'MCQ'},
  {id:'QB0064',course:'DG',topic:'DG Imitations',q:'What is the Dispersion of Diamond?',o1:'0.044',o2:'0.44',o3:'0.45',o4:'0.045',ans:1,type:'MCQ'},
  {id:'QB0065',course:'DG',topic:'DG Clarity',q:'If the inclusions in the  stone are Large and/or Numerous inclusions, difficult to easy to notice with naked eye, the  Clarity grade is ………………………...',o1:'SI2',o2:'I1',o3:'I2',o4:'I3',ans:2,type:'MCQ'},
  {id:'QB0066',course:'DG',topic:'DG Clarity',q:'Which of the following is a blemish?',o1:'Nick',o2:'Percussion mark',o3:'Chip',o4:'Pinpoint',ans:1,type:'MCQ'},
  {id:'QB0067',course:'DG',topic:'DG Clarity',q:'Bearded Girdle is the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezer',ans:1,type:'MCQ'},
  {id:'QB0068',course:'DG',topic:'DG Rough',q:'A dodecahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:3,type:'MCQ'},
  {id:'QB0069',course:'DG',topic:'DG Proportions',q:'The Tolkowsky ideal for Pavilion Depth is',o1:'43.1',o2:'43.2',o3:'43.3',o4:'43.4',ans:1,type:'MCQ'},
  {id:'QB0070',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation if the ratio is 1:1, then the estimated table size is',o1:'51',o2:'52',o3:'53',o4:'54',ans:4,type:'MCQ'},
  {id:'QB0071',course:'DG',topic:'DG Proportions',q:'When estimating Table %, if the Table is noticeably misshapen, we will add ……..% to the estimation arrived using ratio method?',o1:'1',o2:'2',o3:'3',o4:'4',ans:1,type:'MCQ'},
  {id:'QB0072',course:'DG',topic:'DG Imitations',q:'What is a good synonym for ‘simulant’?',o1:'Equal value',o2:'Variation',o3:'Synthetic',o4:'Imitation',ans:4,type:'MCQ'},
  {id:'QB0073',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a pear?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0074',course:'DG',topic:'DG Color',q:'The term Champagne diamond is used to describe brown diamonds found in ________ mines.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0075',course:'DG',topic:'DG Color',q:'Yellow color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:4,type:'MCQ'},
  {id:'QB0076',course:'DG',topic:'DG Color',q:'Boron is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:2,type:'MCQ'},
  {id:'QB0077',course:'DG',topic:'DG Proportions',q:'Table is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:1,type:'MCQ'},
  {id:'QB0078',course:'DG',topic:'DG Carat',q:'What is responsible for Scintillation in diamonds?',o1:'Girdle Facets',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Facets',ans:4,type:'MCQ'},
  {id:'QB0079',course:'DG',topic:'DG Carat',q:'Life in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:1,type:'MCQ'},
  {id:'QB0080',course:'DG',topic:'DG Color',q:'Trade term for Black diamond is',o1:'Metal',o2:'Gunmetal',o3:'Onyx',o4:'Rhinestone',ans:1,type:'MCQ'},
  {id:'QB0081',course:'DG',topic:'DG Imitations',q:'Out of the below options, what is American Diamond?',o1:'Synthetic Diamond',o2:'Synthetic Cubic Zirconia (CZ)',o3:'Synthetic Moissanite',o4:'GGG & YAG',ans:2,type:'MCQ'},
  {id:'QB0082',course:'DG',topic:'DG Treatments',q:'Diamonds with Boron Impurity belong to Type',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0083',course:'DG',topic:'DG Carat',q:'What is the weight of a five-grainer diamond?',o1:'5 ct',o2:'0.5 ct',o3:'1.25 ct',o4:'1.50 ct',ans:3,type:'MCQ'},
  {id:'QB0084',course:'DG',topic:'DG Carat',q:'What is the total depth% for a diamond with average girdle diameter = 6.55mm & height= 4.17mm.',o1:'63.5',o2:'63.6',o3:'63.7',o4:'63.66',ans:2,type:'MCQ'},
  {id:'QB0085',course:'DG',topic:'DG Synthetics',q:'The First Gem quality Synthetic diamond was grown in',o1:'1954',o2:'1960',o3:'1970',o4:'1971',ans:3,type:'MCQ'},
  {id:'QB0086',course:'DG',topic:'DG Clarity',q:'What kind of characteristic is known as Inclusion ?',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:2,type:'MCQ'},
  {id:'QB0087',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Pavilion Angle is',o1:'40.25',o2:'40.5',o3:'40.75',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0088',course:'DG',topic:'DG Fancy',q:'Bulge effect is seen in',o1:'Round Brilliant Cut',o2:'Fancy Brilliant Cuts',o3:'Fancy Step Cuts',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0089',course:'DG',topic:'DG Proportions',q:'When using the Ratio Method for Table size estimation if the ratio is 1:2, then the estimated table size is',o1:'71',o2:'72',o3:'73',o4:'74',ans:2,type:'MCQ'},
  {id:'QB0090',course:'DG',topic:'DG Imitations',q:'What is the specific gravity of diamond?',o1:'1.33',o2:'2.24',o3:'2.42',o4:'3.52',ans:4,type:'MCQ'},
  {id:'QB0091',course:'DG',topic:'DG Treatments',q:'To which type belong the semi-conductive diamonds?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0092',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a heart?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0093',course:'DG',topic:'DG Color',q:'The term Cognac diamond is used to describe brown diamonds found in ________ mines.',o1:'Diavik',o2:'Mir',o3:'Argyle',o4:'Premier',ans:3,type:'MCQ'},
  {id:'QB0094',course:'DG',topic:'DG Proportions',q:'Crown Facets is responsible for',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:2,type:'MCQ'},
  {id:'QB0095',course:'DG',topic:'DG SDA',q:'Melee includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:1,type:'MCQ'},
  {id:'QB0096',course:'DG',topic:'DG SDA',q:'-2 sieve includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:3,type:'MCQ'},
  {id:'QB0097',course:'DG',topic:'DG Pricing',q:'Diamond prizes are updated on every _____________ . (day of the weeDG',o1:'Thursday',o2:'Friday',o3:'Saturday',o4:'Sunday',ans:2,type:'MCQ'},
  {id:'QB0098',course:'DG',topic:'DG Pol/Sym',q:'Burn Marks & Abraded Culet are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Polish',o4:'Symmetry',ans:3,type:'MCQ'},
  {id:'QB0099',course:'DG',topic:'DG Rough',q:'The diamonds originating from War Zones / Third World Countries are called',o1:'Coated diamonds',o2:'Conflict diamonds',o3:'Frosted diamonds',o4:'Irradiated diamonds',ans:2,type:'MCQ'},
  {id:'QB0100',course:'DG',topic:'DG SDA',q:'Approx diameter of 0.10ct diamond would be?',o1:'1 mm',o2:'2 mm',o3:'3 mm',o4:'4 mm',ans:3,type:'MCQ'},
  {id:'QB0101',course:'DG',topic:'DG Treatments',q:'Which diamond Type is considered purest?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:3,type:'MCQ'},
  {id:'QB0102',course:'DG',topic:'DG Proportions',q:'What causes the “fish eye” effect in diamonds?',o1:'Shallow pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0103',course:'DG',topic:'DG Treatments',q:'Type I diamonds',o1:'are purest',o2:'have Nitrogen',o3:'have Boron',o4:'are extremely rare',ans:2,type:'MCQ'},
  {id:'QB0104',course:'DG',topic:'DG Pol/Sym',q:'AbrC is also considered in',o1:'Polish',o2:'Symmetry',o3:'Cut',o4:'Inclusion',ans:1,type:'MCQ'},
  {id:'QB0105',course:'DG',topic:'DG Proportions',q:'Crown height % is estimated using the Table size% and ___________',o1:'Total Depth%',o2:'Pavilion Depth %',o3:'Crown Angle',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0106',course:'DG',topic:'DG Rough',q:'Stages of diamond manufacturing in correct pattern:',o1:'Bruting, Planning, Polishing, Laser Sawing',o2:'Planning, Polishing, Laser Sawing, Bruting',o3:'Planning, Laser Sawing, Bruting, Polishing',o4:'Laser Sawing, Bruting, Planning, Polishing',ans:3,type:'MCQ'},
  {id:'QB0107',course:'DG',topic:'DG Fancy',q:'What is a synonym for a pendeloque?',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'Princess',ans:2,type:'MCQ'},
  {id:'QB0108',course:'DG',topic:'DG Treatments',q:'What happens if you ‘restore’ a brown type IIa diamond?',o1:'It becomes colorless',o2:'The color changes to orange',o3:'The color changes to yellow',o4:'Brown color intensifies',ans:1,type:'MCQ'},
  {id:'QB0109',course:'DG',topic:'DG SDA',q:'What is the average diameter in mm of a 1 ct diamond?',o1:'6.4 mm',o2:'6.5 mm',o3:'6.6 mm',o4:'6.7 mm',ans:2,type:'MCQ'},
  {id:'QB0110',course:'DG',topic:'DG Treatments',q:'Why are fracture-fillings not accepted in diamond trade?',o1:'They don’t improve the clarity',o2:'The treatment can damage certain types of diamond',o3:'They are not stable',o4:'The color becomes worse after some time',ans:3,type:'MCQ'},
  {id:'QB0111',course:'DG',topic:'DG Carat',q:'What is the correct way to give the weight of a 2.2986 ct diamond?',o1:'2.298 ct',o2:'2.29 ct',o3:'2.30 ct',o4:'2.3 ct',ans:3,type:'MCQ'},
  {id:'QB0112',course:'DG',topic:'DG Fancy',q:'What is a synonym for a naivete?',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'Princess',ans:3,type:'MCQ'},
  {id:'QB0113',course:'DG',topic:'DG Imitations',q:'What is the refractive index of diamond?',o1:'1.33',o2:'2.24',o3:'2.42',o4:'3.52',ans:3,type:'MCQ'},
  {id:'QB0114',course:'DG',topic:'DG Carat',q:'If you buy a parcel of 10 stones per carat, what is the weight of a single stone?',o1:'0.2g',o2:'0.1g',o3:'0.02g',o4:'0.01g',ans:3,type:'MCQ'},
  {id:'QB0115',course:'DG',topic:'DG Treatments',q:'Which type belongs to the rarest diamonds?',o1:'Ia',o2:'Ib',o3:'IIa',o4:'IIb',ans:4,type:'MCQ'},
  {id:'QB0116',course:'DG',topic:'DG Synthetics',q:'Which of the following inclusions is never present in natural diamond?',o1:'Diamond inclusions',o2:'Crystal',o3:'irregular growth lines',o4:'metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0117',course:'DG',topic:'DG Fancy',q:'Bow Tie effect is seen in',o1:'Oval',o2:'Pear',o3:'Marquise',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0118',course:'DG',topic:'DG Synthetics',q:'First company to synthetise diamond was',o1:'A.S.E.A.',o2:'General Electric',o3:'Russian BARS',o4:'Apollo Diamonds',ans:2,type:'MCQ'},
  {id:'QB0119',course:'DG',topic:'DG Clarity',q:'A Cloud is concentration of',o1:'Crystal',o2:'Point',o3:'Pinpoint',o4:'Drops',ans:3,type:'MCQ'},
  {id:'QB0120',course:'DG',topic:'DG Rough',q:'Full form of DTC is',o1:'Diamond Transaction Commision',o2:'Diamond Transit Company',o3:'Diamond Trading Company',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0121',course:'DG',topic:'DG Clarity',q:'If the inclusions in the stone are very easy to locate at 10x. The Clarity grade is',o1:'SI2',o2:'I1',o3:'I2',o4:'I3',ans:1,type:'MCQ'},
  {id:'QB0122',course:'DG',topic:'DG Proportions',q:'Crown Angle is the angle formed by the Girdle Plane and the',o1:'Bezel facets',o2:'Upper Girdle facets',o3:'Lower Girdle Facets',o4:'Star Facets',ans:1,type:'MCQ'},
  {id:'QB0123',course:'DG',topic:'DG Proportions',q:'The Tolkowsky Ideal for Crown Angle is',o1:'33',o2:'33.5',o3:'34',o4:'34.5',ans:4,type:'MCQ'},
  {id:'QB0124',course:'DG',topic:'DG Proportions',q:'The Tolkowsky ideal for Crown Height is',o1:'16.1',o2:'16.2',o3:'16.3',o4:'16.4',ans:2,type:'MCQ'},
  {id:'QB0125',course:'DG',topic:'DG Proportions',q:'When estimating Table %, if the Table is obviously misshapen, we will add ……..% to the estimation arrived using ratio method?',o1:'1',o2:'2',o3:'3',o4:'4',ans:2,type:'MCQ'},
  {id:'QB0126',course:'DG',topic:'DG Rough',q:'In a RBC, the number of facets on the pavilion is',o1:'21',o2:'22',o3:'23',o4:'24',ans:4,type:'MCQ'},
  {id:'QB0127',course:'DG',topic:'DG Imitations',q:'Where is the double refraction in synthetic moissanite best seen?',o1:'On the table',o2:'On the crown',o3:'On the girdle',o4:'On the pavilion',ans:4,type:'MCQ'},
  {id:'QB0128',course:'DG',topic:'DG Treatments',q:'Why are some diamonds treated with Irradiation?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0129',course:'DG',topic:'DG Clarity',q:'Reflections are considered in _________grading (face up).',o1:'Plotting',o2:'Color',o3:'Fluorescence',o4:'Clarity',ans:4,type:'MCQ'},
  {id:'QB0130',course:'DG',topic:'DG Treatments',q:'How are inclusions in diamond reached with a KM - Treatment?',o1:'Via a surface-reaching crack',o2:'Via a laser drill hole',o3:'Via an internal tension crack',o4:'Via an internal feather',ans:1,type:'MCQ'},
  {id:'QB0131',course:'DG',topic:'DG Fancy',q:'How do you call the central part of a marquise?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0132',course:'DG',topic:'DG Color',q:'Which is the most commonly available color in a diamond from the list below?',o1:'Brown',o2:'Green',o3:'Pink',o4:'Blue',ans:1,type:'MCQ'},
  {id:'QB0133',course:'DG',topic:'DG Color',q:'Blue color in a diamond is due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:1,type:'MCQ'},
  {id:'QB0134',course:'DG',topic:'DG Color',q:'Green Color in a diamond due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:3,type:'MCQ'},
  {id:'QB0135',course:'DG',topic:'DG Color',q:'Naturally irradiated diamonds are ____________ in color.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:3,type:'MCQ'},
  {id:'QB0136',course:'DG',topic:'DG Color',q:'Structural Irregularities is the reason behind _________ color in diamonds.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:4,type:'MCQ'},
  {id:'QB0137',course:'DG',topic:'DG Color',q:'Choose the rarest color found in diamond, from the color mentioned below:',o1:'Pink',o2:'Green',o3:'Red',o4:'Blue',ans:3,type:'MCQ'},
  {id:'QB0138',course:'DG',topic:'DG Proportions',q:'What is responsible for Total Internal Reflection in diamonds?',o1:'Crown Height',o2:'Crown Angle',o3:'Pavilion Depth',o4:'Pavilion Angle',ans:3,type:'MCQ'},
  {id:'QB0139',course:'DG',topic:'DG Carat',q:'What is responsible for Dispersion in diamonds?',o1:'Table',o2:'Crown Facets',o3:'Pavilion Facets',o4:'Girdle Facets',ans:2,type:'MCQ'},
  {id:'QB0140',course:'DG',topic:'DG Carat',q:'Sparkle in a Diamond is also known as',o1:'Brilliance',o2:'Dispersion',o3:'Scintillation',o4:'Total Internal Reflection',ans:3,type:'MCQ'},
  {id:'QB0141',course:'DG',topic:'DG SDA',q:'Star includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:2,type:'MCQ'},
  {id:'QB0142',course:'DG',topic:'DG SDA',q:'+11 include sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:4,type:'MCQ'},
  {id:'QB0143',course:'DG',topic:'DG Pricing',q:'The official document required to calculate or appraise the prize of the diamond is called',o1:'Diamond Price Report',o2:'Rapaport',o3:'Pricing Chart',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0144',course:'DG',topic:'DG Treatments',q:'Why are some diamonds treated with HPHT treatment?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0145',course:'DG',topic:'DG Imitations',q:'Where is the double refraction in synthetic moissanite best seen from?',o1:'Through the crown',o2:'Through the girdle',o3:'Through the pavilion',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0146',course:'DG',topic:'DG Clarity',q:'Scratches & Abrasions are the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezers',ans:2,type:'MCQ'},
  {id:'QB0147',course:'DG',topic:'DG Clarity',q:'Any kind of ____________characteristic is known as a Blemish.',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:3,type:'MCQ'},
  {id:'QB0148',course:'DG',topic:'DG Rough',q:'The document required to certify the shipment of rough diamonds as legal tender is called',o1:'Origin Report',o2:'KP Certificate',o3:'Approval Memo',o4:'GST Invoice',ans:2,type:'MCQ'},
  {id:'QB0149',course:'DG',topic:'DG Fancy',q:'The elongated culet seen in Emerald Cut diamonds is called',o1:'Kill Line',o2:'Keel Line',o3:'Long Line',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0150',course:'DG',topic:'DG Imitations',q:'The best way to differentiate Mossainite from diamond is to look for?',o1:'Dispersion',o2:'Doubling',o3:'Inclusion',o4:'Girdle',ans:2,type:'MCQ'},
  {id:'QB0151',course:'CSG',topic:'CSG Introduction',q:'DR Biaxial gemstones may belong to',o1:'Trigonal system',o2:'Cubic system',o3:'Tetragonal system',o4:'Orthorhombic system',ans:4,type:'MCQ'},
  {id:'QB0152',course:'CSG',topic:'CSG Introduction',q:'Stability is a sub division of',o1:'Hardness',o2:'Toughness',o3:'Durability',o4:'Beauty',ans:3,type:'MCQ'},
  {id:'QB0153',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in mother of pearl is',o1:'Aventurescence',o2:'Adularescence',o3:'Orient',o4:'Play of color',ans:3,type:'MCQ'},
  {id:'QB0154',course:'CSG',topic:'CSG Instruments',q:'Uniaxial gemstones show __________ under the dichroscope.',o1:'2 colors',o2:'3 colors',o3:'1 color',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0155',course:'CSG',topic:'CSG Instruments',q:'Spot RI reading method is used to measure refractive index of',o1:'Faceted stones',o2:'Round stones',o3:'Colorless stones',o4:'Cabochon stones',ans:4,type:'MCQ'},
  {id:'QB0156',course:'CSG',topic:'CSG Introduction',q:'The Star effect is also known as',o1:'Aventurescence',o2:'Asterism',o3:'Chatoyancy',o4:'Cat’s eye',ans:2,type:'MCQ'},
  {id:'QB0157',course:'CSG',topic:'CSG Introduction',q:'Chatoyancy in gemstones is caused due to',o1:'parallel arrangement of needles',o2:'intersecting needles',o3:'crystal inclusions',o4:'metallic inclusions',ans:1,type:'MCQ'},
  {id:'QB0158',course:'CSG',topic:'CSG Introduction',q:'Hematite and Pyrite has',o1:'Vitreous luster',o2:'Adamantine luster',o3:'Metallic luster',o4:'Pearly luster',ans:3,type:'MCQ'},
  {id:'QB0159',course:'CSG',topic:'CSG Instruments',q:'The gemstone is said to be DR Biaxial',o1:'When both the readings are constant',o2:'When you see intersecting isogyres (cross-figurCSG',o3:'When you observe tri-chroism',o4:'When you see AGG effect',ans:3,type:'MCQ'},
  {id:'QB0160',course:'CSG',topic:'CSG Introduction',q:'Determining factor for Opal is',o1:'white color',o2:'grey color',o3:'play of color',o4:'orange color',ans:3,type:'MCQ'},
  {id:'QB0161',course:'CSG',topic:'CSG Instruments',q:'What effect do polycrystalline/microcrystalline gem stones show under polariscope?',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright dark effect',o4:'Spectral color',ans:2,type:'MCQ'},
  {id:'QB0162',course:'CSG',topic:'CSG Introduction',q:'Aventurescence is seen in',o1:'Moonstone',o2:'Sunstone',o3:'Labradorite',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0163',course:'CSG',topic:'CSG Introduction',q:'Opal belongs to _____________ Crystal system.',o1:'Monoclinic',o2:'Cubic',o3:'Tetragonal',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0164',course:'CSG',topic:'CSG Introduction',q:'____________ shows basal cleavage.',o1:'Tourmaline',o2:'Topaz',o3:'Apatite',o4:'Diamond',ans:2,type:'MCQ'},
  {id:'QB0165',course:'CSG',topic:'CSG Introduction',q:'One carat is equal to how many grams ?',o1:'1',o2:'0.5',o3:'0.25',o4:'0.2',ans:4,type:'MCQ'},
  {id:'QB0166',course:'CSG',topic:'CSG Instruments',q:'Gemstones which are SR can be identified by',o1:'Dichroism',o2:'Single reading on the refractometer',o3:'Uniaxial cross figure',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0167',course:'CSG',topic:'CSG Instruments',q:'Contact liquid is used while taking the refractive index of gemstones because,',o1:'It helps in taking reading',o2:'It provides optical contact between the gemstone and the hemi cylinder',o3:'It sets the limit of the refractometer',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0168',course:'CSG',topic:'CSG Instruments',q:'The rainbow colors seen when a gemstone is kept between the two filters of polariscope is known as',o1:'Interference colors',o2:'Interference figures',o3:'Bull’s eye',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0169',course:'CSG',topic:'CSG Introduction',q:'The Cat’s eye effect is also known as',o1:'Aventurescence',o2:'Labradorescence',o3:'Chatoyancy',o4:'Asterism',ans:3,type:'MCQ'},
  {id:'QB0170',course:'CSG',topic:'CSG Introduction',q:'Color-changing phenomena can be seen in',o1:'natural color-changing sapphire',o2:'synthetic color-changing sapphire',o3:'natural alexandrite',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0171',course:'CSG',topic:'CSG Instruments',q:'Refractometer can be used to',o1:'determine if a gemstone is SR or DR',o2:'determine the identity of the gemstone',o3:'determine the birefringence of the gemstone',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0172',course:'CSG',topic:'CSG Instruments',q:'Interference figure shown by quartz is',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:2,type:'MCQ'},
  {id:'QB0173',course:'CSG',topic:'CSG Corundum',q:'What is the chemical composition of Corundum ?',o1:'Aluminum beryllium silicate',o2:'Aluminum oxide',o3:'Aluminum silicate',o4:'Beryllium oxide',ans:2,type:'MCQ'},
  {id:'QB0174',course:'CSG',topic:'CSG Corundum',q:'A red variety of Corundum is called',o1:'Red sapphire',o2:'Ruby',o3:'Rubellite',o4:'Bixbite',ans:2,type:'MCQ'},
  {id:'QB0175',course:'CSG',topic:'CSG Corundum',q:'A pinkish orange variety of Corundum is called',o1:'Pink sapphire',o2:'Ruby',o3:'Padparadscha',o4:'Bixbite',ans:3,type:'MCQ'},
  {id:'QB0176',course:'CSG',topic:'CSG Corundum',q:'What is the coloring element of Ruby ?',o1:'Aluminum',o2:'Iron',o3:'Boron',o4:'Chromium',ans:4,type:'MCQ'},
  {id:'QB0177',course:'CSG',topic:'CSG Corundum',q:'The Burma rubies have',o1:'Short intersecting needles',o2:'Silk',o3:'Apatite crystals',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0178',course:'CSG',topic:'CSG Corundum',q:'Sapphires are available in',o1:'pink',o2:'blue',o3:'green',o4:'all of the above',ans:4,type:'MCQ'},
  {id:'QB0179',course:'CSG',topic:'CSG Corundum',q:'Typical inclusions in Thai Rubies is',o1:'short intersecting needle',o2:'long needles',o3:'boehmite needles',o4:'silk',ans:3,type:'MCQ'},
  {id:'QB0180',course:'CSG',topic:'CSG Corundum',q:'A Blue sapphire with long intersecting needles could be from',o1:'Burma',o2:'Thailand',o3:'Sri Lanka',o4:'Australia',ans:3,type:'MCQ'},
  {id:'QB0181',course:'CSG',topic:'CSG Corundum',q:'Best color for Ruby is',o1:'purplish red',o2:'reddish purple',o3:'pigeon blood red color',o4:'none of the above',ans:3,type:'MCQ'},
  {id:'QB0182',course:'CSG',topic:'CSG Beryl',q:'One of the important sources of emerald is',o1:'Colombia',o2:'Burma',o3:'Thailand',o4:'Sri Lanka',ans:1,type:'MCQ'},
  {id:'QB0183',course:'CSG',topic:'CSG Beryl',q:'The green color of emerald is due to the presence of',o1:'Titanium',o2:'Chromium',o3:'Aluminium',o4:'Beryllium',ans:2,type:'MCQ'},
  {id:'QB0184',course:'CSG',topic:'CSG Introduction',q:'The fracture seen glass is called',o1:'splintery',o2:'grainy',o3:'conchoidal',o4:'none of the above',ans:3,type:'MCQ'},
  {id:'QB0185',course:'CSG',topic:'CSG Corundum',q:'Best quality rubies are found from',o1:'Burma',o2:'Thailand',o3:'Madagascar',o4:'Sri Lanka',ans:1,type:'MCQ'},
  {id:'QB0186',course:'CSG',topic:'CSG Introduction',q:'What is the luster for CZ ?',o1:'Vitreous',o2:'Adamantine',o3:'Sub-adamantine',o4:'Waxy',ans:3,type:'MCQ'},
  {id:'QB0187',course:'CSG',topic:'CSG Beryl',q:'The aquamarine is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Quartz',o4:'Beryl',ans:4,type:'MCQ'},
  {id:'QB0188',course:'CSG',topic:'CSG Beryl',q:'Interference figure shown by Aquamarine is',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:1,type:'MCQ'},
  {id:'QB0189',course:'CSG',topic:'CSG Beryl',q:'Red variety of Beryl is',o1:'Morganite',o2:'Bixbite',o3:'Goshenite',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0190',course:'CSG',topic:'CSG Beryl',q:'What is the chemical composition of Beryl ?',o1:'Aluminum Beryllium Silicate',o2:'Aluminum Oxide',o3:'Beryllium Aluminum Silicate',o4:'Beryllium Oxide',ans:3,type:'MCQ'},
  {id:'QB0191',course:'CSG',topic:'CSG Instruments',q:'Under the polariscope, a SR gemstone would show',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright, dark effect',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0192',course:'CSG',topic:'CSG Instruments',q:'Natural inclusions are seen in',o1:'Natural Ruby',o2:'Synthetic Sapphire',o3:'Man made glass',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0193',course:'CSG',topic:'CSG Corundum',q:'The \\\'Corn flower blue\\\' term is associated with',o1:'Burmese sapphire',o2:'Srilankan sapphire',o3:'Kashmir sapphire',o4:'Australian sapphire',ans:3,type:'MCQ'},
  {id:'QB0194',course:'CSG',topic:'CSG Treatments',q:'What is the identifying feature of glass filled Rubies ?',o1:'Flux feathers',o2:'Healed fractures',o3:'Blue flashes from fracture',o4:'All of the above.',ans:3,type:'MCQ'},
  {id:'QB0195',course:'CSG',topic:'CSG Synthetics',q:'Which of the following is the characteristic of a synthetic gemstone ?',o1:'Needles',o2:'Trichites',o3:'Curved striations',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0196',course:'CSG',topic:'CSG Treatments',q:'A heat treated Ruby can show',o1:'Rounded crystals',o2:'Unaltered fingerprints',o3:'Intact needles',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0197',course:'CSG',topic:'CSG Synthetics',q:'A flame fusion sapphire may show',o1:'Curved striations',o2:'Crystals',o3:'Needles',o4:'Metallic inclusions',ans:1,type:'MCQ'},
  {id:'QB0198',course:'CSG',topic:'CSG Synthetics',q:'A synthetic ruby manufactured by flux method typically shows',o1:'Flux feathers',o2:'Crystal inclusions',o3:'Hexagonal growth structure',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0199',course:'CSG',topic:'CSG Synthetics',q:'Hydrothermal emeralds can show',o1:'Wave growth pattern',o2:'Gas bubbles',o3:'Silk',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0200',course:'CSG',topic:'CSG Synthetics',q:'Emeralds can be synthesized by',o1:'Flame fusion method',o2:'Czochralski method',o3:'Precipitation method',o4:'Flux method',ans:4,type:'MCQ'},
  {id:'QB0201',course:'CSG',topic:'CSG Synthetics',q:'Rubies can be synthesized by',o1:'Flame fusion method',o2:'Flux method',o3:'Hydrothermal method',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0202',course:'CSG',topic:'CSG Treatments',q:'A doublet/triplet can be identified by',o1:'Rounded crystals',o2:'Curved striations',o3:'Melted needles',o4:'No continuity of inclusions',ans:4,type:'MCQ'},
  {id:'QB0203',course:'CSG',topic:'CSG Treatments',q:'Treatments done on turquoise & lapis lazuli is',o1:'Oiling',o2:'Heating',o3:'Diffusion',o4:'Dyeing',ans:4,type:'MCQ'},
  {id:'QB0204',course:'CSG',topic:'CSG Group I',q:'Fluorite crystallizes in',o1:'Cubic system',o2:'Tetragonal system',o3:'Triclinic system',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0205',course:'CSG',topic:'CSG Group I',q:'The typical inclusion seen in Spinel is',o1:'Octahedral crystals',o2:'Hexagonal crystals',o3:'Rounded crystals',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0206',course:'CSG',topic:'CSG Group I',q:'Typical inclusion seen in hessonite garnet is',o1:'Gas bubbles',o2:'Rounded crystals',o3:'Treacle effect',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0207',course:'CSG',topic:'CSG Group I',q:'The main differentiating factor between Tsavorite Garnet and Hessonite Garnet is',o1:'Spectrum',o2:'RI',o3:'Color',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0208',course:'CSG',topic:'CSG Group I',q:'The typical inclusion seen in Demantoid Garnet is',o1:'Crystals',o2:'Horse tail like inclusion',o3:'Metallic inclusion',o4:'Treacle effect',ans:2,type:'MCQ'},
  {id:'QB0209',course:'CSG',topic:'CSG Introduction',q:'What is the luster for Zircon ?',o1:'Vitreous',o2:'Adamantine',o3:'Sub-adamantine',o4:'Waxy',ans:3,type:'MCQ'},
  {id:'QB0210',course:'CSG',topic:'CSG Introduction',q:'Star Diopside generally shows',o1:'Six rayed star',o2:'Four rayed star',o3:'Twelve rayed star',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0211',course:'CSG',topic:'CSG Group II',q:'The hardness of Quartz on the Mohs scale of hardness is',o1:'6',o2:'7',o3:'8',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0212',course:'CSG',topic:'CSG Synthetics',q:'Synthetic quartz is manufactured by',o1:'Flame fusion method',o2:'Flux method',o3:'Hydrothermal method',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0213',course:'CSG',topic:'CSG Group II',q:'Colorless quartz is called',o1:'Purple quartz',o2:'Amethyst',o3:'Citrine',o4:'Rock crystal',ans:4,type:'MCQ'},
  {id:'QB0214',course:'CSG',topic:'CSG Synthetics',q:'Skull melt method can be used to manufacture',o1:'Synthetic ruby',o2:'Synthetic sapphire',o3:'Synthetic spinel',o4:'Cubic zirconia',ans:4,type:'MCQ'},
  {id:'QB0215',course:'CSG',topic:'CSG Group II',q:'What is the Trade name given to Pink Tourmaline ?',o1:'Ruby',o2:'Rubellite',o3:'Imperial',o4:'Sherry',ans:2,type:'MCQ'},
  {id:'QB0216',course:'CSG',topic:'CSG Group II',q:'Differentiating factor between green tourmaline and green apatite is',o1:'Color',o2:'Birefringence',o3:'Pleochroism',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0217',course:'CSG',topic:'CSG Group I',q:'What is the confirmatory test for Synthetic Blue Spinel ?',o1:'SR nature',o2:'Chalky blue fluorescence',o3:'Chalky blue phosphorescence',o4:'1.728 RI',ans:2,type:'MCQ'},
  {id:'QB0218',course:'CSG',topic:'CSG Group I',q:'Rhodolite garnet is',o1:'Red',o2:'Brown',o3:'Purplish Red',o4:'Brownish Red',ans:3,type:'MCQ'},
  {id:'QB0219',course:'CSG',topic:'CSG Group II',q:'The tiger’s eye is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Quartz',o4:'Beryl',ans:3,type:'MCQ'},
  {id:'QB0220',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in goldstone is',o1:'Labradorescence',o2:'Adulerescence',o3:'Aventurescence',o4:'Fluorescence',ans:3,type:'MCQ'},
  {id:'QB0221',course:'CSG',topic:'CSG Group III',q:'The differentiating factor for iolite and amethyst is',o1:'Strong pleochroism',o2:'R.I.',o3:'Birefringence',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0222',course:'CSG',topic:'CSG Group I',q:'What is the characteristic inclusion in lapis lazuli ?',o1:'Pyrite',o2:'Cuprite',o3:'Apatite',o4:'Fluorite',ans:1,type:'MCQ'},
  {id:'QB0223',course:'CSG',topic:'CSG Introduction',q:'One of the factors which qualifies a mineral as a gemstone is',o1:'Chemical composition',o2:'Beauty',o3:'Specific gravity',o4:'Smoothness',ans:2,type:'MCQ'},
  {id:'QB0224',course:'CSG',topic:'CSG Group III',q:'Color changing variety of chrysoberyl is',o1:'Color changing chrysoCSG Beryl',o2:'Alexandrite',o3:'Color changing sapphire',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0225',course:'CSG',topic:'CSG Instruments',q:'The gemstone is said to be SR if',o1:'both the reading are not constant',o2:'the reading is single',o3:'there is no shadow line',o4:'none of  the above',ans:2,type:'MCQ'},
  {id:'QB0226',course:'CSG',topic:'CSG Instruments',q:'Line RI reading method is used to measure refractive index of',o1:'Faceted stones',o2:'Opaque stones',o3:'Carved stones',o4:'Cabochon stones',ans:1,type:'MCQ'},
  {id:'QB0227',course:'CSG',topic:'CSG Group I',q:'Spinel belong to ___________ Crystal system.',o1:'Monoclinic',o2:'Cubic',o3:'Tetragonal',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0228',course:'CSG',topic:'CSG Group I',q:'The Almandine garnets have',o1:'Rutile needles',o2:'Silk',o3:'Spinel crystals',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0229',course:'CSG',topic:'CSG Group I',q:'Spessartites are available in',o1:'Pink',o2:'Red',o3:'Orange',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0230',course:'CSG',topic:'CSG Corundum',q:'Typical inclusions seen in Sri Lankan sapphire is',o1:'short rutile needles',o2:'long rutile needles',o3:'silk',o4:'fingerprint inclusion',ans:2,type:'MCQ'},
  {id:'QB0231',course:'CSG',topic:'CSG Synthetics',q:'The crucibles used during flux growth process is made of',o1:'Aluminium',o2:'Copper',o3:'Brass',o4:'Platinum',ans:4,type:'MCQ'},
  {id:'QB0232',course:'CSG',topic:'CSG Synthetics',q:'A synthetic color changing sapphire may show',o1:'Curved striations',o2:'Crystals',o3:'Needles',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0233',course:'CSG',topic:'CSG Group II',q:'Purple colored quartz is called',o1:'Purple quartz',o2:'Amethyst',o3:'Citrine',o4:'Rock crystal',ans:2,type:'MCQ'},
  {id:'QB0234',course:'CSG',topic:'CSG Group II',q:'Tourmaline with red, white and green colors is called',o1:'Achroite',o2:'Verdilite',o3:'Rubellite',o4:'Water melon tourmaline',ans:4,type:'MCQ'},
  {id:'QB0235',course:'CSG',topic:'CSG Introduction',q:'DR Uniaxial gemstones belong to',o1:'Trigonal system',o2:'Hexagonal system',o3:'Tetragonal system',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0236',course:'CSG',topic:'CSG Group III',q:'Topaz hardness on Moh\\\'s scale is',o1:'3',o2:'6',o3:'8',o4:'5',ans:3,type:'MCQ'},
  {id:'QB0237',course:'CSG',topic:'CSG Introduction',q:'The optical phenomena seen in moonstone is',o1:'Aventurescence',o2:'Adulerescence',o3:'Orient',o4:'Play of color',ans:2,type:'MCQ'},
  {id:'QB0238',course:'CSG',topic:'CSG Instruments',q:'What effect do ADR stones show under polariscope ?',o1:'All dark effect',o2:'All bright effect',o3:'Alternate bright dark effect',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0239',course:'CSG',topic:'CSG Group II',q:'If a green colored gemstone shows dichroism it can be',o1:'Glass',o2:'Spinel',o3:'Tourmaline',o4:'Garnet',ans:3,type:'MCQ'},
  {id:'QB0240',course:'CSG',topic:'CSG Instruments',q:'The contact liquid usually has refractive index of',o1:'1.75',o2:'1.89',o3:'1.79',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0241',course:'CSG',topic:'CSG Group I',q:'Spinel crystals are typical inclusion seen in',o1:'Tourmaline',o2:'Ruby',o3:'Spinel',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0242',course:'CSG',topic:'CSG Group I',q:'The luster of Fluorite is',o1:'Vitreous',o2:'Waxy',o3:'Silky',o4:'Metallic',ans:2,type:'MCQ'},
  {id:'QB0243',course:'CSG',topic:'CSG Group I',q:'The species of Tsavorite Garnet and Hessonite Garnet is',o1:'Hydrogrossular',o2:'Grossularite',o3:'Pyrope',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0244',course:'CSG',topic:'CSG Group III',q:'The toughest gemstone is ______________',o1:'Ruby',o2:'Diamond',o3:'Nephrite',o4:'Lapis lazuli',ans:3,type:'MCQ'},
  {id:'QB0245',course:'CSG',topic:'CSG Group III',q:'Dark green light green Banded variety is known as ____________',o1:'Fluorite',o2:'Agate',o3:'Malachite',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0246',course:'CSG',topic:'CSG Group II',q:'The Indian name for rock crystal is',o1:'Manik',o2:'Moti',o3:'Spatik',o4:'Gomedh',ans:3,type:'MCQ'},
  {id:'QB0247',course:'CSG',topic:'CSG Group III',q:'The _____________ has a strong eye-visible pleochroism.',o1:'Iolite',o2:'Ruby',o3:'Sapphire',o4:'Topaz',ans:1,type:'MCQ'},
  {id:'QB0248',course:'CSG',topic:'CSG Corundum',q:'Corundum crystallizes in the ______________ system.',o1:'Cubic',o2:'Orthorhombic',o3:'Triclinic',o4:'Trigonal',ans:4,type:'MCQ'},
  {id:'QB0249',course:'CSG',topic:'CSG Organic',q:'Tahitian Pearls are ____________ in color.',o1:'White',o2:'Grey',o3:'Black',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0250',course:'CSG',topic:'CSG Organic',q:'Best form of Ivory is',o1:'Rhinos Horn',o2:'Walrus Teeth',o3:'Mountain Goat Horn',o4:'Elephant Tusk',ans:4,type:'MCQ'},
  {id:'QB0251',course:'CSG',topic:'CSG Treatments',q:'Gemstones are treated to',o1:'Improve color',o2:'Improve clarity',o3:'Change color',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0252',course:'CSG',topic:'CSG Treatments',q:'Which of the following Treatments cannot be carried on Emeralds ?',o1:'Oiling',o2:'Dyeing',o3:'Heat treatment',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0253',course:'CSG',topic:'CSG Introduction',q:'Aventurescence in gemstones is caused due to',o1:'parallel arrangement of needles',o2:'intersecting needles',o3:'crystal inclusions',o4:'Metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0254',course:'CSG',topic:'CSG Synthetics',q:'The synthetic Opal have',o1:'Zig-zag pattern',o2:'Gas bubbles',o3:'Snake- skin pattern',o4:'Flux Fingerprint',ans:3,type:'MCQ'},
  {id:'QB0255',course:'CSG',topic:'CSG Synthetics',q:'Which of the following identifies a synthetic gemstone ?',o1:'Needles',o2:'Healed fractures',o3:'Curved striations',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0256',course:'CSG',topic:'CSG Group I',q:'The best Lapis lazuli comes from',o1:'Baluchistan',o2:'Pakistan',o3:'Afghanistan',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0257',course:'CSG',topic:'CSG Group I',q:'Black variety of garnet is called',o1:'Rubellite',o2:'Melanite',o3:'Dolomite',o4:'Bixbite',ans:2,type:'MCQ'},
  {id:'QB0258',course:'CSG',topic:'CSG Group I',q:'Timur ruby is a ______________',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Ruby',o4:'Red Spinel',ans:4,type:'MCQ'},
  {id:'QB0259',course:'CSG',topic:'CSG Group II',q:'Typical inclusion seen in Amethyst is',o1:'Gas bubbles',o2:'Rounded crystals',o3:'Zebra stripe',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0260',course:'CSG',topic:'CSG Group I',q:'Which of the following is a simulants of Opal ?',o1:'Synthetic Opal',o2:'Opal Doublet',o3:'Slocum Stone',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0261',course:'CSG',topic:'CSG Group I',q:'Purplish variety of garnet is',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Spessartite garnet',o4:'Pyrope garnet',ans:1,type:'MCQ'},
  {id:'QB0262',course:'CSG',topic:'CSG Group II',q:'What is the characteristic feature of a Tourmaline?',o1:'Trichites',o2:'Fractures',o3:'Curved striations',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0263',course:'CSG',topic:'CSG Group II',q:'Black tourmaline is called',o1:'Dravite',o2:'Schrol',o3:'Melanite',o4:'Hessonite',ans:2,type:'MCQ'},
  {id:'QB0264',course:'CSG',topic:'CSG Group I',q:'Moldavite is a species of',o1:'Natural glass',o2:'Manmade glass',o3:'Colored glass',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0265',course:'CSG',topic:'CSG Introduction',q:'Three set of intersecting needles can cause a ____________ star.',o1:'4 rayed',o2:'6 rayed',o3:'8 rayed',o4:'9 rayed',ans:2,type:'MCQ'},
  {id:'QB0266',course:'CSG',topic:'CSG Group II',q:'Tourmaline sometimes show ____________ as optical phenomena.',o1:'Asterism',o2:'Chatoyancy',o3:'Color change',o4:'All of the above',ans:2,type:'MCQ'},
  {id:'QB0267',course:'CSG',topic:'CSG Group II',q:'Banded variety of quartz is known as',o1:'Chalcedony',o2:'Agate',o3:'Citrine',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0268',course:'CSG',topic:'CSG Group II',q:'The hardness of Apatite is',o1:'5',o2:'6',o3:'7',o4:'8',ans:1,type:'MCQ'},
  {id:'QB0269',course:'CSG',topic:'CSG Synthetics',q:'What is the identifying factor of a synthetic sapphire ?',o1:'Crystals',o2:'Fingerprints',o3:'Curved striations',o4:'Tension halo',ans:3,type:'MCQ'},
  {id:'QB0270',course:'CSG',topic:'CSG Beryl',q:'The typical inclusion seen in Austrian emerald is',o1:'tremolite fibres',o2:'actinolite stalks',o3:'jagged 3 phase',o4:'none of the above',ans:2,type:'MCQ'},
  {id:'QB0271',course:'CSG',topic:'CSG Instruments',q:'A gemstone is said to be uniaxial if',o1:'It is dichroic',o2:'Two readings under the refractometer',o3:'Shows alternate light dark effect',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0272',course:'CSG',topic:'CSG Instruments',q:'Natural inclusions are seen in a',o1:'Natural gemstones',o2:'Treated gemstones',o3:'Assembled stones',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0273',course:'CSG',topic:'CSG Corundum',q:'Padparadscha is _______________ colored sapphire.',o1:'Pink',o2:'Orange',o3:'Orangy Pink',o4:'Purple',ans:3,type:'MCQ'},
  {id:'QB0274',course:'CSG',topic:'CSG Instruments',q:'Interference figure shown by biaxial stones',o1:'Uniaxial cross figure',o2:'Bull’s eye',o3:'Moustache effect',o4:'Interference figure',ans:3,type:'MCQ'},
  {id:'QB0275',course:'CSG',topic:'CSG Beryl',q:'What is the main identifying feature of Colombian emerald ?',o1:'Rounded crystals',o2:'Tension halo',o3:'Gas bubble',o4:'Three phase inclusions',ans:4,type:'MCQ'},
  {id:'QB0276',course:'CSG',topic:'CSG Introduction',q:'Optical Phenomenon seen in Ruby is',o1:'Asterism',o2:'Chatoyancy',o3:'Play of color',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0277',course:'CSG',topic:'CSG Introduction',q:'Optical Phenomenon seen in Sunstone is',o1:'Adulerescence',o2:'Aventurescence',o3:'Iridescence',o4:'Play of color',ans:2,type:'MCQ'},
  {id:'QB0278',course:'CSG',topic:'CSG Beryl',q:'Tremolite fibres are typical inclusions seen in ___________ emeralds',o1:'Colombian',o2:'Russian',o3:'Zimbabwe',o4:'Brazil',ans:3,type:'MCQ'},
  {id:'QB0279',course:'CSG',topic:'CSG Instruments',q:'Polariscope cannot be used to test',o1:'Opaque stones',o2:'Red stones',o3:'Yellow stones',o4:'Colorless stones',ans:2,type:'MCQ'},
  {id:'QB0280',course:'CSG',topic:'CSG Corundum',q:'Which of the following gemstones show strong fluorescence?',o1:'Almandite garnet',o2:'Rhodolite garnet',o3:'Ruby',o4:'Rubellite',ans:3,type:'MCQ'},
  {id:'QB0281',course:'CSG',topic:'CSG Corundum',q:'What is main colouring element for Yellow Sapphire?',o1:'Copper',o2:'Manganese',o3:'Iron',o4:'Chromium',ans:3,type:'MCQ'},
  {id:'QB0282',course:'CSG',topic:'CSG Group II',q:'Apatite can be differentiated from Tourmaline by its',o1:'RI',o2:'Pleochroism',o3:'Birefringence',o4:'All of the above',ans:3,type:'MCQ'},
  {id:'QB0283',course:'CSG',topic:'CSG Group I',q:'Uvarovite is a __________________colored garnet.',o1:'Red',o2:'Yellow',o3:'Orange',o4:'Green',ans:4,type:'MCQ'},
  {id:'QB0284',course:'CSG',topic:'CSG Group I',q:'Obsidian is ________________',o1:'Natural glass',o2:'Manmade glass',o3:'Quartz',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0285',course:'CSG',topic:'CSG Group III',q:'The sunstone is a variety of',o1:'Garnet',o2:'Tourmaline',o3:'Feldspar',o4:'Beryl',ans:3,type:'MCQ'},
  {id:'QB0286',course:'CSG',topic:'CSG Group III',q:'_____________ is also known for its strong pleochroism.',o1:'Goshenite',o2:'Indicolite',o3:'Aquamarine',o4:'Tanzanite',ans:4,type:'MCQ'},
  {id:'QB0287',course:'CSG',topic:'CSG Group III',q:'Pink colored Spodumene is called',o1:'Pink Spodumene',o2:'Morganite',o3:'Kunzite',o4:'Hiddenite',ans:3,type:'MCQ'},
  {id:'QB0288',course:'CSG',topic:'CSG Group III',q:'Typical color of Peridot is',o1:'Greenish blue',o2:'Orangy red',o3:'Yellowish green',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0289',course:'CSG',topic:'CSG Group II',q:'Zircon can be identified by',o1:'doubling of back facets',o2:'toughness',o3:'polish',o4:'hardness',ans:1,type:'MCQ'},
  {id:'QB0290',course:'CSG',topic:'CSG Group III',q:'Malachite is identified by its',o1:'Typical green color',o2:'Bandings',o3:'Opaque nature',o4:'All of the above',ans:4,type:'MCQ'},
  {id:'QB0291',course:'CSG',topic:'CSG Group III',q:'The typical inclusion seen in Peridot',o1:'Trichites',o2:'Lily pad like',o3:'Two immiscible liquids',o4:'Two phase',ans:2,type:'MCQ'},
  {id:'QB0292',course:'CSG',topic:'CSG Group III',q:'The luster seen in turquoise is',o1:'Waxy',o2:'Vitreous',o3:'Metallic',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0293',course:'CSG',topic:'CSG Group III',q:'The differentiating factor for iolite and amethyst',o1:'Strong pleochroism',o2:'R.I.',o3:'Birefringence',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0294',course:'CSG',topic:'CSG Group III',q:'Violetish blue variety of zoisite is called',o1:'Thulite',o2:'Anyolite',o3:'Tanzanite',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0295',course:'CSG',topic:'CSG Organic',q:'Coral and Amber are classified as',o1:'Organic Gems',o2:'Minerals',o3:'Amorphous',o4:'All of the above',ans:1,type:'MCQ'},
  {id:'QB0296',course:'CSG',topic:'CSG Organic',q:'Jet is even considered as',o1:'Hematite',o2:'Hematine',o3:'Black Onyx',o4:'None of the above',ans:4,type:'MCQ'},
  {id:'QB0297',course:'CSG',topic:'CSG Organic',q:'Which turtle shell comes under Organic gem material ?',o1:'Star',o2:'Hawksbill',o3:'Great John',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0298',course:'CSG',topic:'CSG Organic',q:'First country to come up with Pearl Culturing process is',o1:'Japan',o2:'Australia',o3:'China',o4:'India',ans:2,type:'MCQ'},
  {id:'QB0299',course:'CSG',topic:'CSG Organic',q:'Irridesence seen on Mother of Pearl is called',o1:'Iris effect',o2:'Inteference Colors',o3:'Orient',o4:'Rainbow',ans:3,type:'MCQ'},
  {id:'QB0300',course:'CSG',topic:'CSG Organic',q:'Younger version of Amber is called',o1:'Copal',o2:'Cobalt',o3:'Android',o4:'Ambroid',ans:1,type:'MCQ'},
  {id:'QB0301',course:'DG',topic:'PDG',q:'The elongated culet seen in Emerald Cut diamonds is called',o1:'Kill Line',o2:'Keel Line',o3:'Long Line',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0302',course:'DG',topic:'PDG',q:'The best way to differentiate Mossainite from diamond is to look for?',o1:'Dispersion',o2:'Doubling',o3:'Inclusion',o4:'Girdle',ans:2,type:'MCQ'},
  {id:'QB0303',course:'DG',topic:'PDG',q:'Crown Angle is the angle formed by the Girdle Plane and the',o1:'Bezel facets',o2:'Upper Girdle facets',o3:'Lower Girdle Facets',o4:'Star Facets',ans:1,type:'MCQ'},
  {id:'QB0304',course:'DG',topic:'PDG',q:'The official document required to calculate or appraise the prize of the diamond is called',o1:'Diamond Price Report',o2:'Rapaport',o3:'Pricing Chart',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0305',course:'DG',topic:'PDG',q:'What is a good synonym for ‘simulant’?',o1:'Equal value',o2:'Variation',o3:'Synthetic',o4:'Imitation',ans:4,type:'MCQ'},
  {id:'QB0306',course:'DG',topic:'PDG',q:'Why are some diamonds treated with HPHT treatment?',o1:'To improve the clarity',o2:'To remove inclusions',o3:'To improve the toughness',o4:'To alter the color',ans:4,type:'MCQ'},
  {id:'QB0307',course:'DG',topic:'PDG',q:'Green Color in a diamond due to',o1:'Boron',o2:'Structural Irregularities',o3:'Irradiation',o4:'Nitrogen',ans:3,type:'MCQ'},
  {id:'QB0308',course:'DG',topic:'PDG',q:'Which of the following inclusions is never present in natural diamond?',o1:'Diamond inclusions',o2:'Crystal',o3:'irregular growth lines',o4:'metallic inclusions',ans:4,type:'MCQ'},
  {id:'QB0309',course:'DG',topic:'PDG',q:'What is the correct name for a Natural Yellow diamond with a brown tinge?',o1:'Natural Fancy brownish yellow',o2:'Fancy brownish yellow',o3:'Natural Fancy yellowish brown',o4:'Fancy yellowish brown',ans:1,type:'MCQ'},
  {id:'QB0310',course:'DG',topic:'PDG',q:'Which of the following faults is not judged for polish?',o1:'Burn marks',o2:'Scratches',o3:'Nick',o4:'Wavy girdle',ans:4,type:'MCQ'},
  {id:'QB0311',course:'DG',topic:'PDG',q:'Burn Marks & Abraded Culet are considered in _____________ grade.',o1:'Clarity',o2:'Cut',o3:'Polish',o4:'Symmetry',ans:3,type:'MCQ'},
  {id:'QB0312',course:'DG',topic:'PDG',q:'What causes the “fish eye” effect in diamonds?',o1:'Shallow pavilion',o2:'Shallow crown',o3:'Very thin girdle',o4:'Small table',ans:1,type:'MCQ'},
  {id:'QB0313',course:'DG',topic:'PDG',q:'How do you call the central part of a heart and pear?',o1:'Shoulder',o2:'Head',o3:'Belly',o4:'Wing',ans:3,type:'MCQ'},
  {id:'QB0314',course:'DG',topic:'PDG',q:'What is the correct way to give the weight of a 1.2981 ct diamond?',o1:'1.298 ct',o2:'1.29 ct',o3:'1.30 ct',o4:'1.3 ct',ans:2,type:'MCQ'},
  {id:'QB0315',course:'DG',topic:'PDG',q:'First company to synthetise diamond was',o1:'A.S.E.A.',o2:'General Electric',o3:'Russian BARS',o4:'Apollo Diamonds',ans:2,type:'MCQ'},
  {id:'QB0316',course:'DG',topic:'PDG',q:'If the inclusions in the stone are somewhat easy to locate with 10x, the Clarity grade is?',o1:'VS1',o2:'VS2',o3:'SI1',o4:'SI2',ans:2,type:'MCQ'},
  {id:'QB0317',course:'DG',topic:'PDG',q:'The main purpose of plotting is',o1:'Grading',o2:'Clarity Grading',o3:'Certification',o4:'Identification of inclusion',ans:4,type:'MCQ'},
  {id:'QB0318',course:'DG',topic:'PDG',q:'During V.E, if your diamond looks slightly colored from Pavilion and colorless from Crown, your diamond is in the ______________ color range.',o1:'D EF',o2:'GH IJ',o3:'KLM',o4:'N - Z',ans:2,type:'MCQ'},
  {id:'QB0319',course:'DG',topic:'PDG',q:'Reflections are considered in _________grading (face up).',o1:'Plotting',o2:'Color',o3:'Fluorescence',o4:'Clarity',ans:4,type:'MCQ'},
  {id:'QB0320',course:'DG',topic:'PDG',q:'Which is the most commonly available color in a diamond?',o1:'Yellow',o2:'Brown',o3:'Green',o4:'Orange',ans:1,type:'MCQ'},
  {id:'QB0321',course:'DG',topic:'PDG',q:'___________ is considered 100% of a Round shape diamond.',o1:'The average girdle diameter',o2:'The lowest girdle diameter',o3:'The highest girdle diameter',o4:'The height',ans:1,type:'MCQ'},
  {id:'QB0322',course:'DG',topic:'PDG',q:'Any kind of ____________characteristic is known as a Blemish.',o1:'External',o2:'Internal',o3:'Surficial',o4:'Bodily',ans:3,type:'MCQ'},
  {id:'QB0323',course:'DG',topic:'PDG',q:'Boron is the reson behind __________ color in diamond.',o1:'Yellow',o2:'Blue',o3:'Green',o4:'Brown',ans:2,type:'MCQ'},
  {id:'QB0324',course:'DG',topic:'PDG',q:'Bearded Girdle is the result of',o1:'Manufacturing process',o2:'Wear and Tear',o3:'Impact when a stone is dropped',o4:'Constant friction from the tweezer',ans:1,type:'MCQ'},
  {id:'QB0325',course:'DG',topic:'PDG',q:'Why are fracture-fillings not accepted in diamond trade?',o1:'They don’t improve the clarity',o2:'The treatment can damage certain types of diamond',o3:'They are not stable',o4:'The color becomes worse after some time',ans:3,type:'MCQ'},
  {id:'QB0326',course:'DG',topic:'RDG',q:'Diamond is a crystalline for of a',o1:'Nitrogen & Hydrogen',o2:'Carbon & Oxygen',o3:'Carbon',o4:'Silicon Oxide',ans:3,type:'MCQ'},
  {id:'QB0327',course:'DG',topic:'RDG',q:'The lustre of diamond is',o1:'Metallic',o2:'Waxy',o3:'Adamantine',o4:'Vitreous',ans:3,type:'MCQ'},
  {id:'QB0328',course:'DG',topic:'RDG',q:'Hardness of Diamond is',o1:'9',o2:'9.5',o3:'10',o4:'10.5',ans:3,type:'MCQ'},
  {id:'QB0329',course:'DG',topic:'RDG',q:'Macle is an example of',o1:'Penetration twin',o2:'Regular twin',o3:'Contact twin',o4:'Aggregate',ans:3,type:'MCQ'},
  {id:'QB0330',course:'DG',topic:'RDG',q:'In the 1st century A.D. diamond was defined by a term _______ that had a meaning very close to unconquerable.',o1:'Adamantine',o2:'Adamas',o3:'Adamanas',o4:'Amadas',ans:2,type:'MCQ'},
  {id:'QB0331',course:'DG',topic:'RDG',q:'Which following category of rough diamonds is the most desired?',o1:'SW1',o2:'MK1',o3:'SPT1',o4:'CL1',ans:1,type:'MCQ'},
  {id:'QB0332',course:'DG',topic:'RDG',q:'Makeable1 category diamonds are',o1:'Clean and slightly distorted in shape',o2:'Only clean',o3:'Clean and perfect in shape',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0333',course:'DG',topic:'RDG',q:'Where can we find the trigons on a diamond?',o1:'On the dodecahedral planes',o2:'On the cubic planes',o3:'On the octahedral planes',o4:'On the tetrahedral planes',ans:3,type:'MCQ'},
  {id:'QB0334',course:'DG',topic:'RDG',q:'Coated Diamonds are',o1:'Semi transparent',o2:'Opaque',o3:'Translucent',o4:'Semi translucent',ans:2,type:'MCQ'},
  {id:'QB0335',course:'DG',topic:'RDG',q:'Who is the largest diamond producer outside Africa?',o1:'Australia',o2:'Russia',o3:'Canada',o4:'U.S.A.',ans:2,type:'MCQ'},
  {id:'QB0336',course:'DG',topic:'RDG',q:'Host rocks containing diamonds are',o1:'Kimberlite',o2:'Lamprorite',o3:'All of the above',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0337',course:'DG',topic:'RDG',q:'A member who gets regular supply of rough from the mining company is also called as a',o1:'DTC',o2:'Sight Holders',o3:'Central Selling Organization',o4:'None of the above',ans:2,type:'MCQ'},
  {id:'QB0338',course:'DG',topic:'RDG',q:'What is the translation for ‘Koh-i-Noor’?',o1:'The unbreakable stone',o2:'The great blue diamond',o3:'Sun of the sea',o4:'Mountain of light',ans:4,type:'MCQ'},
  {id:'QB0339',course:'DG',topic:'RDG',q:'Which of the following mines is not in South Africa?',o1:'The Finch mine',o2:'The Premier mine',o3:'The Koffiefontein mine',o4:'The Ekati mine',ans:4,type:'MCQ'},
  {id:'QB0340',course:'DG',topic:'RDG',q:'A Octahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:1,type:'MCQ'},
  {id:'QB0341',course:'DG',topic:'RDG',q:'What do we call an mix parcel of rough diamonds coming directly from the mine?',o1:'A fresh parcel',o2:'A run of mine',o3:'A random parcel',o4:'A rough parcel',ans:2,type:'MCQ'},
  {id:'QB0342',course:'DG',topic:'RDG',q:'A dodecahedron shows',o1:'Triangle shaped faces.',o2:'Square shaped faces.',o3:'Kite shaped faces.',o4:'Rectangle shaped faces.',ans:3,type:'MCQ'},
  {id:'QB0343',course:'DG',topic:'RDG',q:'The diamonds originating from War Zones / Third World Countries are called',o1:'Coated diamonds',o2:'Conflict diamonds',o3:'Frosted diamonds',o4:'Irradiated diamonds',ans:2,type:'MCQ'},
  {id:'QB0344',course:'DG',topic:'RDG',q:'Full form of DTC is',o1:'Diamond Transaction Commision',o2:'Diamond Transit Company',o3:'Diamond Trading Company',o4:'None of the above',ans:3,type:'MCQ'},
  {id:'QB0345',course:'DG',topic:'RDG',q:'The document required to certify the shipment of rough diamonds as legal tender is called',o1:'Origin Report',o2:'KP Certificate',o3:'Approval Memo',o4:'GST Invoice',ans:2,type:'MCQ'},
  {id:'QB0346',course:'DG',topic:'SDA',q:'Melee includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:1,type:'MCQ'},
  {id:'QB0347',course:'DG',topic:'SDA',q:'Which is the best tweezer to hold star & melee size diamonds?',o1:'S Tip',o2:'F Tip',o3:'L Tip',o4:'M Tip',ans:2,type:'MCQ'},
  {id:'QB0348',course:'DG',topic:'SDA',q:'+11 include sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:4,type:'MCQ'},
  {id:'QB0349',course:'DG',topic:'SDA',q:'The most premium grade given to Diamond Studded jewelry is',o1:'IF D',o2:'VVS EF',o3:'IF DEF',o4:'VVS DEF',ans:2,type:'MCQ'},
  {id:'QB0350',course:'DG',topic:'SDA',q:'Star includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:2,type:'MCQ'},
  {id:'QB0351',course:'DG',topic:'SDA',q:'What is the average diameter in mm of a 1 ct diamond?',o1:'6.4 mm',o2:'6.5 mm',o3:'6.6 mm',o4:'6.7 mm',ans:2,type:'MCQ'},
  {id:'QB0352',course:'DG',topic:'SDA',q:'Approx diameter of 0.10ct diamond would be?',o1:'1 mm',o2:'2 mm',o3:'3 mm',o4:'4 mm',ans:3,type:'MCQ'},
  {id:'QB0353',course:'DG',topic:'SDA',q:'-2 sieve includes sizes from',o1:'0.03ct – 0.07ct',o2:'0.01ct - 0.02ct',o3:'Less than 0.01ct',o4:'0.08ct – 0.12ct',ans:3,type:'MCQ'},
  {id:'QB0354',course:'DG',topic:'SDA',q:'The instrument required to lift the diamonds from sorting pad is called',o1:'Scoop',o2:'Lifter',o3:'Filler',o4:'None of the above',ans:1,type:'MCQ'},
  {id:'QB0355',course:'DG',topic:'SDA',q:'The numbering system used in sizing the small diamonds is called',o1:'Diameter',o2:'Carat & Cents',o3:'mm size',o4:'Sieve Size',ans:4,type:'MCQ'},
  {id:'QB0356',course:'JP',topic:'Week 1 MCQ',q:'Which app is used for gemstone rendering in this course?',o1:'Photoshop',o2:'Procreate',o3:'Illustrator',o4:'CorelDRAW',ans:2,type:'MCQ'},
  {id:'QB0357',course:'JP',topic:'Week 1 MCQ',q:'Which tool is mainly used to resize and rotate objects in Procreate?',o1:'Brush Tool',o2:'Arrow Tool',o3:'Smudge Tool',o4:'Eraser Tool',ans:2,type:'MCQ'},
  {id:'QB0358',course:'JP',topic:'Week 1 MCQ',q:'Which visual effect is essential when rendering a Star Sapphire?',o1:'Texture dots',o2:'Matte finish',o3:'Star-shaped light reflection',o4:'Flat shading',ans:3,type:'MCQ'},
  {id:'QB0359',course:'JP',topic:'Week 1 MCQ',q:'Which brush setting is most important for controlling diamond spacing?',o1:'Stroke path',o2:'Opacity',o3:'Eraser',o4:'Gaussian Blur',ans:1,type:'MCQ'},
  {id:'QB0360',course:'JP',topic:'Week 1 MCQ',q:'How do you fill a color inside a closed shape in Procreate using the Colour Picker?',o1:'Tap the brush repeatedly inside the shape',o2:'Use the Smudge tool',o3:'Drag and drop the selected color into the shape',o4:'Adjust the opacity of the layer',ans:3,type:'MCQ'},
  {id:'QB0361',course:'JP',topic:'Week 1 MCQ',q:'What are facets in a diamond?',o1:'The color of the diamond',o2:'The weight of the diamond',o3:'The surfaces cut on the diamond',o4:'The price of the diamond',ans:3,type:'MCQ'},
  {id:'QB0362',course:'JP',topic:'Week 1 MCQ',q:'What is Procreate primarily used for?',o1:'Video Editing',o2:'Digital Illustration and Design',o3:'3D Modeling',o4:'Animation Only',ans:2,type:'MCQ'},
  {id:'QB0363',course:'JP',topic:'Week 1 MCQ',q:'Which tool in Procreate allows you to organize artwork into editable sections?',o1:'Layers',o2:'Color Wheel',o3:'Gallery',o4:'Actions',ans:1,type:'MCQ'},
  {id:'QB0364',course:'JP',topic:'Week 1 MCQ',q:'A cabochon gemstone is characterized by:',o1:'Multiple facets',o2:'Smooth, rounded surface',o3:'Flat top and faceted bottom',o4:'Square shape only',ans:2,type:'MCQ'},
  {id:'QB0365',course:'JP',topic:'Week 1 MCQ',q:'What is the purpose of the Brush Library?',o1:'To store images',o2:'To select and customize drawing brushes',o3:'To create layers',o4:'To export files',ans:2,type:'MCQ'},
  {id:'QB0366',course:'JP',topic:'Week 2 MCQ',q:'Which brush type is used to create perforated or patterned jewelry bases?',o1:'Diamond brush',o2:'Lattice brush',o3:'Smudge brush',o4:'Calligraphy brush',ans:2,type:'MCQ'},
  {id:'QB0367',course:'JP',topic:'Week 2 MCQ',q:'What is the main idea of a pave setting?',o1:'One big stone',o2:'Many small stones set close together',o3:'Flat metal only',o4:'Rough surface',ans:2,type:'MCQ'},
  {id:'QB0368',course:'JP',topic:'Week 2 MCQ',q:'Flat band rings cannot be rendered using isometric views.',o1:'True',o2:'False',o3:'Not applicable',o4:'Not applicable',ans:1,type:'MCQ'},
  {id:'QB0369',course:'JP',topic:'Week 2 MCQ',q:'Tapered flat band rings are:',o1:'The same width all around',o2:'Broken',o3:'Twisted',o4:'Narrower at one end and wider at another',ans:4,type:'MCQ'},
  {id:'QB0370',course:'JP',topic:'Week 2 MCQ',q:'Lattice brushes in jewelry design are used to:',o1:'Create perforated or patterned surfaces',o2:'Color gemstones',o3:'Shade metal only',o4:'Erase mistakes',ans:1,type:'MCQ'},
  {id:'QB0371',course:'JP',topic:'Week 2 MCQ',q:'Which jewelry setting holds a gemstone using small metal claws?',o1:'Bezel setting',o2:'Prong setting',o3:'Channel setting',o4:'Flush setting',ans:2,type:'MCQ'},
  {id:'QB0372',course:'JP',topic:'Week 2 MCQ',q:'Masking in Procreate helps designers to:',o1:'Delete layers permanently',o2:'Change canvas size',o3:'Control where lattice patterns appear',o4:'Rotate designs',ans:3,type:'MCQ'},
  {id:'QB0373',course:'JP',topic:'Week 2 MCQ',q:'Motif brushes are mainly used to:',o1:'Create repeating decorative elements',o2:'Draw straight lines',o3:'Color gemstones',o4:'Add shading only',ans:1,type:'MCQ'},
  {id:'QB0374',course:'JP',topic:'Week 2 MCQ',q:'In engagement ring illustration, why is proper proportion important?',o1:'It reduces file size',o2:'It ensures the ring looks realistic and balanced',o3:'It helps export images faster',o4:'It removes the need for shading',ans:2,type:'MCQ'},
  {id:'QB0375',course:'JP',topic:'Week 2 MCQ',q:'In the engagement ring design workflow in Procreate, which step should be completed before starting the final rendering stage?',o1:'Exporting the final design file',o2:'Applying final presentation layout',o3:'Creating the base ring structure',o4:'Merging all layers and flattening the artwork',ans:3,type:'MCQ'},
  {id:'QB0376',course:'JP',topic:'Week 3 MCQ',q:'Chain brushes in Procreate are used to design:',o1:'Gemstones',o2:'Background patterns',o3:'Necklaces, bracelets, and charms',o4:'Rings',ans:3,type:'MCQ'},
  {id:'QB0377',course:'JP',topic:'Week 3 MCQ',q:'What is important to keep in mind when designing textured brushes?',o1:'Symmetry and repeat accuracy',o2:'Random spacing',o3:'Only brush size',o4:'Erasing layers',ans:1,type:'MCQ'},
  {id:'QB0378',course:'JP',topic:'Week 3 MCQ',q:'What kind of settings are used for uncut stones?',o1:'Open prong settings only',o2:'Pave settings',o3:'Closed bezel settings',o4:'Micro prong setting',ans:3,type:'MCQ'},
  {id:'QB0379',course:'JP',topic:'Week 3 MCQ',q:'What does a clipping mask do in Procreate?',o1:'Paints everywhere on the canvas',o2:'Erases all layers',o3:'Shows paint only inside the shape on the layer below',o4:'Changes the brush size',ans:3,type:'MCQ'},
  {id:'QB0380',course:'JP',topic:'Week 3 MCQ',q:'Opacity in Procreate controls the transparency of a layer.',o1:'True',o2:'False',o3:'Not applicable',o4:'Not applicable',ans:1,type:'MCQ'},
  {id:'QB0381',course:'JP',topic:'Week 3 MCQ',q:'Textured brushes are commonly used in jewelry illustration to create:',o1:'Background colors only',o2:'Jewelry surface detailing',o3:'Gemstone cuts',o4:'Animation effects',ans:2,type:'MCQ'},
  {id:'QB0382',course:'JP',topic:'Week 3 MCQ',q:'Chain brushes are commonly applied when illustrating:',o1:'Necklaces, charms, and back chains',o2:'Earrings only',o3:'Jewelry packaging',o4:'Gemstone reflections',ans:1,type:'MCQ'},
  {id:'QB0383',course:'JP',topic:'Week 3 MCQ',q:'Polki and Kundan jewelry are known for using:',o1:'Perfectly cut diamonds',o2:'Uncut natural diamonds and gemstones',o3:'Synthetic gemstones only',o4:'Colored glass stones',ans:2,type:'MCQ'},
  {id:'QB0384',course:'JP',topic:'Week 3 MCQ',q:'Which setting style is traditionally used in Polki jewelry?',o1:'Prong setting',o2:'Invisible setting',o3:'Closed bezel setting',o4:'Tension setting',ans:3,type:'MCQ'},
  {id:'QB0385',course:'JP',topic:'Week 3 MCQ',q:'Temple jewelry designs are often inspired by:',o1:'Modern architecture',o2:'Indian heritage of god/goddess idols and cultural motifs',o3:'Minimalist geometric patterns',o4:'Abstract digital art',ans:2,type:'MCQ'},
];

// ════════════════════════════════════════════════════════════════
// BADGES, RANKS & HONOURS — Version 3 additions
// ════════════════════════════════════════════════════════════════

function otCalculateBadge(percentage, passingScore) {
  var ps = passingScore || OT_PASS_PERCENT;
  if (percentage >= 95) return {name:'Diamond Distinction', icon:'💎', tier:'diamond', color:'#0D1B2E'};
  if (percentage >= 85) return {name:'Sapphire Excellence', icon:'🔵', tier:'sapphire', color:'#1a4b8c'};
  if (percentage >= 75) return {name:'Emerald Achievement', icon:'🟢', tier:'emerald', color:'#065f46'};
  if (percentage >= 65) return {name:'Ruby Scholar',        icon:'🔴', tier:'ruby',    color:'#991b1b'};
  if (percentage >= ps)  return {name:'Certified Pass',     icon:'✨', tier:'pass',    color:'#92400e'};
  return                        {name:'Needs Improvement',  icon:'📚', tier:'fail',    color:'#6b7280'};
}

function otGetCumulativeHonour(weeklyAvg, finalResults, passingScore) {
  var ps = passingScore || OT_PASS_PERCENT;
  // Final exam score is definitive
  if (finalResults && finalResults.length > 0) {
    var bestFinal = finalResults.reduce(function(m,r){ return Math.max(m, parseFloat(r.percentage)||0); }, 0);
    if (bestFinal >= 90) return {title:'Graduate Gemologist', icon:'🏆', color:'#C9A84C'};
    if (bestFinal >= 80) return {title:'Diamond Graduate',    icon:'💎', color:'#0D1B2E'};
    if (bestFinal >= 70) return {title:'Sapphire Graduate',   icon:'🔵', color:'#1a4b8c'};
    if (bestFinal >= ps)  return {title:'Certified Graduate', icon:'🟢', color:'#065f46'};
    return                       {title:'Supplementary Required', icon:'❌', color:'#dc2626'};
  }
  // Interim: weekly average
  if (weeklyAvg !== null && weeklyAvg !== undefined) {
    if (weeklyAvg >= 90) return {title:'Graduate Gemologist (Interim)', icon:'🏆', color:'#C9A84C'};
    if (weeklyAvg >= 80) return {title:'Diamond Graduate (Interim)',    icon:'💎', color:'#0D1B2E'};
    if (weeklyAvg >= 70) return {title:'Sapphire Graduate (Interim)',   icon:'🔵', color:'#1a4b8c'};
    if (weeklyAvg >= ps)  return {title:'Certified Graduate (Interim)', icon:'🟢', color:'#065f46'};
    return                       {title:'Supplementary Required',       icon:'❌', color:'#dc2626'};
  }
  return null;
}

function otGetSpecialBadges(weeklyResults, finalResults, allResults) {
  var specials = [];
  // Perfect Stone — 100% on any test
  if (allResults.some(function(r){ return parseFloat(r.percentage)>=100; }))
    specials.push({name:'Perfect Stone', icon:'🎯', desc:'Scored 100% on a test'});
  // Hat Trick — passed all 3 weekly tests
  if (weeklyResults.length>=3 && weeklyResults.every(function(r){ return r.result==='Pass'; }))
    specials.push({name:'Hat Trick', icon:'🎩', desc:'Passed all 3 weekly tests'});
  // Rising Star — score improved each week (need at least 2)
  if (weeklyResults.length>=2) {
    var rising=true;
    for (var i=1;i<weeklyResults.length;i++) {
      if ((parseFloat(weeklyResults[i].percentage)||0)<=(parseFloat(weeklyResults[i-1].percentage)||0)){rising=false;break;}
    }
    if (rising) specials.push({name:'Rising Star', icon:'📈', desc:'Score improved every week'});
  }
  // Consistency — all 3 weekly scores within 5%
  if (weeklyResults.length>=3) {
    var scores=weeklyResults.map(function(r){return parseFloat(r.percentage)||0;});
    if (Math.max.apply(null,scores)-Math.min.apply(null,scores)<=5)
      specials.push({name:'Consistency', icon:'⭐', desc:'All weekly scores within 5% of each other'});
  }
  return specials;
}

function otGetClassRank(ss, testId, studentId, percentage) {
  try {
    var shR=ss.getSheetByName(SH_OT_RESPONSES);
    if (!shR||shR.getLastRow()<=1) return null;
    var rRows=shR.getRange(2,1,shR.getLastRow()-1,13).getValues();
    // Get all valid scores for this test (latest attempt per student)
    var byStudent={};
    rRows.filter(function(r){return r[1]===testId&&r[12]!==null&&r[12]!=='';}).forEach(function(r){
      var sid=r[2], pct=parseFloat(r[12])||0;
      if (!byStudent[sid]||pct>byStudent[sid]) byStudent[sid]=pct;
    });
    var scores=Object.values(byStudent).sort(function(a,b){return b-a;});
    var rank=1;
    for(var i=0;i<scores.length;i++){if(scores[i]>percentage)rank++;else break;}
    return {rank:rank, total:scores.length};
  } catch(e) { return null; }
}

// ── Enhanced otGetStudentResults (replaces original) ─────────────
function otGetStudentResultsV3(ss, p) {
  if (!p.studentId||!p.batchCode) return {status:'error',reason:'missing_params'};
  ensureOnlineTestSheets(ss);
  var shR=ss.getSheetByName(SH_OT_RESPONSES);
  var rRows=shR.getLastRow()>1?shR.getRange(2,1,shR.getLastRow()-1,16).getValues():[];
  var shOT=ss.getSheetByName(SH_ONLINE_TESTS);
  var otRows=shOT.getLastRow()>1?shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues():[];
  var testMap={};otRows.forEach(function(r){testMap[r[0]]=r;});
  var myResponses=rRows.filter(function(r){
    if (String(r[2]).trim().toUpperCase()!==String(p.studentId).trim().toUpperCase()) return false;
    if (String(r[4]).trim().toUpperCase()===String(p.batchCode).trim().toUpperCase()) return true;
    var t=testMap[r[1]]||[];
    var batches=String(t[3]||'').split(',').map(function(s){return s.trim().toUpperCase();});
    return batches.indexOf(String(p.batchCode).trim().toUpperCase())!==-1;
  });
  var questionRowsByTest={};
  var manualRowsByKey={};
  function getQuestionRows(testId) {
    if (questionRowsByTest[testId]) return questionRowsByTest[testId];
    var shQ=ss.getSheetByName(SH_OT_QUESTIONS);
    var qRows=shQ.getLastRow()>1?shQ.getRange(2,1,shQ.getLastRow()-1,13).getValues():[];
    questionRowsByTest[testId]=qRows.filter(function(q){return String(q[0])===String(testId);})
      .sort(function(a,b){return(a[12]||0)-(b[12]||0);});
    return questionRowsByTest[testId];
  }
  function getManualMap(testId, studentId) {
    var key=String(testId)+'|'+String(studentId);
    if (manualRowsByKey[key]) return manualRowsByKey[key];
    var map={};
    var shMG=ss.getSheetByName(SH_OT_MANUAL_GRADES);
    var mgRows=shMG.getLastRow()>1?shMG.getRange(2,1,shMG.getLastRow()-1,9).getValues():[];
    mgRows.forEach(function(m){
      if (String(m[0])===String(testId)&&String(m[1])===String(studentId)) {
        map[m[2]]={
          studentAnswer:m[3],
          score:m[4],
          maxMarks:m[5],
          feedback:m[6]||'',
          gradedBy:m[7]||'',
          gradedAt:m[8]||'',
          graded:m[4]!==''&&m[4]!==null
        };
      }
    });
    manualRowsByKey[key]=map;
    return map;
  }
  function optionText(q, val) {
    if (val===undefined||val===null||val==='') return '';
    var type=q[9]||'MCQ';
    if (type==='MCQ') {
      var idx=parseInt(val,10);
      return idx>=1&&idx<=4 ? String(q[3+idx]||'') : String(val);
    }
    return String(val);
  }
  function buildBreakdown(responseRow, testRow) {
    if ((testRow[12]||'summary')!=='full') return [];
    var answers={};
    try{answers=JSON.parse(responseRow[14]||'{}');}catch(e){}
    var negEnabled=testRow[7]==='Yes';
    var negVal=parseFloat(testRow[8])||0.25;
    var manualMap=getManualMap(responseRow[1], responseRow[2]);
    return getQuestionRows(responseRow[1]).map(function(q, i){
      var qId=q[1], type=q[9]||'MCQ', marks=parseFloat(q[10])||1;
      var raw=answers[qId]!==undefined?String(answers[qId]):'';
      var correct=String(q[8]||'');
      var item={qNo:i+1,qId:qId,type:type,question:q[3]||'',marks:marks,
        studentAnswer:optionText(q, raw),rawStudentAnswer:raw,correctAnswer:optionText(q, correct),
        isCorrect:null,score:'',maxMarks:marks};
      if (type==='Theory'||type==='FileUpload') {
        var mg=manualMap[qId]||{};
        item.studentAnswer=mg.studentAnswer||raw;
        item.correctAnswer='';
        item.score=mg.score!==undefined?mg.score:'';
        item.maxMarks=mg.maxMarks||marks;
        item.graded=!!mg.graded;
        item.feedback=mg.feedback||'';
        return item;
      }
      if (!raw) {
        item.isCorrect=false;
        item.score=0;
        return item;
      }
      if (type==='FillBlank') item.isCorrect=raw.trim().toLowerCase()===correct.trim().toLowerCase();
      else item.isCorrect=String(raw)===correct;
      item.score=item.isCorrect?marks:(negEnabled?-negVal:0);
      return item;
    });
  }
  // Best score per test for retake
  var bestByTest={};
  myResponses.forEach(function(r){
    var t=testMap[r[1]]||[];
    if(t[18]==='Yes'){var pct=parseFloat(r[12])||0;if(!bestByTest[r[1]]||pct>bestByTest[r[1]].pct)bestByTest[r[1]]={row:r,pct:pct};}
  });
  var results=myResponses.map(function(r){
    var t=testMap[r[1]]||[];
    if(t[11]!=='Yes') return null;
    if(t[18]==='Yes'&&bestByTest[r[1]]&&bestByTest[r[1]].row!==r) return null;
    var pct=parseFloat(r[12]);
    var ps=parseFloat(t[22])||OT_PASS_PERCENT;
    var badge=(!isNaN(pct))?otCalculateBadge(pct,ps):null;
    var rank=(!isNaN(pct))?otGetClassRank(ss,r[1],p.studentId,pct):null;
    var feedback = '';
    var manualMap = getManualMap(r[1], p.studentId);
    if (manualMap['PORTFOLIO']) {
      feedback = manualMap['PORTFOLIO'].feedback || '';
    } else {
      var feedbacks = [];
      for (var qId in manualMap) {
        if (manualMap[qId].feedback) feedbacks.push(manualMap[qId].feedback);
      }
      feedback = feedbacks.join('; ');
    }
    return{testId:r[1],testLabel:t[1]||r[1],testType:t[2]||'',
      submittedAt:r[5],submitType:r[6],totalScore:r[10],totalMarks:r[11],
      percentage:pct,result:r[13],resultsMode:t[12]||'summary',
      attemptNo:r[15],allowRetake:t[18]||'No',
      passingScore:ps,badge:badge,classRank:rank,
      feedback:feedback,
      questionBreakdown:buildBreakdown(r,t)};
  }).filter(Boolean);
  var weekly=results.filter(function(r){return r.testType==='Weekly';});
  var final_=results.filter(function(r){return r.testType==='Final';});
  var weeklyAvg=null;
  if(weekly.length>0){
    // Best-of-3: sort scores descending, take top 3, average them
    var wScores=weekly.map(function(r){return r.percentage||0;}).sort(function(a,b){return b-a;});
    var top3w=wScores.slice(0,3);
    weeklyAvg=Math.round(top3w.reduce(function(s,v){return s+v;},0)/top3w.length);
  }
  // Sort weekly by submission date for Rising Star check
  var weeklyOrdered=weekly.slice().sort(function(a,b){return new Date(a.submittedAt)-new Date(b.submittedAt);});
  var defaultPS = weekly.length>0?(parseFloat(testMap[weekly[0].testId]&&testMap[weekly[0].testId][22])||OT_PASS_PERCENT):OT_PASS_PERCENT;
  var specials=otGetSpecialBadges(weeklyOrdered,final_,results);
  var cumulative=otGetCumulativeHonour(weeklyAvg,final_,defaultPS);
  return{
    status:'ok',weeklyResults:weekly,finalResults:final_,
    weeklyAverage:weeklyAvg,
    weeklyPass:weeklyAvg!==null?weeklyAvg>=defaultPS:null,
    specialBadges:specials,
    cumulativeHonour:cumulative,
    overallPass:(weeklyAvg!==null&&weeklyAvg>=defaultPS)&&
      (final_.length===0||final_.some(function(r){return r.result==='Pass';}))
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAY HUB — Gemstone Tray Management System
// ═══════════════════════════════════════════════════════════════════════════════

const SH_TRAY_REGISTRY     = 'Tray_Registry';
const SH_TRAY_BOOKINGS     = 'Tray_Bookings';
const SH_TRAY_NOTIFICATIONS= 'Tray_Notifications';
const SH_TRAY_WEEKLY_NEEDS = 'Tray_WeeklyNeeds';
const SH_TRAY_HISTORY      = 'Tray_History';

// Diamond instructors per centre (for accountability + notifications)
var CENTRE_HOME_INSTRUCTORS = {
  'Mumbai':  ['Amit Sidpura', 'Bhavin Patel'],
  'Delhi':   ['Nishchay Kapoor'],
  'Surat':   ['Khorehmand Kasad'],
  'Chennai': ['Sharoon Joy']
};

// ── Sheet setup ─────────────────────────────────────────────────────────────
function ensureTraySheets(ss) {
  function ensureSheet(name, headers) {
    var sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(headers);
      sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#0D1B2E').setFontColor('#C9A84C');
    }
    return sh;
  }
  ensureSheet(SH_TRAY_REGISTRY,      ['TrayID','Category','TopicCode','TopicName','HomeCentre','HomeInstructor','StoneCount','WeekUsage','LocationStatus','CurrentCentre','ExpectedReturn','RegisteredAt','Notes','BorrowerConfirmed','BorrowerInstructor']);
  ensureSheet(SH_TRAY_BOOKINGS,      ['BookingID','TrayID','HomeCentre','RequestingInstructor','RequestingCentre','WeeksBooked','StartDate','DeadlineDate','Status','StoneCountOnReturn','RejectReason','CreatedAt','UpdatedAt','BatchCode']);
  ensureSheet(SH_TRAY_NOTIFICATIONS, ['NotifID','ToInstructor','Type','BookingID','Message','Read','CreatedAt']);
  ensureSheet(SH_TRAY_WEEKLY_NEEDS,  ['Instructor','Centre','TraysNeededPerWeek','UpdatedAt']);
  ensureSheet(SH_TRAY_HISTORY,       ['HistoryID','TrayID','LegNumber','FromCentre','ToCentre','FromInstructor','ToInstructor','PlannedStart','PlannedEnd','ActualSent','ActualReceived','Status']);
}

function getTraySheet(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) { ensureTraySheets(ss); sh = ss.getSheetByName(name); }
  return sh;
}

function trayRows(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow()-1, sh.getLastColumn()).getValues();
}

// ── TRAY CATALOGUE ──────────────────────────────────────────────────────────
// All known trays, keyed by centre. Used for bulk-seeding and guided registration.
var TRAY_CATALOGUE = {
  // Diamond trays (topic code → {name, weekUsage})
  DM: {
    'MS1': {name:'Master Set 1',          weekUsage:'Week 2–6'},
    'MS2': {name:'Master Set 2',          weekUsage:'Week 2–6'},
    'MS' : {name:'Master Set',           weekUsage:'Week 2–6'},
    'RI1': {name:'Regular Inventory 1',  weekUsage:'Week 2–6'},
    'RI2': {name:'Regular Inventory 2',  weekUsage:'Week 2–6'},
    'FS' : {name:'Fancy Shapes',         weekUsage:'Week 4'},
    'IM' : {name:'Imitation',            weekUsage:'Week 4'},
    'WT' : {name:'Weekly Test',          weekUsage:'Week 3–4–5'},
    'FT' : {name:'Final Test',           weekUsage:'Week 6'},
    'LG1': {name:'Lab Grown 1',          weekUsage:'Week 4–5–6'},
    'LG2': {name:'Lab Grown 2',          weekUsage:'Week 4–5–6'},
    'DS' : {name:'Diamond Sorting',      weekUsage:'Week 5'},
    'MJ' : {name:'Mounted Jewelry',      weekUsage:'Week 5'},
    'RD1': {name:'Rough Diamonds 1',     weekUsage:'Week 1'},
    'RD2': {name:'Rough Diamonds 2',     weekUsage:'Week 1'},
    'RD3': {name:'Rough Diamonds 3',     weekUsage:'Week 1'}
  },
  // Colored Stone trays
  CS: {
    'OPI' : {name:'Optical Properties & Instruments', weekUsage:''},
    'OPI2': {name:'Optical Properties & Instruments 2', weekUsage:''},
    'INI' : {name:'Instruments & Inclusions',          weekUsage:''},
    'INI2': {name:'Instruments & Inclusions 2',        weekUsage:''},
    'RES' : {name:'Natural RES (Ruby·Emerald·Sapphire)',weekUsage:''},
    'TRT' : {name:'Treatments',                        weekUsage:''},
    'SYN' : {name:'Synthetics',                        weekUsage:''},
    'GR1' : {name:'Group 1 (Garnet·Opal·Lapis)',       weekUsage:''},
    'GR2' : {name:'Group 2 (Tourmaline·Topaz·Peridot)',weekUsage:''},
    'GR3' : {name:'Group 3 (Feldspar·Jade·Tanzanite)', weekUsage:''},
    'QTZ' : {name:'Quartz',                            weekUsage:''},
    'QTZ1': {name:'Quartz 1 (Amethyst·Smoky·Citrine)', weekUsage:''},
    'QTZ2': {name:'Quartz 2 (Agate·Chalcedony·Onyx)',  weekUsage:''},
    'PRC' : {name:'Practice',                          weekUsage:''},
    'PRC2': {name:'Practice 2',                        weekUsage:''},
    'EXA' : {name:'Test Series A (A1-A11)',            weekUsage:''},
    'EXB' : {name:'Test Series B (B1-B11)',            weekUsage:''},
    'EXC' : {name:'Test Series C (C1-C11)',            weekUsage:''},
    'EXD' : {name:'Test Series D (D1-D11)',            weekUsage:''},
    'EXE' : {name:'Test Series E (E1-E11)',            weekUsage:''}
  },
  // Organics
  OR: {
    'OR1': {name:'Organics 1 (Amber·Coral·Pearl)',    weekUsage:''},
    'OR2': {name:'Organics 2',                         weekUsage:''}
  }
};

// Per-centre tray set. Format: [[category, trayNo/topicCode, topicCode, stoneCount] for Mumbai, or [category, topicCode, stoneCount] for others]
var CENTRE_TRAY_SETS = {
  'Mumbai': [
    // Diamonds: MUM-DM-T01 to MUM-DM-T15
    ['DM', '01', 'MS1', 57], ['DM', '02', 'RI1', 57], ['DM', '03', 'RI2', 57], 
    ['DM', '04', 'FS', 25], ['DM', '05', 'IM', 25], ['DM', '06', 'WT', 25], 
    ['DM', '07', 'FT', 25], ['DM', '08', 'LG1', 25], ['DM', '09', 'LG2', 25], 
    ['DM', '10', 'DS', 25], ['DM', '11', 'MJ', 25], ['DM', '12', 'RD1', 25], 
    ['DM', '13', 'RD2', 25], ['DM', '14', 'RD3', 25], ['DM', '15', 'MS2', 57],
    // Colored Stones Teaching: MUM-CS-T01 to MUM-CS-T23
    ['CS', '01', 'OPI', 25], ['CS', '12', 'OPI', 25],
    ['CS', '02', 'INI', 25], ['CS', '13', 'INI', 25],
    ['CS', '03', 'RES', 25], ['CS', '14', 'RES', 25],
    ['CS', '04', 'TRT', 25], ['CS', '15', 'TRT', 25],
    ['CS', '05', 'SYN', 25], ['CS', '16', 'SYN', 25],
    ['CS', '06', 'GR1', 25], ['CS', '17', 'GR1', 25],
    ['CS', '07', 'GR2', 25], ['CS', '18', 'GR2', 25],
    ['CS', '08', 'QTZ', 25], ['CS', '19', 'QTZ', 25],
    ['CS', '09', 'GR3', 25], ['CS', '20', 'GR3', 25],
    ['CS', '10', 'PRC', 25], ['CS', '21', 'PRC', 25], 
    ['CS', '11', 'PRC', 25], ['CS', '22', 'PRC', 25],
    ['CS', '23', 'PRC', 25],
    // Colored Stone Exam/Test Series Trays: MUM-CS-T-EX1 to MUM-CS-T-EX5
    ['CS', 'EX1', 'EXA', 11], ['CS', 'EX2', 'EXB', 11],
    ['CS', 'EX3', 'EXC', 11], ['CS', 'EX4', 'EXD', 11],
    ['CS', 'EX5', 'EXE', 11],
    // Organics: MUM-OR-T01 to MUM-OR-T02
    ['OR', '01', 'OR1', 25], ['OR', '02', 'OR2', 25]
  ],
  'Delhi': [
    ['DM','MS',57],['DM','RI1',57],['DM','RI2',57],['DM','FS',25],
    ['DM','IM',25],['DM','WT',25],['DM','FT',25],['DM','DS',25],['DM','RD1',25],
    ['CS','OPI',17],['CS','SYN',20],['CS','RES',25],['CS','GR1',20],
    ['CS','GR2',25],['CS','QTZ1',25],['CS','QTZ2',25],['CS','PRC',25]
  ],
  'Surat': [
    ['DM','MS',57],['DM','RI1',57],['DM','RI2',57],['DM','FS',25],
    ['DM','IM',25],['DM','WT',25],['DM','FT',25]
  ],
  'Chennai': [
    ['DM','MS',57],['DM','RI1',57]
  ]
};

var CENTRE_ABBR = {'Mumbai':'MUM','Delhi':'DEL','Surat':'SUR','Chennai':'CHN'};

function trayMakeId(centre, category, topicCode) {
  var ctr = CENTRE_ABBR[centre] || centre.substring(0,3).toUpperCase();
  return ctr + '-' + category + '-' + topicCode;
}

function trayNextId(ss, type, centre, explicitTopicCode) {
  // New format: CTR-CAT-CODE  e.g. MUM-DM-MS, DEL-CS-OPI
  var cat = (type === 'Diamond') ? 'DM' : (type === 'Organics' ? 'OR' : 'CS');
  var code = explicitTopicCode || 'MISC';
  return trayMakeId(centre, cat, code);
}

// ── trayBulkSeed ─────────────────────────────────────────────────────────────
// Seeds all known trays for all centres. Safe to run multiple times (skips existing IDs).
// Supports optional p.filterCentre ('Mumbai'|'Delhi'|'Surat'|'Chennai') and p.filterCategory ('DM'|'CS'|'OR')
function trayBulkSeed(ss, p) {
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_REGISTRY);
  
  var filterCentre = (p && p.filterCentre) || '';
  var filterCategory = (p && p.filterCategory) || '';

  // Clean up/remove entries matching the seeding criteria from the registry to avoid duplicates
  var data = sh.getDataRange().getValues();
  if (data.length > 1) {
    var header = data[0];
    var rowsToKeep = [header];
    var removedCount = 0;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var trayId = String(row[0] || '');
      var cat = String(row[1] || '');
      var homeCentre = String(row[4] || '');
      
      var shouldClear = false;
      if (filterCentre) {
        if (homeCentre === filterCentre && (!filterCategory || cat === filterCategory)) {
          shouldClear = true;
        }
      } else {
        // Default "Seed All"
        if (((homeCentre === 'Mumbai' || trayId.endsWith('-DM-MS')) && (!filterCategory || cat === filterCategory))) {
          shouldClear = true;
        }
      }
      
      if (shouldClear) {
        removedCount++;
      } else {
        rowsToKeep.push(row);
      }
    }
    if (removedCount > 0) {
      sh.clearContents();
      sh.getRange(1, 1, rowsToKeep.length, header.length).setValues(rowsToKeep);
    }
  }
  
  var existing = trayRows(sh).map(function(r){ return String(r[0]||'').trim(); });
  var seeded = 0, skipped = 0;
  var now = new Date().toISOString();
  Object.keys(CENTRE_TRAY_SETS).forEach(function(centre) {
    if (filterCentre && filterCentre !== centre) return;
    
    var abbr = CENTRE_ABBR[centre] || centre.substring(0,3).toUpperCase();
    CENTRE_TRAY_SETS[centre].forEach(function(entry) {
      var cat, code, stones, id;
      var homeInstructor = '';
      
      if (entry.length === 4) {
        cat = entry[0];
        var trayNo = entry[1];
        code = entry[2];
        stones = entry[3];
        
        var trayStr = String(trayNo);
        if (trayStr.startsWith('EX')) {
          id = abbr + '-' + cat + '-T-' + trayStr;
        } else {
          id = abbr + '-' + cat + '-T' + trayStr;
        }
      } else {
        cat = entry[0];
        code = entry[1];
        stones = entry[2];
        id = abbr + '-' + cat + '-' + code;
      }
      
      if (filterCategory && filterCategory !== cat) return; // skip if category doesn't match filter
      
      // Determine Home Instructor for Mumbai
      if (centre === 'Mumbai') {
        if (cat === 'CS' || cat === 'OR') {
          homeInstructor = 'Asmita';
        } else if (cat === 'DM') {
          homeInstructor = 'Amit / Bhavin';
        }
      }
      
      if (existing.indexOf(id) !== -1) { skipped++; return; }
      
      var catObj = TRAY_CATALOGUE[cat] || {};
      var info = catObj[code] || {name: code, weekUsage: ''};
      // cols: TrayID,Category,TopicCode,TopicName,HomeCentre,HomeInstructor,StoneCount,WeekUsage,LocationStatus,CurrentCentre,ExpectedReturn,RegisteredAt,Notes
      sh.appendRow([id, cat, code, info.name, centre, homeInstructor, stones, info.weekUsage, 'UNCONFIRMED', centre, '', now, 'Bulk seeded']);
      existing.push(id);
      seeded++;
    });
  });
  return {status:'ok', seeded:seeded, skipped:skipped};
}

// ── trayConfirmLocation ──────────────────────────────────────────────────────
// p: { trayId, locationStatus('HOME'|'ON_LOAN'|'UNKNOWN'), currentCentre, expectedReturn, instructor }
// Col index: 0=TrayID,1=Cat,2=TopicCode,3=TopicName,4=HomeCentre,5=HomeInstructor,
//            6=StoneCount,7=WeekUsage,8=LocationStatus,9=CurrentCentre,10=ExpectedReturn,
//            11=RegisteredAt,12=Notes,13=BorrowerConfirmed
function trayConfirmLocation(ss, p) {
  if (!p.trayId || !p.locationStatus) return {status:'error', message:'Missing trayId or locationStatus'};
  var sh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(p.trayId).trim()) {
      var homeCentre = String(rows[i][4]);
      var fromInstructor = p.instructor || String(rows[i][5]);
      sh.getRange(i+1, 9).setValue(p.locationStatus);
      sh.getRange(i+1,10).setValue(p.currentCentre || homeCentre);
      sh.getRange(i+1,11).setValue(p.expectedReturn || '');
      if (p.instructor && !rows[i][5]) sh.getRange(i+1,6).setValue(p.instructor);
      sh.getRange(i+1,14).setValue('');                                              // BorrowerConfirmed reset
      sh.getRange(i+1,15).setValue(p.borrowerInstructor || '');                     // BorrowerInstructor
      // Write to Tray_History
      if (p.locationStatus === 'ON_LOAN') {
        var histId = trayHistId();
        var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
        var today = new Date().toISOString().split('T')[0];
        hsh.appendRow([histId, p.trayId, 1, homeCentre, p.currentCentre||'',
          fromInstructor, p.borrowerInstructor||'',
          today, p.expectedReturn||'', today, '', 'SENT']);
        // Notify borrower instructors
        var targets = _getInstructorsForCentre(ss, p.currentCentre);
        if (p.borrowerInstructor && p.borrowerInstructor.trim() !== '' && targets.indexOf(p.borrowerInstructor) === -1) {
          targets.push(p.borrowerInstructor);
        }
        targets.forEach(function(name) {
          trayAddNotif(ss, name, 'incoming_tray', histId+':'+p.trayId,
            '📦 Tray '+p.trayId+' is on its way from '+homeCentre+' ('+fromInstructor+').'+(p.expectedReturn?' Expected by '+p.expectedReturn:''));
        });
        // Notify other home diamonds
        _notifyHomeDiamonds(ss, homeCentre, fromInstructor, 'tray_dispatched', histId+':'+p.trayId,
          '📤 '+p.trayId+' sent to '+(p.currentCentre||'unknown')+(p.borrowerInstructor?' ('+p.borrowerInstructor+')':''));
      } else if (p.locationStatus === 'IN_USE') {
        var histId = trayHistId();
        var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
        var today = new Date().toISOString().split('T')[0];
        hsh.appendRow([histId, p.trayId, 0, homeCentre, homeCentre,
          fromInstructor, fromInstructor,
          p.startDate||today, p.expectedReturn||'', today, '', 'IN_USE']);
      } else if (p.locationStatus === 'HOME') {
        // Close any open IN_USE or SENT row if returning home via simple confirm
        _closeOpenHistoryLeg(ss, p.trayId);
      }
      return {status:'ok', trayId:p.trayId};
    }
  }
  return {status:'error', message:'Tray not found: '+p.trayId};
}

// ── trayBorrowerConfirm ──────────────────────────────────────────────────────
// Called by the BORROWING centre instructor to confirm they have the tray.
// p: { trayId, borrowerInstructor, borrowerCentre, expectedReturn? }
function trayBorrowerConfirm(ss, p) {
  if (!p.trayId || !p.borrowerCentre) return {status:'error', message:'Missing trayId or borrowerCentre'};
  var sh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(p.trayId).trim()) {
      var currentLoc = String(rows[i][8] || 'UNCONFIRMED');
      // Allow confirmation even if home hasn't set ON_LOAN yet — record it
      sh.getRange(i+1, 9).setValue('ON_LOAN');                                     // LocationStatus
      sh.getRange(i+1,10).setValue(p.borrowerCentre);                              // CurrentCentre
      if (p.expectedReturn) sh.getRange(i+1,11).setValue(p.expectedReturn);        // ExpectedReturn
      sh.getRange(i+1,14).setValue('yes');                                          // BorrowerConfirmed
      return {status:'ok', trayId:p.trayId, previousStatus: currentLoc};
    }
  }
  return {status:'error', message:'Tray not found: '+p.trayId};
}

// ── trayUpdateDetails ────────────────────────────────────────────────────────
// p: { trayId, stoneCount?, notes?, weekUsage? }
function trayUpdateDetails(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  var sh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(p.trayId).trim()) {
      if (p.stoneCount !== undefined) sh.getRange(i+1, 7).setValue(parseInt(p.stoneCount)||0);
      if (p.weekUsage  !== undefined) sh.getRange(i+1, 8).setValue(p.weekUsage);
      if (p.notes      !== undefined) sh.getRange(i+1,13).setValue(p.notes);
      return {status:'ok', trayId:p.trayId};
    }
  }
  return {status:'error', message:'Tray not found: '+p.trayId};
}

function trayAddNotif(ss, toInstructor, type, bookingId, message) {
  var sh = getTraySheet(ss, SH_TRAY_NOTIFICATIONS);
  var id = 'TN-' + Date.now() + '-' + Math.floor(Math.random()*1000);
  sh.appendRow([id, toInstructor, type, bookingId, message, 'N', new Date().toISOString()]);
  return id;
}

// ── trayRegister ─────────────────────────────────────────────────────────────
// p: { category('DM'|'CS'|'OR'), topicCode, centre, instructor, stoneCount, notes? }
// Also accepts legacy: { type('Diamond'|'ColoredStone'), trayNumber, ... }
function trayRegister(ss, p) {
  ensureTraySheets(ss);
  // Normalise category/topicCode
  var cat, code;
  if (p.category && p.topicCode) {
    cat = p.category; code = p.topicCode;
  } else if (p.type) {
    // Legacy path
    cat = (p.type === 'Diamond') ? 'DM' : (p.type === 'Organics' ? 'OR' : 'CS');
    code = p.topicCode || (p.trayNumber ? 'T'+p.trayNumber : 'MISC');
  } else {
    return {status:'error', message:'Missing category/topicCode'};
  }
  if (!p.centre || !p.instructor) return {status:'error', message:'Missing centre or instructor'};
  var count = parseInt(p.stoneCount) || 0;
  if (count < 1) return {status:'error', message:'Stone count must be > 0'};
  var abbr = CENTRE_ABBR[p.centre] || p.centre.substring(0,3).toUpperCase();
  var id = abbr + '-' + cat + '-' + code;
  var sh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var existing = trayRows(sh).map(function(r){ return String(r[0]||'').trim(); });
  if (existing.indexOf(id) !== -1) return {status:'error', message:'Tray '+id+' is already registered'};
  var catObj = TRAY_CATALOGUE[cat] || {};
  var info = catObj[code] || {name: code, weekUsage: ''};
  // TrayID,Category,TopicCode,TopicName,HomeCentre,HomeInstructor,StoneCount,WeekUsage,LocationStatus,CurrentCentre,ExpectedReturn,RegisteredAt,Notes
  sh.appendRow([id, cat, code, info.name, p.centre, p.instructor, count, info.weekUsage, 'HOME', p.centre, '', new Date().toISOString(), p.notes||'']);
  return {status:'ok', trayId: id};
}

// ── trayGetBoard ─────────────────────────────────────────────────────────────
// Returns aggregated matrix: per centre × type → {total, free, engaged, trays[]}
function trayGetBoard(ss, p) {
  ensureTraySheets(ss);
  var regRows  = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var bookRows = trayRows(getTraySheet(ss, SH_TRAY_BOOKINGS));
  var now = new Date();

  // Build active booking map: trayId → {status, requestingCentre, deadline}
  var activeBookings = {};
  bookRows.forEach(function(r) {
    var status = String(r[8]||'');
    if (['pending','active','returning'].indexOf(status) !== -1) {
      activeBookings[String(r[1])] = {
        status: status,
        bookingId: String(r[0]),
        requestingCentre: String(r[4]),
        requestingInstructor: String(r[3]),
        deadline: r[7] ? new Date(r[7]) : null,
        weeksBooked: parseInt(r[5])||1
      };
    }
  });

  // Group trays by centre → type
  // New cols: TrayID(0),Category(1),TopicCode(2),TopicName(3),HomeCentre(4),HomeInstructor(5),StoneCount(6),WeekUsage(7),LocationStatus(8),CurrentCentre(9),ExpectedReturn(10),RegisteredAt(11),Notes(12)
  var centreMap = {};
  regRows.forEach(function(r) {
    var trayId    = String(r[0]);
    var cat       = String(r[1] || '');
    var topicCode = String(r[2] || '');
    var topicName = String(r[3] || '');
    var centre    = String(r[4] || r[2] || ''); // HomeCentre (new col 4, fallback old col 2)
    var instructor= String(r[5] || r[3] || '');
    var stones    = parseInt(r[6]) || 0;
    var weekUsage = String(r[7] || '');
    var locStatus        = String(r[8] || 'UNCONFIRMED');
    var currentCtr       = String(r[9] || centre);
    var expectedReturn   = r[10] ? String(r[10]).split('T')[0] : '';
    var borrowerConfirmed= String(r[13] || '') === 'yes';
    // Legacy support: if cat is empty, derive from old 'Type' field
    if (!cat) { cat = (String(r[1])==='Diamond') ? 'DM' : 'CS'; }
    if (!centre) return;
    if (!centreMap[centre]) centreMap[centre] = {centre:centre, instructor:instructor, DM:[], CS:[], OR:[]};
    var booking = activeBookings[trayId] || null;
    var trayStatus = 'available';
    var daysLeft = null;
    if (locStatus === 'UNCONFIRMED') trayStatus = 'unconfirmed';
    if (booking) {
      trayStatus = booking.status === 'pending' ? 'requested' : (booking.status === 'returning' ? 'returning' : 'engaged');
      if (booking.deadline) {
        daysLeft = Math.ceil((booking.deadline.getTime() - now.getTime()) / 86400000);
        if (daysLeft < 0) trayStatus = 'overdue';
      }
    }
    var key = (cat === 'DM') ? 'DM' : (cat === 'OR' ? 'OR' : 'CS');
    centreMap[centre][key].push({
      trayId: trayId,
      category: cat,
      topicCode: topicCode,
      topicName: topicName,
      weekUsage: weekUsage,
      stoneCount: stones,
      locationStatus: locStatus,
      currentCentre: currentCtr,
      expectedReturn: expectedReturn,
      borrowerConfirmed: borrowerConfirmed,
      status: trayStatus,
      requestingCentre: booking ? booking.requestingCentre : null,
      requestingInstructor: booking ? booking.requestingInstructor : null,
      bookingId: booking ? booking.bookingId : null,
      deadline: booking && booking.deadline ? booking.deadline.toISOString().split('T')[0] : null,
      daysLeft: daysLeft
    });
  });

  var centres = Object.values(centreMap).map(function(c) {
    function summary(trays) {
      return {
        total: trays.length,
        free: trays.filter(function(t){ return t.status==='available'; }).length,
        engaged: trays.filter(function(t){ return ['engaged','overdue','returning'].indexOf(t.status)!==-1; }).length,
        requested: trays.filter(function(t){ return t.status==='requested'; }).length,
        unconfirmed: trays.filter(function(t){ return t.status==='unconfirmed'; }).length,
        trays: trays
      };
    }
    return {
      centre: c.centre,
      instructor: c.instructor,
      diamond: summary(c.DM),
      coloredStone: summary(c.CS),
      organics: summary(c.OR)
    };
  });
  centres.sort(function(a,b){ return a.centre.localeCompare(b.centre); });
  return {status:'ok', centres:centres};
}

// ── trayGetMine ──────────────────────────────────────────────────────────────
// p: { centre }
function trayGetMine(ss, p) {
  if (!p.centre) return {status:'error', message:'Centre required'};
  var board = trayGetBoard(ss, p);
  if (board.status !== 'ok') return board;
  var mine = board.centres.filter(function(c){ return c.centre === p.centre; });
  // Also get incoming requests for my trays
  var bookRows = trayRows(getTraySheet(ss, SH_TRAY_BOOKINGS));
  var regRows  = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var myTrayIds = regRows.filter(function(r){ return String(r[4]||r[2])===p.centre; }).map(function(r){ return String(r[0]); });
  var incoming = bookRows.filter(function(r){
    return myTrayIds.indexOf(String(r[1]))!==-1 && String(r[8])==='pending';
  }).map(function(r){
    return {bookingId:String(r[0]),trayId:String(r[1]),requestingInstructor:String(r[3]),requestingCentre:String(r[4]),weeksBooked:parseInt(r[5])||1,startDate:r[6]?new Date(r[6]).toISOString().split('T')[0]:'',createdAt:String(r[11])};
  });
  return {status:'ok', myCentreData: mine[0]||null, incomingCount: incoming.length};
}

// ── trayBook ─────────────────────────────────────────────────────────────────
// p: { trayId, requestingInstructor, requestingCentre, weeksBooked, startDate }
function trayBook(ss, p) {
  if (!p.trayId || !p.requestingInstructor || !p.requestingCentre || !p.weeksBooked) {
    return {status:'error', message:'Missing required fields'};
  }
  ensureTraySheets(ss);
  var weeks = parseInt(p.weeksBooked) || 1;
  var startDate = p.startDate ? new Date(p.startDate) : new Date();
  // Normalise to Monday of the week
  var day = startDate.getDay();
  var diff = (day === 0) ? -6 : 1 - day;
  startDate.setDate(startDate.getDate() + diff);
  startDate.setHours(0,0,0,0);
  var deadline = new Date(startDate.getTime());
  deadline.setDate(deadline.getDate() + (weeks * 7) - 1);

  // Check tray exists and is available
  var regRows = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var trayRow = regRows.find(function(r){ return String(r[0])===p.trayId; });
  if (!trayRow) return {status:'error', message:'Tray not found'};
  if (String(trayRow[4] || trayRow[2]) === p.requestingCentre) return {status:'error', message:'Cannot request your own tray'};

  // Check no active booking
  var bookRows = trayRows(getTraySheet(ss, SH_TRAY_BOOKINGS));
  var conflict = bookRows.find(function(r){
    return String(r[1])===p.trayId && ['pending','active','returning'].indexOf(String(r[8]))!==-1;
  });
  if (conflict) return {status:'error', message:'Tray already has an active booking'};

  var bookingId = 'BK-' + Date.now();
  var sh = getTraySheet(ss, SH_TRAY_BOOKINGS);
  sh.appendRow([
    bookingId, p.trayId, String(trayRow[4] || trayRow[2]), p.requestingInstructor, p.requestingCentre,
    weeks, startDate.toISOString().split('T')[0], deadline.toISOString().split('T')[0],
    'pending', '', '', new Date().toISOString(), new Date().toISOString(), p.batchCode || ''
  ]);

  // Notify home instructor
  var homeInstructor = String(trayRow[5] || trayRow[3]);
  var msg = p.requestingInstructor + ' (' + p.requestingCentre + ') has requested tray ' + p.trayId + 
            (p.batchCode ? ' for batch ' + p.batchCode : '') +
            ' for ' + weeks + ' week' + (weeks>1?'s':'') + ' starting ' + startDate.toISOString().split('T')[0] + '.';
  trayAddNotif(ss, homeInstructor, 'request', bookingId, msg);
  return {status:'ok', bookingId:bookingId, deadline: deadline.toISOString().split('T')[0]};
}

// ── trayRespond ──────────────────────────────────────────────────────────────
// p: { bookingId, decision:'accept'|'reject', rejectReason }
function trayRespond(ss, p) {
  if (!p.bookingId || !p.decision) return {status:'error', message:'Missing bookingId or decision'};
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_BOOKINGS);
  var rows = trayRows(sh);
  var idx  = rows.findIndex(function(r){ return String(r[0])===p.bookingId; });
  if (idx === -1) return {status:'error', message:'Booking not found'};
  var row = rows[idx];
  if (String(row[8]) !== 'pending') return {status:'error', message:'Booking is no longer pending'};

  var newStatus = (p.decision === 'accept') ? 'active' : 'rejected';
  var dataRow = idx + 2;
  sh.getRange(dataRow, 9).setValue(newStatus);
  sh.getRange(dataRow, 11).setValue(p.rejectReason || '');
  sh.getRange(dataRow, 13).setValue(new Date().toISOString());

  // Notify requester
  var requester = String(row[3]);
  var trayId    = String(row[1]);
  if (newStatus === 'active') {
    trayAddNotif(ss, requester, 'accepted', p.bookingId,
      'Your request for tray ' + trayId + ' has been accepted. Return by ' + (row[7]?new Date(row[7]).toISOString().split('T')[0]:'') + '.');
  } else {
    trayAddNotif(ss, requester, 'rejected', p.bookingId,
      'Your request for tray ' + trayId + ' was declined.' + (p.rejectReason ? ' Reason: ' + p.rejectReason : ''));
  }
  return {status:'ok', newStatus:newStatus};
}

// ── trayMarkReturning ────────────────────────────────────────────────────────
// p: { bookingId, stoneCount }
function trayMarkReturning(ss, p) {
  if (!p.bookingId) return {status:'error', message:'bookingId required'};
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_BOOKINGS);
  var rows = trayRows(sh);
  var idx  = rows.findIndex(function(r){ return String(r[0])===p.bookingId; });
  if (idx === -1) return {status:'error', message:'Booking not found'};
  var row = rows[idx];
  var dataRow = idx + 2;
  sh.getRange(dataRow, 9).setValue('returning');
  sh.getRange(dataRow, 10).setValue(parseInt(p.stoneCount)||0);
  sh.getRange(dataRow, 13).setValue(new Date().toISOString());
  // Notify home instructor
  var homeCentre = String(row[2]);
  var regRows = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var trayReg = regRows.find(function(r){ return String(r[0])===String(row[1]); });
  var homeInstructor = trayReg ? String(trayReg[3]) : homeCentre;
  trayAddNotif(ss, homeInstructor, 'returning', p.bookingId,
    'Tray ' + String(row[1]) + ' has been dispatched by ' + String(row[3]) + ' (' + String(row[4]) + '). Stone count declared: ' + (p.stoneCount||'—') + '.');
  return {status:'ok'};
}

// ── trayConfirmReturn ────────────────────────────────────────────────────────
// p: { bookingId, stoneCount }
function trayConfirmReturn(ss, p) {
  if (!p.bookingId) return {status:'error', message:'bookingId required'};
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_BOOKINGS);
  var rows = trayRows(sh);
  var idx  = rows.findIndex(function(r){ return String(r[0])===p.bookingId; });
  if (idx === -1) return {status:'error', message:'Booking not found'};
  var row = rows[idx];
  var dataRow = idx + 2;
  sh.getRange(dataRow, 9).setValue('returned');
  if (p.stoneCount) sh.getRange(dataRow, 10).setValue(parseInt(p.stoneCount));
  sh.getRange(dataRow, 13).setValue(new Date().toISOString());
  // Notify requester: confirmed
  trayAddNotif(ss, String(row[3]), 'confirmed', p.bookingId,
    'Your return of tray ' + String(row[1]) + ' has been confirmed by ' + String(row[2]) + '. Thank you!');
  return {status:'ok'};
}

// ── trayGetWeekPlan ──────────────────────────────────────────────────────────
// p: { instructor, centre }  — returns 4-week forward view
function trayGetWeekPlan(ss, p) {
  if (!p.instructor || !p.centre) return {status:'error', message:'instructor and centre required'};
  ensureTraySheets(ss);

  // Get weekly need target
  var needRows = trayRows(getTraySheet(ss, SH_TRAY_WEEKLY_NEEDS));
  var needRow  = needRows.find(function(r){ return String(r[0])===p.instructor; });
  var weeklyNeed = needRow ? (parseInt(needRow[2])||3) : 3;

  var bookRows = trayRows(getTraySheet(ss, SH_TRAY_BOOKINGS));
  var regRows  = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));

  // Build trays belonging to this centre (home trays)
  var homeTrayIds = regRows.filter(function(r){ return String(r[2])===p.centre; }).map(function(r){ return String(r[0]); });

  // Active/returning bookings where THIS instructor is the requester
  var myActive = bookRows.filter(function(r){
    return String(r[3])===p.instructor && ['active','returning'].indexOf(String(r[8]))!==-1;
  });
  // Also home trays currently at home (not in any active booking)
  var engagedHomeTrayIds = bookRows.filter(function(r){
    return ['active','returning'].indexOf(String(r[8]))!==-1;
  }).map(function(r){ return String(r[1]); });
  var freehomeTrayIds = homeTrayIds.filter(function(id){ return engagedHomeTrayIds.indexOf(id)===-1; });

  // Build 4-week windows starting from this Monday
  var today = new Date(); today.setHours(0,0,0,0);
  var dayOfWeek = today.getDay();
  var monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek===0?6:dayOfWeek-1));

  var weeks = [];
  for (var w = 0; w < 4; w++) {
    var wStart = new Date(monday); wStart.setDate(monday.getDate() + w*7);
    var wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 6);
    wStart.setHours(0,0,0,0); wEnd.setHours(23,59,59,999);

    // Trays engaged during this week by this instructor (booked trays overlapping this window)
    var weekTrays = myActive.filter(function(r) {
      var sd = r[6] ? new Date(r[6]) : null;
      var dd = r[7] ? new Date(r[7]) : null;
      if (!sd || !dd) return false;
      return sd <= wEnd && dd >= wStart;
    }).map(function(r) {
      var trayId = String(r[1]);
      var regR = regRows.find(function(rr){ return String(rr[0])===trayId; });
      return {
        trayId: trayId,
        type: regR ? String(regR[1]) : '',
        from: String(r[2]),
        deadline: r[7] ? new Date(r[7]).toISOString().split('T')[0] : '',
        status: String(r[8]),
        bookingId: String(r[0])
      };
    });

    // Also include free home trays as "available this week"
    var homeFreeForWeek = freehomeTrayIds.map(function(id){
      var regR = regRows.find(function(rr){ return String(rr[0])===id; });
      return { trayId:id, type:regR?String(regR[1]):'', from:p.centre, deadline:'home', status:'available', bookingId:null };
    });

    var allThisWeek = weekTrays.concat(homeFreeForWeek).slice(0, Math.max(weekTrays.length + homeFreeForWeek.length, weeklyNeed));
    var covered = weekTrays.length + homeFreeForWeek.length;
    var coverStatus = covered >= weeklyNeed ? 'ok' : (covered > 0 ? 'partial' : 'empty');

    weeks.push({
      weekNum: w + 1,
      label: w===0 ? 'This Week' : 'Week ' + (w+1),
      startDate: wStart.toISOString().split('T')[0],
      endDate:   wEnd.toISOString().split('T')[0],
      trays: weekTrays,
      homeFree: homeFreeForWeek,
      covered: covered,
      need: weeklyNeed,
      coverStatus: coverStatus
    });
  }
  return {status:'ok', weeks:weeks, weeklyNeed:weeklyNeed};
}

// ── traySetWeeklyNeed ────────────────────────────────────────────────────────
// p: { instructor, centre, traysNeeded }
function traySetWeeklyNeed(ss, p) {
  if (!p.instructor || !p.traysNeeded) return {status:'error', message:'instructor and traysNeeded required'};
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_WEEKLY_NEEDS);
  var rows = trayRows(sh);
  var idx  = rows.findIndex(function(r){ return String(r[0])===p.instructor; });
  if (idx === -1) {
    sh.appendRow([p.instructor, p.centre||'', parseInt(p.traysNeeded)||3, new Date().toISOString()]);
  } else {
    sh.getRange(idx+2, 3).setValue(parseInt(p.traysNeeded)||3);
    sh.getRange(idx+2, 4).setValue(new Date().toISOString());
  }
  return {status:'ok'};
}

// ── trayGetNotifications ─────────────────────────────────────────────────────
// p: { instructor }
function trayGetNotifications(ss, p) {
  if (!p.instructor) return {status:'ok', notifications:[]};
  ensureTraySheets(ss);
  var rows = trayRows(getTraySheet(ss, SH_TRAY_NOTIFICATIONS));
  var unread = rows.filter(function(r){ return String(r[1])===p.instructor && String(r[5])==='N'; })
    .map(function(r){ return {notifId:String(r[0]),type:String(r[2]),bookingId:String(r[3]),message:String(r[4]),createdAt:String(r[6])}; });
  return {status:'ok', notifications:unread};
}

// ── trayMarkNotifRead ────────────────────────────────────────────────────────
// p: { notifId } or { instructor } (marks all)
function trayMarkNotifRead(ss, p) {
  ensureTraySheets(ss);
  var sh = getTraySheet(ss, SH_TRAY_NOTIFICATIONS);
  var rows = trayRows(sh);
  rows.forEach(function(r, i) {
    if ((p.notifId && String(r[0])===p.notifId) || (p.instructor && String(r[1])===p.instructor && String(r[5])==='N')) {
      sh.getRange(i+2, 6).setValue('Y');
    }
  });
  return {status:'ok'};
}

// ── trayGetHistory ───────────────────────────────────────────────────────────
// p: { trayId?, centre?, instructor? }
// Now reads from Tray_History for movement log, plus Tray_Bookings for request history
function trayGetHistory(ss, p) {
  ensureTraySheets(ss);
  var hrows = trayRows(getTraySheet(ss, SH_TRAY_HISTORY));
  var filtered = hrows.filter(function(r) {
    if (p.trayId     && String(r[1])!==p.trayId) return false;
    if (p.centre     && String(r[3])!==p.centre && String(r[4])!==p.centre) return false;
    if (p.instructor && String(r[5])!==p.instructor && String(r[6])!==p.instructor) return false;
    return true;
  });
  var history = filtered.map(function(r) {
    return {
      historyId: String(r[0]),
      trayId: String(r[1]),
      legNumber: parseInt(r[2])||0,
      fromCentre: String(r[3]),
      toCentre: String(r[4]),
      fromInstructor: String(r[5]),
      toInstructor: String(r[6]),
      plannedStart: r[7] ? String(r[7]).split('T')[0] : '',
      plannedEnd: r[8] ? String(r[8]).split('T')[0] : '',
      actualSent: r[9] ? String(r[9]).split('T')[0] : '',
      actualReceived: r[10] ? String(r[10]).split('T')[0] : '',
      status: String(r[11])
    };
  });
  history.sort(function(a,b){ return b.actualSent.localeCompare(a.actualSent) || b.historyId.localeCompare(a.historyId); });
  return {status:'ok', history: history.slice(0,200)};
}

// ── Deadline reminder check (call from a time-based trigger) ─────────────────
function trayCheckDeadlineReminders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var bookRows = trayRows(getTraySheet(ss, SH_TRAY_BOOKINGS));
  var regRows  = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var now = new Date(); now.setHours(0,0,0,0);
  var twoDays = new Date(now); twoDays.setDate(now.getDate() + 2);

  bookRows.forEach(function(r) {
    if (String(r[8]) !== 'active') return;
    var deadline = r[7] ? new Date(r[7]) : null;
    if (!deadline) return;
    deadline.setHours(0,0,0,0);
    var daysLeft = Math.ceil((deadline - now) / 86400000);
    // Send reminder at 2 days before and on deadline day
    if (daysLeft === 2 || daysLeft === 0) {
      var requester = String(r[3]);
      var trayId    = String(r[1]);
      var msg = daysLeft === 0
        ? 'URGENT: Tray ' + trayId + ' is due back TODAY (' + deadline.toISOString().split('T')[0] + '). Please dispatch immediately.'
        : 'Reminder: Tray ' + trayId + ' is due back in 2 days (' + deadline.toISOString().split('T')[0] + '). Please plan dispatch.';
      trayAddNotif(ss, requester, daysLeft===0 ? 'overdue_warning' : 'deadline_reminder', String(r[0]), msg);
    }
    // Mark overdue
    if (daysLeft < 0) {
      var sh = getTraySheet(ss, SH_TRAY_BOOKINGS);
      var allRows = trayRows(sh);
      var idx = allRows.findIndex(function(rr){ return String(rr[0])===String(r[0]); });
      if (idx !== -1) sh.getRange(idx+2, 9).setValue('overdue');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAY HISTORY — Journey tracking helpers + new actions
// ═══════════════════════════════════════════════════════════════════════════════

function trayHistId() { return 'TH-' + Date.now() + '-' + Math.floor(Math.random()*1000); }

function _getTrayHomeCentre(ss, trayId) {
  var rows = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  for (var i=0; i<rows.length; i++) { if (String(rows[i][0])===trayId) return String(rows[i][4]); }
  return '';
}

function _notifyHomeDiamonds(ss, homeCentre, excludeInstructor, type, refId, message) {
  var diamonds = CENTRE_HOME_INSTRUCTORS[homeCentre] || [];
  diamonds.forEach(function(name) {
    if (name === excludeInstructor) return;
    trayAddNotif(ss, name, type, refId, message);
  });
}

function _getInstructorsForCentre(ss, centre) {
  if (!centre) return [];
  ensureUserCredentials(ss);
  var shCreds = ss.getSheetByName(SH_USER_CREDENTIALS);
  var list = [];
  
  if (shCreds && shCreds.getLastRow() >= 2) {
    var rows = shCreds.getRange(2, 1, shCreds.getLastRow() - 1, 8).getValues();
    rows.forEach(function(r) {
      var role = String(r[0]);
      var name = String(r[1]).trim();
      var centresStr = String(r[2] || '');
      var active = String(r[7] || 'Y') !== 'N';
      if (role === 'Instructor' && active && name) {
        var centres = centresStr.split(',').map(function(c) { return c.trim().toUpperCase(); });
        if (centres.indexOf(centre.toUpperCase().trim()) !== -1) {
          if (list.indexOf(name) === -1) {
            list.push(name);
          }
        }
      }
    });
  }
  
  var shBatches = ss.getSheetByName(SH_BATCHES);
  if (shBatches && shBatches.getLastRow() >= 2) {
    var data = shBatches.getRange(2, 1, shBatches.getLastRow() - 1, 10).getValues();
    data.forEach(function(r) {
      var active = String(r[7] || 'Y') !== 'N';
      var c = String(r[1] || '').trim();
      if (active && c.toUpperCase() === centre.toUpperCase().trim()) {
        var assigned = detectSlotOrDate(r[4]) ? (r[9] || '') : (r[8] || '');
        var name = String(assigned).trim();
        if (name && list.indexOf(name) === -1) {
          list.push(name);
        }
      }
    });
  }
  
  if (list.length === 0 && CENTRE_HOME_INSTRUCTORS[centre]) {
    list = CENTRE_HOME_INSTRUCTORS[centre];
  }
  return list;
}


// Close any open SENT/RECEIVED/IN_USE leg when a tray returns HOME
function _closeOpenHistoryLeg(ss, trayId) {
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var hrows = trayRows(hsh);
  var today = new Date().toISOString().split('T')[0];
  for (var i=0; i<hrows.length; i++) {
    if (String(hrows[i][1])!==trayId) continue;
    var st = String(hrows[i][11]);
    if (st==='SENT'||st==='RECEIVED'||st==='IN_USE') {
      hsh.getRange(i+2, 11).setValue(today);      // ActualReceived
      hsh.getRange(i+2, 12).setValue('RETURNED'); // Status
    }
  }
}

// ── trayGetJourney ────────────────────────────────────────────────────────────
// Returns all history legs for a tray in order (for journey trail display)
// p: { trayId }
function trayGetJourney(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var hrows = trayRows(getTraySheet(ss, SH_TRAY_HISTORY)).filter(function(r){ return String(r[1])===p.trayId; });
  hrows.sort(function(a,b){ return (parseInt(a[2])||0)-(parseInt(b[2])||0); });
  var legs = hrows.map(function(r){
    return {
      historyId:      String(r[0]),
      legNumber:      parseInt(r[2])||0,
      fromCentre:     String(r[3]),
      toCentre:       String(r[4]),
      fromInstructor: String(r[5]),
      toInstructor:   String(r[6]),
      plannedStart:   r[7]?String(r[7]).split('T')[0]:'',
      plannedEnd:     r[8]?String(r[8]).split('T')[0]:'',
      actualSent:     r[9]?String(r[9]).split('T')[0]:'',
      actualReceived: r[10]?String(r[10]).split('T')[0]:'',
      status:         String(r[11])
    };
  });
  return {status:'ok', legs:legs};
}

// ── trayPlanJourney ───────────────────────────────────────────────────────────
// Home instructor pre-books multi-leg journey for a tray.
// p: { trayId, legs:[{toCentre, toInstructor, startDate, endDate}], instructor }
function trayPlanJourney(ss, p) {
  var legs = p.legs;
  if (typeof legs === 'string') {
    try {
      legs = JSON.parse(legs);
    } catch(e) {
      return {status:'error', message:'Invalid legs format'};
    }
  }
  p.legs = legs;
  if (!p.trayId || !p.legs || !p.legs.length) return {status:'error', message:'Missing trayId or legs'};
  ensureTraySheets(ss);
  var rrows = trayRows(getTraySheet(ss, SH_TRAY_REGISTRY));
  var trayRow = null;
  for (var i=0; i<rrows.length; i++) { if (String(rrows[i][0])===p.trayId){trayRow=rrows[i];break;} }
  if (!trayRow) return {status:'error', message:'Tray not found'};
  var homeCentre = String(trayRow[4]);
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var existingLegs = trayRows(hsh).filter(function(r){ return String(r[1])===p.trayId; });
  var maxLeg = existingLegs.reduce(function(m,r){ return Math.max(m, parseInt(r[2])||0); }, 0);
  // fromCentre for first new leg = last existing leg's toCentre (or homeCentre)
  var fromCentre = maxLeg>0 ? String(existingLegs[existingLegs.length-1][4]) : homeCentre;
  var fromInstructor = p.instructor || String(trayRow[5]);
  p.legs.forEach(function(leg, idx) {
    hsh.appendRow([trayHistId(), p.trayId, maxLeg+idx+1,
      fromCentre, leg.toCentre||'',
      fromInstructor, leg.toInstructor||'',
      leg.startDate||'', leg.endDate||'',
      '', '', 'PLANNED']);
    fromCentre = leg.toCentre || fromCentre;
    fromInstructor = leg.toInstructor || '';
  });
  return {status:'ok', trayId:p.trayId, legsCreated:p.legs.length};
}

// ── trayDispatch ──────────────────────────────────────────────────────────────
// Home instructor physically dispatches a tray: marks PLANNED leg as SENT,
// updates Tray_Registry, notifies recipient + home diamonds.
// p: { trayId, histId?, instructor }
function trayDispatch(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var hrows = trayRows(hsh);
  var legIdx = -1;
  for (var i=0; i<hrows.length; i++) {
    if (String(hrows[i][1])!==p.trayId) continue;
    if (p.histId && String(hrows[i][0])!==p.histId) continue;
    if (String(hrows[i][11])==='PLANNED') { legIdx=i; break; }
  }
  if (legIdx===-1) return {status:'error', message:'No PLANNED leg found. Use trayConfirmLocation for ad-hoc dispatch.'};
  
  // Verify that the tray is currently at the HOME centre before dispatching
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  var trayRowIdx = -1;
  for (var j=1; j<rrows.length; j++) {
    if (String(rrows[j][0]).trim()===p.trayId) { trayRowIdx=j; break; }
  }
  if (trayRowIdx===-1) return {status:'error', message:'Tray not found in registry'};
  var currentLoc = String(rrows[trayRowIdx][8] || 'UNCONFIRMED');
  var currentCentre = String(rrows[trayRowIdx][9] || '');
  var homeCentre = String(rrows[trayRowIdx][4] || '');
  var isAtHome = (currentLoc === 'HOME' || (currentLoc === 'UNCONFIRMED' && currentCentre === homeCentre));
  if (!isAtHome) {
    return {status:'error', message:'Tray is not currently at Home centre. Only the custodian centre can dispatch it.'};
  }

  var leg = hrows[legIdx];
  var today = new Date().toISOString().split('T')[0];
  hsh.getRange(legIdx+2, 10).setValue(today);
  hsh.getRange(legIdx+2, 12).setValue('SENT');
  var toCentre = String(leg[4]);
  var toInstructor = String(leg[6]);
  var fromCentre = String(leg[3]);
  var endDate = String(leg[8]);
  // Update registry
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  for (var j=1; j<rrows.length; j++) {
    if (String(rrows[j][0]).trim()===p.trayId) {
      rsh.getRange(j+1,9).setValue('ON_LOAN');
      rsh.getRange(j+1,10).setValue(toCentre);
      rsh.getRange(j+1,11).setValue(endDate);
      rsh.getRange(j+1,14).setValue('');
      rsh.getRange(j+1,15).setValue(toInstructor);
      break;
    }
  }
  var targets = _getInstructorsForCentre(ss, toCentre);
  if (toInstructor && toInstructor.trim() !== '' && targets.indexOf(toInstructor) === -1) {
    targets.push(toInstructor);
  }
  targets.forEach(function(name) {
    trayAddNotif(ss, name, 'incoming_tray', String(leg[0])+':'+p.trayId,
      '📦 Tray '+p.trayId+' is on its way from '+fromCentre+' ('+(p.instructor||'Home')+').'+(endDate?' Expected by '+endDate:''));
  });
  _notifyHomeDiamonds(ss, _getTrayHomeCentre(ss,p.trayId), p.instructor||'', 'tray_dispatched', String(leg[0])+':'+p.trayId,
    '📤 '+p.trayId+' dispatched to '+toCentre+(toInstructor?' ('+toInstructor+')':'')+(endDate?', due '+endDate:''));
  return {status:'ok', trayId:p.trayId, toCentre:toCentre, toInstructor:toInstructor};
}

// ── trayConfirmReceived ───────────────────────────────────────────────────────
// Borrowing instructor confirms they have the tray; updates history + notifies home.
// p: { trayId, histId?, instructor }
function trayConfirmReceived(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var hrows = trayRows(hsh);
  var legIdx = -1;
  for (var i=0; i<hrows.length; i++) {
    if (String(hrows[i][1])!==p.trayId) continue;
    if (p.histId && String(hrows[i][0])!==p.histId) continue;
    if (String(hrows[i][11])==='SENT') { legIdx=i; break; }
  }
  if (legIdx===-1) return {status:'error', message:'No SENT leg found for tray'};
  var leg = hrows[legIdx];
  var today = new Date().toISOString().split('T')[0];
  hsh.getRange(legIdx+2, 11).setValue(today);
  hsh.getRange(legIdx+2, 12).setValue('RECEIVED');
  // Mark BorrowerConfirmed in registry
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  for (var j=1; j<rrows.length; j++) {
    if (String(rrows[j][0]).trim()===p.trayId) {
      rsh.getRange(j+1,14).setValue('yes');
      break;
    }
  }
  var toCentre = String(leg[4]);
  var toInstructor = p.instructor || String(leg[6]);
  _notifyHomeDiamonds(ss, _getTrayHomeCentre(ss,p.trayId), '', 'tray_received', String(leg[0])+':'+p.trayId,
    '✅ '+p.trayId+' confirmed received at '+toCentre+(toInstructor?' by '+toInstructor:''));
  return {status:'ok', trayId:p.trayId, legId:String(leg[0])};
}

// ── trayConfirmDispatched ─────────────────────────────────────────────────────
// Borrowing centre forwards the tray to the next pre-planned leg (or back home).
// p: { trayId, histId?, instructor }
function trayConfirmDispatched(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var hrows = trayRows(hsh);
  var curIdx = -1;
  for (var i=0; i<hrows.length; i++) {
    if (String(hrows[i][1])!==p.trayId) continue;
    if (p.histId && String(hrows[i][0])!==p.histId) continue;
    var st = String(hrows[i][11]);
    if (st==='RECEIVED'||st==='SENT') { curIdx=i; break; }
  }
  if (curIdx===-1) return {status:'error', message:'No active leg found for tray'};
  var curLeg = hrows[curIdx];
  var curLegNum = parseInt(curLeg[2])||1;
  hsh.getRange(curIdx+2, 12).setValue('DISPATCHED');
  // Find next PLANNED leg
  var nextIdx = -1;
  for (var k=0; k<hrows.length; k++) {
    if (String(hrows[k][1])!==p.trayId) continue;
    if ((parseInt(hrows[k][2])||0)===(curLegNum+1) && String(hrows[k][11])==='PLANNED') { nextIdx=k; break; }
  }
  var today = new Date().toISOString().split('T')[0];
  var toCentre, toInstructor, endDate;
  if (nextIdx!==-1) {
    var nextLeg = hrows[nextIdx];
    hsh.getRange(nextIdx+2, 10).setValue(today);
    hsh.getRange(nextIdx+2, 12).setValue('SENT');
    toCentre = String(nextLeg[4]);
    toInstructor = String(nextLeg[6]);
    endDate = String(nextLeg[8]);
    var targets = _getInstructorsForCentre(ss, toCentre);
    if (toInstructor && toInstructor.trim() !== '' && targets.indexOf(toInstructor) === -1) {
      targets.push(toInstructor);
    }
    targets.forEach(function(name) {
      trayAddNotif(ss, name, 'incoming_tray', String(nextLeg[0])+':'+p.trayId,
        '📦 Tray '+p.trayId+' is on its way from '+String(curLeg[4])+(p.instructor?' ('+p.instructor+')':'')+'.'+(endDate?' Expected by '+endDate:''));
    });
  } else {
    // No next leg — returning home
    toCentre = _getTrayHomeCentre(ss, p.trayId);
    toInstructor = (CENTRE_HOME_INSTRUCTORS[toCentre]||[])[0] || '';
    endDate = '';
    var histId = trayHistId();
    hsh.appendRow([histId, p.trayId, curLegNum+1,
      String(curLeg[4]), toCentre, p.instructor||String(curLeg[6]), toInstructor,
      today, '', today, '', 'SENT']);
    var targets = _getInstructorsForCentre(ss, toCentre);
    if (toInstructor && toInstructor.trim() !== '' && targets.indexOf(toInstructor) === -1) {
      targets.push(toInstructor);
    }
    targets.forEach(function(name) {
      trayAddNotif(ss, name, 'incoming_tray', histId+':'+p.trayId,
        '📦 Tray '+p.trayId+' is returning home from '+String(curLeg[4])+(p.instructor?' ('+p.instructor+')':''));
    });
  }
  // Update registry
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  for (var j=1; j<rrows.length; j++) {
    if (String(rrows[j][0]).trim()===p.trayId) {
      rsh.getRange(j+1,9).setValue('ON_LOAN');
      rsh.getRange(j+1,10).setValue(toCentre);
      rsh.getRange(j+1,11).setValue(endDate);
      rsh.getRange(j+1,14).setValue('');
      rsh.getRange(j+1,15).setValue(toInstructor);
      break;
    }
  }
  _notifyHomeDiamonds(ss, _getTrayHomeCentre(ss,p.trayId), '', 'tray_forwarded', String(curLeg[0])+':'+p.trayId,
    '🔁 '+p.trayId+' forwarded: '+String(curLeg[4])+' → '+toCentre+(toInstructor?' ('+toInstructor+')':''));
  return {status:'ok', trayId:p.trayId, nextCentre:toCentre, nextInstructor:toInstructor};
}

// ── trayMarkInUse ─────────────────────────────────────────────────────────────
// Home instructor marks a home tray as in-use for a batch (occupies it without moving).
// p: { trayId, startDate?, endDate, instructor }
function trayMarkInUse(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  var homeCentre = '';
  for (var i=1; i<rrows.length; i++) {
    if (String(rrows[i][0]).trim()===p.trayId) {
      homeCentre = String(rrows[i][4]);
      rsh.getRange(i+1,9).setValue('IN_USE');
      rsh.getRange(i+1,11).setValue(p.endDate||'');
      break;
    }
  }
  var today = p.startDate || new Date().toISOString().split('T')[0];
  var histId = trayHistId();
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  hsh.appendRow([histId, p.trayId, 0,
    homeCentre, homeCentre,
    p.instructor||'', p.instructor||'',
    today, p.endDate||'', today, '', 'IN_USE']);
  return {status:'ok', trayId:p.trayId, histId:histId};
}

// ── trayMarkInUseDone ─────────────────────────────────────────────────────────
// Closes an IN_USE session and returns tray to HOME status.
// p: { trayId, histId? }
function trayMarkInUseDone(ss, p) {
  if (!p.trayId) return {status:'error', message:'Missing trayId'};
  ensureTraySheets(ss);
  var hsh = getTraySheet(ss, SH_TRAY_HISTORY);
  var hrows = trayRows(hsh);
  var today = new Date().toISOString().split('T')[0];
  for (var i=0; i<hrows.length; i++) {
    if (String(hrows[i][1])!==p.trayId) continue;
    if (p.histId && String(hrows[i][0])!==p.histId) continue;
    if (String(hrows[i][11])==='IN_USE') {
      hsh.getRange(i+2, 11).setValue(today);
      hsh.getRange(i+2, 12).setValue('RETURNED');
      break;
    }
  }
  var rsh = getTraySheet(ss, SH_TRAY_REGISTRY);
  var rrows = rsh.getDataRange().getValues();
  for (var j=1; j<rrows.length; j++) {
    if (String(rrows[j][0]).trim()===p.trayId) {
      rsh.getRange(j+1,9).setValue('HOME');
      rsh.getRange(j+1,11).setValue('');
      break;
    }
  }
  return {status:'ok', trayId:p.trayId};
}

// ── Diploma Release calculations & actions ───────────────────

// ── getInstructorEligibility ─────────────────────────────────────────
// Returns diploma eligibility data filtered to the instructor's batches.
// Used by the new Eligibility tab in the instructor portal.
function getInstructorEligibility(ss, p) {
  try {
    const instructor = String(p.instructor || '').trim();
    if (!instructor) return {status:'error', reason:'missing_instructor'};

    // Get all diploma data (reuse full list)
    const full = getDiplomaReleaseList(ss, p);
    if (full.status !== 'ok') return full;

    // Find batches assigned to this instructor. Use sessions as a fallback for
    // older batches whose assignment column was not populated yet.
    const myBatches = new Set();
    const shBatches = ss.getSheetByName(SH_BATCHES);
    const batchData = shBatches && shBatches.getLastRow() > 1
      ? shBatches.getRange(2, 1, shBatches.getLastRow()-1, 10).getValues() : [];
    batchData.forEach(r => {
      const batchCode = String(r[0] || '').toUpperCase();
      const hasSlot = detectSlotOrDate(r[4]);
      const assigned = hasSlot ? (r[9] || '') : (r[8] || r[9] || '');
      if (batchCode && sameName(assigned, instructor)) myBatches.add(batchCode);
    });

    const shSess = ss.getSheetByName(SH_SESSIONS);
    const sessData = shSess && shSess.getLastRow() > 1
      ? shSess.getRange(2, 1, shSess.getLastRow()-1, 9).getValues() : [];
    sessData.forEach(r => {
      if (sameName(String(r[4]).trim(), instructor)) myBatches.add(String(r[1]).toUpperCase());
    });

    // Filter list to instructor's batches only
    const filtered = full.list.filter(row => myBatches.has(String(row.batchCode).toUpperCase()));

    // Group by batch for summary
    const byBatch = {};
    filtered.forEach(row => {
      const bc = row.batchCode;
      if (!byBatch[bc]) byBatch[bc] = { batchCode: bc, centre: row.centre, course: row.course, students: [] };
      byBatch[bc].students.push(row);
    });

    const batches = Object.values(byBatch).map(b => {
      const eligible = b.students.filter(s => s.eligible).length;
      const total = b.students.length;
      return { ...b, eligibleCount: eligible, totalCount: total };
    });

    return { status:'ok', batches };
  } catch(err) {
    return { status:'error', message: err.toString() };
  }
}

// ── Portfolio Upload — SH_OT_RESPONSES stores link/file URL ──────────
// New sheet column: if Answers JSON starts with "PORTFOLIO:", treat as portfolio submission.
function otSubmitPortfolio(ss, p) {
  try {
    const testId    = String(p.testId    || '').trim().toUpperCase();
    const studentId = String(p.studentId || '').trim().toUpperCase();
    const batchCode = String(p.batchCode || '').trim().toUpperCase();
    const studentName = String(p.studentName || '').trim();
    const fileUrl   = String(p.fileUrl   || '').trim();  // Drive/iCloud/Dropbox link
    const notes     = String(p.notes     || '').trim();  // optional notes from student

    if (!testId || !studentId || !batchCode) return {status:'error', reason:'missing_params'};
    if (!fileUrl) return {status:'error', reason:'no_file_url'};

    ensureOnlineTestSheets(ss);
    const shR = ss.getSheetByName(SH_OT_RESPONSES);
    const shOT = ss.getSheetByName(SH_ONLINE_TESTS);

    // Verify test exists and is active/portfolio type
    const otRows = shOT.getLastRow() > 1 ? shOT.getRange(2,1,shOT.getLastRow()-1,23).getValues() : [];
    const testRow = otRows.find(r => String(r[0]).toUpperCase() === testId);
    if (!testRow) return {status:'error', reason:'test_not_found'};
    const testStatus = String(testRow[6] || '').toLowerCase();
    if (testStatus !== 'active') return {status:'error', reason:'test_not_active'};

    // Check for existing submission from this student
    const existing = shR.getLastRow() > 1 ? shR.getRange(2,1,shR.getLastRow()-1,16).getValues() : [];
    const alreadySubmitted = existing.some(r =>
      String(r[1]).toUpperCase() === testId && String(r[2]).toUpperCase() === studentId
    );
    if (alreadySubmitted) return {status:'error', reason:'already_submitted'};

    // Write response row — store portfolio payload as JSON in Answers JSON column (col 15)
    const responseId = 'PF-' + testId + '-' + studentId + '-' + Date.now();
    const portfolioPayload = JSON.stringify({ type:'portfolio', fileUrl, notes });
    const now = new Date();
    shR.appendRow([
      responseId, testId, studentId, studentName, batchCode,
      now, 'portfolio', 0, 0, 0, 0, 0, null, 'Pending',
      portfolioPayload, 1
    ]);

    return {status:'ok', responseId};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

// Returns all portfolio submissions for a test (instructor view)
function otGetPortfolioSubmissions(ss, p) {
  try {
    const testId = String(p.testId || '').trim().toUpperCase();
    if (!testId) return {status:'error', reason:'missing_test_id'};

    ensureOnlineTestSheets(ss);
    const shR = ss.getSheetByName(SH_OT_RESPONSES);
    const rows = shR.getLastRow() > 1 ? shR.getRange(2,1,shR.getLastRow()-1,16).getValues() : [];
    const submissions = rows
      .filter(r => String(r[1]).toUpperCase() === testId && String(r[6]) === 'portfolio')
      .map(r => {
        let payload = {};
        try { payload = JSON.parse(r[14]); } catch(e) {}
        return {
          responseId: r[0],
          studentId: r[2],
          studentName: r[3],
          batchCode: r[4],
          submittedAt: r[5],
          fileUrl: payload.fileUrl || '',
          notes: payload.notes || '',
          result: r[13],    // 'Pending' until graded
          score: r[10]      // filled when instructor grades
        };
      });

    return {status:'ok', submissions};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function getDiplomaReleaseList(ss, p) {
  try {
    const students = getStudentRows(ss);
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.id] = s;
    });

    const enrollments = getEnrollmentRows(ss).filter(e => e.status === 'Active');
    
    // ── Load HOD Approvals override mapping ──────────────────────────
    const shHod = ss.getSheetByName(SH_HOD_APPROVALS);
    const hodRows = shHod && shHod.getLastRow() > 1
      ? shHod.getRange(2, 1, shHod.getLastRow() - 1, 9).getValues() : [];
    const hodMap = {};
    hodRows.forEach(r => {
      const sid = String(r[1]).toUpperCase();
      const bc = String(r[2]).toUpperCase();
      const status = String(r[8]).trim();
      if (sid && bc) {
        hodMap[sid + '|' + bc] = status;
      }
    });
    
    const shBatches = ss.getSheetByName(SH_BATCHES);
    const batchData = shBatches && shBatches.getLastRow() > 1 
      ? shBatches.getRange(2, 1, shBatches.getLastRow() - 1, 10).getValues() 
      : [];
    const batchMap = {};
    batchData.forEach(r => {
      const code = String(r[0]).toUpperCase();
      batchMap[code] = {
        batchCode: code,
        centre: r[1] || '',
        course: r[2] || '',
        type: r[3] || '',
        start: r[5] || '',
        end: r[6] || ''
      };
    });

    const shSess = ss.getSheetByName(SH_SESSIONS);
    const sessionData = shSess && shSess.getLastRow() > 1 
      ? shSess.getRange(2, 1, shSess.getLastRow() - 1, 9).getValues() 
      : [];
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sessionsByBatch = {};
    sessionData.forEach(r => {
      const bc = String(r[1]).toUpperCase();
      const sessDateVal = r[2];
      const type = String(r[5] || '').toLowerCase();
      if (bc && sessDateVal && type !== 'cancelled') {
        const sDate = new Date(sessDateVal);
        if (sDate <= today) {
          if (!sessionsByBatch[bc]) sessionsByBatch[bc] = [];
          sessionsByBatch[bc].push(String(r[0]).toUpperCase());
        }
      }
    });

    const shFb = ss.getSheetByName(SH_FEEDBACK);
    const feedbackData = shFb && shFb.getLastRow() > 1 
      ? shFb.getRange(2, 1, shFb.getLastRow() - 1, 2).getValues()
      : [];
    
    const attendanceMap = {};
    feedbackData.forEach(r => {
      const sc = String(r[0]).toUpperCase();
      const sid = String(r[1]).toUpperCase();
      if (sc && sid) {
        attendanceMap[sid + '|' + sc] = true;
      }
    });

    const shAss = ss.getSheetByName(SH_ASSESSMENTS);
    const assData = shAss && shAss.getLastRow() > 1 
      ? shAss.getRange(2, 1, shAss.getLastRow() - 1, 4).getValues()
      : [];
    const assessmentsByBatch = {};
    assData.forEach(r => {
      const bc = String(r[1]).toUpperCase();
      if (bc) {
        if (!assessmentsByBatch[bc]) assessmentsByBatch[bc] = [];
        assessmentsByBatch[bc].push({
          assessmentId: String(r[0]).toUpperCase(),
          testName: r[2] || '',
          testType: r[3] || ''
        });
      }
    });

    const shMarks = ss.getSheetByName(SH_MARKS);
    const marksData = shMarks && shMarks.getLastRow() > 1
      ? shMarks.getRange(2, 1, shMarks.getLastRow() - 1, 9).getValues()
      : [];

    const marksByAssAndStudent = {};
    const assessmentHasGrades = {};
    marksData.forEach(r => {
      const assId = String(r[0]).toUpperCase();
      const sid = String(r[1]).toUpperCase();
      if (assId && sid) {
        marksByAssAndStudent[sid + '|' + assId] = {
          marks: r[3],
          pct: r[4]
        };
        assessmentHasGrades[assId] = true;
      }
    });

    // ── Load OT (Online Test) results for unified scoring ──────────
    const shOT = ss.getSheetByName(SH_ONLINE_TESTS);
    const otTestRows = shOT && shOT.getLastRow() > 1
      ? shOT.getRange(2, 1, shOT.getLastRow() - 1, 23).getValues() : [];
    const otTestMap = {};
    otTestRows.forEach(r => {
      const tid = String(r[0]).toUpperCase();
      if (tid) otTestMap[tid] = {
        testLabel: r[1] || '',
        testType: String(r[2] || '').trim(),
        batchCodes: String(r[3] || '').split(',').map(b => b.trim().toUpperCase()).filter(Boolean),
        resultsReleased: String(r[11]) === 'Yes'
      };
    });

    const shOTR = ss.getSheetByName(SH_OT_RESPONSES);
    const otResponseRows = shOTR && shOTR.getLastRow() > 1
      ? shOTR.getRange(2, 1, shOTR.getLastRow() - 1, 16).getValues() : [];
    // Best score per student per test (handles retakes)
    const otBestByStudentTest = {};
    otResponseRows.forEach(r => {
      const testId = String(r[1]).toUpperCase();
      const studentId = String(r[2]).toUpperCase();
      const batchCode = String(r[4]).toUpperCase();
      const pct = parseFloat(r[12]) || 0;
      const t = otTestMap[testId];
      if (!t || !t.resultsReleased) return;
      const key = studentId + '~~' + testId;
      if (!otBestByStudentTest[key] || pct > otBestByStudentTest[key].pct) {
        otBestByStudentTest[key] = { pct, batchCode, testType: t.testType, testLabel: t.testLabel, testId };
      }
    });
    // Group by student|batch → array of scored entries
    const otScoresByStudentBatch = {};
    Object.values(otBestByStudentTest).forEach(entry => {
      const sbKey = entry.batchCode ? (entry.batchCode + '~~' + entry.testId.split('~~')[0]) : null;
      // Re-derive: group by studentId+batchCode
    });
    // Simpler: rebuild from otBestByStudentTest
    const otScoresBySB = {};
    Object.keys(otBestByStudentTest).forEach(key => {
      const entry = otBestByStudentTest[key];
      const studentId = key.split('~~')[0];
      const sbKey = studentId + '|' + entry.batchCode;
      if (!otScoresBySB[sbKey]) otScoresBySB[sbKey] = [];
      otScoresBySB[sbKey].push({ testType: entry.testType, testLabel: entry.testLabel, pct: entry.pct });
    });

    const list = [];
    enrollments.forEach(e => {
      const batchCode = String(e.batchCode).toUpperCase();
      const studentId = String(e.studentId).toUpperCase();
      const batch = batchMap[batchCode];
      
      if (!batch) return;

      const student = studentMap[studentId];
      const studentName = student ? student.name : studentId;

      const batchSessionCodes = sessionsByBatch[batchCode] || [];
      const totalSessions = batchSessionCodes.length;
      let attended = 0;
      batchSessionCodes.forEach(sc => {
        if (attendanceMap[studentId + '|' + sc]) {
          attended++;
        }
      });
      const attendancePct = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

      const batchAssessments = assessmentsByBatch[batchCode] || [];

      // Helper: classify a test as Weekly or Final by type field first,
      // then fall back to test name keywords (for tests entered before
      // Weekly/Final were added as explicit type options).
      function isWeeklyTest(a) {
        const t = String(a.testType || '').toLowerCase();
        const n = String(a.testName || '').toLowerCase();
        if (t === 'weekly') return true;
        if (t === 'final' || t === 're-test') return false;
        // name-based fallback — if name contains 'final' it's a final, otherwise treat as weekly
        // (covers 'Test 1', 'Test 2', 'Weekly Test', etc.)
        return n.indexOf('final') === -1;
      }
      function isFinalTest(a) {
        const t = String(a.testType || '').toLowerCase();
        const n = String(a.testName || '').toLowerCase();
        if (t === 'final') return true;
        if (t === 'weekly' || t === 're-test') return false;
        // name-based fallback
        return n.indexOf('final') !== -1;
      }

      // ── Collect weekly scores from both Manual + OT sources ──
      const manualWeeklyScores = [];
      const onlineWeeklyScores = [];

      // Manual assessment weekly scores
      const weeklyAssessments = batchAssessments.filter(a => isWeeklyTest(a) && assessmentHasGrades[a.assessmentId]);
      weeklyAssessments.forEach(a => {
        const markRow = marksByAssAndStudent[studentId + '|' + a.assessmentId];
        if (markRow && markRow.pct !== 'DNA' && markRow.pct !== '' && markRow.pct !== null && markRow.pct !== undefined) {
          const pctVal = Number(markRow.pct);
          if (!isNaN(pctVal)) manualWeeklyScores.push(pctVal);
        }
      });

      // OT system weekly scores
      const otStudentScores = otScoresBySB[studentId + '|' + batchCode] || [];
      otStudentScores.forEach(entry => {
        const tl = String(entry.testType || '').toLowerCase();
        const nl = String(entry.testLabel || '').toLowerCase();
        // Match isWeeklyTest logic: weekly if testType is 'weekly', or if testType is
        // not 'final'/'re-test' and the label doesn't contain 'final'.
        const isW = tl === 'weekly' ||
          (tl !== 'final' && tl !== 're-test' && nl.indexOf('final') === -1);
        if (isW) onlineWeeklyScores.push(entry.pct);
      });

      // Average all entered manual weekly marks and all conducted online weekly tests.
      const allWeeklyScores = manualWeeklyScores.concat(onlineWeeklyScores);
      const weeklyAvg = allWeeklyScores.length > 0
        ? Math.round(allWeeklyScores.reduce((s, v) => s + v, 0) / allWeeklyScores.length)
        : null;

      // ── Final exam — best from both sources ───────────────────────
      let finalExamScore = null;

      const finalExams = batchAssessments.filter(a => isFinalTest(a) && assessmentHasGrades[a.assessmentId]);
      finalExams.forEach(a => {
        const markRow = marksByAssAndStudent[studentId + '|' + a.assessmentId];
        if (markRow && markRow.pct !== 'DNA' && markRow.pct !== '') {
          const pctVal = Number(markRow.pct) || 0;
          if (finalExamScore === null || pctVal > finalExamScore) finalExamScore = pctVal;
        }
      });

      // OT final scores
      otStudentScores.forEach(entry => {
        const tl = String(entry.testType || '').toLowerCase();
        const nl = String(entry.testLabel || '').toLowerCase();
        const isF = tl === 'final' ||
          (tl !== 'weekly' && tl !== 're-test' && nl.indexOf('final') !== -1);
        if (isF && (finalExamScore === null || entry.pct > finalExamScore)) {
          finalExamScore = entry.pct;
        }
      });

      const attendancePass = attendancePct >= 75;
      const weeklyPass = weeklyAvg !== null && weeklyAvg >= 60;
      const finalPass = finalExamScore !== null && finalExamScore >= 60;
      const hodStatus = hodMap[studentId + '|' + batchCode] || '';
      // Attendance is shown as a warning but does NOT gate diploma eligibility.
      // Only marks (weekly avg ≥60% AND final ≥60%) or HOD approval determine eligible status.
      const eligible = (weeklyPass && finalPass) || (hodStatus === 'Approved');

      list.push({
        studentId,
        studentName,
        batchCode,
        centre: batch.centre,
        course: batch.course,
        attendance: {
          attended,
          total: totalSessions,
          pct: attendancePct,
          pass: attendancePass
        },
        weeklyAvg: {
          value: weeklyAvg,
          pass: weeklyPass,
          manualCount: manualWeeklyScores.length,
          onlineCount: onlineWeeklyScores.length
        },
        finalExam: {
          value: finalExamScore,
          pass: finalPass
        },
        eligible,
        hodStatus,
        diplomaStatus: e.diplomaStatus || '',
        diplomaReleasedBy: e.diplomaReleasedBy || '',
        diplomaReleasedAt: e.diplomaReleasedAt || '',
        rowIndex: e.rowIndex || null,
        source: e.source || ''
      });
    });

    return {
      status: 'ok',
      list
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.toString()
    };
  }
}

function releaseStudentDiploma(ss, p) {
  try {
    const studentId = String(p.studentId || '').trim().toUpperCase();
    const batchCode = String(p.batchCode || '').trim().toUpperCase();
    const counselor = String(p.counselorName || '').trim();
    
    if (!studentId || !batchCode) {
      return {status: 'error', reason: 'missing_params'};
    }
    
    const shEn = ss.getSheetByName(SH_ENROLLMENTS);
    if (!shEn) {
      return {status: 'error', reason: 'sheet_not_found'};
    }
    
    ensureEnrollmentHeaders(shEn);
    
    const lastRow = shEn.getLastRow();
    let foundRowIndex = -1;
    
    if (lastRow > 1) {
      const data = shEn.getRange(2, 1, lastRow - 1, 4).getValues();
      for (let i = 0; i < data.length; i++) {
        if (String(data[i][0]).toUpperCase() === studentId && String(data[i][1]).toUpperCase() === batchCode && String(data[i][2]) === 'Active') {
          foundRowIndex = i + 2;
          break;
        }
      }
    }
    
    if (foundRowIndex === -1) {
      const shStud = ss.getSheetByName(SH_STUDENTS);
      let legacyExists = false;
      if (shStud && shStud.getLastRow() > 1) {
        const studData = shStud.getRange(2, 1, shStud.getLastRow() - 1, 7).getValues();
        for (let i = 0; i < studData.length; i++) {
          if (String(studData[i][0]).toUpperCase() === studentId && String(studData[i][1]).toUpperCase() === batchCode && String(studData[i][6]) === 'Active') {
            legacyExists = true;
            break;
          }
        }
      }
      
      if (legacyExists) {
        shEn.appendRow([studentId, batchCode, 'Active', new Date().toISOString(), 'Released', counselor, new Date().toISOString()]);
        return {status: 'ok', rowIndex: shEn.getLastRow()};
      } else {
        return {status: 'error', reason: 'enrollment_not_found'};
      }
    }
    
    shEn.getRange(foundRowIndex, 5, 1, 3).setValues([['Released', counselor, new Date().toISOString()]]);
    return {status: 'ok', rowIndex: foundRowIndex};
  } catch (err) {
    return {status: 'error', message: err.toString()};
  }
}

// ── NEW HELPER FUNCTIONS ──

function getUpcomingBatches(ss, p) {
  try {
    const instructor = String(p.instructor || '').trim();
    if (!instructor) return {status:'error', reason:'missing_instructor'};
    const sh = ss.getSheetByName(SH_BATCHES);
    if (!sh || sh.getLastRow() < 2) return {status:'ok', batches:[]};
    const data = sh.getRange(2, 1, sh.getLastRow()-1, 10).getValues();
    const today = new Date(); today.setHours(0,0,0,0);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const batches = data.filter(r => {
      if (!r[0]) return false;
      const hasSlot = detectSlotOrDate(r[4]);
      const assigned = hasSlot ? (r[9] || '') : (r[8] || r[9] || '');
      if (!sameName(assigned, instructor)) return false;
      const startRaw = hasSlot ? r[5] : r[4];
      if (!startRaw) return false;
      const sD = new Date(startRaw);
      return !isNaN(sD) && sD >= today && sD <= in30;
    }).map(r => {
      const hasSlot = detectSlotOrDate(r[4]);
      const startRaw = hasSlot ? r[5] : r[4];
      const endRaw = hasSlot ? r[6] : r[5];
      const sD = new Date(startRaw);
      const daysToStart = Math.ceil((sD.getTime() - today.getTime()) / (86400000));
      return {
        batchCode: r[0],
        centre: r[1],
        course: r[2],
        type: r[3],
        startDate: sD.toLocaleDateString('en-IN'),
        endDate: endRaw ? new Date(endRaw).toLocaleDateString('en-IN') : '',
        daysToStart,
        startingSoon: daysToStart <= 7
      };
    });
    return {status:'ok', batches};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function submitHODApprovalRequest(ss, p) {
  try {
    const studentId = String(p.studentId || '').trim().toUpperCase();
    const batchCode = String(p.batchCode || '').trim().toUpperCase();
    const studentName = String(p.studentName || '').trim();
    const weeklyAvg = String(p.weeklyAvg || '').trim();
    const finalExam = String(p.finalExam || '').trim();
    const requestedBy = String(p.counselorName || '').trim();
    if (!studentId || !batchCode) return {status:'error', reason:'missing_params'};
    
    const sh = ss.getSheetByName(SH_HOD_APPROVALS);
    if (!sh) return {status:'error', reason:'no_sheet'};
    
    if (sh.getLastRow() > 1) {
      const data = sh.getRange(2, 1, sh.getLastRow()-1, 9).getValues();
      const exists = data.some(r => String(r[1]).toUpperCase() === studentId && String(r[2]).toUpperCase() === batchCode);
      if (exists) return {status:'error', reason:'request_already_exists'};
    }
    
    const appId = 'APP-' + Date.now();
    sh.appendRow([
      appId, studentId, batchCode, studentName, weeklyAvg, finalExam,
      requestedBy, new Date().toISOString(), 'Pending', '', '', ''
    ]);
    return {status:'ok', approvalId: appId};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function getPendingHODApprovals(ss, p) {
  try {
    const sh = ss.getSheetByName(SH_HOD_APPROVALS);
    if (!sh || sh.getLastRow() < 2) return {status:'ok', list:[]};
    const data = sh.getRange(2, 1, sh.getLastRow()-1, 12).getValues();
    const list = data.filter(r => r[0]).map((r, i) => ({
      approvalId: r[0],
      studentId: r[1],
      batchCode: r[2],
      studentName: r[3],
      weeklyAvg: r[4],
      finalExam: r[5],
      requestedBy: r[6],
      requestedAt: r[7],
      status: r[8],
      reviewedBy: r[9],
      reviewedAt: r[10],
      note: r[11],
      rowIndex: i + 2
    }));
    return {status:'ok', list};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function reviewHODApproval(ss, p) {
  try {
    const appId = String(p.approvalId || '').trim();
    const status = String(p.status || '').trim();
    const adminName = String(p.adminName || 'Sunil Sharma').trim();
    const note = String(p.note || '').trim();
    if (!appId || !status) return {status:'error', reason:'missing_params'};
    
    const sh = ss.getSheetByName(SH_HOD_APPROVALS);
    if (!sh || sh.getLastRow() < 2) return {status:'error', reason:'no_sheet'};
    const data = sh.getRange(2, 1, sh.getLastRow()-1, 1).getValues();
    let rowIndex = -1;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]) === appId) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex === -1) return {status:'error', reason:'request_not_found'};
    
    sh.getRange(rowIndex, 9, 1, 4).setValues([[
      status, adminName, new Date().toISOString(), note
    ]]);
    return {status:'ok'};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function getInventoryStock(ss, p) {
  try {
    const centre = String(p.centre || '').trim();
    
    const shItems = ss.getSheetByName(SH_INV_ITEMS);
    const itemsData = shItems && shItems.getLastRow() > 1 ? shItems.getRange(2, 1, shItems.getLastRow()-1, 4).getValues() : [];
    const items = itemsData.filter(r => r[0]).map(r => ({
      itemId: r[0],
      itemName: r[1],
      category: r[2],
      unit: r[3]
    }));
    
    const shStock = ss.getSheetByName(SH_INV_STOCK);
    const stockData = shStock && shStock.getLastRow() > 1 ? shStock.getRange(2, 1, shStock.getLastRow()-1, 4).getValues() : [];
    
    const stockMap = {};
    stockData.forEach(r => {
      const sc = String(r[1]).trim();
      const sItemId = String(r[2]).trim();
      const qty = Number(r[3]) || 0;
      if (!centre || sc === centre) {
        stockMap[sItemId] = (stockMap[sItemId] || 0) + qty;
      }
    });
    
    const list = items.map(item => ({
      ...item,
      quantity: stockMap[item.itemId] || 0
    }));
    
    return {status:'ok', list};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function submitInventoryRequest(ss, p) {
  try {
    const centre = String(p.centre || '').trim();
    const itemId = String(p.itemId || '').trim();
    const qty = Number(p.quantity) || 0;
    const urgency = String(p.urgency || 'Medium').trim();
    const note = String(p.note || '').trim();
    const requestedBy = String(p.counselorName || '').trim();
    
    if (!centre || !itemId || qty <= 0) return {status:'error', reason:'missing_params'};
    
    const shReq = ss.getSheetByName(SH_INV_REQUESTS);
    if (!shReq) return {status:'error', reason:'no_sheet'};
    
    const reqId = 'REQ-' + Date.now();
    shReq.appendRow([
      reqId, centre, itemId, qty, urgency, note,
      requestedBy, new Date().toISOString(), 'Pending', '', ''
    ]);
    return {status:'ok', requestId: reqId};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function getInventoryRequests(ss, p) {
  try {
    const centre = String(p.centre || '').trim();
    const shReq = ss.getSheetByName(SH_INV_REQUESTS);
    if (!shReq || shReq.getLastRow() < 2) return {status:'ok', list:[]};
    
    const reqData = shReq.getRange(2, 1, shReq.getLastRow()-1, 11).getValues();
    
    const shItems = ss.getSheetByName(SH_INV_ITEMS);
    const itemsData = shItems && shItems.getLastRow() > 1 ? shItems.getRange(2, 1, shItems.getLastRow()-1, 2).getValues() : [];
    const itemMap = {};
    itemsData.forEach(r => { if(r[0]) itemMap[r[0]] = r[1]; });
    
    const shDisp = ss.getSheetByName(SH_INV_DISPATCH);
    const dispData = shDisp && shDisp.getLastRow() > 1 ? shDisp.getRange(2, 1, shDisp.getLastRow()-1, 7).getValues() : [];
    const dispMap = {};
    dispData.forEach(r => {
      const rId = String(r[1]).trim();
      if(rId) {
        dispMap[rId] = {
          dispatchId: r[0],
          qtyDispatched: r[2],
          dispatchDate: r[3],
          courierInfo: r[4]
        };
      }
    });
    
    const list = reqData.filter(r => r[0]).map((r, i) => {
      const rId = String(r[0]).trim();
      return {
        requestId: rId,
        centre: r[1],
        itemId: r[2],
        itemName: itemMap[r[2]] || r[2],
        quantityRequested: r[3],
        urgency: r[4],
        note: r[5],
        requestedBy: r[6],
        requestedAt: r[7],
        status: r[8],
        approvedBy: r[9],
        approvedAt: r[10],
        dispatch: dispMap[rId] || null,
        rowIndex: i + 2
      };
    }).filter(r => !centre || r.centre === centre);
    
    return {status:'ok', list};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function processInventoryDispatch(ss, p) {
  try {
    const reqId = String(p.requestId || '').trim();
    const qty = Number(p.qtyDispatched) || 0;
    const courierInfo = String(p.courierInfo || '').trim();
    const adminName = String(p.adminName || 'Admin').trim();
    
    if (!reqId || qty <= 0) return {status:'error', reason:'missing_params'};
    
    const shReq = ss.getSheetByName(SH_INV_REQUESTS);
    const reqData = shReq.getLastRow() > 1 ? shReq.getRange(2, 1, shReq.getLastRow()-1, 1).getValues() : [];
    let rowIndex = -1;
    for (let i = 0; i < reqData.length; i++) {
      if (String(reqData[i][0]) === reqId) {
        rowIndex = i + 2;
        break;
      }
    }
    if (rowIndex === -1) return {status:'error', reason:'request_not_found'};
    
    shReq.getRange(rowIndex, 9, 1, 3).setValues([[
      'Dispatched', adminName, new Date().toISOString()
    ]]);
    
    const shDisp = ss.getSheetByName(SH_INV_DISPATCH);
    const dispId = 'DSP-' + Date.now();
    shDisp.appendRow([
      dispId, reqId, qty, new Date().toISOString(), courierInfo, adminName, new Date().toISOString()
    ]);
    
    return {status:'ok'};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function confirmInventoryReceived(ss, p) {
  try {
    const reqId = String(p.requestId || '').trim();
    const counselor = String(p.counselorName || '').trim();
    
    if (!reqId) return {status:'error', reason:'missing_params'};
    
    const shReq = ss.getSheetByName(SH_INV_REQUESTS);
    const reqRows = shReq.getLastRow() > 1 ? shReq.getRange(2, 1, shReq.getLastRow()-1, 9).getValues() : [];
    let rowIndex = -1;
    let centre = '', itemId = '', qtyRequested = 0;
    for (let i = 0; i < reqRows.length; i++) {
      if (String(reqRows[i][0]) === reqId) {
        rowIndex = i + 2;
        centre = reqRows[i][1];
        itemId = reqRows[i][2];
        qtyRequested = Number(reqRows[i][3]) || 0;
        break;
      }
    }
    if (rowIndex === -1) return {status:'error', reason:'request_not_found'};
    
    shReq.getRange(rowIndex, 9).setValue('Received');
    
    const shStock = ss.getSheetByName(SH_INV_STOCK);
    const stockRows = shStock.getLastRow() > 1 ? shStock.getRange(2, 1, shStock.getLastRow()-1, 4).getValues() : [];
    let stockRowIndex = -1;
    for (let i = 0; i < stockRows.length; i++) {
      if (String(stockRows[i][1]).trim() === centre && String(stockRows[i][2]).trim() === itemId) {
        stockRowIndex = i + 2;
        break;
      }
    }
    
    if (stockRowIndex !== -1) {
      const existingQty = Number(shStock.getRange(stockRowIndex, 4).getValue()) || 0;
      shStock.getRange(stockRowIndex, 4).setValue(existingQty + qtyRequested);
      shStock.getRange(stockRowIndex, 5, 1, 2).setValues([[new Date().toISOString(), counselor]]);
    } else {
      const stockId = 'STK-' + Date.now();
      shStock.appendRow([stockId, centre, itemId, qtyRequested, new Date().toISOString(), counselor]);
    }
    
    return {status:'ok'};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function registerVendor(ss, p) {
  try {
    const name = String(p.vendorName || '').trim();
    const contact = String(p.contactPerson || '').trim();
    const phone = String(p.phone || '').trim();
    const email = String(p.email || '').trim();
    const address = String(p.address || '').trim();
    const items = String(p.suppliedItems || '').trim();
    const registeredBy = String(p.adminName || 'Admin').trim();
    
    if (!name) return {status:'error', reason:'missing_params'};
    
    const shVen = ss.getSheetByName(SH_INV_VENDORS);
    if (!shVen) return {status:'error', reason:'no_sheet'};
    
    const vendorId = 'VEN-' + Date.now();
    shVen.appendRow([
      vendorId, name, contact, phone, email, address, items, registeredBy, new Date().toISOString()
    ]);
    return {status:'ok', vendorId};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

function getVendors(ss, p) {
  try {
    const shVen = ss.getSheetByName(SH_INV_VENDORS);
    if (!shVen || shVen.getLastRow() < 2) return {status:'ok', list:[]};
    const data = shVen.getRange(2, 1, shVen.getLastRow()-1, 9).getValues();
    const list = data.filter(r => r[0]).map(r => ({
      vendorId: r[0],
      vendorName: r[1],
      contactPerson: r[2],
      phone: r[3],
      email: r[4],
      address: r[5],
      suppliedItems: r[6],
      registeredBy: r[7],
      registeredAt: r[8]
    }));
    return {status:'ok', list};
  } catch(err) {
    return {status:'error', message: err.toString()};
  }
}

// ── Inventory Item Master ────────────────────────────────────────────────────

function getInventoryItemMaster(ss, p) {
  try {
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    if (!sh || sh.getLastRow() < 2) return {status:'ok', list:[]};
    // Read up to 10 cols (cols 9=vendorId, 10=costLocked may not exist yet)
    var lastCol = sh.getLastColumn();
    var colCount = Math.max(lastCol, 8);
    var data = sh.getRange(2, 1, sh.getLastRow()-1, colCount).getValues();

    // Build vendor lookup map
    var vendorMap = {};
    var shVen = ss.getSheetByName(SH_INV_VENDORS);
    if (shVen && shVen.getLastRow() > 1) {
      var vData = shVen.getRange(2, 1, shVen.getLastRow()-1, 5).getValues();
      vData.forEach(function(v) {
        if (v[0]) vendorMap[String(v[0])] = { vendorId: v[0], vendorName: v[1], contactPerson: v[2], phone: v[3], email: v[4] };
      });
    }

    var list = data.filter(function(r){return r[0];}).map(function(r,i){
      var vendorId = colCount >= 9 ? String(r[8]||'') : '';
      var costLocked = colCount >= 10 ? (r[9] === true || r[9] === 'TRUE' || r[9] === 'true') : false;
      var vendor = vendorId && vendorMap[vendorId] ? vendorMap[vendorId] : null;
      return {
        itemId: r[0], itemName: r[1], category: r[2], unit: r[3],
        reorderLevel: Number(r[4])||0, unitCost: Number(r[5])||0,
        notes: r[6]||'', rowIndex: i+2,
        vendorId: vendorId, costLocked: costLocked,
        vendorName: vendor ? vendor.vendorName : '',
        vendorContact: vendor ? vendor.contactPerson : '',
        vendorPhone: vendor ? vendor.phone : '',
        vendorEmail: vendor ? vendor.email : ''
      };
    });
    return {status:'ok', list:list};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function addInventoryItem(ss, p) {
  try {
    var itemName = String(p.itemName||'').trim();
    var category = String(p.category||'').trim();
    var unit = String(p.unit||'Pcs').trim();
    var reorderLevel = Number(p.reorderLevel)||0;
    var unitCost = Number(p.unitCost)||0;
    var notes = String(p.notes||'').trim();
    var vendorId = String(p.vendorId||'').trim();
    var costLocked = (unitCost > 0 && p.costLocked === true) ? true : false;
    if (!itemName||!category) return {status:'error', reason:'missing_params'};
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    if (!sh) return {status:'error', reason:'no_sheet'};
    var itemId = 'ITEM-' + String(sh.getLastRow()).padStart(3,'0');
    sh.appendRow([itemId, itemName, category, unit, reorderLevel, unitCost, notes, new Date().toISOString(), vendorId, costLocked]);
    return {status:'ok', itemId:itemId};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function updateInventoryItem(ss, p) {
  try {
    var itemId = String(p.itemId||'').trim();
    var itemName = String(p.itemName||'').trim();
    if (!itemId||!itemName) return {status:'error', reason:'missing_params'};
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    var lastCol = sh.getLastColumn();
    var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,Math.max(lastCol,10)).getValues() : [];
    var rowIndex = -1; var existingRow = null;
    for (var i=0;i<rows.length;i++) { if(String(rows[i][0])===itemId){rowIndex=i+2; existingRow=rows[i]; break;} }
    if (rowIndex===-1) return {status:'error', reason:'not_found'};

    // Cost lock logic
    var existingCost = Number(existingRow[5])||0;
    var newCost = Number(p.unitCost)||0;
    var existingLocked = (existingRow[9] === true || existingRow[9] === 'TRUE' || existingRow[9] === 'true');
    var costChanged = newCost !== existingCost;

    // Determine new lock state
    var newLocked = existingLocked;
    if (p.forceUnlock === true) newLocked = false;   // explicit unlock
    if (p.lockCost === true) newLocked = true;         // explicit lock
    // Auto-lock when cost is set for first time (was 0, now >0)
    if (existingCost === 0 && newCost > 0 && p.lockCost !== false) newLocked = true;

    // Annotate notes with audit trail if locked cost was changed
    var notes = String(p.notes||existingRow[6]||'').trim();
    if (existingLocked && costChanged && p.forceUnlock === true) {
      var auditNote = '[Cost changed from ₹' + existingCost + ' to ₹' + newCost + ' on ' + new Date().toLocaleDateString('en-IN') + ']';
      notes = notes ? notes + ' ' + auditNote : auditNote;
    }

    var vendorId = String(p.vendorId !== undefined ? p.vendorId : (existingRow[8]||'')).trim();

    // Write cols 2-7 (name, category, unit, reorderLevel, unitCost, notes)
    sh.getRange(rowIndex,2,1,6).setValues([[
      itemName, String(p.category||existingRow[2]||''), String(p.unit||existingRow[3]||'Pcs'),
      Number(p.reorderLevel !== undefined ? p.reorderLevel : existingRow[4])||0,
      newCost, notes
    ]]);
    // Write cols 9-10 (vendorId, costLocked) — expand sheet if needed
    sh.getRange(rowIndex,9,1,2).setValues([[vendorId, newLocked]]);
    return {status:'ok', costLocked: newLocked};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function deleteInventoryItem(ss, p) {
  try {
    var itemId = String(p.itemId||'').trim();
    if (!itemId) return {status:'error', reason:'missing_params'};
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,1).getValues() : [];
    for (var i=0;i<rows.length;i++) {
      if (String(rows[i][0])===itemId) { sh.deleteRow(i+2); return {status:'ok'}; }
    }
    return {status:'error', reason:'not_found'};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

// ── Update Branch Stock ──────────────────────────────────────────────────────

function updateBranchStock(ss, p) {
  try {
    var centre = String(p.centre||'').trim();
    var itemId = String(p.itemId||'').trim();
    var quantity = Number(p.quantity !== undefined ? p.quantity : p.qty);
    var updatedBy = String(p.updatedBy||'Admin').trim();
    if (!centre||!itemId||isNaN(quantity)) return {status:'error', reason:'missing_params'};
    var sh = ss.getSheetByName(SH_INV_STOCK);
    if (!sh) return {status:'error', reason:'no_sheet'};
    var rows = sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,3).getValues() : [];
    var rowIndex = -1;
    for (var i=0;i<rows.length;i++) {
      if (String(rows[i][1]).trim()===centre && String(rows[i][2]).trim()===itemId) { rowIndex=i+2; break; }
    }
    var now = new Date().toISOString();
    if (rowIndex!==-1) {
      sh.getRange(rowIndex,4,1,3).setValues([[quantity, now, updatedBy]]);
    } else {
      sh.appendRow(['STK-'+Date.now(), centre, itemId, quantity, now, updatedBy]);
    }
    return {status:'ok'};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

// ── Course Bundles ───────────────────────────────────────────────────────────

var INV_COURSE_BUNDLES = {
  'Diamond Graduate (DG)': [
    {itemId:'ITEM-001',name:'DG Course Workbook',qty:1},
    {itemId:'ITEM-002',name:'DG Study Cards',qty:1},
    {itemId:'ITEM-003',name:'Diamond Grading Report (Practice)',qty:1},
    {itemId:'ITEM-004',name:'Stone Paper Parcel (Small)',qty:5},
    {itemId:'ITEM-005',name:'Envelope (Medium)',qty:2},
    {itemId:'ITEM-006',name:'Loupe 10x (Student)',qty:1},
    {itemId:'ITEM-012',name:'DG Welcome Kit Folder',qty:1},
    {itemId:'ITEM-049',name:'IGI Pen (Branded)',qty:1}
  ],
  'Colored Stone Graduate (CSG)': [
    {itemId:'ITEM-016',name:'CSG Course Workbook',qty:1},
    {itemId:'ITEM-017',name:'CSG Study Cards',qty:1},
    {itemId:'ITEM-018',name:'Color Stone Report (Practice)',qty:1},
    {itemId:'ITEM-022',name:'Stone Paper Parcel (Small) CSG',qty:5},
    {itemId:'ITEM-027',name:'Envelope (Large)',qty:2},
    {itemId:'ITEM-006',name:'Loupe 10x (Student)',qty:1},
    {itemId:'ITEM-024',name:'CSG Welcome Kit Folder',qty:1},
    {itemId:'ITEM-049',name:'IGI Pen (Branded)',qty:1}
  ],
  'Jewelry Design Graduate (JDG)': [
    {itemId:'ITEM-028',name:'JDG Course Workbook',qty:1},
    {itemId:'ITEM-029',name:'Sketching Pencils Set (12)',qty:1},
    {itemId:'ITEM-030',name:'Drawing Paper Pad A3',qty:1},
    {itemId:'ITEM-031',name:'Eraser (Art)',qty:1},
    {itemId:'ITEM-032',name:'Pencil Sharpener',qty:1},
    {itemId:'ITEM-033',name:'Color Pencils Set (24)',qty:1},
    {itemId:'ITEM-036',name:'A4 Gateway Sheet',qty:2},
    {itemId:'ITEM-038',name:'JDG Welcome Kit Folder',qty:1},
    {itemId:'ITEM-049',name:'IGI Pen (Branded)',qty:1}
  ],
  'Pearls & Gem Graduate (PGG)': [
    {itemId:'ITEM-040',name:'PGG Course Workbook',qty:1},
    {itemId:'ITEM-041',name:'Pearl Strand (Practice)',qty:1},
    {itemId:'ITEM-044',name:'Stone Paper Parcel (Small) PGG',qty:3},
    {itemId:'ITEM-045',name:'Envelope (Medium) PGG',qty:2},
    {itemId:'ITEM-047',name:'PGG Welcome Kit Folder',qty:1},
    {itemId:'ITEM-049',name:'IGI Pen (Branded)',qty:1}
  ]
};

function getCourseBundles(ss, p) {
  try {
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    var itemsData = sh && sh.getLastRow()>1 ? sh.getRange(2,1,sh.getLastRow()-1,4).getValues() : [];
    var itemMap = {};
    itemsData.forEach(function(r){ if(r[0]) itemMap[String(r[0])] = {name:r[1],unit:r[3]}; });
    var bundles = Object.keys(INV_COURSE_BUNDLES).map(function(courseName){
      return {
        course: courseName,
        items: INV_COURSE_BUNDLES[courseName].map(function(bi){
          return {
            itemId: bi.itemId,
            name: itemMap[bi.itemId] ? itemMap[bi.itemId].name : bi.name,
            unit: itemMap[bi.itemId] ? itemMap[bi.itemId].unit : 'Pcs',
            qtyPerStudent: bi.qty
          };
        })
      };
    });
    return {status:'ok', bundles:bundles};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function submitCourseBundleRequest(ss, p) {
  try {
    var centre = String(p.centre||'').trim();
    var courseName = String(p.courseName||'').trim();
    var numStudents = Number(p.numStudents)||0;
    var urgency = String(p.urgency||'Medium').trim();
    var note = String(p.note||'').trim();
    var requestedBy = String(p.counselorName||'').trim();
    if (!centre||!courseName||numStudents<=0) return {status:'error', reason:'missing_params'};
    var bundle = INV_COURSE_BUNDLES[courseName];
    if (!bundle) return {status:'error', reason:'bundle_not_found'};
    var shReq = ss.getSheetByName(SH_INV_REQUESTS);
    var now = new Date().toISOString();
    var ts = Date.now();
    var requestIds = [];
    bundle.forEach(function(bi, idx){
      var reqId = 'REQ-'+ts+'-'+idx;
      shReq.appendRow([
        reqId, centre, bi.itemId, bi.qty*numStudents, urgency,
        '[Bundle: '+courseName+' x '+numStudents+' students] '+note,
        requestedBy, now, 'Pending', '', ''
      ]);
      requestIds.push(reqId);
    });
    return {status:'ok', requestIds:requestIds, itemsCreated:requestIds.length};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

// ── Seed Real IGI Items ───────────────────────────────────────────────────────

function seedInventoryItems(ss, p) {
  try {
    var forceReseed = p && (p.force===true || p.force==='true');
    var sh = ss.getSheetByName(SH_INV_ITEMS);
    if (!sh) sh = ss.insertSheet(SH_INV_ITEMS);
    var currentCount = sh.getLastRow() - 1;
    if (currentCount > 5 && !forceReseed) return {status:'ok', message:'Already seeded', count:currentCount};
    if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
    sh.getRange(1,1,1,10).setValues([['Item ID','Item Name','Category','Unit','Reorder Level','Unit Cost (Rs)','Notes','Created At','Vendor ID','Cost Locked']]);
    var ts = new Date().toISOString();
    var ITEMS = [
      ['ITEM-001','Education Brochure','Promotion Collateral','Pcs',50,79,'For walk-ins & events',ts],
      ['ITEM-002','Spiral Note Book','Promotion Collateral','Pcs',30,142,'Given at enrollment',ts],
      ['ITEM-003','Pens','Promotion Collateral','Pcs',100,20,'Student pens',ts],
      ['ITEM-004','Diamond Grading Manual','Course Collateral','Pcs',10,2348,'DG course manual',ts],
      ['ITEM-005','Diamond Grading Handbook','Course Collateral','Pcs',5,59,'DG reference handbook',ts],
      ['ITEM-006','RBC Work Sheet','Course Collateral','Pcs',20,597,'Round Brilliant Cut worksheets',ts],
      ['ITEM-007','Fancy Shape Work Sheet','Course Collateral','Pcs',20,667,'Fancy shape worksheets',ts],
      ['ITEM-008','Fine Tip Tweezer','Course Collateral','Pcs',10,140,'Fine tip tweezers for DG',ts],
      ['ITEM-009','Color Card','Course Collateral','Pcs',10,0,'Diamond color reference card',ts],
      ['ITEM-010','Diamond Grading Kit','Course Collateral','Sets',5,2500,'Complete DG student kit',ts],
      ['ITEM-011','Assortment Pads','Classroom Equipment','Pcs',2,0,'Diamond assortment pads',ts],
      ['ITEM-012','Grading Lamps','Classroom Equipment','Pcs',1,1800,'Grading lamps for classroom',ts],
      ['ITEM-013','UV Lamp','Classroom Equipment','Pcs',1,38000,'UV lamp longwave/shortwave',ts],
      ['ITEM-014','Microscope','Classroom Equipment','Pcs',1,100000,'Binocular microscope',ts],
      ['ITEM-015','Dial Gauge','Classroom Equipment','Pcs',1,900,'Millimeter dial gauge',ts],
      ['ITEM-016','Jewelry Gauge','Classroom Equipment','Pcs',1,1350,'Jewelry millimeter gauge',ts],
      ['ITEM-017','Colored Stone Manual','Course Collateral','Pcs',10,3600,'CSG course manual',ts],
      ['ITEM-018','CS Work Sheet','Course Collateral','Pcs',20,597,'Colored stone worksheets',ts],
      ['ITEM-019','Color Chart','Course Collateral','Pcs',10,25,'Munsell color chart for CSG',ts],
      ['ITEM-020','RI Liquid','Course Collateral','Bottles',2,0,'Refractive index liquid',ts],
      ['ITEM-021','Colored Stone Grading Kit','Course Collateral','Sets',5,1750,'CSG student kit',ts],
      ['ITEM-022','SG Kit / Weighing Scale','Classroom Equipment','Pcs',1,31800,'Specific gravity kit',ts],
      ['ITEM-023','Refractometer','Classroom Equipment','Pcs',1,7500,'Gemological refractometer',ts],
      ['ITEM-024','Dichroscope','Classroom Equipment','Pcs',1,2450,'Calcite dichroscope',ts],
      ['ITEM-025','Polariscope','Classroom Equipment','Pcs',1,9500,'Polariscope for stone ID',ts],
      ['ITEM-026','Jewelry Design Manual','Course Collateral','Pcs',10,1574,'JD course manual',ts],
      ['ITEM-027','JD Journal / Sketch Book','Course Collateral','Pcs',10,0,'JD sketch journal',ts],
      ['ITEM-028','Jewelry Design Kit','Course Collateral','Sets',5,7500,'JD student kit',ts],
      ['ITEM-029','Portfolio Bag','Course Collateral','Pcs',5,350,'JD portfolio bag',ts],
      ['ITEM-030','Vellum Sheets','Course Collateral','Pcs',50,0,'Pack of 10 per student',ts],
      ['ITEM-031','A3 Black/Grey Sheets','Course Collateral','Pcs',30,120,'A3 black and grey sheets JD',ts],
      ['ITEM-032','A4 Gateway Sheet','Course Collateral','Pcs',20,0,'Gateway worksheet A4',ts],
      ['ITEM-033','Sheet Protectors','Course Collateral','Pcs',50,0,'Sheet protectors JD',ts],
      ['ITEM-034','Polished Diamond Grading Manual','Course Collateral','Pcs',10,1154,'PDG course manual',ts],
      ['ITEM-035','Rough Diamond Grading Manual','Course Collateral','Pcs',10,1154,'RDG course manual',ts],
      ['ITEM-036','Small Diamond Assortment Manual','Course Collateral','Pcs',10,342,'SDA course manual',ts],
      ['ITEM-037','Gem Cloth','Course Collateral','Pcs',20,250,'Gem cleaning cloth',ts],
      ['ITEM-038','Ghodi (Stand)','Classroom Equipment','Pcs',1,0,'Diamond stand for assortment',ts],
      ['ITEM-039','Diamond Sorting Sieve','Classroom Equipment','Pcs',1,0,'Diamond sorting sieve set',ts],
      ['ITEM-040','IRES Manual','Course Collateral','Pcs',10,1911,'IRES course manual',ts],
      ['ITEM-041','Jewelry Design CAD Manual','Course Collateral','Pcs',5,783,'JD CAD course manual',ts],
      ['ITEM-042','PC with Rhino Software','Classroom Equipment','Pcs',0,0,'1 per student seat; licenced',ts],
      ['ITEM-043','JewelPad Design Manual','Course Collateral','Pcs',5,954,'JewelPad course manual',ts],
      ['ITEM-044','Diploma in Pearl Manual','Course Collateral','Pcs',10,2057,'Pearl course manual',ts],
      ['ITEM-045','Pearl Work Sheet','Course Collateral','Pcs',20,597,'Pearl grading worksheets',ts],
      ['ITEM-046','Pearl Grading Kit','Course Collateral','Sets',5,0,'Pearl student kit',ts],
      ['ITEM-047','Pearl Assortment Tray','Classroom Equipment','Pcs',1,0,'Pearl assortment tray',ts],
      ['ITEM-048','Black Laptop Bags','Misc / Diploma','Pcs',5,400,'For study material',ts],
      ['ITEM-049','Black Jute Bags','Misc / Diploma','Pcs',5,145,'For Diploma packet',ts],
      ['ITEM-050','Student Diploma','Misc / Diploma','Pcs',5,36,'Print on demand',ts],
      ['ITEM-051','Participant Certificate','Misc / Diploma','Pcs',10,20,'Participant certificate',ts],
      ['ITEM-052','Diploma Frame','Misc / Diploma','Pcs',10,50,'Diploma display frame',ts],
      ['ITEM-053','White Folder','Misc / Diploma','Pcs',100,100,'White folder for MBMG diploma',ts],
      ['ITEM-054','Black Folder','Misc / Diploma','Pcs',10,210,'Black folder general',ts],
      ['ITEM-055','Grading Lamp Tubes','Classroom Equipment','Pcs',5,500,'Replacement tubes for grading lamps',ts],
      ['ITEM-056','Medium Tip Tweezer','Corporate Batch','Pcs',10,140,'Medium tip tweezer for corporate',ts],
      ['ITEM-057','10X Loupe','Corporate Batch','Pcs',10,550,'10x loupe for corporate batch',ts],
      ['ITEM-058','Paper Bag','Corporate Batch','Pcs',10,75,'Paper bag for corporate kit',ts],
      ['ITEM-059','Grading Lamp (Small)','Corporate Batch','Pcs',10,1350,'Small grading lamp for corporate',ts],
      ['ITEM-060','Assortment Pad (Small)','Corporate Batch','Pcs',10,0,'Small assortment pad for corporate',ts]
    ];
    sh.getRange(2, 1, ITEMS.length, 8).setValues(ITEMS);
    return {status:'ok', message:'Seeded '+ITEMS.length+' items', count:ITEMS.length};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function setupInventorySheets(ss, p) {
  try {
    var sheets = [
      { name: SH_INV_ITEMS,    headers: ['Item ID','Item Name','Category','Unit','Reorder Level','Unit Cost (Rs)','Notes','Created At','Vendor ID','Cost Locked'] },
      { name: SH_INV_STOCK,    headers: ['Stock ID','Centre','Item ID','Quantity','Updated At','Updated By'] },
      { name: SH_INV_REQUESTS, headers: ['Request ID','Centre','Item ID','Quantity Requested','Urgency','Counsellor Note','Requested By','Requested At','Status','Approved By','Approved At'] },
      { name: SH_INV_DISPATCH, headers: ['Dispatch ID','Request ID','Quantity Dispatched','Dispatch Date','Courier / Tracking Info','Dispatched By','Dispatched At'] },
      { name: SH_INV_VENDORS,  headers: ['Vendor ID','Vendor Name','Contact Person','Phone','Email','Address','Supplied Items','Registered By','Registered At'] }
    ];
    var created = [];
    sheets.forEach(function(def) {
      var sh = ss.getSheetByName(def.name);
      if (!sh) {
        sh = ss.insertSheet(def.name);
        sh.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
        created.push(def.name);
      }
    });
    return { status:'ok', created: created, message: created.length ? 'Created: '+created.join(', ') : 'All sheets already exist' };
  } catch(err) { return {status:'error', message: err.toString()}; }
}

// ── Seed Stock from Excel data ────────────────────────────────────────────────

function seedInventoryStock(ss, p) {
  try {
    var forceReseed = p && (p.force===true || p.force==='true');
    // Ensure INV_Items exists; build name→ID map
    var itemSh = ss.getSheetByName(SH_INV_ITEMS);
    if (!itemSh || itemSh.getLastRow() < 2) return {status:'error', message:'Seed items first (INV_Items is empty)'};
    var itemData = itemSh.getRange(2, 1, itemSh.getLastRow()-1, 2).getValues();
    var nameToId = {};
    itemData.forEach(function(r){ if(r[1]) nameToId[r[1].toString().trim()] = r[0]; });

    // Ensure INV_Stock exists
    var sh = ss.getSheetByName(SH_INV_STOCK);
    if (!sh) { sh = ss.insertSheet(SH_INV_STOCK); sh.getRange(1,1,1,6).setValues([['Stock ID','Centre','Item ID','Quantity','Updated At','Updated By']]); }

    if (sh.getLastRow() > 1 && !forceReseed) return {status:'ok', message:'Stock already seeded', count:sh.getLastRow()-1};
    if (forceReseed && sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow()-1);

    var ts = new Date().toISOString();
    // Stock data extracted from IGI_Pan_India_Inventory_v2.xlsx
    var STOCK_DATA = {
      'Mumbai':    {'Education Brochure':0,'Spiral Note Book':0,'Pens':0,'Diamond Grading Manual':0,'Diamond Grading Handbook':0,'RBC Work Sheet':0,'Fancy Shape Work Sheet':0,'Fine Tip Tweezer':0,'Color Card':0,'Diamond Grading Kit':0,'Assortment Pads':0,'Grading Lamps':0,'UV Lamp':0,'Microscope':0,'Dial Gauge':0,'Jewelry Gauge':0,'Colored Stone Manual':0,'CS Work Sheet':0,'Color Chart':0,'RI Liquid':0,'Colored Stone Grading Kit':0,'SG Kit / Weighing Scale':0,'Refractometer':0,'Dichroscope':0,'Polariscope':0,'Polished Diamond Grading Manual':0,'Rough Diamond Grading Manual':0,'Small Diamond Assortment Manual':0,'Gem Cloth':0,'IRES Manual':0,'Black Laptop Bags':0,'Black Jute Bags':0,'Student Diploma':500,'Participant Certificate':250,'Diploma Frame':50,'Grading Lamp Tubes':5,'Medium Tip Tweezer':0,'10X Loupe':0,'Paper Bag':250,'Grading Lamp (Small)':0,'Assortment Pad (Small)':0},
      'Hyderabad': {'Education Brochure':20,'Spiral Note Book':9,'Pens':9,'Diamond Grading Manual':4,'Diamond Grading Handbook':0,'RBC Work Sheet':16,'Fancy Shape Work Sheet':8,'Fine Tip Tweezer':8,'Color Card':8,'Diamond Grading Kit':8,'Assortment Pads':0,'Grading Lamps':192,'UV Lamp':0,'Microscope':0,'Dial Gauge':8,'Jewelry Gauge':8,'Colored Stone Manual':5,'CS Work Sheet':10,'Color Chart':0,'RI Liquid':0,'Colored Stone Grading Kit':5,'SG Kit / Weighing Scale':0,'Refractometer':10,'Dichroscope':5,'Polariscope':0,'Polished Diamond Grading Manual':0,'Rough Diamond Grading Manual':4,'Small Diamond Assortment Manual':4,'Gem Cloth':0,'Black Laptop Bags':0,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Delhi':     {'Education Brochure':150,'Spiral Note Book':0,'Pens':0,'Diamond Grading Manual':0,'Assortment Pads':60,'Grading Lamps':120,'UV Lamp':5,'Microscope':12,'Dial Gauge':0,'Jewelry Gauge':0,'SG Kit / Weighing Scale':2,'Refractometer':0,'Dichroscope':0,'Polariscope':1,'Polished Diamond Grading Manual':0,'Black Laptop Bags':0,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Lucknow':   {'Education Brochure':5,'Spiral Note Book':0,'Pens':20,'Diamond Grading Manual':2,'RBC Work Sheet':4,'Fancy Shape Work Sheet':4,'Fine Tip Tweezer':2,'Assortment Pads':18,'Grading Lamps':112,'UV Lamp':5,'Microscope':4,'Dial Gauge':4,'Jewelry Gauge':2,'Polished Diamond Grading Manual':2,'Small Diamond Assortment Manual':2,'Gem Cloth':2,'Black Jute Bags':5,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Bangalore': {'Education Brochure':0,'Spiral Note Book':5,'Pens':3,'Diamond Grading Manual':4,'RBC Work Sheet':16,'Fancy Shape Work Sheet':8,'Fine Tip Tweezer':4,'Color Card':10,'Diamond Grading Kit':8,'Assortment Pads':48,'Grading Lamps':56,'UV Lamp':5,'Microscope':4,'Dial Gauge':10,'Jewelry Gauge':4,'Polished Diamond Grading Manual':1,'Black Laptop Bags':0,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Kolkata':   {'Education Brochure':140,'Spiral Note Book':25,'Pens':5,'Assortment Pads':24,'Grading Lamps':64,'UV Lamp':5,'Microscope':4,'Dial Gauge':10,'Jewelry Gauge':10,'Colored Stone Manual':5,'CS Work Sheet':5,'Color Chart':4,'Colored Stone Grading Kit':5,'SG Kit / Weighing Scale':2,'Refractometer':16,'Dichroscope':5,'Polariscope':1,'Polished Diamond Grading Manual':1,'Black Laptop Bags':0,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Jaipur':    {'Education Brochure':30,'Spiral Note Book':1,'Pens':500,'Diamond Grading Manual':3,'Fancy Shape Work Sheet':4,'Fine Tip Tweezer':12,'Diamond Grading Kit':18,'Grading Lamps':64,'Dial Gauge':10,'Colored Stone Manual':4,'CS Work Sheet':5,'Color Chart':6,'Refractometer':14,'Dichroscope':1,'Black Laptop Bags':25,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0},
      'Chennai':   {'Education Brochure':0,'Spiral Note Book':3,'Pens':3,'Diamond Grading Manual':2,'RBC Work Sheet':8,'Fancy Shape Work Sheet':4,'Fine Tip Tweezer':4,'Color Card':4,'Diamond Grading Kit':4,'Assortment Pads':36,'Grading Lamps':48,'UV Lamp':5,'Microscope':4,'Dial Gauge':4,'Jewelry Gauge':4,'SG Kit / Weighing Scale':2,'Polished Diamond Grading Manual':1,'Black Laptop Bags':2,'Black Jute Bags':0,'Student Diploma':0,'Participant Certificate':0,'Diploma Frame':0,'Grading Lamp Tubes':0}
    };

    var rows = [];
    var idx = 1;
    Object.keys(STOCK_DATA).forEach(function(centre) {
      var items = STOCK_DATA[centre];
      Object.keys(items).forEach(function(itemName) {
        var qty = items[itemName];
        if (qty === 0) return; // skip zero-stock rows to keep sheet clean
        var itemId = nameToId[itemName];
        if (!itemId) return; // item not in master — skip
        rows.push(['STK-'+String(idx).padStart(4,'0'), centre, itemId, qty, ts, 'seed']);
        idx++;
      });
    });

    if (rows.length > 0) sh.getRange(2, 1, rows.length, 6).setValues(rows);
    return {status:'ok', message:'Seeded stock for '+Object.keys(STOCK_DATA).length+' centres ('+rows.length+' rows)', count:rows.length};
  } catch(err) { return {status:'error', message: err.toString()}; }
}

function checkStudentClashes(ss, studentId, batchCodes) {
  const shBatches = ss.getSheetByName(SH_BATCHES);
  if (!shBatches || shBatches.getLastRow() < 2) return null;
  
  // 1. Build batches map
  const batchesMap = {};
  const batchData = shBatches.getRange(2, 1, shBatches.getLastRow() - 1, 10).getValues();
  batchData.forEach(r => {
    const code = String(r[0]).trim().toUpperCase();
    const isNew = detectSlotOrDate(r[4]);
    batchesMap[code] = {
      batchCode: code,
      centre: r[1],
      course: r[2],
      type: r[3],
      batchSlot: isNew ? String(r[4]).trim() : 'Full Day',
      startDate: isNew ? r[5] : r[4],
      endDate: isNew ? r[6] : r[5]
    };
  });
  
  // 2. Fetch active student enrollments
  const studentEnrollments = getEnrollmentRows(ss).filter(e => e.studentId === studentId && String(e.status).trim().toLowerCase() === 'active');
  if (!studentEnrollments.length) return null;
  
  const parseDateSafe = function(val) {
    if (!val) return null;
    if (val instanceof Date) return new Date(val);
    const s = String(val).trim();
    const parts = s.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  
  const fmtDateString = function(v) {
    if (!v) return '';
    if (v instanceof Date) return v.toLocaleDateString('en-IN');
    const d = new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-IN');
  };
  
  for (let i = 0; i < batchCodes.length; i++) {
    const newBatchCode = batchCodes[i];
    const newBatch = batchesMap[newBatchCode];
    if (!newBatch) continue;
    
    for (let j = 0; j < studentEnrollments.length; j++) {
      const e = studentEnrollments[j];
      const existingBatch = batchesMap[e.batchCode];
      if (!existingBatch) continue;
      
      // Course duplicate check
      if (existingBatch.course === newBatch.course) {
        return {
          status: 'error',
          reason: 'course_exists',
          message: 'Student ' + studentId + ' is already enrolled in course "' + newBatch.course + '" (Batch: ' + e.batchCode + ').'
        };
      }
      
      // Schedule/Time clash check
      const startA = parseDateSafe(existingBatch.startDate);
      const endA = parseDateSafe(existingBatch.endDate);
      const startB = parseDateSafe(newBatch.startDate);
      const endB = parseDateSafe(newBatch.endDate);
      
      if (startA && endA && startB && endB) {
        startA.setHours(0,0,0,0);
        endA.setHours(23,59,59,999);
        startB.setHours(0,0,0,0);
        endB.setHours(23,59,59,999);
        
        const dateOverlap = (startA <= endB && startB <= endA);
        if (dateOverlap) {
          const slotA = existingBatch.batchSlot || 'Full Day';
          const slotB = newBatch.batchSlot || 'Full Day';
          const slotOverlap = (slotA === 'Full Day' || slotB === 'Full Day' || slotA === slotB);
          if (slotOverlap) {
            return {
              status: 'error',
              reason: 'schedule_clash',
              message: 'Schedule Clash: Student ' + studentId + ' is already enrolled in batch ' + e.batchCode + ' (' + slotA + ') during this duration (' + fmtDateString(existingBatch.startDate) + ' to ' + fmtDateString(existingBatch.endDate) + ').'
            };
          }
        }
      }
    }
  }
  
  return null;
}

function deleteBatch(ss, p) {
  try {
    const batchCode = String(p.batchCode || '').trim().toUpperCase();
    const keepStudents = (p.keepStudents === 'true');
    
    if (!batchCode) {
      return {status: 'error', reason: 'missing_batch_code', message: 'Missing batch code parameter.'};
    }
    
    // 1. Delete from SH_BATCHES
    const shBatches = ss.getSheetByName(SH_BATCHES);
    if (shBatches && shBatches.getLastRow() > 1) {
      const data = shBatches.getRange(2, 1, shBatches.getLastRow() - 1, 1).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][0]).trim().toUpperCase() === batchCode) {
          shBatches.deleteRow(i + 2);
        }
      }
    }
    
    // 2. Delete from SH_ENROLLMENTS
    const shEnrollments = ss.getSheetByName(SH_ENROLLMENTS);
    if (shEnrollments && shEnrollments.getLastRow() > 1) {
      const data = shEnrollments.getRange(2, 2, shEnrollments.getLastRow() - 1, 1).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][0]).trim().toUpperCase() === batchCode) {
          shEnrollments.deleteRow(i + 2);
        }
      }
    }
    
    // 3. Delete from SH_STUDENTS (if keepStudents is false)
    if (!keepStudents) {
      const shStudents = ss.getSheetByName(SH_STUDENTS);
      if (shStudents && shStudents.getLastRow() > 1) {
        const data = shStudents.getRange(2, 2, shStudents.getLastRow() - 1, 1).getValues();
        for (let i = data.length - 1; i >= 0; i--) {
          if (String(data[i][0]).trim().toUpperCase() === batchCode) {
            shStudents.deleteRow(i + 2);
          }
        }
      }
    }
    
    // 4. Delete from SH_SESSIONS
    const shSessions = ss.getSheetByName(SH_SESSIONS);
    if (shSessions && shSessions.getLastRow() > 1) {
      const data = shSessions.getRange(2, 2, shSessions.getLastRow() - 1, 1).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][0]).trim().toUpperCase() === batchCode) {
          shSessions.deleteRow(i + 2);
        }
      }
    }
    
    // 5. Delete from SH_FEEDBACK
    const shFeedback = ss.getSheetByName(SH_FEEDBACK);
    if (shFeedback && shFeedback.getLastRow() > 1) {
      const data = shFeedback.getRange(2, 4, shFeedback.getLastRow() - 1, 1).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][0]).trim().toUpperCase() === batchCode) {
          shFeedback.deleteRow(i + 2);
        }
      }
    }
    
    // 6. Delete from SH_FEES
    const shFees = ss.getSheetByName(SH_FEES);
    if (shFees && shFees.getLastRow() > 1) {
      const data = shFees.getRange(2, 3, shFees.getLastRow() - 1, 1).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][0]).trim().toUpperCase() === batchCode) {
          shFees.deleteRow(i + 2);
        }
      }
    }
    
    // 7. Find assessment IDs for this batch and delete marks, then delete assessments
    const shAssessments = ss.getSheetByName(SH_ASSESSMENTS);
    const assessmentIds = [];
    if (shAssessments && shAssessments.getLastRow() > 1) {
      const data = shAssessments.getRange(2, 1, shAssessments.getLastRow() - 1, 2).getValues();
      for (let i = data.length - 1; i >= 0; i--) {
        if (String(data[i][1]).trim().toUpperCase() === batchCode) {
          assessmentIds.push(String(data[i][0]));
          shAssessments.deleteRow(i + 2);
        }
      }
    }
    
    if (assessmentIds.length > 0) {
      const shMarks = ss.getSheetByName(SH_MARKS);
      if (shMarks && shMarks.getLastRow() > 1) {
        const data = shMarks.getRange(2, 1, shMarks.getLastRow() - 1, 1).getValues();
        for (let i = data.length - 1; i >= 0; i--) {
          if (assessmentIds.includes(String(data[i][0]))) {
            shMarks.deleteRow(i + 2);
          }
        }
      }
    }
    
    // Invalidate script cache
    try { CacheService.getScriptCache().remove('batches||'); } catch(_e){}
    
    return {status: 'ok'};
  } catch (err) {
    return {status: 'error', message: err.toString()};
  }
}

// ════════════════════════════════════════════════════════════════
// ATTENDANCE FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * getStudentTodaySession
 * Returns today's open session for a student's active batches.
 * Also returns whether student has already marked attendance.
 */
function getStudentTodaySession(ss, p) {
  try {
    var studentId = String(p.studentId || '').toUpperCase();
    if (!studentId) return {status:'error', reason:'missing_params'};
    var todayStr = dateKey(new Date());

    // Get student's active batches
    var enrollments = getEnrollmentRows(ss).filter(function(e) {
      return String(e.studentId).toUpperCase() === studentId && e.status === 'Active';
    });
    if (!enrollments.length) return {status:'ok', sessions:[]};

    var batchCodes = enrollments.map(function(e){ return String(e.batchCode).toUpperCase(); });

    // Get today's sessions for those batches
    var shSess = ss.getSheetByName(SH_SESSIONS);
    if (!shSess || shSess.getLastRow() < 2) return {status:'ok', sessions:[]};
    var sessData = shSess.getRange(2,1,shSess.getLastRow()-1, Math.max(shSess.getLastColumn(),14)).getValues();
    var todaySessions = sessData.filter(function(r) {
      return r[0] && batchCodes.indexOf(String(r[1]).toUpperCase()) > -1 &&
             r[2] && dateKey(new Date(r[2])) === todayStr;
    });
    if (!todaySessions.length) return {status:'ok', sessions:[]};

    // Check ATT_Records for already-marked
    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    var markedSet = {};
    if (shAtt && shAtt.getLastRow() > 1) {
      shAtt.getRange(2,1,shAtt.getLastRow()-1,5).getValues().forEach(function(r) {
        if (String(r[3]).toUpperCase() === studentId) {
          markedSet[String(r[1]).toUpperCase()] = true;
        }
      });
    }

    // Get batch details
    var shBatch = ss.getSheetByName(SH_BATCHES);
    var batchMap = {};
    if (shBatch && shBatch.getLastRow() > 1) {
      shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues().forEach(function(r) {
        if (r[0]) batchMap[String(r[0]).toUpperCase()] = {centre:r[1],course:r[2],batchSlot:r[4]||'Full Day'};
      });
    }

    var sessions = todaySessions.map(function(r) {
      var sessionCode = String(r[0]).toUpperCase();
      var batchCode   = String(r[1]).toUpperCase();
      var bm = batchMap[batchCode] || {};
      return {
        sessionCode: sessionCode,
        batchCode:   batchCode,
        sessionNo:   r[3],
        instructor:  r[4] || '',
        topic:       r[6] || '',
        attStatus:   r[9] || 'pending',
        centre:      bm.centre || '',
        course:      bm.course || '',
        batchSlot:   bm.batchSlot || 'Full Day',
        alreadyMarked: !!markedSet[sessionCode]
      };
    });
    return {status:'ok', sessions:sessions};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * selfMarkAttendance
 * Student marks their own attendance with optional location data.
 * Never blocks — records what it can.
 */
function selfMarkAttendance(ss, p) {
  try {
    var studentId   = String(p.studentId || '').toUpperCase();
    var sessionCode = String(p.sessionCode || '').toUpperCase();
    if (!studentId || !sessionCode) return {status:'error', reason:'missing_params'};

    // Validate session exists and is today
    var shSess = ss.getSheetByName(SH_SESSIONS);
    if (!shSess || shSess.getLastRow() < 2) return {status:'error', reason:'session_not_found'};
    var sessRows = shSess.getRange(2,1,shSess.getLastRow()-1, Math.max(shSess.getLastColumn(),14)).getValues();
    var sessRow  = sessRows.filter(function(r){ return String(r[0]).toUpperCase()===sessionCode; })[0];
    if (!sessRow) return {status:'error', reason:'session_not_found'};

    var todayStr = dateKey(new Date());
    if (sessRow[2] && dateKey(new Date(sessRow[2])) !== todayStr) return {status:'error', reason:'session_not_today'};

    var batchCode = String(sessRow[1]).toUpperCase();

    // Prevent double-mark
    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    if (!shAtt) { ensureSheets(ss); shAtt = ss.getSheetByName(SH_ATT_RECORDS); }
    if (shAtt.getLastRow() > 1) {
      var existing = shAtt.getRange(2,1,shAtt.getLastRow()-1,4).getValues();
      var alreadyMarked = existing.some(function(r){
        return String(r[1]).toUpperCase()===sessionCode && String(r[3]).toUpperCase()===studentId;
      });
      if (alreadyMarked) return {status:'error', reason:'already_marked'};
    }

    // Get student name
    var stuAll = getStudentsForBatch(ss, batchCode);
    var stu = stuAll.filter(function(s){ return String(s.enrollmentNo).toUpperCase()===studentId; })[0];
    var studentName = stu ? stu.name : '';

    // Get centre
    var shBatch = ss.getSheetByName(SH_BATCHES);
    var centre = '';
    if (shBatch && shBatch.getLastRow() > 1) {
      var bRows = shBatch.getRange(2,1,shBatch.getLastRow()-1,5).getValues();
      var bRow  = bRows.filter(function(r){ return String(r[0]).toUpperCase()===batchCode; })[0];
      if (bRow) centre = bRow[1];
    }

    var recordId = 'ATT-' + sessionCode + '-' + studentId + '-' + Date.now();
    var lat  = p.lat  || '';
    var lng  = p.lng  || '';
    var acc  = p.accuracy || '';
    var addr = p.resolvedAddress || '';
    var locStatus = p.locationStatus || (lat ? 'captured' : 'unavailable');

    shAtt.appendRow([
      recordId, sessionCode, batchCode, studentId, studentName, centre,
      todayStr, new Date().toISOString(), 'self', 'present',
      lat, lng, acc, addr, locStatus, p.ip || ''
    ]);

    // Update present count on session row
    _updateSessionAttCount(ss, shSess, sessRows, sessionCode, batchCode);

    return {status:'ok', recordId:recordId, resolvedAddress:addr};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * getSessionAttendanceFull — instructor live view
 * Returns full student list with who marked, who didn't, location info.
 */
function getSessionAttendanceFull(ss, p) {
  try {
    var sessionCode = String(p.sessionCode || '').toUpperCase();
    var batchCode   = String(p.batchCode   || '').toUpperCase();
    if (!sessionCode && !batchCode) return {status:'error', reason:'missing_params'};

    // If only batchCode provided, find today's session
    if (!sessionCode && batchCode) {
      var todayStr = dateKey(new Date());
      var shSess2 = ss.getSheetByName(SH_SESSIONS);
      if (shSess2 && shSess2.getLastRow() > 1) {
        var sr2 = shSess2.getRange(2,1,shSess2.getLastRow()-1,2).getValues();
        var found2 = sr2.filter(function(r){
          return String(r[1]).toUpperCase()===batchCode;
        });
        // get last one (today's)
        if (found2.length) sessionCode = String(found2[found2.length-1][0]).toUpperCase();
      }
    }

    var stuAll = getStudentsForBatch(ss, batchCode || '');

    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    var attMap = {};
    if (shAtt && shAtt.getLastRow() > 1) {
      shAtt.getRange(2,1,shAtt.getLastRow()-1,16).getValues().forEach(function(r) {
        if (String(r[1]).toUpperCase() === sessionCode) {
          attMap[String(r[3]).toUpperCase()] = {
            markedAt: r[7], markedBy: r[8], status: r[9],
            resolvedAddress: r[13], locationStatus: r[14]
          };
        }
      });
    }

    var students = stuAll.map(function(s) {
      var sid = String(s.enrollmentNo).toUpperCase();
      var att = attMap[sid];
      return {
        enrollmentNo: s.enrollmentNo, name: s.name,
        marked: !!att,
        markedAt: att ? att.markedAt : '',
        markedBy: att ? att.markedBy : '',
        status:   att ? att.status   : 'pending',
        resolvedAddress: att ? att.resolvedAddress : '',
        locationStatus:  att ? att.locationStatus  : ''
      };
    });

    // Session meta
    var sessInfo = {};
    var shSess3 = ss.getSheetByName(SH_SESSIONS);
    if (shSess3 && shSess3.getLastRow() > 1) {
      var sRows = shSess3.getRange(2,1,shSess3.getLastRow()-1,Math.max(shSess3.getLastColumn(),14)).getValues();
      var sRow  = sRows.filter(function(r){ return String(r[0]).toUpperCase()===sessionCode; })[0];
      if (sRow) sessInfo = {
        sessionCode: sessionCode, batchCode: String(sRow[1]).toUpperCase(),
        sessionDate: sRow[2], sessionNo: sRow[3], instructor: sRow[4],
        topic: sRow[6], attStatus: sRow[9]||'pending',
        presentCount: sRow[10]||0, absentCount: sRow[11]||0,
        confirmedBy: sRow[12]||'', confirmedAt: sRow[13]||''
      };
    }

    return {status:'ok', session:sessInfo, students:students,
      presentCount: Object.keys(attMap).length, totalCount: stuAll.length};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * instructorMarkAttendance
 * Instructor marks one or many students present/absent.
 * p.marks = [{enrollmentNo, status:'present'|'absent'}]
 * p.sessionCode, p.batchCode, p.instructorName
 */
function instructorMarkAttendance(ss, p) {
  try {
    var sessionCode    = String(p.sessionCode || '').toUpperCase();
    var batchCode      = String(p.batchCode   || '').toUpperCase();
    var instructorName = p.instructorName || 'Instructor';
    var marks = p.marks || [];
    if (!sessionCode || !marks.length) return {status:'error', reason:'missing_params'};

    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    if (!shAtt) { ensureSheets(ss); shAtt = ss.getSheetByName(SH_ATT_RECORDS); }

    // Build existing map
    var existingMap = {};
    if (shAtt.getLastRow() > 1) {
      shAtt.getRange(2,1,shAtt.getLastRow()-1,4).getValues().forEach(function(r) {
        if (String(r[1]).toUpperCase()===sessionCode) {
          existingMap[String(r[3]).toUpperCase()] = true;
        }
      });
    }

    // Get student names
    var stuAll = getStudentsForBatch(ss, batchCode);
    var stuMap = {};
    stuAll.forEach(function(s){ stuMap[String(s.enrollmentNo).toUpperCase()] = s.name; });

    // Get centre
    var centre = '';
    var shBatch = ss.getSheetByName(SH_BATCHES);
    if (shBatch && shBatch.getLastRow() > 1) {
      var bRows = shBatch.getRange(2,1,shBatch.getLastRow()-1,5).getValues();
      var bRow  = bRows.filter(function(r){ return String(r[0]).toUpperCase()===batchCode; })[0];
      if (bRow) centre = bRow[1];
    }

    var todayStr = dateKey(new Date());
    var written  = 0;
    var updated  = 0;

    marks.forEach(function(m) {
      var sid    = String(m.enrollmentNo || '').toUpperCase();
      var status = m.status === 'absent' ? 'absent' : 'present';
      if (!sid) return;

      if (existingMap[sid]) {
        // Update existing row
        if (shAtt.getLastRow() > 1) {
          var rows = shAtt.getRange(2,1,shAtt.getLastRow()-1,10).getValues();
          for (var i=0; i<rows.length; i++) {
            if (String(rows[i][1]).toUpperCase()===sessionCode && String(rows[i][3]).toUpperCase()===sid) {
              shAtt.getRange(i+2,9).setValue('instructor');
              shAtt.getRange(i+2,10).setValue(status);
              updated++;
              break;
            }
          }
        }
      } else {
        // New row
        var recordId = 'ATT-' + sessionCode + '-' + sid + '-' + Date.now();
        shAtt.appendRow([
          recordId, sessionCode, batchCode, sid, stuMap[sid]||'', centre,
          todayStr, new Date().toISOString(), 'instructor', status,
          '', '', '', '', 'n/a', ''
        ]);
        written++;
      }
    });

    // Update counts on session
    var shSess = ss.getSheetByName(SH_SESSIONS);
    var sessRows = shSess && shSess.getLastRow() > 1 ?
      shSess.getRange(2,1,shSess.getLastRow()-1,Math.max(shSess.getLastColumn(),14)).getValues() : [];
    _updateSessionAttCount(ss, shSess, sessRows, sessionCode, batchCode);

    return {status:'ok', written:written, updated:updated};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * finaliseAttendance
 * Locks the session attendance. Sets attStatus = 'confirmed'.
 */
function finaliseAttendance(ss, p) {
  try {
    var sessionCode    = String(p.sessionCode || '').toUpperCase();
    var instructorName = p.instructorName || 'Instructor';
    if (!sessionCode) return {status:'error', reason:'missing_params'};

    var shSess = ss.getSheetByName(SH_SESSIONS);
    if (!shSess || shSess.getLastRow() < 2) return {status:'error', reason:'session_not_found'};
    var sessRows = shSess.getRange(2,1,shSess.getLastRow()-1,Math.max(shSess.getLastColumn(),14)).getValues();
    var rowIdx = -1;
    var batchCode = '';
    for (var i=0; i<sessRows.length; i++) {
      if (String(sessRows[i][0]).toUpperCase()===sessionCode) { rowIdx=i; batchCode=String(sessRows[i][1]).toUpperCase(); break; }
    }
    if (rowIdx < 0) return {status:'error', reason:'session_not_found'};

    // Count present/absent from ATT_Records
    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    var presentCount = 0; var absentCount = 0;
    if (shAtt && shAtt.getLastRow() > 1) {
      shAtt.getRange(2,1,shAtt.getLastRow()-1,10).getValues().forEach(function(r) {
        if (String(r[1]).toUpperCase()===sessionCode) {
          if (r[9]==='present') presentCount++; else absentCount++;
        }
      });
    }

    var shRow = rowIdx + 2;
    // Ensure columns 10-14 exist
    var lastCol = Math.max(shSess.getLastColumn(), 14);
    if (lastCol < 14) shSess.getRange(1,10,1,5).setValues([['Att Status','Present Count','Absent Count','Att Confirmed By','Att Confirmed At']]);
    shSess.getRange(shRow, 10).setValue('confirmed');
    shSess.getRange(shRow, 11).setValue(presentCount);
    shSess.getRange(shRow, 12).setValue(absentCount);
    shSess.getRange(shRow, 13).setValue(instructorName);
    shSess.getRange(shRow, 14).setValue(new Date().toISOString());
    shSess.getRange(shRow, 1, 1, lastCol).setBackground('#E8F5EE');

    return {status:'ok', sessionCode:sessionCode, presentCount:presentCount, absentCount:absentCount};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * getPendingAttendanceSessions
 * Returns sessions that have no attendance confirmation (attStatus != 'confirmed').
 * Used by counselor portal on login to show the reminder banner.
 */
function getPendingAttendanceSessions(ss, p) {
  try {
    var instructorName = p.instructorName || '';
    var centre         = p.centre         || '';
    var shSess = ss.getSheetByName(SH_SESSIONS);
    if (!shSess || shSess.getLastRow() < 2) return {status:'ok', pending:[]};

    var today = new Date(); today.setHours(0,0,0,0);
    var cutoff = new Date(today); cutoff.setDate(cutoff.getDate()-7); // look back 7 days max

    var allRows = shSess.getRange(2,1,shSess.getLastRow()-1,Math.max(shSess.getLastColumn(),14)).getValues();

    // Get batches for this instructor/centre
    var shBatch = ss.getSheetByName(SH_BATCHES);
    var allowedBatchCodes = null;
    if (instructorName && shBatch && shBatch.getLastRow() > 1) {
      var bRows = shBatch.getRange(2,1,shBatch.getLastRow()-1,10).getValues();
      allowedBatchCodes = new Set(bRows.filter(function(r){
        var instr = r[9]||r[8]||'';
        var ctr   = r[1]||'';
        return (!instructorName || String(instr).toLowerCase()===instructorName.toLowerCase()) &&
               (!centre || String(ctr).toLowerCase()===centre.toLowerCase());
      }).map(function(r){ return String(r[0]).toUpperCase(); }));
    } else if (centre && shBatch && shBatch.getLastRow() > 1) {
      var bRows2 = shBatch.getRange(2,1,shBatch.getLastRow()-1,5).getValues();
      allowedBatchCodes = new Set(bRows2.filter(function(r){
        return String(r[1]).toLowerCase()===centre.toLowerCase();
      }).map(function(r){ return String(r[0]).toUpperCase(); }));
    }

    var pending = allRows.filter(function(r) {
      if (!r[0] || !r[2]) return false;
      var sessDate = new Date(r[2]); sessDate.setHours(0,0,0,0);
      if (sessDate < cutoff || sessDate > today) return false; // only past & today
      var attStatus = String(r[9]||'').toLowerCase();
      if (attStatus==='confirmed' || attStatus==='skipped') return false;
      if (allowedBatchCodes && !allowedBatchCodes.has(String(r[1]).toUpperCase())) return false;
      return true;
    }).map(function(r) {
      return {
        sessionCode: String(r[0]).toUpperCase(),
        batchCode:   String(r[1]).toUpperCase(),
        sessionDate: r[2] ? new Date(r[2]).toLocaleDateString('en-IN') : '',
        sessionNo:   r[3],
        instructor:  r[4]||'',
        topic:       r[6]||'',
        attStatus:   r[9]||'pending',
        presentCount:r[10]||0, absentCount:r[11]||0
      };
    });

    return {status:'ok', pending:pending, count:pending.length};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * Helper: recount present/absent in ATT_Records and update Sessions row
 */
function _updateSessionAttCount(ss, shSess, sessRows, sessionCode, batchCode) {
  try {
    var shAtt = ss.getSheetByName(SH_ATT_RECORDS);
    if (!shAtt) return;
    var presentCount=0; var absentCount=0;
    if (shAtt.getLastRow() > 1) {
      shAtt.getRange(2,1,shAtt.getLastRow()-1,10).getValues().forEach(function(r) {
        if (String(r[1]).toUpperCase()===sessionCode) {
          if (String(r[9]).toLowerCase()==='present') presentCount++;
          else absentCount++;
        }
      });
    }
    if (!shSess) return;
    for (var i=0; i<sessRows.length; i++) {
      if (String(sessRows[i][0]).toUpperCase()===sessionCode) {
        var shRow = i+2;
        var lastCol = Math.max(shSess.getLastColumn(), 14);
        shSess.getRange(shRow,10).setValue(shSess.getRange(shRow,10).getValue()||'pending');
        shSess.getRange(shRow,11).setValue(presentCount);
        shSess.getRange(shRow,12).setValue(absentCount);
        break;
      }
    }
  } catch(_e) {}
}

// ════════════════════════════════════════════════════════════════
// DIPLOMA PDF GENERATION
// ════════════════════════════════════════════════════════════════

/**
 * Run this function ONCE from the GAS editor (Run → authorizeScopes)
 * to grant Drive permissions to this script.  After running it once
 * the web-app deployment will also carry Drive access.
 */
function authorizeScopes() {
  // Touch DriveApp so GAS requests the drive scope during authorization
  var folder = DriveApp.getFolderById(DIPLOMA_TEMPLATES_FOLDER_ID);
  Logger.log('Drive access OK. Folder: ' + folder.getName());
  SpreadsheetApp.getActive(); // also confirm Sheets scope
}

const DIPLOMA_TEMPLATES_FOLDER_ID = '1DUR58XGeJZCwT59IwN47H6UralKGsVcV';
const DIPLOMA_OUTPUT_FOLDER_NAME  = 'IGI-Diplomas-Generated';
const SH_DIPLOMAS = 'Diplomas';

// Map course name → template filename in the Drive folder
const DIPLOMA_TEMPLATE_MAP = {
  'Diamond Graduate':              'Diamond Graduate Diploma.pdf',
  'Diamond Graduate DG':           'Diamond Graduate Diploma.pdf',
  'Colored Stone Graduate':        'Colored Stone Graduate Diploma .pdf',
  'CSG':                           'Colored Stone Graduate Diploma .pdf',
  'Graduate Gemologist':           'Graduate Gemologist Diploma .pdf',
  'GG':                            'Graduate Gemologist Diploma .pdf',
  'Smart Learning DG':             'Smart Learning DG Diploma .pdf',
  'Smart Learning GG':             'Smart Learning GG Diploma .pdf',
  'Smart Learning CSG':            'Smart Learning CSG Diploma.pdf',
  'JewelPad Design':               'Jewelpad Oncampus Diploma .pdf',
  'JewelPad On-campus':            'Jewelpad Oncampus Diploma .pdf',
  'JewelPad Online':               'Jewelpad online Diploma .pdf',
  'Jewelry Design Manual':         'JD Manual Diploma .pdf',
  'JD Manual':                     'JD Manual Diploma .pdf',
  'Polished Diamond Grading':      'PDC Diploma .pdf',
  'PDC':                           'PDC Diploma .pdf',
  'Rough Diamond Graduate':        'Rough Diamond Diploma .pdf',
  'Small Diamond Assortment':      'Small Diamond Assortment Diploma .pdf',
  'Identification of RES':         'IRES Diploma.pdf',
  'IRES':                          'IRES Diploma.pdf',
  'Diamond Essentials':            'Diamnd Essential 5cs Diploma.pdf',
  'Diamond Graduate Integrated':   'Diamond Graduate Diploma.pdf',
  'Coloured Stone Integrated':     'Colored Stone Graduate Diploma .pdf',
};

// Per-template text coordinates (pdf-lib: y from BOTTOM of page)
// cover: white rectangle {x,y,w,h} to erase existing sample text before writing new text
// name: centred horizontally; date/id/instructor: left-anchored x
const DIPLOMA_COORD_MAP = {
  // ── Standard 989×794 — name field BLANK in template ──────────────────
  'Diamond Graduate Diploma.pdf':           {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82, size:10,cover:{x:185,y:69,w:200,h:20}},  instructor:{x:612,y:100,size:9}},
  'Graduate Gemologist Diploma .pdf':       {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82, size:10,cover:{x:185,y:69,w:200,h:20}},  instructor:{x:612,y:100,size:9}},
  'Colored Stone Graduate Diploma .pdf':    {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:null},                      id:{x:190,y:82, size:10,cover:null},                      instructor:{x:612,y:100,size:9}},
  'IRES Diploma.pdf':                       {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:null},                      id:{x:190,y:82, size:10,cover:null},                      instructor:{x:612,y:100,size:9}},
  'Diamnd Essential 5cs Diploma.pdf':       {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:null},                      id:{x:190,y:82, size:10,cover:null},                      instructor:{x:612,y:100,size:9}},
  // ── Standard 989×794 — name BLANK, date+ID have sample values ────────
  'JD Manual Diploma .pdf':                 {pageW:989,pageH:794, name:{y:415,size:27,cover:null},            date:{x:190,y:99, size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82, size:10,cover:{x:185,y:69,w:200,h:20}},  instructor:{x:612,y:100,size:9}},
  // ── Standard 989×794 — name+date+ID all have sample values ──────────
  'Jewelpad Oncampus Diploma .pdf':         {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  'Jewelpad online Diploma .pdf':           {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  'PDC Diploma .pdf':                       {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  'Rough Diamond Diploma .pdf':             {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  'Small Diamond Assortment Diploma .pdf':  {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  // ── Smart Learning GG  (989×794 landscape, name has sample value) ────
  'Smart Learning GG Diploma .pdf':         {pageW:989,pageH:794, name:{y:415,size:27,cover:{x:100,y:428,w:790,h:65}}, date:{x:190,y:99,size:11,cover:{x:185,y:86,w:200,h:22}},  id:{x:190,y:82,size:10,cover:{x:185,y:69,w:200,h:20}},   instructor:{x:612,y:100,size:9}},
  // ── A4 Landscape 842×595 Smart Learning ──────────────────────────────
  'Smart Learning DG Diploma .pdf':         {pageW:842,pageH:595, name:{y:340,size:22,cover:{x:100,y:322,w:640,h:45}}, date:{x:173,y:56, size:10,cover:{x:168,y:44,w:160,h:20}}, id:{x:173,y:38,size:9, cover:{x:168,y:27,w:160,h:18}},   instructor:{x:490,y:57, size:8}},
  'Smart Learning CSG Diploma.pdf':         {pageW:842,pageH:595, name:{y:340,size:22,cover:{x:100,y:322,w:640,h:45}}, date:{x:173,y:56, size:10,cover:{x:168,y:44,w:160,h:20}}, id:{x:173,y:38,size:9, cover:{x:168,y:27,w:160,h:18}},   instructor:{x:490,y:57, size:8}},
};

/**
 * getDiplomaTemplate
 * Returns the template PDF as base64 so the browser can generate the diploma client-side.
 */
function getDiplomaTemplate(ss, p) {
  try {
    var course      = String(p.course || '').trim();
    var templateFile = DIPLOMA_TEMPLATE_MAP[course];
    if (!templateFile) {
      // Fuzzy match — find closest key
      var lc = course.toLowerCase();
      Object.keys(DIPLOMA_TEMPLATE_MAP).forEach(function(k) {
        if (!templateFile && k.toLowerCase().indexOf(lc) > -1) templateFile = DIPLOMA_TEMPLATE_MAP[k];
      });
    }
    if (!templateFile) return {status:'error', reason:'no_template_for_course', course:course};

    // Find file in Drive folder
    var folder = DriveApp.getFolderById(DIPLOMA_TEMPLATES_FOLDER_ID);
    var files   = folder.getFilesByName(templateFile);
    if (!files.hasNext()) return {status:'error', reason:'template_file_not_found', file:templateFile};

    var file   = files.next();
    var bytes  = file.getBlob().getBytes();
    var b64    = Utilities.base64Encode(bytes);
    var coords = DIPLOMA_COORD_MAP[templateFile] || null;

    return {status:'ok', base64:b64, filename:templateFile, coords:coords};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * saveDiplomaFile
 * Saves the browser-generated diploma PDF to Drive and records it in the Diplomas sheet.
 * p.pdfBase64, p.studentId, p.studentName, p.batchCode, p.course, p.completionDate, p.releasedBy
 */
function saveDiplomaFile(ss, p) {
  try {
    var studentId      = String(p.studentId   || '').toUpperCase();
    var studentName    = String(p.studentName || '').trim();
    var batchCode      = String(p.batchCode   || '').toUpperCase();
    var course         = String(p.course      || '').trim();
    var completionDate = String(p.completionDate || '').trim();
    var releasedBy     = String(p.releasedBy  || 'Admin').trim();
    var pdfB64         = p.pdfBase64 || '';
    if (!studentId || !pdfB64) return {status:'error', reason:'missing_params'};

    // Get or create output folder
    var root  = DriveApp.getFolderById(DIPLOMA_TEMPLATES_FOLDER_ID);
    var outIt = root.getFoldersByName(DIPLOMA_OUTPUT_FOLDER_NAME);
    var outFolder = outIt.hasNext() ? outIt.next() : root.createFolder(DIPLOMA_OUTPUT_FOLDER_NAME);

    // Save PDF file
    var fileName = studentId + '_' + studentName.replace(/\s+/g, '_') + '_' + course.replace(/\s+/g, '_') + '.pdf';
    var pdfBytes = Utilities.base64Decode(pdfB64);
    var blob     = Utilities.newBlob(pdfBytes, 'application/pdf', fileName);
    var pdfFile  = outFolder.createFile(blob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId   = pdfFile.getId();
    var driveLink = 'https://drive.google.com/file/d/' + fileId + '/view';

    // Ensure Diplomas sheet
    var shDip = ss.getSheetByName(SH_DIPLOMAS);
    if (!shDip) {
      ss.insertSheet(SH_DIPLOMAS);
      shDip = ss.getSheetByName(SH_DIPLOMAS);
      shDip.appendRow(['Record ID','Student ID','Student Name','Batch Code','Course','Completion Date','Drive File ID','Drive Link','Generated At','Released By','Email Sent']);
    }

    var recordId = 'DIP-' + studentId + '-' + Date.now();
    shDip.appendRow([recordId, studentId, studentName, batchCode, course, completionDate, fileId, driveLink, new Date().toISOString(), releasedBy, 'No']);

    // Also update Enrollments sheet to "Released" + link
    var shEn = ss.getSheetByName(SH_ENROLLMENTS);
    if (shEn && shEn.getLastRow() > 1) {
      var enData = shEn.getRange(2,1,shEn.getLastRow()-1,8).getValues();
      for (var i=0; i<enData.length; i++) {
        if (String(enData[i][0]).toUpperCase()===studentId && String(enData[i][1]).toUpperCase()===batchCode) {
          shEn.getRange(i+2,5).setValue('Released');
          shEn.getRange(i+2,6).setValue(releasedBy);
          shEn.getRange(i+2,7).setValue(new Date().toISOString());
          // Store drive link in col 8 if header exists
          if (shEn.getLastColumn() >= 8) shEn.getRange(i+2,8).setValue(driveLink);
          break;
        }
      }
    }

    // Email student (optional)
    if (p.sendEmail === 'true' && studentName) {
      var shStud = ss.getSheetByName(SH_STUDENTS);
      var email  = '';
      if (shStud && shStud.getLastRow() > 1) {
        var stuRows = shStud.getRange(2,1,shStud.getLastRow()-1,10).getValues();
        stuRows.forEach(function(r){ if (String(r[0]).toUpperCase()===studentId && r[5]) email = r[5]; });
      }
      if (email) {
        try {
          MailApp.sendEmail({
            to: email,
            subject: 'Congratulations! Your IGI Diploma is Ready — ' + course,
            htmlBody: '<p>Dear ' + studentName + ',</p>' +
              '<p>Congratulations! 🎓 You have successfully completed the <strong>' + course + '</strong> course at IGI School of Gemology.</p>' +
              '<p>Your diploma is ready to download:<br>' +
              '<a href="' + driveLink + '" style="background:#C8A951;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin-top:8px">Download Your Diploma</a></p>' +
              '<p style="color:#666;font-size:12px">This diploma can be viewed and downloaded at any time using the link above.</p>' +
              '<p>Warm regards,<br>IGI School of Gemology</p>'
          });
          shDip.getRange(shDip.getLastRow(), 11).setValue('Yes');
        } catch(mailErr) {}
      }
    }

    return {status:'ok', driveLink:driveLink, fileId:fileId, recordId:recordId};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * getStudentDiplomas
 * Returns all diploma records for a student (for portal display).
 */
function getStudentDiplomas(ss, p) {
  try {
    var studentId = String(p.studentId || '').toUpperCase();
    if (!studentId) return {status:'error', reason:'missing_params'};

    var shDip = ss.getSheetByName(SH_DIPLOMAS);
    if (!shDip || shDip.getLastRow() < 2) return {status:'ok', diplomas:[]};

    var rows = shDip.getRange(2,1,shDip.getLastRow()-1,11).getValues();
    var diplomas = rows.filter(function(r){ return String(r[1]).toUpperCase()===studentId; }).map(function(r){
      return {
        recordId:       r[0], studentId: r[1], studentName: r[2],
        batchCode:      r[3], course: r[4],    completionDate: r[5],
        driveLink:      r[7], generatedAt: r[8], releasedBy: r[9]
      };
    });
    return {status:'ok', diplomas:diplomas};
  } catch(err) { return {status:'error', message:err.toString()}; }
}

/**
 * sendOverdueFeeEmailNotifications
 * Computes overdue fee installments and sends summarized email updates to centre counselors.
 */
function sendOverdueFeeEmailNotifications(ss) {
  var ss = ss || SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SH_FEES);
  if (!sh || sh.getLastRow() < 2) {
    Logger.log("sendOverdueFeeEmailNotifications: Student_Fees sheet empty or not found.");
    return { status: 'ok', overdueCount: 0, emailsSent: 0, message: "No fee records found." };
  }

  var tz = Session.getScriptTimeZone();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  var colsToRead = Math.max(lastCol, 41);
  var data = sh.getRange(2, 1, lastRow - 1, colsToRead).getValues();

  var COUNSELOR_EMAILS = {
    'Mumbai': ['anuradha@igi.org', 'indiaeducation@igi.org', 'omkar.kadam@igi.org'],
    'Lucknow': ['anuradha@igi.org'],
    'Ahmedabad': ['anuradha@igi.org'],
    'Delhi': ['delhiedu@igi.org'],
    'Bangalore': ['bangaloreedu@igi.org'],
    'Hyderabad': ['hyderabadedu@igi.org'],
    'Chennai': ['chennaiedu@igi.org'],
    'Jaipur': ['jaipuredu@igi.org'],
    'Surat': ['suratedu@igi.org'],
    'Kolkata': ['kolkataedu@igi.org']
  };
  var ADMIN_EMAIL = 'sunil.sharma@igi.org';

  var overdueByCentre = {};
  var totalOverdueCount = 0;

  for (var idx = 0; idx < data.length; idx++) {
    var r = data[idx];
    var studentId = r[0];
    if (!studentId) continue;

    var studentName = r[1] || 'Unknown';
    var batchCode = String(r[2] || '').toUpperCase();
    var centre = String(r[3] || '').trim();
    var course = r[4] || '';

    var overdueAmount = 0;
    var maxDaysPastDue = 0;
    var overdueInstallments = [];

    var installmentsToCheck = [
      { num: 1, amt: r[18], due: r[19], paid: r[20] },
      { num: 2, amt: r[24], due: r[25], paid: r[26] },
      { num: 3, amt: r[30], due: r[31], paid: r[32] }
    ];

    installmentsToCheck.forEach(function(inst) {
      if (String(inst.paid).trim().toUpperCase() !== 'Y' && inst.due) {
        var dueDate = new Date(inst.due);
        if (!isNaN(dueDate.getTime())) {
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            var amt = Number(inst.amt) || 0;
            overdueAmount += amt;
            var diffTime = today.getTime() - dueDate.getTime();
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysPastDue) {
              maxDaysPastDue = diffDays;
            }
            overdueInstallments.push({
              num: inst.num,
              amount: amt,
              dueDate: dueDate
            });
          }
        }
      }
    });

    var ft = normalizedFeeTotals(r);
    if (overdueAmount > 0 || (ft.feeStatus === 'Overdue' && ft.outstanding > 0)) {
      var finalOverdueAmount = overdueAmount > 0 ? overdueAmount : ft.outstanding;
      
      if (maxDaysPastDue === 0) {
        installmentsToCheck.forEach(function(inst) {
          if (String(inst.paid).trim().toUpperCase() !== 'Y' && inst.due) {
            var dDate = new Date(inst.due);
            if (!isNaN(dDate.getTime())) {
              dDate.setHours(0, 0, 0, 0);
              var diff = today.getTime() - dDate.getTime();
              var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
              if (days > maxDaysPastDue) maxDaysPastDue = days;
            }
          }
        });
      }

      var studentObj = {
        studentId: studentId,
        studentName: studentName,
        batchCode: batchCode,
        course: course,
        overdueAmount: finalOverdueAmount,
        outstanding: ft.outstanding,
        daysPastDue: maxDaysPastDue,
        installments: overdueInstallments
      };

      if (!overdueByCentre[centre]) {
        overdueByCentre[centre] = [];
      }
      overdueByCentre[centre].push(studentObj);
      totalOverdueCount++;
    }
  }

  if (totalOverdueCount === 0) {
    Logger.log("sendOverdueFeeEmailNotifications: No overdue records found.");
    return { status: 'ok', overdueCount: 0, emailsSent: 0, message: "No overdue fee records found." };
  }

  var emailsSentCount = 0;
  var processedCentres = Object.keys(overdueByCentre);

  for (var cIdx = 0; cIdx < processedCentres.length; cIdx++) {
    var centreName = processedCentres[cIdx];
    var students = overdueByCentre[centreName];
    if (students.length === 0) continue;

    var toEmails = COUNSELOR_EMAILS[centreName] || [];
    var isFallbackToAdmin = false;
    
    if (toEmails.length === 0) {
      toEmails = [ADMIN_EMAIL];
      isFallbackToAdmin = true;
    }

    var toEmailsStr = toEmails.join(',');
    
    students.sort(function(a, b) {
      return b.daysPastDue - a.daysPastDue;
    });

    var tableRowsHtml = '';
    students.forEach(function(s) {
      var formattedAmt = '₹' + s.overdueAmount.toLocaleString('en-IN');
      var formattedOut = '₹' + s.outstanding.toLocaleString('en-IN');
      var instDetails = s.installments.map(function(inst) {
        return 'Inst ' + inst.num + ' (due ' + Utilities.formatDate(inst.dueDate, tz, 'yyyy-MM-dd') + ')';
      }).join(', ');
      
      if (!instDetails) {
        instDetails = 'General past due';
      }

      tableRowsHtml += '<tr style="border-bottom: 1px solid #E2E8F0;">' +
        '<td style="padding: 12px 10px; font-size: 13px; color: #1E293B;">' +
          '<div style="font-weight: 600; color: #0F172A;">' + escapeHtml(s.studentName) + '</div>' +
          '<div style="font-size: 11px; color: #64748B;">ID: ' + escapeHtml(s.studentId) + '</div>' +
        '</td>' +
        '<td style="padding: 12px 10px; font-size: 13px; color: #334155;">' +
          '<div style="font-weight: 500;">' + escapeHtml(s.batchCode) + '</div>' +
          '<div style="font-size: 11px; color: #64748B;">' + escapeHtml(s.course) + '</div>' +
        '</td>' +
        '<td style="padding: 12px 10px; font-size: 13px; text-align: right; color: #B91C1C; font-weight: 600;">' + formattedAmt + '</td>' +
        '<td style="padding: 12px 10px; font-size: 13px; text-align: right; color: #475569;">' + formattedOut + '</td>' +
        '<td style="padding: 12px 10px; font-size: 13px; text-align: center; color: #1E293B;">' +
          '<span style="background-color: #FEF2F2; color: #991B1B; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">' + s.daysPastDue + ' days</span>' +
        '</td>' +
        '<td style="padding: 12px 10px; font-size: 11px; color: #64748B;">' + escapeHtml(instDetails) + '</td>' +
      '</tr>';
    });

    var subject = '⚠️ Overdue Fee Alert: ' + centreName + ' Centre — ' + students.length + ' Pending';
    if (isFallbackToAdmin) {
      subject = '[Admin Alert] Unmapped Centre Overdue Fees: ' + centreName + ' — ' + students.length + ' Pending';
    }

    var htmlBody = '<html><body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px; margin: 0; -webkit-font-smoothing: antialiased;">' +
      '<div style="max-width: 800px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-top: 6px solid #0D1B2E; overflow: hidden;">' +
        '<div style="background-color: #0D1B2E; padding: 24px; text-align: center;">' +
          '<h1 style="color: #C9A84C; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">IGI SCHOOL OF GEMOLOGY</h1>' +
          '<p style="color: #FDFCF9; margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Overdue Fee Installment Summary &mdash; ' + escapeHtml(centreName) + ' Centre</p>' +
        '</div>' +
        '<div style="padding: 24px;">' +
          '<p style="font-size: 15px; color: #334155; line-height: 1.6; margin-top: 0;">Dear Team,</p>' +
          '<p style="font-size: 15px; color: #334155; line-height: 1.6;">Please find below the summary of students in <strong>' + escapeHtml(centreName) + '</strong> who currently have overdue fee installments. Please follow up with them immediately to reconcile these accounts.</p>' +
          '<div style="margin-top: 24px; overflow-x: auto;">' +
            '<table style="width: 100%; border-collapse: collapse; border: 1px solid #E2E8F0; min-width: 600px;">' +
              '<thead>' +
                '<tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">' +
                  '<th style="text-align: left; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Student</th>' +
                  '<th style="text-align: left; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Batch / Course</th>' +
                  '<th style="text-align: right; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Overdue Amt</th>' +
                  '<th style="text-align: right; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Total Out.</th>' +
                  '<th style="text-align: center; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Overdue Days</th>' +
                  '<th style="text-align: left; padding: 12px 10px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Installment Details</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                tableRowsHtml +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div style="margin-top: 28px; text-align: center;">' +
            '<a href="https://igi-feedback-attendance.vercel.app/counselor.html" style="background-color: #0D1B2E; color: #C9A84C; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Go to Counselor Portal</a>' +
          '</div>' +
          '<hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 32px 0 16px 0;">' +
          '<p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.5;">This is an automated system notification. For any fee updates, please check and record transactions inside the Counselor Portal or directly in the Student Fees Google Sheet.</p>' +
        '</div>' +
      '</div>' +
    '</body></html>';

    var textBody = 'Dear Team,\n\n' +
      'Please find below the summary of students in ' + centreName + ' who currently have overdue fee installments.\n\n' +
      students.map(function(s) {
        return '- ' + s.studentName + ' (ID: ' + s.studentId + ')\n' +
          '  Batch: ' + s.batchCode + ' | Course: ' + s.course + '\n' +
          '  Overdue Amount: ₹' + s.overdueAmount + '\n' +
          '  Total Outstanding: ₹' + s.outstanding + '\n' +
          '  Days Past Due: ' + s.daysPastDue + ' days\n';
      }).join('\n') +
      '\nRegards,\nIGI School of Gemology';

    var emailOptions = {
      to: toEmailsStr,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
      name: 'IGI School of Gemology'
    };

    if (!isFallbackToAdmin) {
      emailOptions.cc = ADMIN_EMAIL;
    }

    try {
      MailApp.sendEmail(emailOptions);
      emailsSentCount++;
      Logger.log("sendOverdueFeeEmailNotifications: Sent overdue fee email for centre " + centreName + " to: " + toEmailsStr);
    } catch(mailErr) {
      Logger.log("sendOverdueFeeEmailNotifications: Error sending email to: " + toEmailsStr + ". Details: " + mailErr.toString());
    }
  }

  return {
    status: 'ok',
    overdueCount: totalOverdueCount,
    emailsSent: emailsSentCount,
    message: "Processed " + processedCentres.length + " centres. Dispatched " + emailsSentCount + " emails."
  };
}

/**
 * createDailyOverdueEmailTrigger
 * Configures the daily time-driven trigger for overdue fee emails.
 */
function createDailyOverdueEmailTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var exists = triggers.some(function(t) {
    return t.getHandlerFunction() === 'dailyOverdueEmailTrigger';
  });
  if (!exists) {
    ScriptApp.newTrigger('dailyOverdueEmailTrigger')
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();
  }
}

/**
 * dailyOverdueEmailTrigger
 * Trigger handler function executed daily.
 */
function dailyOverdueEmailTrigger() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  sendOverdueFeeEmailNotifications(ss);
}

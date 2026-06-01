/**
 * IGI Feedback Attendance — shared constants
 * Included inline in each HTML page
 */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWiL5q9A3Z1odYYK0ZRR8ngqwPhzPnkX4maKJRlgM6QspoiV1abAzFjRwEJIZEDpC65Q/exec';
const COUNSELOR_PASS_LOCAL = 'IGI2026'; // used for holiday management calls

const CENTRES  = ['Mumbai','Delhi','Kolkata','Surat','Chennai','Hyderabad','Pune','Bangalore','Lucknow','Ahmedabad','Jaipur'];
const COURSES  = [
  'Diamond Graduate','Colored Stone Graduate','Jewelry Design','CAD Design',
  'JewelPad Design','Diploma in Pearls','Polished Diamond Grading',
  'Rough Diamond Graduate','Identification of RES','Small Diamond Assortment',
  'Diamond Graduate Integrated','Coloured Stone Integrated',
  'Corporate Programs','Seminars','Gem-A Foundation','Gem-A Diploma',
  'Emerald','Pearl',
  'Navratna Masterclass (10 Half Days)','Navratna Masterclass (5 Full Days)'
];
const INSTRUCTORS = [
  'Amit Sidpura','Asmita Saroday','Arjun Mistry','Bhavin Patel',
  'Sneha Garodia','Khorehmand Kasad','Nishchay Kapoor','Piyush Ahuja',
  'Preeti Agarwala','Sayan Banerjee','Deepak Nachankar','Sharoon Joy','Seema Athavale'
];

function gasGet(params, cb) {
  const cbName = '_cb_' + Date.now() + '_' + Math.floor(Math.random()*9999);
  const qs     = Object.entries(params).map(([k,v])=>k+'='+encodeURIComponent(v||'')).join('&');
  const s      = document.createElement('script');
  let done     = false;
  window[cbName] = function(d){ done=true; delete window[cbName]; try{document.body.removeChild(s);}catch(x){} cb(null,d); };
  s.onerror = function(){ if(!done){done=true;delete window[cbName];try{document.body.removeChild(s);}catch(x){}cb(new Error('network'),null);} };
  s.src = GAS_URL + '?' + qs + '&callback=' + cbName;
  document.body.appendChild(s);
  setTimeout(function(){ if(!done){done=true;delete window[cbName];try{document.body.removeChild(s);}catch(x){}cb(new Error('timeout'),null);} }, 12000);
}

function ensureToastHost() {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type) {
  const host = ensureToastHost();
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 180);
  }, 3200);
}

function emptyState(icon, title, message, actionHtml) {
  return '<div class="empty-state"><div class="empty-icon">' + icon + '</div><div class="empty-title">' + title + '</div><div class="empty-copy">' + message + '</div>' + (actionHtml || '') + '</div>';
}

function loadingState(message) {
  return '<div class="spinner-wrap"><div class="spinner"></div><p>' + (message || 'Loading...') + '</p></div>';
}

const CSS_VARS = `
:root{
  --navy:#0D1B2E;--navy2:#1A2F4E;--gold:#C9A84C;--gold-light:#E8C97A;--gold-pale:#F9F3E3;
  --white:#FDFCF9;--off:#F4F1EB;--muted:#8A8070;--border:rgba(201,168,76,0.2);
  --teal:#1D9E75;--red:#C94A4A;--blue:#185FA5;--radius:12px;
  --shadow:0 4px 24px rgba(13,27,46,0.10);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:"DM Sans",sans-serif;background:linear-gradient(180deg,#FBFAF6 0%,var(--off) 42%,#EEE8DC 100%);color:var(--navy);min-height:100vh;font-size:15px;line-height:1.6}
.wrap{max-width:1040px;margin:0 auto;padding:20px 16px 60px}
.site-header{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:var(--radius);margin-bottom:18px;overflow:hidden;box-shadow:0 16px 36px rgba(13,27,46,.16)}
.hdr-logo{padding:18px 24px 12px;display:flex;align-items:center;justify-content:center}
.hdr-logo img{height:38px;width:auto}
.hdr-divider{height:1px;background:rgba(201,168,76,0.3);margin:0 24px}
.hdr-band{padding:8px 24px 14px;text-align:center}
.hdr-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
.hdr-sub{font-size:11px;color:rgba(255,255,255,0.4)}
.card{background:rgba(253,252,249,.96);border-radius:var(--radius);border:1px solid var(--border);padding:22px;margin-bottom:16px;box-shadow:var(--shadow)}
.section-tag{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}
.card h2{font-size:18px;font-weight:600;color:var(--navy);margin-bottom:4px}
.card .sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.5}
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;background:var(--white);color:var(--navy);outline:none;transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--gold)}
.field .auto-val{background:var(--gold-pale);font-weight:600;font-size:13px;color:#6b4c10}
.field textarea{resize:vertical;min-height:70px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:600;cursor:pointer;border:none;transition:all .2s}
.btn-gold{background:var(--gold);color:var(--navy);width:100%}
.btn-gold:hover{background:var(--gold-light)}
.btn-gold:disabled{opacity:.5;cursor:not-allowed}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--muted)}
.btn-outline:hover{border-color:var(--gold);color:var(--navy)}
.btn-danger{background:transparent;border:1.5px solid var(--red);color:var(--red)}
.spinner-wrap{text-align:center;padding:32px}
.spinner{width:30px;height:30px;border:3px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 12px}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner-wrap p{font-size:13px;color:var(--muted)}
.err-box{background:#FEF2F2;border:1px solid rgba(201,74,74,.3);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--red);margin-top:10px;display:none}
.err-box.show{display:block}
.info-box{background:var(--gold-pale);border-left:3px solid var(--gold);border-radius:0 8px 8px 0;padding:10px 14px;font-size:12px;color:#6b4c10;margin-bottom:14px;line-height:1.6}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge-green{background:#E8F5EE;color:#1a7a3c}
.badge-red{background:#FEF2F2;color:var(--red)}
.badge-amber{background:var(--gold-pale);color:#B87A10}
.badge-blue{background:#EEF4FB;color:var(--blue)}
.screen{display:none}.screen.active{display:block}
.tab-bar{display:flex;gap:4px;background:rgba(13,27,46,.96);border-radius:10px;padding:6px;margin-bottom:20px;overflow-x:auto;position:sticky;top:8px;z-index:5;box-shadow:0 12px 28px rgba(13,27,46,.12)}
.tab{flex:1;min-width:max-content;padding:9px 12px;border-radius:7px;font-size:12px;font-weight:600;text-align:center;cursor:pointer;color:rgba(255,255,255,.58);transition:all .2s;border:none;background:transparent;font-family:"DM Sans",sans-serif;white-space:nowrap}
.tab.active{background:var(--gold);color:var(--navy)}
.tab-content{display:none}.tab-content.active{display:block}
.dashboard-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.summary-tile{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:14px 15px;box-shadow:0 3px 14px rgba(13,27,46,.06);min-height:92px}
.summary-tile .k{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.summary-tile .v{font-family:"DM Mono",monospace;font-size:28px;line-height:1.1;font-weight:700;color:var(--navy);margin-top:8px}
.summary-tile .s{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.35}
.summary-tile.warn{border-color:rgba(201,74,74,.22);background:#FFF8F5}
.summary-tile.ok{border-color:rgba(29,158,117,.2);background:#F4FBF7}
.empty-state{text-align:center;border:1px dashed rgba(138,128,112,.35);background:rgba(244,241,235,.55);border-radius:10px;padding:28px 18px;color:var(--muted)}
.empty-icon{font-size:26px;line-height:1;margin-bottom:10px}
.empty-title{font-size:15px;font-weight:700;color:var(--navy);margin-bottom:4px}
.empty-copy{font-size:13px;max-width:420px;margin:0 auto;line-height:1.5}
.compact-table{width:100%;border-collapse:separate;border-spacing:0 7px;font-size:13px}
.compact-table th{text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);padding:0 10px 2px}
.compact-table td{background:var(--off);padding:10px;border-top:1px solid transparent;border-bottom:1px solid transparent;vertical-align:middle}
.compact-table td:first-child{border-radius:8px 0 0 8px}
.compact-table td:last-child{border-radius:0 8px 8px 0;text-align:right}
.search-input{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:"DM Sans",sans-serif;font-size:13px;background:var(--white);color:var(--navy);outline:none;margin-bottom:10px}
.search-input:focus{border-color:var(--gold)}
.timeline-list{position:relative;display:grid;gap:12px;margin-top:8px}
.timeline-card{position:relative;border:1px solid var(--border);border-radius:10px;background:var(--white);padding:14px 16px 14px 20px;box-shadow:0 2px 12px rgba(13,27,46,.05)}
.timeline-card:before{content:"";position:absolute;left:8px;top:18px;width:7px;height:7px;border-radius:50%;background:var(--gold)}
.timeline-card.today{background:var(--gold-pale);border-color:rgba(201,168,76,.65)}
.timeline-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.timeline-title{font-size:14px;font-weight:800;color:var(--navy)}
.timeline-meta{font-size:11px;color:var(--muted);margin-top:2px}
.timeline-topic{font-size:13px;color:var(--navy);margin-top:8px;line-height:1.45}
.timeline-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.toast-host{position:fixed;right:16px;bottom:16px;display:grid;gap:8px;z-index:9999;max-width:min(360px,calc(100vw - 32px))}
.toast{transform:translateY(8px);opacity:0;border-radius:10px;padding:11px 14px;background:var(--navy);color:var(--white);box-shadow:0 14px 34px rgba(13,27,46,.24);font-size:13px;font-weight:600;transition:opacity .18s,transform .18s}
.toast.show{opacity:1;transform:translateY(0)}
.toast-error{background:#8D2D2D}.toast-info{background:var(--navy2)}
@media(max-width:760px){.dashboard-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap{padding:12px 12px 50px}.card{padding:18px 16px}.compact-table thead{display:none}.compact-table,.compact-table tbody,.compact-table tr,.compact-table td{display:block;width:100%}.compact-table tr{background:var(--off);border-radius:8px;margin-bottom:8px;padding:8px 10px}.compact-table td{background:transparent;padding:3px 0}.compact-table td:last-child{text-align:left}}
@media(max-width:430px){.dashboard-summary{grid-template-columns:1fr}.hdr-logo img{height:32px}}
`;

const COURSE_FEES_JS = {
  'Diamond Graduate':                    {fee:165900,regFee:25000,gst:18},
  'Colored Stone Graduate':              {fee:185900,regFee:25000,gst:18},
  'Graduate Gemologist':                 {fee:351800,regFee:50000,gst:18},
  'JewelPad Design':                     {fee:41900, regFee:0,    gst:18},
  'Navratna Masterclass (10 Half Days)': {fee:51900, regFee:0,    gst:18},
  'Navratna Masterclass (5 Full Days)':  {fee:51900, regFee:0,    gst:18},
  'Gem-A Foundation':                    {fee:285500,regFee:0,    gst:18},
  'Gem-A Diploma':                       {fee:422500,regFee:0,    gst:18},
  'Jewelry Design Manual':               {fee:103900,regFee:0,    gst:18},
  'Polished Diamond Grading':            {fee:99900, regFee:0,    gst:18},
  'Small Diamond Assortment':            {fee:14900, regFee:0,    gst:18},
  'Rough Diamond':                       {fee:51900, regFee:0,    gst:18},
  'iRES':                                {fee:35900, regFee:0,    gst:18},
  'Diamond Essentials 5Cs':            {fee:25900, regFee:0,    gst:18},
  'JD-CAD':                              {fee:82900, regFee:0,    gst:18},
  'Smart Learning DG':                   {fee:114900,regFee:0,    gst:18},
  'Smart Learning CSG':                  {fee:114900,regFee:0,    gst:18},
  'Smart Learning GG':                   {fee:229800,regFee:0,    gst:18}
};
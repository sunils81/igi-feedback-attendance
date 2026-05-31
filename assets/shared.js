/**
 * IGI Feedback Attendance — shared constants
 * Included inline in each HTML page
 */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxWiL5q9A3Z1odYYK0ZRR8ngqwPhzPnkX4maKJRlgM6QspoiV1abAzFjRwEJIZEDpC65Q/exec';

const CENTRES  = ['Mumbai','Delhi','Kolkata','Surat','Chennai','Hyderabad','Pune','Bangalore','Lucknow','Ahmedabad','Jaipur'];
const COURSES  = [
  'Diamond Graduate','Colored Stone Graduate','Jewelry Design','CAD Design',
  'JewelPad Design','Diploma in Pearls','Polished Diamond Grading',
  'Rough Diamond Graduate','Identification of RES','Small Diamond Assortment',
  'Diamond Graduate Integrated','Coloured Stone Integrated',
  'Corporate Programs','Seminars','Gem-A Foundation','Gem-A Diploma','Emerald','Pearl'
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

const CSS_VARS = `
:root{
  --navy:#0D1B2E;--navy2:#1A2F4E;--gold:#C9A84C;--gold-light:#E8C97A;--gold-pale:#F9F3E3;
  --white:#FDFCF9;--off:#F4F1EB;--muted:#8A8070;--border:rgba(201,168,76,0.2);
  --teal:#1D9E75;--red:#C94A4A;--blue:#185FA5;--radius:12px;
  --shadow:0 4px 24px rgba(13,27,46,0.10);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:"DM Sans",sans-serif;background:var(--off);color:var(--navy);min-height:100vh;font-size:15px;line-height:1.6}
.wrap{max-width:720px;margin:0 auto;padding:20px 16px 60px}
.site-header{background:var(--navy);border-radius:var(--radius);margin-bottom:24px;overflow:hidden}
.hdr-logo{padding:18px 24px 12px;display:flex;align-items:center;justify-content:center}
.hdr-logo img{height:38px;width:auto}
.hdr-divider{height:1px;background:rgba(201,168,76,0.3);margin:0 24px}
.hdr-band{padding:8px 24px 14px;text-align:center}
.hdr-label{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
.hdr-sub{font-size:11px;color:rgba(255,255,255,0.4)}
.card{background:var(--white);border-radius:var(--radius);border:1px solid var(--border);padding:24px;margin-bottom:16px;box-shadow:var(--shadow)}
.section-tag{font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}
.card h2{font-size:18px;font-weight:600;color:var(--navy);margin-bottom:4px}
.card .sub{font-size:13px;color:var(--muted);margin-bottom:18px;line-height:1.5}
.field{margin-bottom:14px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
.field input,.field select,.field textarea{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;background:var(--white);color:var(--navy);outline:none;transition:border-color .2s}
.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--gold)}
.field .auto-val{background:var(--gold-pale);font-weight:600;font-size:13px;color:#6b4c10}
.field textarea{resize:vertical;min-height:70px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 22px;border-radius:8px;font-family:"DM Sans",sans-serif;font-size:14px;font-weight:500;cursor:pointer;border:none;transition:all .2s}
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
.tab-bar{display:flex;gap:4px;background:var(--navy);border-radius:10px;padding:6px;margin-bottom:20px}
.tab{flex:1;padding:9px;border-radius:7px;font-size:12px;font-weight:600;text-align:center;cursor:pointer;color:rgba(255,255,255,.5);transition:all .2s;border:none;background:transparent;font-family:"DM Sans",sans-serif}
.tab.active{background:var(--gold);color:var(--navy)}
.tab-content{display:none}.tab-content.active{display:block}
@media(max-width:600px){.wrap{padding:12px 12px 50px}.card{padding:18px 16px}}
`;

import json
OUT = []
A = OUT.append

# ---------------- 1. hero ----------------
A('''<section class="scene dark" id="s-hero" data-chap="Welcome" data-wipe="diamond" data-morph="1480,560,520,0,hex">
  <div data-cx="hero" style="position:absolute;right:0;top:0;width:1200px;height:1080px;border-radius:0;border:0;background:radial-gradient(60% 55% at 55% 50%,#14305a 0%,#0a1630 55%,#060d1f 100%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,12,28,1) 0%,rgba(6,12,28,.92) 36%,rgba(6,12,28,0) 62%);pointer-events:none"></div>
  <div class="pad" style="justify-content:center;gap:30px;pointer-events:none">
    <img src="media/igi-logo-white.png" alt="IGI School of Gemology" class="rise" style="width:340px">
    <div class="eyebrow rise">Colored Stone Graduate · Crystallography · Part 2</div>
    <h1 class="kt" style="font-size:112px;max-width:900px;color:#FBF6EA">Symmetry, Habit <span class="it shine">& the Gem Bench</span></h1>
    <p class="lead rise" style="max-width:760px">The rules behind crystal geometry, the shapes gems really grow in, the history of the science and how it helps at the bench.</p>
    <div class="row rise" style="gap:14px"><span class="chip gold">4 chapters</span><span class="chip">Rotation lab</span><span class="chip">Crystal gallery</span><span class="chip">Quiz & matching</span></div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3,v=new C.Viewer(sc.querySelector('[data-cx=hero]'),{fit:1,r:11,spin:.003,view:'std',labels:false});v.st.axes=false;v.apply();
   var g1=CXD.solid(v.extra,C.FORMS.garnetCombo(),0xc23040,{pos:v3(0,-1.7,-.4)}),g2=CXD.solid(v.extra,C.FORMS.quartz().map(function(p){return{n:p.n,d:p.d*1.15}}),0xb58be0,{pos:v3(0,.45,.3)}),g3=CXD.solid(v.extra,C.FORMS.octahedron(),0xe0507a,{pos:v3(0,2.5,-.4)});
   g1.scale.setScalar(.75);g3.scale.setScalar(.8);v.root.position.y=.3;v.r=v.r0=13.6;
   v.onFrame=function(now){g1.rotation.z=now/2600;g3.rotation.z=-now/3000;g2.rotation.z=now/4000};
  })();
  </script>
</section>''')

# ---------------- 2. symmetry elements ----------------
A('''<section class="scene dark" id="s-sym" data-chap="Symmetry elements" data-wipe="hex" data-morph="960,560,1250,45,diamond">
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Chapter 4 · What is crystal symmetry?</div><div data-cx="els"></div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:1120px;flex:none"></div>
      <div class="col grow" style="gap:16px;justify-content:center"><div id="syN" class="sysh" style="font-size:52px"></div><p class="dk" id="syT" style="font-size:23px"></p>
        <div class="tip" style="font-size:19px">Watch the <b style="color:#ff6f61">red corner</b>. After each operation it lands on a corner that looks exactly the same, and the crystal coincides with its gold outline. That is what “symmetry” means.</div>
        <p class="small" style="color:#9fb6da">Symmetry elements, and the combination a crystal has, decide which of the seven systems it belongs to.</p></div>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{fit:1,r:8.6,spin:.002,tools:['views','auto','reset'],labels:false});v.st.axes=false;v.apply();
   var op=new T.Group();v.extra.add(op);CXD.solid(op,C.FORMS.cube(),0x8fc7ff,{opacity:.4});var mk=new T.Mesh(new T.SphereGeometry(.12,18,14),new T.MeshStandardMaterial({color:0xff6f61,emissive:0x401010}));mk.position.set(1,1,1);op.add(mk);
   var gh=CXD.solid(v.extra,C.FORMS.cube(),0xffd27a,{opacity:.0,edge:0xffd27a,r:.012});gh.children.forEach(function(c){if(c.material&&c.material.opacity!==undefined&&c.geometry.type==='CylinderGeometry'){c.material=c.material.clone();c.material.opacity=.55}});
   var gm=new T.Mesh(new T.SphereGeometry(.07,14,10),new T.MeshBasicMaterial({color:0xffd27a}));gm.position.set(1,1,1);v.extra.add(gm);
   var el=new T.Group();v.extra.add(el);var am=new T.MeshBasicMaterial({color:0xffd27a});
   function axis(d){var u=d.clone().normalize(),p=u.clone().multiplyScalar(-2.4),q=u.clone().multiplyScalar(2.4),L=4.8,cy=new T.Mesh(new T.CylinderGeometry(.025,.025,L,10),am);cy.quaternion.setFromUnitVectors(v3(0,1,0),u);el.add(cy)}
   var S={r4:['4-fold rotation axis','Through the centres of opposite cube faces. A quarter turn (90°) brings the crystal back into coincidence, four times in a full turn.',v3(0,0,1),4],r3:['3-fold rotation axis','Through opposite corners. A third of a turn (120°) repeats it. Four of these axes are what make a crystal cubic.',v3(1,1,1),3],r2:['2-fold rotation axis','Through the midpoints of opposite edges. A half turn (180°) repeats it.',v3(1,1,0),2],m:['Mirror plane','A plane that cuts the crystal into two halves that are mirror images. Each point is reflected to the same distance on the other side.',v3(0,0,1),'m'],i:['Centre of symmetry','Every point is matched by an identical point the same distance away on the opposite side of the centre (inversion).',null,'i']};
   var cur='r4',t0=performance.now();
   CXD.seg(sc.querySelector('[data-cx=els]'),[['r4','4-fold axis'],['r3','3-fold axis'],['r2','2-fold axis'],['m','Mirror plane'],['i','Centre']],function(k){cur=k;t0=performance.now();while(el.children.length)el.remove(el.children[0]);document.getElementById('syN').textContent=S[k][0];document.getElementById('syT').textContent=S[k][1];op.quaternion.identity();op.scale.set(1,1,1);
     if(S[k][2]&&typeof S[k][3]==='number')axis(S[k][2]);
     if(k==='m'){var pm=new T.Mesh(new T.PlaneGeometry(3.4,3.4),new T.MeshStandardMaterial({color:0xffd27a,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false}));el.add(pm)}
     if(k==='i'){var c=new T.Mesh(new T.SphereGeometry(.09,16,12),am);el.add(c);var ln=new T.Line(new T.BufferGeometry().setFromPoints([v3(1,1,1),v3(-1,-1,-1)]),new T.LineDashedMaterial({color:0xffd27a,dashSize:.12,gapSize:.08}));ln.computeLineDistances();el.add(ln)}},0);
   v.onFrame=function(now){var t=(now-t0)/1000,s=S[cur],per=2.4,ph=t%per,k=Math.floor(t/per),e=Math.min(1,ph/1.1),ee=e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2;
     if(typeof s[3]==='number'){var ang=2*Math.PI/s[3]*(k+ee);op.quaternion.setFromAxisAngle(s[2].clone().normalize(),ang);op.scale.set(1,1,1)}
     else{op.quaternion.identity();var f=(k%2===0)?1-2*ee:-1+2*ee;if(s[3]==='m')op.scale.set(1,1,f);else op.scale.set(f,f,f)}};
  })();
  </script>
</section>''')

# ---------------- 3. rotation lab ----------------
A('''<section class="scene dark" id="s-rot" data-chap="Rotation lab" data-wipe="slice" data-morph="1800,200,90,0,hex">
  <style>#s-rot .res{font:700 30px/1.2 var(--display);padding:14px 18px;border-radius:14px;border:1px solid rgba(160,200,255,.3);color:#fff;min-height:64px}#s-rot .res.ok{border-color:#58c27a;background:rgba(88,194,122,.14)}#s-rot .res.no{border-color:#e06a5a;background:rgba(224,106,90,.14)}</style>
  <div class="pad" style="gap:14px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Rotational symmetry lab · turn the crystal about its c axis</div><div data-cx="models"></div></div>
    <div class="row rise" style="flex:1;gap:26px;min-height:0">
      <div data-cx="v" style="width:860px;flex:none"></div>
      <div class="col grow" style="gap:14px;min-width:0">
        <div class="row" style="gap:10px;align-items:center"><span class="eyebrow" style="font-size:13px">Rotate by</span><div data-cx="angles"></div></div>
        <div class="res" id="roR">Choose an angle. The gold outline shows where the crystal started.</div>
        <p class="dk" id="roT"></p>
        <div class="row" style="gap:18px;flex:1;min-height:0;align-items:stretch">
          <svg viewBox="0 0 640 300" id="roSvg" style="flex:1;background:rgba(255,255,255,.04);border-radius:16px;border:1px solid rgba(160,200,255,.16)"></svg>
        </div>
        <div class="tip" style="font-size:18px">Only <b>1-, 2-, 3-, 4- and 6-fold</b> rotations are possible in a repeating crystal lattice. Pentagons cannot fill a plane without gaps, so ordinary crystals never show 5-fold symmetry. (Quasicrystals, discovered by Dan Shechtman, are ordered but not periodic.)</div>
      </div>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{fit:5.3,labels:false,tools:['views','reset'],auto:false,view:'std'});v.th=20*C.D2R;v.ph=58*C.D2R;v.o.view='std';
   var M={beryl:['Beryl (hexagonal)',6,true,0x2fb37a],tourmaline:['Tourmaline (trigonal)',3,true,0x37a46a],zircon:['Zircon (tetragonal)',4,false,0x8fb8e8],topaz:['Topaz (orthorhombic)',2,false,0xe39a3a],tri:['Kyanite-type (triclinic)',1,false,0x4a74c9]};
   var key='beryl',ghost=null,mk=null,gk=null,target=0,cur=0,from=0,t0=0;
   function load(k){key=k;var m=M[k];var H=CXD.crystal(v,k,{four:m[2],color:m[3]});v.st.cell=false;v.st.axes=false;v.apply();
     CXD.clearExtra(v);ghost=CXD.solid(v.extra,C.FORMS[k](),0xffd27a,{opacity:0,edge:0xffd27a,r:v.ext*.008});
     var top=H.V.reduce(function(a,p){return (p.z>a.z+1e-6||(Math.abs(p.z-a.z)<1e-6&&p.x>a.x))?p:a},H.V[0]);
     mk=new T.Mesh(new T.SphereGeometry(v.ext*.05,16,12),new T.MeshStandardMaterial({color:0xff6f61,emissive:0x401010}));mk.position.copy(top);v.faces.add(mk);
     gk=new T.Mesh(new T.SphereGeometry(v.ext*.03,12,10),new T.MeshBasicMaterial({color:0xffd27a}));gk.position.copy(top);v.extra.add(gk);
     var ax=new T.Mesh(new T.CylinderGeometry(v.ext*.01,v.ext*.01,v.ext*2.6,8),new T.MeshBasicMaterial({color:0x8fc7ff}));ax.quaternion.setFromUnitVectors(v3(0,1,0),v3(0,0,1));v.extra.add(ax);
     cur=target=0;rot(0);document.getElementById('roR').className='res';document.getElementById('roR').textContent='Choose an angle. The gold outline shows where the crystal started.';
     document.getElementById('roT').innerHTML='<b>'+m[0]+'</b> has a <b>'+m[1]+'-fold</b> axis along c'+(m[1]===1?' (no rotational symmetry at all)':'')+'. It repeats every <b>'+(360/m[1])+'°</b>.'}
   function rot(a){v.faces.rotation.z=a;v.edges.rotation.z=a}
   function turn(deg){from=0;target=deg*C.D2R;t0=performance.now();var n=M[key][1],ok=Math.abs((deg%(360/n)))<1e-6;var r=document.getElementById('roR');r.className='res '+(ok?'ok':'no');r.innerHTML=ok?'✓ '+deg+'°: the crystal matches its outline.':'✗ '+deg+'°: it does not match. Look at the outline.'}
   CXD.seg(sc.querySelector('[data-cx=models]'),Object.keys(M).map(function(k){return[k,M[k][0].split(' (')[0]]}),function(k){load(k)},0);
   var as=sc.querySelector('[data-cx=angles]');as.classList.add('cxseg');[60,90,120,180,360].forEach(function(d){var b=document.createElement('button');b.type='button';b.textContent=d+'°';b.onclick=function(e){e.stopPropagation();[].forEach.call(as.children,function(x){x.classList.toggle('on',x===b)});turn(d)};as.appendChild(b)});
   v.onFrame=function(now){if(target){var k=Math.min(1,(now-t0)/1200),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;rot(target*e)}};
   // tiling demo
   var s=document.getElementById('roSvg'),h='',poly=function(cx,cy,n,r,rot,fill){var p=[];for(var i=0;i<n;i++){var a=rot+i*2*Math.PI/n;p.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1))}return'<polygon points="'+p.join(' ')+'" fill="'+fill+'" stroke="#0a1630" stroke-width="2"/>'};
   for(var i=0;i<4;i++)for(var j=0;j<3;j++)h+='<rect x="'+(20+i*34)+'" y="'+(60+j*34)+'" width="34" height="34" fill="#4a74c9" stroke="#0a1630" stroke-width="2"/>';
   var R=22;for(var j=0;j<4;j++)for(var i=0;i<4;i++){var cx=200+i*R*1.732+(j%2)*R*.866,cy=70+j*R*1.5;h+=poly(cx,cy,6,R,Math.PI/6,'#2fb37a')}
   var r5=30,c=[[440,110],[490,95],[465,165],[520,150],[560,105]];c.forEach(function(q,i){h+=poly(q[0],q[1],5,r5,-Math.PI/2+(i%2)*Math.PI/5,'#e0507a')});
   h+='<text x="88" y="250" text-anchor="middle" fill="#dbe5f7" font-size="20" font-family="Manrope,sans-serif">4-fold: fills</text><text x="270" y="250" text-anchor="middle" fill="#dbe5f7" font-size="20" font-family="Manrope,sans-serif">6-fold: fills</text><text x="500" y="250" text-anchor="middle" fill="#ffb3a8" font-size="20" font-family="Manrope,sans-serif">5-fold: gaps</text>';
   h+='<text x="320" y="30" text-anchor="middle" fill="#c9a24d" font-size="16" font-weight="800" letter-spacing="2" font-family="Manrope,sans-serif">WHY NO 5-FOLD AXIS?</text>';s.innerHTML=h;
  })();
  </script>
</section>''')

# ---------------- 4. symmetry challenge ----------------
A('''<section class="scene dark" id="s-chal" data-chap="Symmetry challenge" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <style>#s-chal .opts{display:grid;grid-template-columns:1fr 1fr;gap:12px}#s-chal .opts button{font:700 22px/1.2 var(--body);padding:18px 20px;border-radius:14px;border:1.5px solid rgba(160,200,255,.3);background:rgba(255,255,255,.05);color:#fff;cursor:pointer;text-align:left}#s-chal .opts button.ok{background:rgba(88,194,122,.25);border-color:#58c27a}#s-chal .opts button.no{background:rgba(224,106,90,.22);border-color:#e06a5a}</style>
  <div class="pad" style="gap:14px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Symmetry challenge · rotate the mystery crystal, then choose its system</div><div class="chip gold" id="chS">Score 0 / 0</div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:980px;flex:none"></div>
      <div class="col grow" style="gap:16px;justify-content:center">
        <div class="eyebrow" id="chN" style="font-size:14px"></div>
        <div class="sysh" style="font-size:46px">Which crystal system?</div>
        <div class="opts" id="chO"></div>
        <div class="dk" id="chW" style="min-height:96px;font-size:21px"></div>
        <button type="button" class="chip gold" id="chX" style="cursor:pointer;border:0;font:800 18px/1 var(--body);padding:14px 20px;align-self:flex-start;visibility:hidden">Next crystal →</button>
      </div>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{fit:4.4,labels:false,tools:['views','auto','reset']});
   var R=[['beryl',1,0x8fc7ff,'Hexagonal',['Hexagonal','Trigonal','Tetragonal','Orthorhombic'],'Six identical side faces and a flat top: a 6-fold axis along c. This is a beryl prism.'],['dodecahedron',0,0x8fc7ff,'Cubic',['Tetragonal','Cubic','Hexagonal','Orthorhombic'],'Twelve identical rhomb faces. Only cubic symmetry (four 3-fold axes) makes all twelve equal: the garnet dodecahedron.'],['quartz',1,0x8fc7ff,'Trigonal',['Hexagonal','Trigonal','Cubic','Tetragonal'],'A trap! It looks six-sided, but the end faces alternate between two different rhombohedra, so the axis is only 3-fold. This is quartz.'],['zircon',0,0x8fc7ff,'Tetragonal',['Orthorhombic','Cubic','Tetragonal','Hexagonal'],'A square cross-section with four-sided pyramids at each end: one 4-fold axis. Zircon.'],['topaz',0,0x8fc7ff,'Orthorhombic',['Tetragonal','Orthorhombic','Monoclinic','Cubic'],'Turn it 90° and it does not match; 180° does. Three 2-fold axes at right angles: topaz.'],['mono',0,0x8fc7ff,'Monoclinic',['Triclinic','Orthorhombic','Monoclinic','Tetragonal'],'The end faces lean in one direction only. One 2-fold axis and β ≠ 90°: a monoclinic pyroxene shape.']];
   var i=0,sc0=0,n0=0,O=document.getElementById('chO'),W=document.getElementById('chW'),X=document.getElementById('chX');
   function show(){var r=R[i];CXD.crystal(v,r[0],{four:!!r[1],color:r[2]});v.st.axes=false;v.st.cell=false;v.st.auto=!C.RM;v.apply();document.getElementById('chN').textContent='Crystal '+(i+1)+' of '+R.length;W.innerHTML='';X.style.visibility='hidden';
     O.innerHTML='';r[4].forEach(function(o){var b=document.createElement('button');b.type='button';b.textContent=o;b.onclick=function(e){e.stopPropagation();if(O.dataset.done)return;O.dataset.done=1;var ok=o===r[3];n0++;if(ok)sc0++;b.classList.add(ok?'ok':'no');[].forEach.call(O.children,function(x){if(x.textContent===r[3])x.classList.add('ok')});W.innerHTML=(ok?'<b style="color:#7fe0a0">Correct.</b> ':'<b style="color:#ff9f8c">Not quite.</b> ')+r[5];document.getElementById('chS').textContent='Score '+sc0+' / '+n0;v.st.axes=true;v.apply();X.style.visibility='visible';X.textContent=i<R.length-1?'Next crystal →':'Play again ↺'};O.appendChild(b)});delete O.dataset.done}
   X.onclick=function(e){e.stopPropagation();i++;if(i>=R.length){i=0;sc0=0;n0=0;document.getElementById('chS').textContent='Score 0 / 0'}show()};show();
  })();
  </script>
</section>''')

# ---------------- 5. form vs habit ----------------
A('''<section class="scene dark" id="s-habit" data-chap="Form vs habit" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <style>#s-habit .ht{display:flex;flex-direction:column;gap:8px;min-height:0}#s-habit .ht>div:first-child{flex:1}#s-habit .ht h3{color:#fff;font:700 28px/1 var(--display)}</style>
  <div class="pad" style="gap:14px">
    <div class="eyebrow rise">Chapter 5 · Crystal form versus crystal habit</div>
    <div class="row rise" style="gap:22px"><div class="card grow" style="background:rgba(255,255,255,.06)"><h3 style="color:#ffd27a">Form</h3><p class="dk">A set of faces made identical by the crystal’s symmetry, such as the cube {100} or the octahedron {111}. A crystal can combine several forms.</p></div><div class="card grow" style="background:rgba(255,255,255,.06)"><h3 style="color:#ffd27a">Habit</h3><p class="dk">The overall look of a crystal or aggregate: long, flat, blocky, needle-like… It depends on growth conditions as well as structure.</p></div></div>
    <div class="gal rise" style="flex:1;grid-template-columns:repeat(6,1fr)">
      <div class="ht step"><div data-hb="pris"></div><h3>Prismatic</h3><p class="small" style="color:#cfdaf0">Long in one direction: beryl, tourmaline, quartz</p></div>
      <div class="ht step"><div data-hb="tab"></div><h3>Tabular</h3><p class="small" style="color:#cfdaf0">Flat plates: ruby, some morganite</p></div>
      <div class="ht step"><div data-hb="equ"></div><h3>Equant</h3><p class="small" style="color:#cfdaf0">Similar in all directions: garnet, spinel</p></div>
      <div class="ht step"><div data-hb="aci"></div><h3>Acicular</h3><p class="small" style="color:#cfdaf0">Needles: rutile, the “silk” in corundum</p></div>
      <div class="ht step"><div data-hb="fib"></div><h3>Fibrous</h3><p class="small" style="color:#cfdaf0">Parallel fibres: tiger’s eye, the cat’s-eye effect</p></div>
      <div class="ht step"><figure class="photo" style="flex:1"><img src="media/mc-stones-turquoise.jpg" alt=""><figcaption>Turquoise · W.carter, CC BY 4.0</figcaption></figure><h3>Massive</h3><p class="small" style="color:#cfdaf0">No visible crystal faces: turquoise, jade, lapis</p></div>
    </div>
  </div>
  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>Crystal system vs crystal habit.</b> The system is fixed by the internal structure; the habit is how the crystal happened to grow. Quartz is always trigonal, but it can be long and thin, short and stubby, or massive (chalcedony). Habit is a useful first clue on rough, never an identification on its own.</div></details>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3,H6=C.HEX(1);
   function fam(hkl,d,ops){return C.family(hkl,d,H6,ops)}
   function mini(k,build,r){var el=sc.querySelector('[data-hb='+k+']');el.style.height='100%';var v=new C.Viewer(el,{fit:1,r:r||5,spin:.005,labels:false});v.st.axes=false;v.apply();build(v);return v}
   mini('pris',function(v){CXD.solid(v.extra,fam([1,0,-1,0],.32,{rot:6}).concat(fam([0,0,0,1],1.15,{mz:true})),0x2fb37a)},5.2);
   mini('tab',function(v){CXD.solid(v.extra,fam([1,1,-2,0],.95,{rot:6}).concat(fam([0,0,0,1],.24,{mz:true})),0xd0284a)},5.4);
   mini('equ',function(v){CXD.solid(v.extra,C.FORMS.dodecahedron(),0xc23040)},5.2);
   mini('aci',function(v){[[0,0,0],[.5,.2,.2],[-.4,.3,-.1]].forEach(function(p,i){var g=CXD.solid(v.extra,fam([1,1,-2,0],.05,{rot:4}).concat(fam([0,0,0,1],1.3,{mz:true})),0xe8b04a,{opacity:.85,r:.006});g.position.set(p[0],p[1],p[2]);g.rotation.set(i*.5,i*.7,0)})},5.2);
   mini('fib',function(v){for(var i=0;i<40;i++){var a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.55,g=CXD.solid(v.extra,fam([1,1,-2,0],.035,{rot:4}).concat(fam([0,0,0,1],1.1+Math.random()*.15,{mz:true})),0xc8962e,{opacity:.9,r:.003});g.position.set(Math.cos(a)*r,Math.sin(a)*r,0)}},5.2);
  })();
  </script>
</section>''')

# ---------------- 6. one mineral many shapes ----------------
A('''<section class="scene dark" id="s-many" data-chap="One mineral, many shapes" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:14px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">One mineral, many appearances</div><div data-cx="min"></div></div>
    <div class="row rise" style="flex:1;gap:28px;min-height:0">
      <div data-cx="v" style="width:980px;flex:none"></div>
      <div class="col grow" style="gap:14px;min-width:0">
        <div data-cx="hab"></div>
        <div id="mnN" class="sysh" style="font-size:50px"></div>
        <p class="dk" id="mnT" style="font-size:22px"></p>
        <figure class="photo" id="mnF" style="flex:1;background:#fff"><img id="mnP" src="" alt="" style="object-fit:contain"><figcaption id="mnC"></figcaption></figure>
      </div>
    </div>
    <div class="tip rise" style="font-size:19px">Growth temperature, available space, impurities and twinning all change the outside shape. So a crystal’s habit is a clue, <b>never proof</b> of identity.</div>
  </div>
  <script>window.__mn={q1:'media/s47_059.jpg',g1:'media/s08_011.jpg',g2:'media/s33_019.jpg',c1:'media/mc-stones-ruby.jpg',c2:'media/s04_006.jpg',b1:'media/mc-stones-aquamarine.jpg',b2:'media/mc-rough-morganite.jpg',b3:'media/s45_054.jpg',s1:'media/mc-look-spinelcrystal.jpg',s2:'media/s37_032.jpg'};</script>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3,I=window.__mn;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{fit:4.4,labels:false,tools:['views','auto','axes','wire','reset']});
   var D={quartz:['Quartz',0xb58be0,1,[['quartz','Prismatic','A six-sided prism with rhombohedral ends: rock crystal and amethyst points.','q1','Quartz crystal · course slides'],['quartzBipyr','Bipyramidal','No prism: the two rhombohedra meet directly. Typical of quartz grown at high temperature, as in some volcanic rocks.',null,'']]],
     garnet:['Garnet',0xc23040,0,[['dodecahedron','Dodecahedron','Twelve rhomb faces: the commonest garnet habit.','g1','Almandine garnet · course slides'],['trapezohedron','Trapezohedron','Twenty-four trapezium faces: common on spessartine and some almandine.','g2','Garnet crystal · course slides'],['garnetCombo','Combination','Dodecahedron with trapezohedron faces on its edges.',null,'']]],
     corundum:['Corundum',0xd0284a,1,[['ruby','Tabular ruby','Flat hexagonal plates with small rhombohedron faces: typical of ruby from marble, as in Myanmar.','c1','Ruby on marble · Robert M. Lavinsky, CC BY-SA 3.0'],['sapphire','Barrel sapphire','Barrel-shaped hexagonal dipyramids: typical of sapphire, as in Sri Lanka.','c2','Sapphire crystal · course slides']]],
     beryl:['Beryl',0x2fb37a,1,[['beryl','Long prism','Long hexagonal prisms with flat ends: emerald and aquamarine.','b1','Aquamarine · Gunnar Ries Amphibol, CC BY-SA 2.5'],['berylTab','Tabular','Short, flat crystals: typical of morganite.','b2','Morganite · Parent Géry, CC BY-SA 3.0'],['berylTerm','Terminated','Prism with small bipyramid faces on its corners, as on some heliodor.','b3','Heliodor crystals · course slides']]],
     spinel:['Spinel',0xe0507a,0,[['octahedron','Octahedron','The classic spinel habit: eight triangular faces.','s1','Spinel · Robert M. Lavinsky, CC BY-SA 3.0'],['twin','Spinel-law twin','Two halves of an octahedron, one turned 180° about a 3-fold axis: a flat, triangular “macle”. Diamond twins the same way.','s2','Spinel twin · course slides']]]};
   var mk='quartz',hs=sc.querySelector('[data-cx=hab]');
   function twin(col){v.setCrystal([]);v.setAxes([]);CXD.clearExtra(v);var n=v3(1,1,1).normalize(),oct=C.FORMS.octahedron().map(function(p){return{n:p.n,d:p.d*(Math.abs(Math.abs(p.n.dot(n))-1)<1e-6?.5:1)}});
     var a=CXD.solid(v.extra,oct.concat([{n:n.clone(),d:0}]),col),b=CXD.solid(v.extra,oct.concat([{n:n.clone().negate(),d:0}]),col);b.quaternion.setFromAxisAngle(n,Math.PI);var g=new T.Group();v.extra.add(g);[a,b].forEach(function(x){v.extra.remove(x);g.add(x)});g.quaternion.setFromUnitVectors(n,v3(0,0,1));v.r=v.r0=5}
   function hab(i){var d=D[mk],h=d[3][i];document.getElementById('mnN').textContent=d[0]+' · '+h[1];document.getElementById('mnT').textContent=h[2];
     if(h[0]==='twin')twin(d[1]);else{CXD.clearExtra(v);CXD.crystal(v,h[0],{four:!!d[2],color:d[1]});v.st.cell=false;v.apply()}
     var f=document.getElementById('mnF');if(h[3]){f.style.visibility='visible';document.getElementById('mnP').src=I[h[3]];document.getElementById('mnC').textContent=h[4]}else f.style.visibility='hidden'}
   CXD.seg(sc.querySelector('[data-cx=min]'),Object.keys(D).map(function(k){return[k,D[k][0]]}),function(k){mk=k;CXD.seg(hs,D[k][3].map(function(h,i){return[i,h[1]]}),function(i){hab(i)},0)},0);
  })();
  </script>
</section>''')

# ---------------- 7. gallery ----------------
G = [
 ['emerald','Emerald','Beryl','Emerald (green, Cr/V)','Hexagonal','Long hexagonal prism with flat ends','RI 1.57–1.58; usually included (“jardin”); often oiled','Emerald, aquamarine and morganite are one mineral, beryl: only the trace colouring element differs.','beryl',1,'0x2fb37a','mc-stones-emerald.jpg','Robert M. Lavinsky, CC BY-SA 3.0'],
 ['aqua','Aquamarine','Beryl','Aquamarine (blue, Fe)','Hexagonal','Long prism, often very clean','Most aquamarine is gently heated to remove a green tint','Aquamarine crystals are often far cleaner than emerald, so large clean stones are common.','beryl',1,'0x8fd0e8','mc-stones-aquamarine.jpg','Gunnar Ries Amphibol, CC BY-SA 2.5'],
 ['ruby','Ruby','Corundum','Ruby (red, Cr)','Trigonal','Tabular hexagonal plates or short prisms','RI 1.76–1.77, SG 4.00; strong red fluorescence','Ruby and sapphire are one mineral: red corundum is ruby, every other colour is sapphire.','ruby',1,'0xd0284a','mc-stones-ruby.jpg','Robert M. Lavinsky, CC BY-SA 3.0'],
 ['sapph','Sapphire','Corundum','Sapphire (blue, Fe + Ti)','Trigonal','Barrel-shaped hexagonal dipyramid','Same properties as ruby; colour zoning parallel to the crystal faces','At 9 on the Mohs scale, corundum is the hardest natural gem after diamond.','sapphire',1,'0x3b6fd6','mc-rough-sapphire.jpg','Supplied by IGI'],
 ['quartz','Quartz','Quartz','Smoky quartz','Trigonal','Six-sided prism with pointed rhombohedral ends','RI 1.544–1.553, SG 2.65; prism faces striated across their length','The horizontal striations on quartz prism faces are a handy recognition feature on rough.','quartz',1,'0x8a7a6a','mc-rough-smoky.jpg','Rob Lavinsky, CC BY 3.0'],
 ['garnet','Garnet','Garnet group','Almandine (shown)','Cubic','Dodecahedron or trapezohedron','Singly refractive; RI 1.72–1.89 by species','Garnet is a group of related species (pyrope, almandine, spessartine, grossular, andradite…), not one mineral.','garnetCombo',0,'0xc23040','s08_011.jpg','Course slides'],
 ['spinel','Spinel','Spinel','Red spinel','Cubic','Octahedron, often twinned (spinel-law twin)','RI 1.718, SG 3.60; singly refractive','The Black Prince’s Ruby in the British Crown Jewels is a red spinel.','octahedron',0,'0xe0507a','mc-look-spinelcrystal.jpg','Robert M. Lavinsky, CC BY-SA 3.0'],
 ['topaz','Topaz','Topaz','Imperial topaz','Orthorhombic','Prismatic, striated along its length, wedge-shaped ends','RI 1.61–1.62, SG 3.53; perfect basal cleavage','Topaz cleaves at right angles to its length, so a sharp knock can split a crystal cleanly.','topaz',0,'0xe39a3a','mc-stones-topaz.jpg','Marie-Lan Taÿ Pamart, CC BY 4.0'],
 ['zircon','Zircon','Zircon','Brown zircon','Tetragonal','Square prism capped by a four-sided bipyramid','RI 1.925–1.984, SG 4.70; strong doubling of back facets','Some zircon grains from Western Australia are about 4.4 billion years old: among the oldest minerals on Earth.','zircon',0,'0xb7834a','s49_066.jpg','Course slides'],
 ['tourm','Tourmaline','Tourmaline group','Green tourmaline (verdelite)','Trigonal','Long prism, rounded-triangular cross-section, lengthwise striations','RI 1.62–1.64, biref. 0.018–0.020; strong pleochroism','Tourmaline is hemimorphic: its two ends have different faces, and a warmed crystal becomes electrically charged (pyroelectricity).','tourmaline',1,'0x37a46a','mc-rough-verdelite.jpg','Robert M. Lavinsky, CC BY-SA 3.0'],
 ['jade','Jadeite','Jadeite (a pyroxene)','Jadeite jade','Monoclinic','Almost always a massive, granular aggregate','Spot RI 1.66, SG 3.33; exceptionally tough','The model shows an ideal pyroxene crystal. Jadeite’s toughness comes from its interlocking grains, not from hardness.','mono',0,'0x45b07a','mc-rough-jade.jpg','Supplied by IGI'],
 ['turq','Turquoise','Turquoise','Turquoise','Triclinic','Massive, microcrystalline; crystals are very rare','Spot RI about 1.61, SG 2.6–2.9; porous','The model is schematic: you will almost never see a turquoise crystal. Its blue comes from copper.','triBox',0,'0x37b8c0','mc-stones-turquoise.jpg','W.carter, CC BY 4.0'],
]
tiles = ''.join('<button type="button" class="gt" data-g="%d"><img src="media/%s" alt=""><span class="gn">%s</span><span class="gs">%s</span></button>' % (i, g[11], g[1], g[4]) for i, g in enumerate(G))
A('''<section class="scene dark" id="s-gal" data-chap="Crystal gallery" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <style>#s-gal .gt{position:relative;border:1px solid rgba(160,200,255,.2);border-radius:18px;overflow:hidden;padding:0;cursor:pointer;background:#0a1630}#s-gal .gt img{width:100%%;height:100%%;object-fit:cover;display:block;transition:transform .5s}#s-gal .gt:hover img{transform:scale(1.06)}#s-gal .gn{position:absolute;z-index:2;left:14px;bottom:36px;font:700 26px/1 var(--display);color:#fff;text-shadow:0 2px 8px #000}#s-gal .gs{position:absolute;z-index:2;left:14px;bottom:12px;font:800 13px/1 var(--body);letter-spacing:.12em;text-transform:uppercase;color:#ffd27a;text-shadow:0 1px 6px #000}#s-gal .gt::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(6,12,28,.85),transparent 55%%);pointer-events:none}
  #galD{position:absolute;inset:118px 46px 96px;z-index:8;display:none;background:rgba(6,12,28,.97);border:1px solid rgba(201,162,77,.5);border-radius:24px;padding:26px;gap:26px}#galD.open{display:flex}#galX{position:absolute;right:20px;top:18px;font:800 18px/1 var(--body);background:#c9a24d;color:#111;border:0;border-radius:999px;padding:12px 18px;cursor:pointer;z-index:3}</style>
  <div class="pad" style="gap:14px">
    <div class="eyebrow rise">Explore the gemstone gallery · tap a crystal</div>
    <div class="gal rise" style="flex:1;grid-template-columns:repeat(6,1fr);grid-template-rows:1fr 1fr">%s</div>
  </div>
  <div id="galD"><button type="button" id="galX">Close ✕</button>
    <div data-cx="v" style="width:900px;flex:none"></div>
    <div class="col grow" style="gap:12px;min-width:0;padding-top:30px">
      <div class="sysh" id="gaN" style="font-size:60px"></div>
      <div class="kvd" id="gaK" style="font-size:20px"></div>
      <div class="tip" id="gaF" style="font-size:20px"></div>
      <figure class="photo" style="flex:1;background:#0a1630"><img id="gaP" src="media/%s" alt="" style="object-fit:contain"><figcaption id="gaC"></figcaption></figure>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,G=%s,D=document.getElementById('galD'),v=null;
   function open(i){var g=G[i];D.classList.add('open');if(!v)v=new C.Viewer(sc.querySelector('#galD [data-cx=v]'),{fit:4.4,labels:false,tools:['views','auto','axes','labels','wire','inspect','reset']});
     CXD.clearExtra(v);CXD.crystal(v,g[8],{four:!!g[9],color:parseInt(g[10])});v.st.cell=false;v.apply();v.onPick=function(f){document.getElementById('gaF').innerHTML=f?CXD.describe(f,C.BASES[v.key]()[2].clone().normalize()):g[7]};
     document.getElementById('gaN').textContent=g[1];document.getElementById('gaK').innerHTML='<b>Species / group</b><span>'+g[2]+'</span><b>Variety</b><span>'+g[3]+'</span><b>Crystal system</b><span>'+g[4]+'</span><b>Typical habit</b><span>'+g[5]+'</span><b>Key notes</b><span>'+g[6]+'</span>';
     document.getElementById('gaF').textContent=g[7];var src=sc.querySelector('.gt[data-g="'+i+'"] img').src;document.getElementById('gaP').src=src;document.getElementById('gaC').textContent=g[1]+' · '+g[12]}
   [].forEach.call(sc.querySelectorAll('.gt'),function(b){b.onclick=function(e){e.stopPropagation();open(+b.dataset.g)}});
   document.getElementById('galX').onclick=function(e){e.stopPropagation();D.classList.remove('open')};D.addEventListener('click',function(e){e.stopPropagation()});
  })();
  </script>
</section>''' % (tiles, G[0][11], json.dumps(G)))

# ---------------- 8. timeline ----------------
TL = [['1669','Nicolas Steno','Angles between corresponding faces of quartz crystals are always the same, however the faces grow: the law of constant angles.'],
      ['1783','Romé de l’Isle','Using the contact goniometer, shows that interfacial angles are constant and characteristic of each substance.'],
      ['1784','René-Just Haüy','Proposes that crystals are built from tiny identical units, an idea drawn from how calcite cleaves.'],
      ['1839','William H. Miller','Introduces the Miller indices (hkl) still used to name crystal faces and planes.'],
      ['1850','Auguste Bravais','Shows there are exactly 14 possible space lattices: the Bravais lattices.'],
      ['1891','Fedorov & Schoenflies','Independently derive the 230 space groups that describe every possible crystal symmetry.'],
      ['1912','Max von Laue','Discovers that crystals diffract X-rays, proving their atoms are regularly arranged. Nobel Prize in Physics 1914.'],
      ['1912–13','W. H. & W. L. Bragg','Formulate Bragg’s law and solve the first crystal structures. Nobel Prize in Physics 1915.'],
      ['1982','Dan Shechtman','Observes quasicrystals with “forbidden” 5-fold symmetry (published 1984). Nobel Prize in Chemistry 2011.']]
cards = ''.join('<div class="card step" style="background:rgba(255,255,255,.06);display:flex;flex-direction:column;gap:8px"><div style="font:700 44px/1 var(--display);color:#ffd27a">%s</div><h3 style="color:#fff">%s</h3><p class="small" style="color:#cfdaf0">%s</p></div>' % tuple(t) for t in TL)
A('''<section class="scene dark" id="s-time" data-chap="History" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Chapter 6 · A brief history of crystallography</div>
    <div style="height:3px;background:linear-gradient(90deg,#c9a24d,rgba(201,162,77,.1));border-radius:3px" class="rise"></div>
    <div class="gal rise" style="flex:1;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:16px">%s</div>
  </div>
</section>''' % cards)

# ---------------- 9. facts ----------------
F = [['Perfect inside, irregular outside','A crystal can have a flawless internal lattice yet look shapeless. Water-worn alluvial sapphires and broken crystals have lost their faces, but not their structure.'],
     ['Why garnet has two favourite shapes','The dodecahedron and the trapezohedron are both cubic forms. Which one develops depends on how fast each set of faces grows; the slowest-growing faces survive.'],
     ['Same mineral, different habits','Quartz can be long and slender, short and stubby, or massive (chalcedony). Temperature, impurities and space decide.'],
     ['Quartz and corundum are both trigonal','A quartz prism and a sapphire barrel look nothing alike, yet both have one 3-fold axis. The system is about symmetry, not shape.'],
     ['No 5-fold axes','Pentagons cannot fill a plane without gaps, so a repeating lattice cannot have 5-fold symmetry. Quasicrystals are ordered but never repeat exactly.'],
     ['X-rays see what microscopes cannot','Atoms are about 0.1 nm apart, far smaller than the wavelength of visible light (400–700 nm). X-rays have wavelengths near 0.1 nm, so they diffract from atomic planes.']]
fc = ''.join('<div class="myth step"><div class="tag">Tap to reveal</div><div class="q" style="font:700 30px/1.15 var(--display)">%s</div><div class="a" style="font-size:21px">%s</div></div>' % tuple(f) for f in F)
A('''<section class="scene dark" id="s-facts" data-chap="Surprising facts" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Crystal facts that surprise students</div>
    <div class="gal rise" style="flex:1;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:18px">%s</div>
  </div>
</section>''' % fc)

# ---------------- 10. bench ----------------
A('''<section class="scene dark" id="s-bench" data-chap="At the gem bench" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:14px">
    <div class="eyebrow rise">Crystallography in practical gemmology</div>
    <div class="gal rise" style="flex:1;grid-template-columns:1.25fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:16px">
      <div class="card step" style="grid-row:span 2;background:rgba(255,255,255,.06);display:flex;flex-direction:column;gap:12px"><h3 style="color:#ffd27a">Optical character</h3>
        <table class="ctable" style="font-size:19px"><tr><th>Structure</th><th>Optics</th><th>Gems</th></tr><tr><td style="font-size:19px">Cubic</td><td>Isotropic, SR</td><td>garnet, spinel</td></tr><tr><td style="font-size:19px">Amorphous</td><td>Isotropic, SR</td><td>opal, glass</td></tr><tr><td style="font-size:19px">Tetragonal, hexagonal, trigonal</td><td>Uniaxial, DR</td><td>zircon, beryl, corundum, quartz</td></tr><tr><td style="font-size:19px">Orthorhombic, monoclinic, triclinic</td><td>Biaxial, DR</td><td>topaz, peridot, jadeite, kyanite</td></tr><tr><td style="font-size:19px">Aggregates</td><td>AGG reaction</td><td>jade, chalcedony, turquoise</td></tr></table>
        <p class="small" style="color:#cfdaf0">Cautions: strain can make an isotropic gem show anomalous double refraction, and looking down an optic axis a DR gem can seem SR.</p></div>
      <div class="col step" style="gap:8px"><figure class="photo" style="flex:1"><img src="media/s37_031.jpg" alt=""></figure><h3 style="color:#fff">Twinning</h3><p class="small" style="color:#cfdaf0">Chrysoberyl trillings, spinel macles and repeated twin lamellae in corundum and feldspar.</p></div>
      <div class="col step" style="gap:8px"><figure class="photo" style="flex:1;background:#fff"><img src="media/s40_044.png" alt="" style="object-fit:contain"></figure><h3 style="color:#fff">Cleavage and parting</h3><p class="small" style="color:#cfdaf0">Cleavage follows weak lattice planes: topaz (basal), diamond (octahedral). Corundum has parting, not true cleavage.</p></div>
      <div class="col step" style="gap:8px"><figure class="photo" style="flex:1"><img src="media/s38_037.jpg" alt=""></figure><h3 style="color:#fff">Growth features</h3><p class="small" style="color:#cfdaf0">Trigons, growth zoning and striations line up with crystal directions and help orient rough and judge origin.</p></div>
      <div class="col step" style="gap:8px"><figure class="photo" style="flex:1"><img src="media/s47_059.jpg" alt=""></figure><h3 style="color:#fff">Rough and cutting</h3><p class="small" style="color:#cfdaf0">Knowing where the c axis runs guides colour orientation (pleochroism) and avoids cleavage planes.</p></div>
    </div>
  </div>
  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>Crystal symmetry vs optical properties.</b> The crystal system predicts the optical character (isotropic, uniaxial or biaxial) in a perfect single crystal. It does not set the RI, colour or pleochroism strength, and real stones complicate it: strain, inclusions, twinning and aggregates all change what you see in the polariscope. Always combine several tests.</div></details>
</section>''')

# ---------------- 11. quiz ----------------
A('''<section class="scene dark" id="s-q" data-chap="Quiz" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:18px"><div class="quiz" data-quiz="p2" data-title="Knowledge check"></div></div>
</section>''')

# ---------------- 12. matching ----------------
A('''<section class="scene dark" id="s-match" data-chap="Match the system" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <style>#s-match .gems{display:flex;flex-wrap:wrap;gap:10px}#s-match .gems button{font:700 22px/1 var(--body);padding:14px 18px;border-radius:999px;border:1.5px solid rgba(160,200,255,.35);background:rgba(255,255,255,.06);color:#fff;cursor:pointer}#s-match .gems button.sel{background:#c9a24d;color:#111;border-color:#c9a24d}#s-match .gems button.shake{animation:shk .4s}@keyframes shk{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}#s-match .bins{display:grid;grid-template-columns:repeat(7,1fr);gap:12px;flex:1}#s-match .bin{border:1.5px dashed rgba(201,162,77,.55);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;cursor:pointer;background:rgba(255,255,255,.03)}#s-match .bin h3{font:700 22px/1.1 var(--display);color:#ffd27a}#s-match .bin span{font:700 17px/1.2 var(--body);color:#0d1a2d;background:#7fe0a0;border-radius:999px;padding:8px 12px;text-align:center}</style>
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Match each gem to its crystal system · tap a gem, then a system</div><div class="row" style="gap:10px;align-items:center"><span class="chip gold" id="maS">0 matched · 0 mistakes</span><button type="button" class="chip" id="maR" style="cursor:pointer">Restart ↺</button></div></div>
    <div class="gems rise" id="maG"></div>
    <div class="bins rise" id="maB"></div>
  </div>
  <script>
  (function(){var P=[['Emerald','Hexagonal'],['Ruby','Trigonal'],['Garnet','Cubic'],['Topaz','Orthorhombic'],['Zircon','Tetragonal'],['Jadeite','Monoclinic'],['Kyanite','Triclinic'],['Quartz','Trigonal'],['Spinel','Cubic'],['Peridot','Orthorhombic'],['Tourmaline','Trigonal'],['Aquamarine','Hexagonal']],SY=['Cubic','Tetragonal','Orthorhombic','Hexagonal','Trigonal','Monoclinic','Triclinic'];
   var G=document.getElementById('maG'),B=document.getElementById('maB'),sel=null,ok=0,bad=0;
   function upd(){document.getElementById('maS').textContent=ok+' matched · '+bad+' mistake'+(bad===1?'':'s')+(ok===P.length?' · complete!':'')}
   function build(){G.innerHTML='';B.innerHTML='';sel=null;ok=0;bad=0;upd();P.slice().sort(function(){return Math.random()-.5}).forEach(function(p){var b=document.createElement('button');b.type='button';b.textContent=p[0];b.dataset.s=p[1];b.onclick=function(e){e.stopPropagation();if(sel)sel.classList.remove('sel');sel=b;b.classList.add('sel')};G.appendChild(b)});
     SY.forEach(function(s){var d=document.createElement('div');d.className='bin';d.innerHTML='<h3>'+s+'</h3>';d.onclick=function(e){e.stopPropagation();if(!sel)return;if(sel.dataset.s===s){var t=document.createElement('span');t.textContent=sel.textContent;d.appendChild(t);sel.remove();sel=null;ok++}else{bad++;var x=sel;x.classList.remove('shake');void x.offsetWidth;x.classList.add('shake')}upd()};B.appendChild(d)})}
   document.getElementById('maR').onclick=function(e){e.stopPropagation();build()};build();
  })();
  </script>
</section>''')

# ---------------- 13. synthesis ----------------
A('''<section class="scene dark" id="s-final" data-chap="The final synthesis" data-wipe="diamond" data-morph="1480,560,520,0,hex">
  <div data-cx="v" style="position:absolute;right:0;top:0;width:1150px;height:1080px;border-radius:0;border:0;background:radial-gradient(60% 55% at 55% 50%,#14305a 0%,#0a1630 55%,#060d1f 100%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,12,28,1) 0%,rgba(6,12,28,.92) 38%,rgba(6,12,28,0) 64%);pointer-events:none"></div>
  <div class="pad" style="justify-content:center;gap:28px;pointer-events:none">
    <div class="eyebrow rise">The final synthesis</div>
    <p class="kt" style="font:700 64px/1.18 var(--display);color:#FBF6EA;max-width:880px">Every gemstone has a geometry. <span class="it shine">Every geometry has a symmetry.</span> And every symmetry reveals a little more about the structure of the natural world.</p>
    <p class="small rise" id="fiPh" style="color:#9fb6da;font-size:22px;min-height:30px"></p>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v=new C.Viewer(sc.querySelector('[data-cx=v]'),{color:0xb58be0,opacity:.62,labels:false,fit:4.6,spin:.003});
   var H=CXD.crystal(v,'quartzBig',{four:true,color:0xb58be0});v.st.axes=false;v.st.cell=false;v.apply();v.root.position.x=-.2;
   var Bs=C.HEX(1.1).map(function(b){return b.clone().multiplyScalar(.2)}),pts=[];for(var i=-9;i<=9;i++)for(var j=-9;j<=9;j++)for(var k=-12;k<=12;k++){var p=Bs[0].clone().multiplyScalar(i).add(Bs[1].clone().multiplyScalar(j)).add(Bs[2].clone().multiplyScalar(k));if(H.F.every(function(f){return f.plane.n.dot(p)<=f.plane.d-.02}))pts.push(p)}
   var g=new T.SphereGeometry(.03,10,8),m=new T.MeshStandardMaterial({color:0xe6d4ff,transparent:true,opacity:0}),im=new T.InstancedMesh(g,m,pts.length),M=new T.Matrix4();pts.forEach(function(p,i){M.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,M)});v.extra.add(im);
   var big=new T.Group();v.extra.add(big);v.setCell(C.HEX(1.1).map(function(b){return b.clone().multiplyScalar(.75)}),{group:big,r:.02,pcolor:0xffd27a,color:0xffd27a});
   var ph=document.getElementById('fiPh'),N=['The crystal','Its ideal form and axes','Its unit cell','Its atomic lattice'],t0=performance.now(),last=-1;
   v.onFrame=function(now){var t=((now-t0)/1000)%16,st=Math.floor(t/4),f=Math.min(1,(t%4)/1);v.faceMeshes.forEach(function(me){me.material.opacity=st===0?.62:st===1?.3:.08});v.axes.visible=st===1;big.visible=st===2;m.opacity=st===3?f:0;if(st!==last){last=st;ph.textContent=N[st]}};
  })();
  </script>
</section>''')

# ---------------- 14. references ----------------
A('''<section class="scene dark" id="s-refs" data-chap="References" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">References and notes</div>
    <div class="row rise" style="gap:40px;flex:1;min-height:0">
      <div class="col grow" style="gap:12px">
        <p class="dk">International Union of Crystallography (IUCr). <i>Online Dictionary of Crystallography</i>: crystal systems, crystal families, law of constancy of interfacial angles. dictionary.iucr.org</p>
        <p class="dk">IUCr. <i>International Tables for Crystallography, Volume A: Space-group symmetry</i>. Conventions for axes, settings (unique-b monoclinic, hexagonal and rhombohedral axes).</p>
        <p class="dk">Klein, C. &amp; Dutrow, B. <i>Manual of Mineral Science</i>. Wiley. Crystal forms, symmetry and the 32 crystal classes.</p>
        <p class="dk">Mindat.org and the IMA list of mineral species: species names and crystal systems of gem minerals.</p>
      </div>
      <div class="col grow" style="gap:12px">
        <p class="dk">Gemological Institute of America (GIA). <i>Gem Encyclopedia</i> and <i>Gems &amp; Gemology</i>: gem properties and crystal habits.</p>
        <p class="dk">The Nobel Prize (nobelprize.org): Physics 1914 (Max von Laue), Physics 1915 (W. H. and W. L. Bragg), Chemistry 2011 (Dan Shechtman).</p>
        <p class="dk">Historical dates cross-checked against the IUCr dictionary and published timelines of crystallography.</p>
        <div class="tip" style="font-size:18px">All 3D crystals are <b>idealised models</b> generated from real axial ratios where stated (zircon, topaz, beryl, corundum, quartz) and schematic proportions otherwise (monoclinic, triclinic). Miller indices are shown only for these ideal forms. Photographs are credited on each slide.</div>
      </div>
    </div>
  </div>
</section>''')

A('''<section class="scene dark" id="s-end" data-chap="Summary" data-wipe="diamond" data-morph="1500,560,480,0,octa">
  <div class="pad" style="gap:30px;justify-content:center">
    <div class="eyebrow rise">What we learned</div>
    <div class="row" style="gap:60px;align-items:center">
      <div class="col grow" style="gap:16px">
        <div class="card step"><h3>Symmetry</h3><p class="small">Rotation axes (1, 2, 3, 4, 6-fold), mirror planes and a centre of symmetry decide the system. No 5-fold axes.</p></div>
        <div class="card step"><h3>Form and habit</h3><p class="small">A form is a set of equivalent faces; habit is the overall shape, and it varies within one mineral.</p></div>
        <div class="card step"><h3>At the bench</h3><p class="small">Structure predicts SR, uniaxial or biaxial, and guides twinning, cleavage and cutting decisions.</p></div>
      </div>
      <div class="col center" style="width:520px;gap:10px">
        <div class="eyebrow" style="justify-content:center">Class score</div>
        <div class="num" style="font-size:200px;color:#FBF6EA"><span id="endScore">0</span></div>
        <p class="small muted">out of 8 questions</p>
      </div>
    </div>
  </div>
</section>''')

DECK = '''<script>
window.DECK={
 tag:'CSG · Crystallography 2',
 menu:[['s-hero','Start','Welcome'],['s-sym','Symmetry','Symmetry elements'],['s-rot','Tool','Rotation lab'],['s-chal','Game','Symmetry challenge'],['s-habit','Habit','Form vs habit'],['s-many','Habit','One mineral, many shapes'],['s-gal','Tool','Crystal gallery'],['s-time','History','Timeline'],['s-facts','History','Surprising facts'],['s-bench','Practice','At the gem bench'],['s-q','Game','Knowledge check'],['s-match','Game','Match the system'],['s-final','Close','Final synthesis'],['s-refs','Close','References'],['s-end','Close','Summary']],
 quiz:{
  p2:[
   {q:'Which rotational symmetry is impossible in a periodic crystal?',o:['5-fold','3-fold','4-fold','6-fold'],a:0,why:'Pentagons cannot tile space without gaps.'},
   {q:'True or false: a six-sided crystal must be hexagonal.',o:['True','False'],a:1,why:'Quartz, corundum and tourmaline can look six-sided but are trigonal.'},
   {q:'The octahedron {111} is an example of a crystal…',o:['Form','Habit','Twin','System'],a:0,why:'A form is a set of symmetry-equivalent faces.'},
   {q:'Prismatic, tabular and acicular describe a crystal’s…',o:['Habit','Form','Symmetry','Lattice'],a:0,why:'Habit is the overall shape.'},
   {q:'Who discovered X-ray diffraction by crystals in 1912?',o:['Max von Laue','René-Just Haüy','Nicolas Steno','Auguste Bravais'],a:0,why:'Von Laue, Nobel Prize in Physics 1914.'},
   {q:'Rotation axes, mirror planes and a centre of symmetry are…',o:['Symmetry elements','Crystal habits','Miller indices','Optic axes'],a:0,why:'They define the symmetry of a crystal.'},
   {q:'True or false: the crystal system alone tells you every optical property of a gem.',o:['True','False'],a:1,why:'It predicts SR/uniaxial/biaxial only; strain, aggregates and inclusions also matter, and RI, colour and pleochroism vary.'},
   {q:'A spinel-law twin is made of two halves of a…',o:['Octahedron','Cube','Hexagonal prism','Rhombohedron'],a:0,why:'One half is turned 180° about a 3-fold axis.'}
  ]
 }
};
</script>'''

open('/tmp/claude-0/cry/p2.html', 'w').write('\n\n'.join(OUT) + '\n\n' + DECK + '\n')
print(len(OUT), 'scenes')

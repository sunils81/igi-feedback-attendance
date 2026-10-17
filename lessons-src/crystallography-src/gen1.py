import json
OUT = []
A = OUT.append

# ---------------- 1. hero ----------------
A('''<section class="scene dark" id="s-hero" data-chap="Welcome" data-wipe="diamond" data-morph="1480,560,520,0,hex">
  <div data-cx="hero" style="position:absolute;right:0;top:0;width:1150px;height:1080px;border-radius:0;border:0;background:radial-gradient(60% 55% at 55% 50%,#14305a 0%,#0a1630 55%,#060d1f 100%)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,12,28,1) 0%,rgba(6,12,28,.92) 36%,rgba(6,12,28,0) 62%);pointer-events:none"></div>
  <div class="pad" style="justify-content:center;gap:30px;pointer-events:none">
    <img src="media/igi-logo-white.png" alt="IGI School of Gemology" class="rise" style="width:340px">
    <div class="eyebrow rise">Colored Stone Graduate · Crystallography · Part 1</div>
    <h1 class="kt" style="font-size:118px;max-width:900px;color:#FBF6EA">Crystallography <span class="it shine">of Gemstones</span></h1>
    <p class="lead rise" style="max-width:760px">Understanding the geometry behind nature’s most beautiful crystals: from atoms to lattice, unit cell and the seven crystal systems.</p>
    <div class="row rise" style="gap:14px"><span class="chip gold">3 chapters</span><span class="chip">Live 3D models</span><span class="chip">7 crystal systems</span></div>
    <p class="small rise" id="heroPh" style="color:#9fb6da;font-size:20px;min-height:28px"></p>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v=new C.Viewer(sc.querySelector('[data-cx=hero]'),{color:0x2fb37a,opacity:.62,labels:false,fit:5.4,spin:.0028,view:'std'});
   var H=CXD.crystal(v,'beryl',{four:true,color:0x2fb37a});v.st.axes=false;v.st.cell=false;v.apply();
   v.root.position.x=-.25;
   // hexagonal lattice points inside the crystal
   var Bs=C.HEX(.997).map(function(b){return b.clone().multiplyScalar(.22)}),pts=[];
   for(var i=-8;i<=8;i++)for(var j=-8;j<=8;j++)for(var k=-8;k<=8;k++){var p=Bs[0].clone().multiplyScalar(i).add(Bs[1].clone().multiplyScalar(j)).add(Bs[2].clone().multiplyScalar(k));if(H.F.every(function(f){return f.plane.n.dot(p)<=f.plane.d-.02}))pts.push(p)}
   var g=new T.SphereGeometry(.035,12,8),m=new T.MeshStandardMaterial({color:0x9fe8c8,transparent:true,opacity:0,roughness:.3}),im=new T.InstancedMesh(g,m,pts.length),M=new T.Matrix4();pts.forEach(function(p,i){M.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,M)});v.extra.add(im);
   var ph=document.getElementById('heroPh'),names=['A natural crystal','Its ideal geometric form and axes','Its repeating atomic lattice'],t0=performance.now(),last=-1;
   v.onFrame=function(now){var t=((now-t0)/1000)%15,st=t<5?0:t<10?1:2,f=Math.min(1,(t%5)/1.2);
     var fo=st===0?.62:st===1?.62-.5*f:.12+.5*Math.max(0,(t-14)/1);
     v.faceMeshes.forEach(function(me){me.material.opacity=fo});
     v.axes.visible=st===1; v.cell.visible=st===1;
     m.opacity=st===2?Math.min(1,f)*(t>14?1-(t-14):1):0;
     if(st!==last){last=st;ph.textContent=names[st]}};
  })();
  </script>
</section>''')

# ---------------- 2. what is crystallography ----------------
A('''<section class="scene dark" id="s-what" data-chap="What is crystallography?" data-wipe="hex" data-morph="960,560,1250,45,diamond">
  <div class="pad" style="gap:18px">
    <div class="eyebrow rise">Chapter 1 · What is crystallography?</div>
    <h2 class="kt" style="font-size:62px;color:#FBF6EA">The science of <span class="it">crystal structure, symmetry and shape</span></h2>
    <div class="row rise" style="flex:1;gap:22px;min-height:0">
      <div class="col grow" style="gap:10px"><figure class="photo" style="flex:1"><img src="media/mc-stones-emerald.jpg" alt=""><figcaption>Emerald crystal · Robert M. Lavinsky, CC BY-SA 3.0</figcaption></figure><h3 style="color:#fff">1 · The natural crystal</h3><p class="dk">What we hold: real faces, uneven sizes, growth marks.</p></div>
      <div class="col grow" style="gap:10px"><div data-cx="form" style="flex:1"></div><h3 style="color:#fff">2 · Its ideal form</h3><p class="dk">The geometry: a hexagonal prism with flat ends, faces at fixed angles.</p></div>
      <div class="col grow" style="gap:10px"><div data-cx="lat" style="flex:1"></div><h3 style="color:#fff">3 · Its internal lattice</h3><p class="dk">The cause: atoms repeating in three dimensions, one unit cell after another.</p></div>
    </div>
    <div class="tip rise">The outside shape and the inside structure are <b>related but not the same thing</b>. A broken or rounded crystal has lost its faces, yet its internal lattice is unchanged.</div>
  </div>
  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>External morphology vs internal structure.</b> Students often think the crystal system is “the shape”. Stress that the system is defined by the internal lattice and symmetry. A water-worn alluvial sapphire pebble is still trigonal. Faces only appear when a crystal grows freely; their angles are fixed by the lattice (Steno’s law), but their sizes depend on growth conditions.</div></details>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T;
   var a=new C.Viewer(sc.querySelector('[data-cx=form]'),{color:0x2fb37a,opacity:.55,labels:false,fit:3.6});CXD.crystal(a,'beryl',{four:true,color:0x2fb37a});a.st.cell=false;a.apply();
   var b=new C.Viewer(sc.querySelector('[data-cx=lat]'),{color:0x9fd0ff,cellAlways:true,fit:3.2});var Bs=C.HEX(1);b.setCell(Bs,{axes:false,fill:0x2fb37a,fitCam:true,points:true});
   var BB=Bs.map(function(x){return x.clone()});var O=BB[0].clone().add(BB[1]).add(BB[2]).multiplyScalar(-.5);
   var g=new T.SphereGeometry(.05,12,8),m=new T.MeshStandardMaterial({color:0x9fe8c8,transparent:true,opacity:.75}),pts=[];for(var i=-2;i<=3;i++)for(var j=-2;j<=3;j++)for(var k=-1;k<=2;k++){pts.push(O.clone().add(BB[0].clone().multiplyScalar(i)).add(BB[1].clone().multiplyScalar(j)).add(BB[2].clone().multiplyScalar(k)))}
   var im=new T.InstancedMesh(g,m,pts.length),M=new T.Matrix4();pts.forEach(function(p,i){M.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,M)});b.extra.add(im);b.r=b.r0=9;
  })();
  </script>
</section>''')

# ---------------- 3. why ----------------
A('''<section class="scene" id="s-why" data-chap="Why it matters" data-wipe="slice" data-morph="1800,200,90,0,hex">
  <div class="facets"></div>
  <div class="pad" style="gap:20px">
    <div class="eyebrow rise">Why a gemmologist studies crystallography</div>
    <div class="gal" style="flex:1;grid-template-columns:repeat(5,1fr)">
      <div class="col step" style="gap:10px"><figure class="photo" style="flex:1;background:#fff"><img src="media/s45_053.jpg" alt="" style="object-fit:contain"></figure><h3>Identification</h3><p class="small">A six-sided prism with flat ends suggests beryl; an octahedron suggests spinel. A first clue, never proof.</p></div>
      <div class="col step" style="gap:10px"><figure class="photo" style="flex:1;background:#fff"><img src="media/s43_051.jpg" alt="" style="object-fit:contain"></figure><h3>Habit on rough</h3><p class="small">Sorting and cutting rough starts with recognising its shape and where the c axis runs.</p></div>
      <div class="col step" style="gap:10px"><figure class="photo" style="flex:1"><img src="media/mc-tools-pol.jpg" alt=""></figure><h3>Optics</h3><p class="small">Cubic gems are singly refractive; the other systems are doubly refractive, uniaxial or biaxial.</p></div>
      <div class="col step" style="gap:10px"><figure class="photo" style="flex:1"><img src="media/s38_038.jpg" alt=""></figure><h3>Growth and inclusions</h3><p class="small">Growth zoning, trigons and crystal inclusions follow the lattice directions.</p></div>
      <div class="col step" style="gap:10px"><figure class="photo" style="flex:1;background:#fff"><img src="media/s40_044.png" alt="" style="object-fit:contain"></figure><h3>Cleavage and cutting</h3><p class="small">Topaz cleaves parallel to its base; a cutter must place the table away from that plane.</p></div>
    </div>
  </div>
</section>''')

# ---------------- 4. atoms to crystal ----------------
A('''<section class="scene dark" id="s-atoms" data-chap="From atoms to crystal" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Chapter 2 · From atoms to crystal</div><div data-cx="steps"></div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:1120px;flex:none"></div>
      <div class="col grow" style="gap:16px;justify-content:center"><span class="num-badge" id="atK">1</span><div id="atN" class="sysh" style="font-size:56px"></div><p class="dk" id="atT" style="font-size:24px"></p><div class="tip" style="font-size:19px">Schematic: one kind of atom on a simple cubic lattice, so the idea is easy to see. Real gem minerals have several kinds of atom in each cell.</div></div>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{color:0x8fc7ff,fit:1,r:9.5,spin:.0025,labels:false});v.st.axes=false;v.apply();
   var N=5,h=(N-1)/2,s=.62,P=[],R=[];for(var i=0;i<N;i++)for(var j=0;j<N;j++)for(var k=0;k<N;k++){P.push(v3((i-h)*s,(j-h)*s,(k-h)*s));R.push(v3((Math.random()-.5)*5,(Math.random()-.5)*5,(Math.random()-.5)*4))}
   var g=new T.SphereGeometry(.12,16,12),m=new T.MeshStandardMaterial({color:0x8fd8ff,roughness:.25,metalness:.15}),im=new T.InstancedMesh(g,m,P.length);im.instanceMatrix.setUsage(T.DynamicDrawUsage);v.extra.add(im);
   var gm=new T.MeshStandardMaterial({color:0xffd27a,roughness:.25,metalness:.2}),gold=new T.InstancedMesh(g,gm,8);v.extra.add(gold);
   var cell=new T.Group();v.extra.add(cell);var lat=new T.Group();v.extra.add(lat);
   var em=new T.MeshBasicMaterial({color:0xffd27a}),lm=new T.LineBasicMaterial({color:0x6f9fe0,transparent:true,opacity:.45});
   // lattice lines
   for(var a=0;a<N;a++)for(var b=0;b<N;b++){[[v3(-h*s,(a-h)*s,(b-h)*s),v3(h*s,(a-h)*s,(b-h)*s)],[v3((a-h)*s,-h*s,(b-h)*s),v3((a-h)*s,h*s,(b-h)*s)],[v3((a-h)*s,(b-h)*s,-h*s),v3((a-h)*s,(b-h)*s,h*s)]].forEach(function(q){lat.add(new T.Line(new T.BufferGeometry().setFromPoints(q),lm))})}
   var o=v3(0,0,0);var corners=[];for(var c=0;c<8;c++)corners.push(v3((c&1)*s,(c>>1&1)*s,(c>>2&1)*s));
   [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(function(e){var p=corners[e[0]],q=corners[e[1]],d=v3().subVectors(q,p),L=d.length(),cy=new T.Mesh(new T.CylinderGeometry(.025,.025,L,8),em);cy.position.copy(p).add(q).multiplyScalar(.5);cy.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());cell.add(cy)});
   var M=new T.Matrix4();corners.forEach(function(p,i){M.makeTranslation(p.x,p.y,p.z);gold.setMatrixAt(i,M)});
   var crys=new T.Group();v.extra.add(crys);var cb=C.FORMS.cube().map(function(p){p.d=h*s+.2;return p});var H=C.hull(cb);
   H.F.forEach(function(f){var pos=[];for(var k=1;k<f.idx.length-1;k++)[f.idx[0],f.idx[k],f.idx[k+1]].forEach(function(j){pos.push(H.V[j].x,H.V[j].y,H.V[j].z)});var gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(pos,3));gg.computeVertexNormals();crys.add(new T.Mesh(gg,new T.MeshStandardMaterial({color:0x8fc7ff,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false})))});
   var S=[['Atoms','Atoms (or ions) start out disordered, as in a melt or a solution.'],['Order','As the crystal grows they settle into a regular, repeating 3D pattern: the lattice.'],['Unit cell','The smallest box that, repeated side by side, rebuilds the whole pattern: the unit cell.'],['Crystal','Millions of cells repeat outwards; the flat faces of the crystal follow the lattice planes.']];
   var cur=0,t0=performance.now(),from=R,mix=0;function go(i){cur=i;t0=performance.now();document.getElementById('atK').textContent=i+1;document.getElementById('atN').textContent=S[i][0];document.getElementById('atT').textContent=S[i][1]}
   CXD.seg(sc.querySelector('[data-cx=steps]'),S.map(function(x,i){return[i,(i+1)+'. '+x[0]]}),function(i){go(i)},0);
   var p=v3();v.onFrame=function(now){var k=Math.min(1,(now-t0)/1400),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;mix=cur===0?Math.max(0,mix-.03):Math.min(1,cur===1?e:1);
     var jit=cur===0?1:0;P.forEach(function(q,i){p.copy(R[i]).lerp(q,mix);if(jit){p.x+=Math.sin(now/400+i)*.05;p.y+=Math.cos(now/500+i*1.3)*.05}M.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,M)});im.instanceMatrix.needsUpdate=true;
     lat.visible=cur>=1&&mix>.95;cell.visible=gold.visible=cur>=2;m.opacity=1;m.transparent=cur===2;m.opacity=cur===2?.35:1;crys.visible=cur===3;
     crys.children.forEach(function(c){c.material.opacity=.18*e})};
  })();
  </script>
</section>''')

# ---------------- 5. lattice & unit cell ----------------
A('''<section class="scene dark" id="s-cell" data-chap="Lattice and unit cell" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Crystal lattice and unit cell · tap to highlight</div><div data-cx="parts"></div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:1120px;flex:none"></div>
      <div class="col grow" style="gap:16px;justify-content:center"><div id="ucN" class="sysh" style="font-size:54px"></div><p class="dk" id="ucT" style="font-size:23px"></p>
        <div class="tip" style="font-size:19px">A unit cell is a <b>repeat unit of the lattice</b>, not a molecule. A halite (NaCl) unit cell, for example, holds four sodium and four chlorine ions shared with its neighbours.</div></div>
    </div>
  </div>
  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>Lattice vs unit cell.</b> The lattice is an infinite array of identical points: a mathematical pattern. The unit cell is one box cut from it that tiles space when repeated. Each corner point is shared by 8 cells, so a simple cell “owns” one lattice point. Atoms are then placed at or around the lattice points (the “motif”). Ask students: if the lattice is wallpaper, the unit cell is one tile of the design.</div></details>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{color:0x8fc7ff,cellAlways:true,fit:1,r:8.5,spin:.0025,tools:['views','auto','reset']});
   var Bs=C.basis(1,1,1,90,90,90);var P=v.setCell(Bs,{axes:true,angles:['α','β','γ'],fill:0x8fc7ff,points:true,lgroup:'cellv'});
   var L=CXD.lattice(v,Bs,4,{r:.05,color:0x6f9fe0,opacity:.55});
   var lm=new T.LineBasicMaterial({color:0x6f9fe0,transparent:true,opacity:.28}),lg=new T.Group();v.extra.add(lg);for(var a=0;a<4;a++)for(var b=0;b<4;b++){[[v3(-1,a-1,b-1),v3(2,a-1,b-1)],[v3(a-1,-1,b-1),v3(a-1,2,b-1)],[v3(a-1,b-1,-1),v3(a-1,b-1,2)]].forEach(function(q){q=q.map(function(x){return x.clone().add(v3(-.5,-.5,-.5)).add(v3(.5,.5,.5)).sub(v3(1,1,1).multiplyScalar(.5))});lg.add(new T.Line(new T.BufferGeometry().setFromPoints(q),lm))})}
   var hl=new T.Group();v.extra.add(hl);var hm=new T.MeshBasicMaterial({color:0xff6f61});
   function rod(p,q){var d=v3().subVectors(q,p),Lh=d.length(),cy=new T.Mesh(new T.CylinderGeometry(.03,.03,Lh,8),hm);cy.position.copy(p).add(q).multiplyScalar(.5);cy.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());return cy}
   var S={pts:['Lattice points','Every point has identical surroundings. The 3D array of these points is the crystal lattice.'],edges:['Edges','The 12 edges of the cell have lengths a, b and c: the lattice parameters.'],faces:['Faces','A unit cell has six faces in three parallel pairs. Repeating the cell across these faces fills space with no gaps.'],axes:['Axes and angles','Three axes a, b, c run along the cell edges. The angles between them are α (between b and c), β (a and c) and γ (a and b).'],lat:['The lattice','Hide the cell and you see the endless 3D grid it comes from. Any one box of the grid that repeats is a unit cell.']};
   CXD.seg(sc.querySelector('[data-cx=parts]'),[['pts','Lattice points'],['edges','Edges'],['faces','Faces'],['axes','Axes & angles'],['lat','Whole lattice']],function(k){
     while(hl.children.length)hl.remove(hl.children[0]);document.getElementById('ucN').textContent=S[k][0];document.getElementById('ucT').textContent=S[k][1];
     v.cell.visible=true;L.m.opacity=.55;lg.visible=true;
     if(k==='pts'){var sg=new T.SphereGeometry(.09,16,12);P.forEach(function(p){var m=new T.Mesh(sg,hm);m.position.copy(p);hl.add(m)})}
     if(k==='edges'){[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(function(e){hl.add(rod(P[e[0]],P[e[1]]))})}
     if(k==='faces'){var fm=new T.MeshStandardMaterial({color:0xff6f61,transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});[[0,1,3,2],[4,5,7,6]].forEach(function(q){var g=new T.BufferGeometry().setFromPoints([P[q[0]],P[q[1]],P[q[2]],P[q[0]],P[q[2]],P[q[3]]]);g.computeVertexNormals();hl.add(new T.Mesh(g,fm))})}
     if(k==='lat'){v.cell.visible=false;L.m.opacity=1}
     v.labels.forEach(function(Lb){if(Lb.group==='cellv')Lb.vis=(k==='axes'||k==='edges')});
   },0);
  })();
  </script>
</section>''')

# ---------------- 6. anatomy ----------------
A('''<section class="scene dark" id="s-anat" data-chap="Anatomy of a crystal" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">The anatomy of a crystal · cube + octahedron combination</div><div data-cx="parts"></div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:1120px;flex:none"></div>
      <div class="col grow" style="gap:16px;justify-content:center"><div id="anN" class="sysh" style="font-size:54px"></div><p class="dk" id="anT" style="font-size:23px"></p><p class="small" style="color:#9fb6da">Idealised model: real crystals have faces of unequal size, but the angles between them stay the same.</p></div>
    </div>
  </div>
  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>Face vs form.</b> A face is one flat surface. A form is the whole set of faces made identical by the crystal’s symmetry: all six cube faces are one form {100}; all eight octahedron faces are one form {111}. This model is a <b>combination</b> of two forms. Curly brackets {hkl} name a form; round brackets (hkl) name one face.</div></details>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{color:0x9fd0ff,opacity:.5,labels:false,fit:4.2,tools:['views','auto','labels','wire','reset']});
   var H=CXD.crystal(v,'cubocta',{color:0x9fd0ff});v.st.cell=false;v.st.axes=false;v.apply();
   var hl=new T.Group();v.root.add(hl);var hm=new T.MeshBasicMaterial({color:0xffd27a});
   function rod(p,q,r){var d=v3().subVectors(q,p),L=d.length(),cy=new T.Mesh(new T.CylinderGeometry(r,r,L,8),hm);cy.position.copy(p).add(q).multiplyScalar(.5);cy.quaternion.setFromUnitVectors(v3(0,1,0),d.normalize());return cy}
   function reset(){while(hl.children.length)hl.remove(hl.children[0]);v.clearLabels('an');v.op=.5;v.faceMeshes.forEach(function(m){m.material.color.set(m.userData.base);m.material.opacity=v.op});v.st.axes=false;v.apply()}
   var S={faces:['Faces','The flat outer surfaces. Each is parallel to a set of lattice planes. This crystal has 14: 6 square and 8 triangular.'],edges:['Edges','Lines where two faces meet. Edges parallel to the same direction form a “zone”.'],verts:['Vertices','The corners, where three or more faces meet. This model has 24.'],axes:['Axes','Imaginary reference lines through the centre. Here they are the cubic axes a = b = c, at 90°.'],angle:['Interfacial angle','The angle between the normals of two faces. Between a cube face and an octahedron face it is always 54.74°, on every crystal of this kind: Steno’s law of constant angles (1669).'],forms:['Forms','A form is a set of faces related by symmetry. Gold: the cube {100}. Blue: the octahedron {111}. This crystal is a combination of two forms.']};
   CXD.seg(sc.querySelector('[data-cx=parts]'),[['faces','Faces'],['edges','Edges'],['verts','Vertices'],['axes','Axes'],['angle','Interfacial angle'],['forms','Forms']],function(k){
     reset();document.getElementById('anN').textContent=S[k][0];document.getElementById('anT').textContent=S[k][1];
     if(k==='faces'){v.faceMeshes.forEach(function(m){m.material.color.set(0xffd27a);m.material.opacity=.45})}
     if(k==='edges'){var seen={};H.F.forEach(function(f){f.idx.forEach(function(a,i){var b=f.idx[(i+1)%f.idx.length],key=Math.min(a,b)+'-'+Math.max(a,b);if(seen[key])return;seen[key]=1;hl.add(rod(H.V[a],H.V[b],.03))})})}
     if(k==='verts'){var sg=new T.SphereGeometry(.07,14,10);H.V.forEach(function(p){var m=new T.Mesh(sg,hm);m.position.copy(p);hl.add(m)})}
     if(k==='axes'){v.st.axes=true;v.apply()}
     if(k==='angle'){var f1=H.F.find(function(f){return f.plane.n.x>.99}),f2=H.F.find(function(f){return f.plane.n.x>.5&&f.plane.n.y>.5&&f.plane.n.z>.5});
       [f1,f2].forEach(function(f){var m=v.faceMeshes.find(function(me){return me.userData.f===f});m.material.color.set(0xffd27a);m.material.opacity=.75;hl.add(rod(v3(0,0,0),f.plane.n.clone().multiplyScalar(f.plane.d*1.9),.022))});
       var a=f1.plane.n,b=f2.plane.n,ang=a.angleTo(b),pts=[];for(var i=0;i<=30;i++){var t=i/30;pts.push(a.clone().multiplyScalar(Math.sin((1-t)*ang)).add(b.clone().multiplyScalar(Math.sin(t*ang))).divideScalar(Math.sin(ang)).multiplyScalar(1.45))}
       hl.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xffd27a})));v.label(a.clone().add(b).normalize().multiplyScalar(1.75),'54.74°','big','an');v.label(a.clone().multiplyScalar(1.95),'(100)','face','an');v.label(b.clone().multiplyScalar(1.95),'(111)','face','an');v.st.solid=true;v.op=.35;v.faceMeshes.forEach(function(m){if(m.material.color.getHex()!==0xffd27a)m.material.opacity=.2});v.view('std')}
     if(k==='forms'){v.faceMeshes.forEach(function(m){m.material.color.set(m.userData.f.plane.form.indexOf('Cube')===0?0xffd27a:0x6fa8ff);m.material.opacity=.6})}
   },0);
  })();
  </script>
</section>''')

# ---------------- 7. Miller indices ----------------
A('''<section class="scene dark" id="s-miller" data-chap="Miller indices" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:16px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Crystal planes and Miller indices</div><div data-cx="planes"></div></div>
    <div class="row rise" style="flex:1;gap:30px;min-height:0">
      <div data-cx="v" style="width:1000px;flex:none"></div>
      <div class="col grow" style="gap:14px;justify-content:center">
        <div id="miN" class="sysh" style="font-size:72px"></div>
        <table class="ctable" style="font-size:22px"><tr><th></th><th>a</th><th>b</th><th>c</th></tr><tr><td style="font-size:19px">1 · Where it cuts</td><td class="r" id="mi0"></td><td class="r" id="mi1"></td><td class="r" id="mi2"></td></tr><tr><td style="font-size:19px">2 · Flip each</td><td class="r" id="mi3"></td><td class="r" id="mi4"></td><td class="r" id="mi5"></td></tr><tr><td style="font-size:19px">3 · Whole numbers</td><td class="r" id="mi6"></td><td class="r" id="mi7"></td><td class="r" id="mi8"></td></tr></table>
        <p class="dk" id="miT"></p>
        <div class="row" style="gap:12px;align-items:center"><button type="button" class="chip gold" id="miF" style="cursor:pointer;border:0;font:800 17px/1 var(--body);padding:13px 18px">Show the crystal form this plane gives</button></div>
        <div class="tip" style="font-size:18px">A <b>plane</b> is a geometric direction through the lattice. A <b>face</b> is a real surface that happens to lie parallel to such a plane. ∞ means the plane never meets that axis, so its index is 0.</div>
      </div>
    </div>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T,v3=C.v3;
   var v=new C.Viewer(sc.querySelector('[data-cx=v]'),{color:0x8fc7ff,cellAlways:true,fit:1,r:6.4,spin:.0025,tools:['views','auto','reset'],view:'std'});
   var Bs=C.basis(1,1,1,90,90,90),O=v3(-.5,-.5,-.5);v.setCell(Bs,{axes:true,origin:O,fill:null,points:true,lgroup:'cellv'});
   var pg=new T.Group();v.extra.add(pg);var cg=new T.Group();v.root.add(cg);var form=false,curK=null;
   var D={'100':[[1,0,0],'1','∞','∞','1','0','0','Cube {100}','A plane cutting only a, parallel to b and c. In a cubic crystal the six equivalent planes make the cube.'],'110':[[1,1,0],'1','1','∞','1','1','0','Dodecahedron {110}','Cuts a and b equally, parallel to c. Twelve equivalent planes make the rhombic dodecahedron, garnet’s classic form.'],'111':[[1,1,1],'1','1','1','1','1','1','Octahedron {111}','Cuts all three axes equally. Eight such planes make the octahedron of spinel and diamond.'],'210':[[2,1,0],'½','1','∞','2','1','0','Tetrahexahedron {210}','Cuts a at ½ and b at 1, parallel to c. Flipping gives 2, 1, 0.'],'211':[[2,1,1],'½','1','1','2','1','1','Trapezohedron {211}','Cuts a at ½, b and c at 1. Twenty-four such faces make the trapezohedron seen on garnet.']};
   function plane(h){while(pg.children.length)pg.remove(pg.children[0]);v.clearLabels('mi');
     var n=v3(h[0],h[1],h[2]),pts=[],E=[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]],P=[];for(var i=0;i<8;i++)P.push(v3(i&1,i>>1&1,i>>2&1));
     E.forEach(function(e){var p=P[e[0]],q=P[e[1]],fp=n.dot(p)-1,fq=n.dot(q)-1;if(Math.abs(fp-fq)<1e-9){return}var t=fp/(fp-fq);if(t>=-1e-6&&t<=1+1e-6){var x=p.clone().lerp(q,t);if(!pts.some(function(y){return y.distanceTo(x)<1e-6}))pts.push(x)}});
     var c=pts.reduce(function(s,p){return s.add(p)},v3()).divideScalar(pts.length),u=v3().subVectors(pts[0],c).normalize(),w=v3().crossVectors(n.clone().normalize(),u);pts.sort(function(a,b){var pa=v3().subVectors(a,c),pb=v3().subVectors(b,c);return Math.atan2(pa.dot(w),pa.dot(u))-Math.atan2(pb.dot(w),pb.dot(u))});
     var pos=[];for(var k=1;k<pts.length-1;k++)[pts[0],pts[k],pts[k+1]].forEach(function(p){var q=p.clone().add(O);pos.push(q.x,q.y,q.z)});var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
     pg.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0xffd27a,transparent:true,opacity:.55,side:T.DoubleSide,depthWrite:false})));
     var ln=pts.concat([pts[0]]).map(function(p){return p.clone().add(O)});pg.add(new T.Line(new T.BufferGeometry().setFromPoints(ln),new T.LineBasicMaterial({color:0xffd27a})));
     var sg=new T.SphereGeometry(.05,14,10),sm=new T.MeshBasicMaterial({color:0xff6f61});['x','y','z'].forEach(function(ax,i){if(h[i]){var p=v3(0,0,0);p[ax]=1/h[i];var m=new T.Mesh(sg,sm);m.position.copy(p).add(O);pg.add(m)}});
   }
   function showForm(){while(cg.children.length)cg.remove(cg.children[0]);var d=D[curK];if(!form){v.cell.visible=true;pg.visible=true;return}
     v.cell.visible=false;pg.visible=false;var h=d[0],out=[];C.cubicSet(h[0],h[1],h[2]).forEach(function(q){out.push({n:v3(q[0],q[1],q[2]).normalize(),d:.75})});var H=C.hull(out);
     H.F.forEach(function(f){var pos=[];for(var k=1;k<f.idx.length-1;k++)[f.idx[0],f.idx[k],f.idx[k+1]].forEach(function(j){pos.push(H.V[j].x,H.V[j].y,H.V[j].z)});var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();var isP=Math.abs(f.plane.n.dot(v3(h[0],h[1],h[2]).normalize())-1)<1e-6;cg.add(new T.Mesh(g,new T.MeshStandardMaterial({color:isP?0xffd27a:0x8fc7ff,transparent:true,opacity:isP?.85:.45,side:T.DoubleSide,depthWrite:false,flatShading:true})))});
     var seen={},em=new T.MeshBasicMaterial({color:0xffffff});H.F.forEach(function(f){f.idx.forEach(function(a,i){var b=f.idx[(i+1)%f.idx.length],key=Math.min(a,b)+'-'+Math.max(a,b);if(seen[key])return;seen[key]=1;var p=H.V[a],q=H.V[b],dd=v3().subVectors(q,p),L=dd.length(),cy=new T.Mesh(new T.CylinderGeometry(.01,.01,L,6),em);cy.position.copy(p).add(q).multiplyScalar(.5);cy.quaternion.setFromUnitVectors(v3(0,1,0),dd.normalize());cg.add(cy)})})}
   var fb=document.getElementById('miF');fb.onclick=function(e){e.stopPropagation();form=!form;fb.textContent=form?'Back to the plane in the unit cell':'Show the crystal form this plane gives';showForm()};
   CXD.seg(sc.querySelector('[data-cx=planes]'),Object.keys(D).map(function(k){return[k,'('+k+')']}),function(k){curK=k;var d=D[k];document.getElementById('miN').textContent='('+k+')';for(var i=0;i<6;i++)document.getElementById('mi'+i).textContent=d[i+1];document.getElementById('mi6').textContent=d[0][0];document.getElementById('mi7').textContent=d[0][1];document.getElementById('mi8').textContent=d[0][2];document.getElementById('miT').innerHTML=d[8]+' The full set of equivalent faces is the form <b>'+d[7]+'</b>.';plane(d[0]);showForm()},0);
  })();
  </script>
</section>''')

# ---------------- 8-14 systems ----------------
SYS = [
 dict(id='s-cub', chap='Cubic', n=1, name='Cubic', alt='isometric', rel='a = b = c · α = β = γ = 90°', color='0xd23c58',
   forms=[['octahedron','Octahedron','Octahedron {111}: spinel and diamond.'],['dodecahedron','Dodecahedron','Rhombic dodecahedron {110}: the classic garnet form.'],['trapezohedron','Trapezohedron','Trapezohedron {211}: also common on garnet.'],['garnetCombo','Garnet combo','Dodecahedron with trapezohedron faces on its edges: a typical garnet.'],['cube','Cube','Cube {100}: fluorite and pyrite.']],
   cells=[[None,'Cubic',"{bs:function(){return CX.basis(1,1,1,90,90,90)},angles:['α = 90°','β = 90°','γ = 90°']}"]],
   sym='Four 3-fold axes along the body diagonals: the defining feature. The full set has three 4-fold axes, six 2-fold axes and nine mirror planes.',
   opt='Isotropic: singly refractive (SR), one RI in every direction. Strain can cause anomalous double refraction.',
   gems='Garnet, spinel, diamond, fluorite, pyrite', mem='All equal, all square: a sugar cube.',
   myth='Cubic crystals always grow as cubes.', ans='Not true. Cube, octahedron, dodecahedron and trapezohedron are all cubic forms. Spinel grows as octahedra, garnet as dodecahedra or trapezohedra.'),
 dict(id='s-tet', chap='Tetragonal', n=2, name='Tetragonal', alt='', rel='a = b ≠ c · α = β = γ = 90°', color='0xd8a24a',
   forms=[['zircon','Zircon','Zircon: square prism {100} capped by a bipyramid {101} (c/a = 0.905).','0x8fb8e8'],['tetraPrism','Prism + pinacoid','Square prism with flat ends: idocrase, scapolite.'],['tetraBipyr','Bipyramid','Tetragonal bipyramid {101}.']],
   cells=[[None,'Tetragonal',"{bs:function(){return CX.basis(1,1,1.45,90,90,90)},angles:['α = 90°','β = 90°','γ = 90°']}"],[None,'Compare with cubic',"{bs:function(){return CX.basis(1,1,1.45,90,90,90)},angles:['α = 90°','β = 90°','γ = 90°'],extra:function(u){var T=CX.T,Bs=CX.basis(1,1,1,90,90,90),O=CX.v3(-.5,-.5,-.725),m=new T.LineBasicMaterial({color:0xff9f8c});[[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]].forEach(function(e){var P=[e[0],e[1]].map(function(i){return O.clone().add(Bs[0].clone().multiplyScalar(i&1)).add(Bs[1].clone().multiplyScalar(i>>1&1)).add(Bs[2].clone().multiplyScalar(i>>2&1))});u.extra.add(new T.Line(new T.BufferGeometry().setFromPoints(P),m))})}}"]],
   sym='One 4-fold axis, parallel to c. All axes at right angles, but c is longer or shorter than a and b.',
   opt='Uniaxial (DR): one optic axis, along c. Look straight down c and the stone behaves as if singly refractive.',
   gems='Zircon, rutile, idocrase (vesuvianite), scapolite', mem='A cube stretched (or squashed) along one axis.',
   myth='Zircon and cubic zirconia are the same thing.', ans='No. Zircon is a natural tetragonal mineral (ZrSiO₄), doubly refractive. Cubic zirconia is a synthetic cubic material (ZrO₂), singly refractive.'),
 dict(id='s-ort', chap='Orthorhombic', n=3, name='Orthorhombic', alt='', rel='a ≠ b ≠ c · α = β = γ = 90°', color='0xe39a3a',
   forms=[['topaz','Topaz','Topaz: prisms {110} and {120}, a dome, a bipyramid and the basal pinacoid (a : b : c = 0.53 : 1 : 0.95).'],['orthoBox','Three pinacoids','Three pairs of faces at right angles: the “matchbox”.'],['orthoBipyr','Rhombic bipyramid','Rhombic bipyramid {111}: its cross-section is a rhombus, not a square.']],
   cells=[[None,'Orthorhombic',"{bs:function(){return CX.basis(.8,1,1.35,90,90,90)},angles:['α = 90°','β = 90°','γ = 90°']}"]],
   sym='Three 2-fold axes at right angles, usually with three mirror planes. No 3-, 4- or 6-fold axis.',
   opt='Biaxial (DR): two optic axes. Many coloured stones show three pleochroic colours (trichroism).',
   gems='Topaz, peridot (olivine), chrysoberyl, tanzanite (zoisite), iolite, andalusite', mem='A matchbox: three different lengths, all corners square.',
   myth='Tourmaline is orthorhombic because it grows as long prisms.', ans='No. Tourmaline is trigonal. A long prismatic habit never decides the system; symmetry does.'),
 dict(id='s-hex', chap='Hexagonal', n=4, name='Hexagonal', alt='', rel='a₁ = a₂ = a₃ ≠ c · basal axes at 120°, c ⊥ base', color='0x2fb37a', four=True,
   forms=[['beryl','Beryl prism','Beryl: hexagonal prism {10̄10} with flat basal pinacoid {0001}: emerald, aquamarine.'],['berylTerm','With bipyramid','Prism and pinacoid with small bipyramid faces {10̄11} on the corners.'],['berylTab','Tabular','Short, tabular habit: typical of morganite.','0xe8a7b8'],['hexBipyr','Bipyramid','Hexagonal bipyramid {10̄11}.']],
   cells=[[None,'Hexagonal',"{bs:function(){return CX.HEX(1.15)},angles:['α = 90°','β = 90°','γ = 120°'],names:['a₁','a₂','c'],extra:function(u){CXD.hexOutline(u,CX.HEX(1.15))}}"]],
   sym='One 6-fold axis, parallel to c. Three equal a axes at 120° in the basal plane, c perpendicular to them. Faces use four indices (hkil), where i = −(h + k).',
   opt='Uniaxial (DR): one optic axis along c.',
   gems='Beryl (emerald, aquamarine, morganite, heliodor, goshenite), apatite', mem='A pencil: six sides around one long axis.',
   myth='Every six-sided crystal is hexagonal.', ans='No. Quartz, corundum and tourmaline often look six-sided but are trigonal: their highest symmetry axis is 3-fold. The cell shown is one third of the hexagonal prism outlined around it.'),
 dict(id='s-tri', chap='Trigonal', n=5, name='Trigonal', alt='rhombohedral', rel='a₁ = a₂ = a₃ ≠ c (hexagonal axes)<br>or a = b = c, α = β = γ ≠ 90° (rhombohedral)', color='0xe0507a', four=True,
   forms=[['quartz','Quartz','Quartz: hexagonal prism capped by two rhombohedra, r and z. It looks six-fold, but r and z are different forms.','0xb58be0'],['sapphire','Sapphire','Sapphire: barrel-shaped hexagonal dipyramid {22̄43} with basal pinacoid.','0x3b6fd6'],['ruby','Ruby','Ruby: tabular hexagonal prism, basal pinacoid and small rhombohedron faces.','0xd0284a'],['rhomb','Rhombohedron','Rhombohedron {10̄11}: six identical rhomb faces, as in calcite and rhodochrosite cleavage.','0xe0507a'],['tourmaline','Tourmaline','Tourmaline: three-sided prism with rounded sides, and different faces at each end (hemimorphic).','0x37a46a']],
   cells=[[None,'Hexagonal axes',"{bs:function(){return CX.HEX(1.6)},angles:['α = 90°','β = 90°','γ = 120°'],names:['a₁','a₂','c'],extra:function(u){CXD.hexOutline(u,CX.HEX(1.6))}}"],[None,'Rhombohedral cell',"{bs:function(){return CX.basis(1,1,1,62,62,62)},angles:['α ≠ 90°','β = α','γ = α']}"]],
   sym='One 3-fold axis, parallel to c. Turn it 120° and it repeats; turn it 60° and it does not.',
   opt='Uniaxial (DR): one optic axis along c.',
   gems='Corundum (ruby, sapphire), quartz, tourmaline, rhodochrosite, hematite, calcite', mem='Three-fold, not six-fold: a 120° turn repeats it.',
   myth='Trigonal minerals always look like rhombohedra.', ans='No. Quartz is usually a six-sided prism, sapphire a barrel, tourmaline a rounded triangular prism. The rhombohedral cell suits corundum and tourmaline; quartz has a primitive hexagonal lattice.'),
 dict(id='s-mon', chap='Monoclinic', n=6, name='Monoclinic', alt='', rel='a ≠ b ≠ c · α = γ = 90°, β ≠ 90°', color='0x45b07a',
   forms=[['mono','Pyroxene prism','Prismatic pyroxene-type crystal (schematic): prism {110}, pinacoids and inclined end faces. Jadeite, diopside and spodumene are pyroxenes.'],['monoBox','Three pinacoids','Three pairs of faces: the box leans because β is not 90°.']],
   cells=[[None,'Monoclinic',"{bs:function(){return CX.basis(.95,.8,1.25,90,110,90)},angles:['α = 90°','β ≈ 110°','γ = 90°']}"]],
   sym='At most one 2-fold axis (along b) and one mirror plane perpendicular to it. Convention used here: “unique b”, so β is the oblique angle.',
   opt='Biaxial (DR): two optic axes.',
   gems='Jadeite, nephrite (tremolite–actinolite), spodumene (kunzite), diopside, orthoclase (moonstone), malachite', mem='A matchbox pushed over in one direction.',
   myth='Jadeite is usually found as well-formed crystals.', ans='Rarely. Jadeite is almost always a tough, interlocking aggregate of tiny crystals. The model shows the ideal shape of a pyroxene, the mineral family jadeite belongs to.'),
 dict(id='s-tcl', chap='Triclinic', n=7, name='Triclinic', alt='', rel='a ≠ b ≠ c · α ≠ β ≠ γ ≠ 90°', color='0x4a74c9',
   forms=[['tri','Bladed crystal','Bladed crystal made only of pinacoids (schematic, kyanite-like).'],['triBox','Three pinacoids','Three pairs of faces, none at right angles.']],
   cells=[[None,'Triclinic',"{bs:function(){return CX.basis(.9,1,1.2,80,100,110)},angles:['α ≈ 80°','β ≈ 100°','γ ≈ 110°']}"]],
   sym='No rotation axis above 1-fold and no mirror plane; at most a centre of symmetry. The least constrained of the seven systems.',
   opt='Biaxial (DR): two optic axes.',
   gems='Turquoise, kyanite, labradorite and amazonite (feldspars), rhodonite', mem='A matchbox pushed over every way: nothing equal, nothing square.',
   myth='You can see the crystal shape in turquoise.', ans='Almost never. Turquoise is triclinic, but it forms massive, microcrystalline aggregates; visible crystals are very rare.'),
]
for s in SYS:
    forms = ','.join("['%s','%s',%s%s]" % (f[0], f[1], json.dumps(f[2]), (','+f[3]) if len(f) > 3 else '') for f in s['forms'])
    cells = ','.join("[null,%s,%s]" % (json.dumps(c[1]), c[2]) for c in s['cells'])
    fn = ''
    if s['id'] in ('s-hex', 's-tri'):
        fn = '''  <details class="fnote"><summary>Faculty notes</summary><div class="fb"><b>Hexagonal vs trigonal.</b> Both use the same four axes (a₁, a₂, a₃ and c), which is why they are easily confused. The difference is the main symmetry axis: <b>6-fold</b> in hexagonal (beryl), <b>3-fold</b> in trigonal (quartz, corundum, tourmaline). Some textbooks group them together as one “hexagonal family”; we use seven systems. Show the rotation demo in Part 2: a beryl prism repeats every 60°, a tourmaline prism only every 120°.</div></details>\n'''
    A('''<section class="scene dark" id="%(id)s" data-chap="%(chap)s" data-wipe="%(wipe)s" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:12px">
    <div class="row" style="flex:1;gap:26px;min-height:0">
      <div class="col" style="width:1080px;flex:none;gap:12px">
        <div class="row rise" style="justify-content:space-between;align-items:center;gap:16px"><div class="eyebrow">System %(n)d of 7</div><div data-cx="forms"></div></div>
        <div data-cx="crystal" class="rise" style="flex:1"></div>
        <p class="dk rise" data-cx="formnote" style="font-size:18px;min-height:26px"></p>
      </div>
      <div class="col grow" style="gap:11px;min-width:0">
        <div class="sysh rise">%(name)s%(alth)s</div>
        <div class="rel rise" style="font-size:%(rs)dpx">%(rel)s</div>
        <div class="row rise" style="justify-content:space-between;align-items:center"><span class="eyebrow" style="font-size:13px">Unit cell</span><div data-cx="cellseg"></div></div>
        <div data-cx="cell" class="rise" style="height:270px"></div>
        <div class="kvd rise"><b>Symmetry</b><span>%(sym)s</span><b>Optics</b><span>%(opt)s</span><b>Gems</b><span>%(gems)s</span><b>Memory aid</b><span>%(mem)s</span></div>
        <div class="myth rise"><div class="tag">Myth or fact? Tap to reveal</div><div class="q">“%(myth)s”</div><div class="a">%(ans)s</div></div>
      </div>
    </div>
  </div>
%(fn)s  <script>CXD.system(document.currentScript.closest('.scene'),{color:%(color)s,four:%(four)s,forms:[%(forms)s],cells:[%(cells)s]});</script>
</section>''' % dict(s, wipe='slice' if s['n'] % 2 else 'hex', alth=(' <span class="it" style="font-size:38px;color:#c9a24d">' + s['alt'] + '</span>') if s['alt'] else '', rs=22 if len(s['rel']) > 50 else 30, four='true' if s.get('four') else 'false', forms=forms, cells=cells, fn=fn))

# ---------------- 15. compare ----------------
A('''<section class="scene dark" id="s-cmp" data-chap="Compare the seven" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <style>#s-cmp .mini{height:190px;cursor:pointer;position:relative}#s-cmp .mini.selA{outline:3px solid #ff9f8c}#s-cmp .mini.selB{outline:3px solid #9fd0ff}#s-cmp .mn{position:absolute;left:10px;bottom:8px;font:700 16px/1 var(--body);color:#fff;z-index:3;pointer-events:none;text-shadow:0 1px 4px #000}#s-cmp .tagA,#s-cmp .tagB{font:800 13px/1 var(--body);letter-spacing:.12em;text-transform:uppercase}#s-cmp .tagA{color:#ff9f8c}#s-cmp .tagB{color:#9fd0ff}</style>
  <div class="pad" style="gap:12px">
    <div class="row rise" style="justify-content:space-between;align-items:flex-end"><div class="eyebrow">Compare the seven systems · tap one for A, then one for B</div><div data-cx="mode"></div></div>
    <div class="gal rise" id="cmpMini" style="grid-template-columns:repeat(7,1fr);height:190px"></div>
    <div class="row rise" style="flex:1;gap:18px;min-height:0">
      <div class="col" style="width:470px;flex:none;gap:6px"><span class="tagA" id="cmpAN"></span><div data-cx="A" style="flex:1"></div></div>
      <div class="col grow" style="gap:8px" id="cmpMid"><span class="eyebrow" style="font-size:13px">Geometric comparison: drag from A to B</span><div data-cx="M" style="flex:1"></div><input type="range" id="cmpR" min="0" max="100" value="0"><p class="small" style="color:#9fb6da">The morph only compares shapes. Crystal systems never change into one another in nature.</p></div>
      <div class="col" style="width:470px;flex:none;gap:6px"><span class="tagB" id="cmpBN"></span><div data-cx="B" style="flex:1"></div></div>
    </div>
    <table class="ctable rise" id="cmpT" style="font-size:18px"></table>
  </div>
  <script>
  (function(){var sc=document.currentScript.closest('.scene'),C=CX,T=C.T;
   var S=[['Cubic',[1,1,1,90,90,90],'octahedron','a = b = c','all 90°','four 3-fold','SR (isotropic)','garnet, spinel',0xd23c58],['Tetragonal',[1,1,1.45,90,90,90],'zircon','a = b ≠ c','all 90°','one 4-fold','uniaxial','zircon',0xd8a24a],['Orthorhombic',[.8,1,1.35,90,90,90],'topaz','a ≠ b ≠ c','all 90°','three 2-fold','biaxial','topaz, peridot',0xe39a3a],['Hexagonal',[1.15,1.15,1.3,90,90,120],'beryl','a₁ = a₂ = a₃ ≠ c','γ = 120°','one 6-fold','uniaxial','beryl',0x2fb37a],['Trigonal',[1,1,1,62,62,62],'quartz','a = b = c (rhombohedral)','α = β = γ ≠ 90°','one 3-fold','uniaxial','corundum, quartz',0xe0507a],['Monoclinic',[.95,.8,1.25,90,110,90],'mono','a ≠ b ≠ c','β ≠ 90°','one 2-fold','biaxial','jadeite, spodumene',0x45b07a],['Triclinic',[.9,1,1.2,80,100,110],'tri','a ≠ b ≠ c','none 90°','none (1-fold)','biaxial','kyanite, turquoise',0x4a74c9]];
   var wrap=document.getElementById('cmpMini'),minis=[],A=0,B=6,next='A',mode='cell';
   S.forEach(function(s,i){var d=document.createElement('div');d.className='mini';wrap.appendChild(d);var v=new C.Viewer(d,{cellAlways:true,fit:3.4,spin:.004});var p=s[1];v.setCell(C.basis(p[0],p[1],p[2],p[3],p[4],p[5]),{fill:s[8],fitCam:true});var n=document.createElement('div');n.className='mn';n.textContent=s[0];d.appendChild(n);
     d.addEventListener('click',function(e){e.stopPropagation();if(next==='A'){A=i;next='B'}else{B=i;next='A'}upd()});minis.push(d)});
   var vA=new C.Viewer(sc.querySelector('[data-cx=A]'),{color:0xff9f8c,cellAlways:true,fit:3.6,labels:false}),vB=new C.Viewer(sc.querySelector('[data-cx=B]'),{color:0x9fd0ff,cellAlways:true,fit:3.6,labels:false}),vM=new C.Viewer(sc.querySelector('[data-cx=M]'),{cellAlways:true,fit:3.8,spin:.003});
   var r=document.getElementById('cmpR');['click','keydown','pointerdown'].forEach(function(t){r.addEventListener(t,function(e){e.stopPropagation()})});
   function cell(v,p,col,keep){v.setCell(C.basis(p[0],p[1],p[2],p[3],p[4],p[5]),{axes:true,angles:['α '+Math.round(p[3])+'°','β '+Math.round(p[4])+'°','γ '+Math.round(p[5])+'°'],fill:col,fitCam:!keep,keepCam:keep,lgroup:'cellv'})}
   function form(v,k,col){v.o.cellAlways=false;v.clearLabels('cellv');CXD.crystal(v,k,{four:k==='beryl'||k==='quartz',color:col});v.st.cell=false;v.apply()}
   function morph(){var t=r.value/100,a=S[A][1],b=S[B][1],p=a.map(function(x,i){return x+(b[i]-x)*t});cell(vM,p,0xc9a24d,true)}
   function upd(){minis.forEach(function(d,i){d.classList.toggle('selA',i===A);d.classList.toggle('selB',i===B)});document.getElementById('cmpAN').textContent='A · '+S[A][0];document.getElementById('cmpBN').textContent='B · '+S[B][0];
     if(mode==='cell'){vA.o.cellAlways=true;vB.o.cellAlways=true;vA.setCrystal([]);vB.setCrystal([]);vA.setAxes([]);vB.setAxes([]);cell(vA,S[A][1],S[A][8]);cell(vB,S[B][1],S[B][8]);document.getElementById('cmpMid').style.visibility='visible';r.value=0;cell(vM,S[A][1],0xc9a24d,false);morph()}
     else{form(vA,S[A][2],S[A][8]);form(vB,S[B][2],S[B][8]);document.getElementById('cmpMid').style.visibility='hidden'}
     var rows=[['','Axes','Angles','Highest symmetry axis','Optics','Gem examples']];document.getElementById('cmpT').innerHTML='<tr>'+rows[0].map(function(h){return'<th>'+h+'</th>'}).join('')+'</tr>'+[A,B].map(function(i,k){var s=S[i];return'<tr><td style="color:'+(k?'#9fd0ff':'#ff9f8c')+'">'+s[0]+'</td><td>'+s[3]+'</td><td>'+s[4]+'</td><td>'+s[5]+'</td><td>'+s[6]+'</td><td>'+s[7]+'</td></tr>'}).join('')}
   r.addEventListener('input',morph);
   CXD.seg(sc.querySelector('[data-cx=mode]'),[['cell','Unit cells'],['form','Ideal crystal forms']],function(k){mode=k;upd()},0);
  })();
  </script>
</section>''')

# ---------------- 16. recap ----------------
A('''<section class="scene dark" id="s-recap" data-chap="Recap" data-wipe="slice" data-morph="1780,200,90,0,hex">
  <div class="pad" style="gap:16px">
    <div class="eyebrow rise">Recap · the seven crystal systems</div>
    <table class="ctable rise" style="font-size:21px">
      <tr><th>System</th><th>Axes</th><th>Angles</th><th>Main symmetry</th><th>Optics</th><th>Gems</th><th>Memory aid</th></tr>
      <tr class="step"><td>Cubic</td><td class="r">a = b = c</td><td>all 90°</td><td>four 3-fold</td><td>SR</td><td>garnet, spinel, diamond</td><td>sugar cube</td></tr>
      <tr class="step"><td>Tetragonal</td><td class="r">a = b ≠ c</td><td>all 90°</td><td>one 4-fold</td><td>uniaxial</td><td>zircon, rutile, idocrase</td><td>stretched cube</td></tr>
      <tr class="step"><td>Orthorhombic</td><td class="r">a ≠ b ≠ c</td><td>all 90°</td><td>three 2-fold</td><td>biaxial</td><td>topaz, peridot, chrysoberyl, tanzanite</td><td>matchbox</td></tr>
      <tr class="step"><td>Hexagonal</td><td class="r">a₁ = a₂ = a₃ ≠ c</td><td>120° / 90°</td><td>one 6-fold</td><td>uniaxial</td><td>beryl, apatite</td><td>pencil</td></tr>
      <tr class="step"><td>Trigonal</td><td class="r">a₁ = a₂ = a₃ ≠ c</td><td>120° / 90° (or rhombohedral)</td><td>one 3-fold</td><td>uniaxial</td><td>corundum, quartz, tourmaline</td><td>turn 120°</td></tr>
      <tr class="step"><td>Monoclinic</td><td class="r">a ≠ b ≠ c</td><td>β ≠ 90°</td><td>one 2-fold</td><td>biaxial</td><td>jadeite, spodumene, diopside</td><td>box pushed one way</td></tr>
      <tr class="step"><td>Triclinic</td><td class="r">a ≠ b ≠ c</td><td>none 90°</td><td>none</td><td>biaxial</td><td>kyanite, turquoise, feldspars</td><td>box pushed every way</td></tr>
    </table>
    <div class="tip step">The system is set by the <b>internal lattice and symmetry</b>. The outside shape (habit) can vary a great deal within one system, and even within one mineral.</div>
  </div>
</section>''')

A('''<section class="scene dark" id="s-q" data-chap="Quiz" data-wipe="hex" data-morph="1800,220,90,0,octa">
  <div class="pad" style="gap:18px"><div class="quiz" data-quiz="p1" data-title="Seven systems check"></div></div>
</section>''')

A('''<section class="scene dark" id="s-end" data-chap="Summary" data-wipe="diamond" data-morph="1500,560,480,0,octa">
  <div class="pad" style="gap:30px;justify-content:center">
    <div class="eyebrow rise">What we learned</div>
    <div class="row" style="gap:60px;align-items:center">
      <div class="col grow" style="gap:16px">
        <div class="card step"><h3>Lattice and unit cell</h3><p class="small">Atoms repeat on a 3D lattice; the unit cell is its repeating box, described by a, b, c and α, β, γ.</p></div>
        <div class="card step"><h3>Faces, forms and Miller indices</h3><p class="small">Faces follow lattice planes. (hkl) names a face, {hkl} a form. Interfacial angles are constant.</p></div>
        <div class="card step"><h3>Seven systems</h3><p class="small">Cubic, tetragonal, orthorhombic, hexagonal, trigonal, monoclinic, triclinic. Part 2: symmetry, habit and practice.</p></div>
      </div>
      <div class="col center" style="width:520px;gap:10px">
        <div class="eyebrow" style="justify-content:center">Class score</div>
        <div class="num" style="font-size:200px;color:#FBF6EA"><span id="endScore">0</span></div>
        <p class="small muted">out of 7 questions</p>
      </div>
    </div>
  </div>
</section>''')

DECK = '''<script>
window.DECK={
 tag:'CSG · Crystallography 1',
 menu:[['s-hero','Start','Welcome'],['s-what','Chapter 1','What is crystallography?'],['s-why','Chapter 1','Why it matters'],['s-atoms','Chapter 2','From atoms to crystal'],['s-cell','Chapter 2','Lattice and unit cell'],['s-anat','Chapter 2','Anatomy of a crystal'],['s-miller','Chapter 2','Miller indices'],['s-cub','Systems','1 · Cubic'],['s-tet','Systems','2 · Tetragonal'],['s-ort','Systems','3 · Orthorhombic'],['s-hex','Systems','4 · Hexagonal'],['s-tri','Systems','5 · Trigonal'],['s-mon','Systems','6 · Monoclinic'],['s-tcl','Systems','7 · Triclinic'],['s-cmp','Tool','Compare the seven'],['s-recap','Recap','Summary table'],['s-q','Game','Quiz'],['s-end','Close','Summary']],
 quiz:{
  p1:[
   {q:'Which system has a = b = c and all angles 90°?',o:['Cubic','Tetragonal','Trigonal','Orthorhombic'],a:0,why:'Three equal axes at right angles.'},
   {q:'a = b ≠ c, all angles 90°:',o:['Tetragonal','Hexagonal','Cubic','Monoclinic'],a:0,why:'One axis differs in length.'},
   {q:'Beryl (emerald, aquamarine) belongs to the…',o:['Hexagonal system','Trigonal system','Tetragonal system','Cubic system'],a:0,why:'Beryl has a 6-fold axis.'},
   {q:'Quartz, corundum and tourmaline are…',o:['Trigonal','Hexagonal','Orthorhombic','Cubic'],a:0,why:'Their main axis is 3-fold, even when the crystal looks six-sided.'},
   {q:'Only β is oblique (not 90°) in the…',o:['Monoclinic system','Triclinic system','Orthorhombic system','Tetragonal system'],a:0,why:'Unique-b monoclinic: α = γ = 90°, β ≠ 90°.'},
   {q:'(hkl) in round brackets means…',o:['One crystal face or plane','A whole form','A crystal system','An optic axis'],a:0,why:'Curly brackets {hkl} name a form.'},
   {q:'Cubic gems are optically…',o:['Singly refractive (isotropic)','Uniaxial','Biaxial','Always pleochroic'],a:0,why:'Equal axes give the same RI in every direction.'}
  ]
 }
};
</script>'''

open('/tmp/claude-0/cry/p1.html', 'w').write('\n\n'.join(OUT) + '\n\n' + DECK + '\n')
print(len(OUT), 'scenes')

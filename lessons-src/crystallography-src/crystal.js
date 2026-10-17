/* IGI crystal engine: one shared WebGL renderer drawing every 3D viewer in the deck.
   Geometry is generated from real crystallographic parameters (a,b,c,alpha,beta,gamma) and
   Miller indices; crystal forms are built as the intersection of their face half-spaces. */
window.CX = (function () {
  const T = THREE, D2R = Math.PI / 180;
  const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let R = null, RW = 0, RH = 0;
  const PR = Math.min(2, window.devicePixelRatio || 1);
  const VIEWS = [];

  /* ---------- maths ---------- */
  const v3 = (x, y, z) => new T.Vector3(x, y, z);
  function basis(a, b, c, al, be, ga) {
    al *= D2R; be *= D2R; ga *= D2R;
    const A = v3(a, 0, 0), B = v3(b * Math.cos(ga), b * Math.sin(ga), 0);
    const cx = c * Math.cos(be), cy = c * (Math.cos(al) - Math.cos(be) * Math.cos(ga)) / Math.sin(ga);
    const C = v3(cx, cy, Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy)));
    return [A, B, C];
  }
  function recip(Bs) {
    const [A, B, C] = Bs, V = A.dot(v3().crossVectors(B, C));
    return [v3().crossVectors(B, C).divideScalar(V), v3().crossVectors(C, A).divideScalar(V), v3().crossVectors(A, B).divideScalar(V)];
  }
  function normal(hkl, Bs) {
    const r = recip(Bs);
    return r[0].clone().multiplyScalar(hkl[0]).add(r[1].clone().multiplyScalar(hkl[1])).add(r[2].clone().multiplyScalar(hkl[2])).normalize();
  }
  /* symmetry-equivalent normals. ops: rot (n-fold about z), mz (mirror z), my, mx, inv, c2y */
  function gen(n, ops) {
    let L = [n.clone()];
    const add = f => { const out = []; L.forEach(p => { out.push(p); out.push(f(p)) }); L = out };
    if (ops.rot) { const out = []; L.forEach(p => { for (let k = 0; k < ops.rot; k++) out.push(p.clone().applyAxisAngle(v3(0, 0, 1), k * 2 * Math.PI / ops.rot)) }); L = out }
    if (ops.mx) add(p => v3(-p.x, p.y, p.z));
    if (ops.my) add(p => v3(p.x, -p.y, p.z));
    if (ops.mz) add(p => v3(p.x, p.y, -p.z));
    if (ops.c2y) add(p => v3(-p.x, p.y, -p.z));
    if (ops.inv) add(p => p.clone().negate());
    const U = [];
    L.forEach(p => { if (!U.some(q => q.distanceTo(p) < 1e-5)) U.push(p) });
    return U;
  }
  function cubicSet(h, k, l) {
    const s = new Set(), out = [];
    const P = [[h, k, l], [h, l, k], [k, h, l], [k, l, h], [l, h, k], [l, k, h]];
    P.forEach(p => { for (let m = 0; m < 8; m++) { const q = [p[0] * (m & 1 ? -1 : 1), p[1] * (m & 2 ? -1 : 1), p[2] * (m & 4 ? -1 : 1)]; const key = q.join(','); if (!s.has(key)) { s.add(key); out.push(q) } } });
    return out;
  }
  /* planes: [{n:Vector3 unit, d, label, form, key}] -> polyhedron */
  function hull(planes) {
    const V = [], E = 1e-6;
    for (let i = 0; i < planes.length; i++) for (let j = i + 1; j < planes.length; j++) for (let k = j + 1; k < planes.length; k++) {
      const a = planes[i].n, b = planes[j].n, c = planes[k].n;
      const bc = v3().crossVectors(b, c), det = a.dot(bc);
      if (Math.abs(det) < 1e-9) continue;
      const p = bc.multiplyScalar(planes[i].d).add(v3().crossVectors(c, a).multiplyScalar(planes[j].d)).add(v3().crossVectors(a, b).multiplyScalar(planes[k].d)).divideScalar(det);
      if (planes.every(q => q.n.dot(p) <= q.d + 1e-5) && !V.some(w => w.distanceTo(p) < 1e-4)) V.push(p);
    }
    const F = [];
    planes.forEach(pl => {
      const idx = []; V.forEach((p, i) => { if (Math.abs(pl.n.dot(p) - pl.d) < 1e-4) idx.push(i) });
      if (idx.length < 3) return;
      const c = idx.reduce((s, i) => s.add(V[i]), v3()).divideScalar(idx.length);
      const u = v3().subVectors(V[idx[0]], c).normalize(), w = v3().crossVectors(pl.n, u);
      idx.sort((i, j) => { const pi = v3().subVectors(V[i], c), pj = v3().subVectors(V[j], c); return Math.atan2(pi.dot(w), pi.dot(u)) - Math.atan2(pj.dot(w), pj.dot(u)) });
      F.push({ idx, plane: pl, c });
    });
    return { V, F };
  }
  /* build planes for a family. hkl may be 3 or 4 index (hexagonal: h,k,i,l) */
  function family(hkl, d, Bs, ops, meta) {
    const h3 = hkl.length === 4 ? [hkl[0], hkl[1], hkl[3]] : hkl;
    const n0 = normal(h3, Bs);
    return gen(n0, ops).map(n => Object.assign({ n, d }, meta || {}));
  }
  function millerOf(n, Bs, four) {
    // inverse: find small integers proportional to (n . A, n . B, n . C)
    const c = [n.dot(Bs[0]), n.dot(Bs[1]), n.dot(Bs[2])];
    let best = null;
    for (let s = 1; s <= 6 && !best; s++) {
      const m = Math.max(...c.map(Math.abs)); const q = c.map(x => x / m * s);
      if (q.every(x => Math.abs(x - Math.round(x)) < 0.04)) best = q.map(Math.round);
    }
    if (!best) return '';
    const g = (a, b) => b ? g(b, a % b) : Math.abs(a);
    const gg = best.reduce((a, b) => g(a, b)); if (gg > 1) best = best.map(x => x / gg);
    const f = x => x < 0 ? '<span class="ov">' + (-x) + '</span>' : '' + x;
    if (four) { const i = -(best[0] + best[1]); return '(' + [best[0], best[1], i, best[2]].map(f).join('') + ')' }
    return '(' + best.map(f).join('') + ')';
  }

  /* ---------- renderer ---------- */
  function ensureR(w, h) {
    if (!R) { R = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false }); R.setPixelRatio(PR); R.autoClear = false; R.setClearColor(0x000000, 0) }
    if (w > RW || h > RH) { RW = Math.max(RW, w); RH = Math.max(RH, h); R.setSize(RW, RH, false) }
  }
  function mat(color, op) { return new T.MeshStandardMaterial({ color, transparent: true, opacity: op, roughness: .18, metalness: .08, side: T.DoubleSide, depthWrite: false, flatShading: true, emissive: new T.Color(color).multiplyScalar(.18) }) }
  function rod(p, q, r, m) {
    const d = v3().subVectors(q, p), L = d.length(); if (L < 1e-6) return null;
    const g = new T.CylinderGeometry(r, r, L, 10, 1, true), o = new T.Mesh(g, m);
    o.position.copy(p).add(q).multiplyScalar(.5); o.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize()); return o;
  }
  function cone(p, dir, r, h, m) { const g = new T.ConeGeometry(r, h, 14), o = new T.Mesh(g, m); o.position.copy(p).add(dir.clone().normalize().multiplyScalar(h / 2)); o.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize()); return o }
  function clear(g) { while (g.children.length) { const c = g.children.pop(); c.traverse(o => { if (o.geometry) o.geometry.dispose() }) } }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  /* ---------- viewer ---------- */
  const VIEWDEF = { front: [0, 0], back: [180, 0], right: [90, 0], left: [-90, 0], top: [0, 89.4], bottom: [0, -89.4], iso: [45, 35.26], std: [22, 14] };
  function Viewer(el, o) {
    o = o || {}; const V = this; this.o = o; this.el = el;
    el.classList.add('viewer', 'cxv');
    this.cv = document.createElement('canvas'); el.appendChild(this.cv); this.ctx = this.cv.getContext('2d');
    this.lab = document.createElement('div'); this.lab.className = 'cx-lab'; el.appendChild(this.lab);
    this.scene = new T.Scene();
    this.scene.add(new T.AmbientLight(0xffffff, .62));
    const l1 = new T.DirectionalLight(0xffffff, .9); l1.position.set(3, 2, 5); this.scene.add(l1);
    const l2 = new T.DirectionalLight(0x9fd8ff, .45); l2.position.set(-4, -3, 1); this.scene.add(l2);
    const l3 = new T.DirectionalLight(0xffe2b0, .35); l3.position.set(0, 4, -3); this.scene.add(l3);
    this.cam = new T.PerspectiveCamera(o.fov || 30, 1, .05, 200); this.cam.up.set(0, 0, 1);
    this.root = new T.Group(); this.scene.add(this.root);
    ['faces', 'edges', 'axes', 'cell', 'extra'].forEach(k => { this[k] = new T.Group(); this.root.add(this[k]) });
    this.labels = []; this.st = { axes: o.axes !== false, labels: o.labels !== false, edges: true, solid: true, cell: !!o.cellOn, auto: o.auto != null ? o.auto && !RM : !RM, inspect: false };
    const vd = VIEWDEF[o.view || 'std']; this.th = vd[0] * D2R; this.ph = vd[1] * D2R; this.r = o.r || 6; this.r0 = this.r; this.tg = v3(0, 0, 0); this.tw = null;
    this.color = o.color || 0x7fd3c8; this.op = o.opacity || .5;
    this.faceMeshes = []; this.sel = null;
    if (o.tools) this.toolbar(o.tools);
    this.bindInput();
    VIEWS.push(this); start();
  }
  Viewer.prototype.label = function (pos, html, cls, group) { const d = document.createElement('div'); d.className = 'cxl ' + (cls || ''); d.innerHTML = html; this.lab.appendChild(d); const L = { pos, el: d, group: group || 'misc' }; this.labels.push(L); return L };
  Viewer.prototype.clearLabels = function (group) { this.labels = this.labels.filter(L => { if (L.group === group) { L.el.remove(); return false } return true }) };
  /* crystal from planes */
  Viewer.prototype.setCrystal = function (planes, opt) {
    opt = opt || {}; clear(this.faces); clear(this.edges); this.clearLabels('face'); this.faceMeshes = []; this.sel = null;
    const H = hull(planes); this.H = H; const em = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .4, metalness: .1, transparent: true, opacity: .95 });
    let ext = 0; H.V.forEach(p => ext = Math.max(ext, p.length())); this.ext = ext;
    const colors = opt.formColors || null;
    H.F.forEach((f, i) => {
      const pos = []; for (let k = 1; k < f.idx.length - 1; k++) [f.idx[0], f.idx[k], f.idx[k + 1]].forEach(j => pos.push(H.V[j].x, H.V[j].y, H.V[j].z));
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
      const col = colors && f.plane.form && colors[f.plane.form] != null ? colors[f.plane.form] : (opt.color != null ? opt.color : this.color);
      const m = mat(col, this.st.solid ? this.op : .04); const me = new T.Mesh(g, m); me.userData = { f, base: col, i }; this.faces.add(me); this.faceMeshes.push(me);
      if (f.plane.label) { const lp = f.c.clone().add(f.plane.n.clone().multiplyScalar(.04 * ext)); this.label(lp, f.plane.label, 'face', 'face') }
    });
    const seen = new Set(), rr = opt.edge || .012 * ext;
    H.F.forEach(f => f.idx.forEach((a, k) => { const b = f.idx[(k + 1) % f.idx.length]; const key = Math.min(a, b) + '-' + Math.max(a, b); if (seen.has(key)) return; seen.add(key); const r = rod(H.V[a], H.V[b], rr, em); if (r) this.edges.add(r) }));
    if (opt.r) this.r = this.r0 = opt.r; else if (!opt.keepCam) { this.r = this.r0 = ext * (this.o.fit || 4.2) }
    this.apply(); return H;
  };
  Viewer.prototype.setAxes = function (axes, opt) {
    opt = opt || {}; clear(this.axes); this.clearLabels('axis');
    axes.forEach(a => {
      const m = new T.MeshBasicMaterial({ color: a.color || 0xf3c969, transparent: true, opacity: .95 });
      const dir = a.v.clone(), L = dir.length(), u = dir.clone().normalize(), rr = opt.r || .018 * (this.ext || 1.5);
      const p0 = a.from ? a.from.clone() : u.clone().multiplyScalar(-L), p1 = (a.from ? a.from.clone() : v3()).add(u.clone().multiplyScalar(L));
      const r1 = rod(p0, p1, rr, m); if (r1) this.axes.add(r1);
      this.axes.add(cone(p1, u, rr * 3.2, rr * 9, m));
      this.label(p1.clone().add(u.clone().multiplyScalar(rr * 16)), a.label, 'axis', 'axis');
    });
    this.apply();
  };
  Viewer.prototype.arc = function (o, u, w, rad, text, color) {
    const m = new T.LineBasicMaterial({ color: color || 0xf3c969 }), pts = [], a = u.clone().normalize(), b = w.clone().normalize(), ang = a.angleTo(b);
    for (let k = 0; k <= 24; k++) { const t = k / 24; const p = new T.Vector3().copy(a).multiplyScalar(Math.sin((1 - t) * ang)).add(b.clone().multiplyScalar(Math.sin(t * ang))).divideScalar(Math.sin(ang) || 1).multiplyScalar(rad).add(o); pts.push(p) }
    const L = new T.Line(new T.BufferGeometry().setFromPoints(pts), m); this.axes.add(L);
    const mid = a.clone().add(b).normalize().multiplyScalar(rad * 1.35).add(o); this.label(mid, text, 'ang', 'axis');
  };
  /* unit cell: three basis vectors, drawn centred (or from origin) */
  Viewer.prototype.setCell = function (Bs, opt) {
    opt = opt || {}; const g = opt.group || this.cell; clear(g); this.clearLabels(opt.lgroup || 'cell');
    const [A, B, C] = Bs, O = opt.origin ? opt.origin.clone() : A.clone().add(B).add(C).multiplyScalar(-.5);
    const P = []; for (let i = 0; i < 8; i++) P.push(O.clone().add(A.clone().multiplyScalar(i & 1)).add(B.clone().multiplyScalar(i >> 1 & 1)).add(C.clone().multiplyScalar(i >> 2 & 1)));
    const em = new T.MeshStandardMaterial({ color: opt.color || 0xbfe9ff, roughness: .4, metalness: .1 });
    const s = Math.max(A.length(), B.length(), C.length()), rr = opt.r || .012 * s;
    [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => { const r = rod(P[e[0]], P[e[1]], rr, em); if (r) g.add(r) });
    if (opt.points !== false) { const sg = new T.SphereGeometry(rr * 3.2, 16, 12), sm = new T.MeshStandardMaterial({ color: opt.pcolor || 0xf3c969, roughness: .3, metalness: .2 }); P.forEach(p => { const m = new T.Mesh(sg, sm); m.position.copy(p); g.add(m) }) }
    if (opt.fill) { const fm = mat(opt.fill, .14); [[0, 1, 3, 2], [4, 5, 7, 6], [0, 1, 5, 4], [2, 3, 7, 6], [0, 2, 6, 4], [1, 3, 7, 5]].forEach(q => { const gg = new T.BufferGeometry().setFromPoints([P[q[0]], P[q[1]], P[q[2]], P[q[0]], P[q[2]], P[q[3]]]); gg.computeVertexNormals(); g.add(new T.Mesh(gg, fm)) }) }
    if (opt.axes) {
      const ac = 0xf3c969; [[A, 'a'], [B, 'b'], [C, 'c']].forEach(([v, n], i) => {
        const m = new T.MeshBasicMaterial({ color: [0xff8f7a, 0x8fe39a, 0x8fc7ff][i] }); const u = v.clone().normalize(), L = v.length() * 1.28;
        const r1 = rod(O, O.clone().add(u.clone().multiplyScalar(L)), rr * 1.3, m); if (r1) g.add(r1); g.add(cone(O.clone().add(u.clone().multiplyScalar(L)), u, rr * 4, rr * 11, m));
        this.label(O.clone().add(u.clone().multiplyScalar(L + rr * 18)), opt.names ? opt.names[i] : n, 'axis ax' + n, opt.lgroup || 'cell');
      });
      if (opt.angles) {
        const add = (u, w, t) => { const pts = [], a = u.clone().normalize(), b = w.clone().normalize(), ang = a.angleTo(b), rad = s * .3; for (let k = 0; k <= 24; k++) { const tt = k / 24; pts.push(a.clone().multiplyScalar(Math.sin((1 - tt) * ang)).add(b.clone().multiplyScalar(Math.sin(tt * ang))).divideScalar(Math.sin(ang)).multiplyScalar(rad).add(O)) } g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: ac }))); this.label(a.clone().add(b).normalize().multiplyScalar(rad * 1.45).add(O), t, 'ang', opt.lgroup || 'cell') };
        add(B, C, opt.angles[0]); add(A, C, opt.angles[1]); add(A, B, opt.angles[2]);
      }
    }
    if (!opt.keepCam && opt.fitCam) { this.ext = s; this.r = this.r0 = s * (this.o.fit || 4.2) }
    this.apply(); return P;
  };
  Viewer.prototype.apply = function () {
    this.axes.visible = this.st.axes; this.edges.visible = this.st.edges; this.cell.visible = this.st.cell || !!this.o.cellAlways;
    this.faceMeshes.forEach(m => { m.material.opacity = this.st.solid ? this.op : .035 });
    this.labels.forEach(L => { L.hide = (L.group === 'face' && !this.st.labels) || (L.group === 'axis' && !this.st.axes) || ((L.group === 'cell') && !(this.st.cell || this.o.cellAlways)) });
    if (this.tb) this.tb.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', !!this.st[b.dataset.t]));
  };
  Viewer.prototype.view = function (name) { const vd = VIEWDEF[name]; if (!vd) return; let th = vd[0] * D2R; while (th - this.th > Math.PI) th -= 2 * Math.PI; while (this.th - th > Math.PI) th += 2 * Math.PI; this.st.auto = false; this.tw = { t0: performance.now(), a: [this.th, this.ph, this.r, this.tg.clone()], b: [th, vd[1] * D2R, this.r0, v3()] }; this.apply() };
  Viewer.prototype.reset = function () { this.view(this.o.view || 'std') };
  Viewer.prototype.toolbar = function (tools) {
    const tb = document.createElement('div'); tb.className = 'cx-tb'; this.tb = tb; const V = this;
    const B = (txt, title, fn, t) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = txt; b.title = title; if (t) b.dataset.t = t; b.onclick = e => { e.stopPropagation(); fn(b) }; tb.appendChild(b); return b };
    const sep = () => { const s = document.createElement('i'); tb.appendChild(s) };
    if (tools.includes('views')) { [['F', 'front', 'Front view (a towards you)'], ['B', 'back', 'Back view'], ['L', 'left', 'Left view'], ['R', 'right', 'Right view'], ['T', 'top', 'Top view (down the c axis)'], ['Bo', 'bottom', 'Bottom view'], ['Iso', 'iso', 'Isometric view']].forEach(v => B(v[0], v[2], () => V.view(v[1]))); sep() }
    const tog = (k, txt, title) => B(txt, title, () => { V.st[k] = !V.st[k]; if (k === 'inspect' && !V.st.inspect) V.pick(null); V.apply(); V.onToggle && V.onToggle(k, V.st[k]) }, k);
    if (tools.includes('auto')) tog('auto', '⟳ Spin', 'Auto-rotate');
    if (tools.includes('axes')) tog('axes', 'Axes', 'Show the crystallographic axes');
    if (tools.includes('labels')) tog('labels', 'Labels', 'Show face labels (Miller indices)');
    if (tools.includes('edges')) tog('edges', 'Edges', 'Show edges');
    if (tools.includes('wire')) B('Wire', 'Transparent solid / wireframe', () => { V.st.solid = !V.st.solid; V.apply(); this.tb.querySelector('[data-w]').classList.toggle('on', !V.st.solid) }).dataset.w = 1;
    if (tools.includes('cell')) tog('cell', 'Unit cell', 'Show the unit cell inside the crystal');
    if (tools.includes('inspect')) tog('inspect', '◎ Inspect', 'Click a face to inspect it');
    if (tools.includes('reset')) B('↺', 'Reset camera', () => V.reset());
    this.el.appendChild(tb); this.apply();
  };
  Viewer.prototype.pick = function (me) {
    if (this.sel) { this.sel.material.color.set(this.sel.userData.base); this.sel.material.emissive.set(new T.Color(this.sel.userData.base).multiplyScalar(.18)); this.sel.material.opacity = this.st.solid ? this.op : .035 }
    this.sel = me;
    if (me) { me.material.color.set(0xffd27a); me.material.emissive.set(0x6b4a10); me.material.opacity = .85 }
    this.onPick && this.onPick(me ? me.userData.f : null);
  };
  Viewer.prototype.bindInput = function () {
    const V = this, cv = this.cv, P = new Map(); let down = null, moved = 0, pinch = 0;
    const loc = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] };
    cv.addEventListener('pointerdown', e => { e.stopPropagation(); cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); down = { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey }; moved = 0; V.st.auto = false; V.tw = null; V.apply(); if (P.size === 2) { const [a, b] = [...P.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]) } });
    cv.addEventListener('pointermove', e => {
      if (!P.has(e.pointerId)) { if (V.st.inspect) V.hover(loc(e)); return }
      const p = P.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; P.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(dx) + Math.abs(dy);
      if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) V.r = Math.max(V.r0 * .35, Math.min(V.r0 * 3, V.r * pinch / d)); pinch = d; return }
      if (down && (down.b === 2 || down.sh)) { const s = V.r * .0016, right = v3(-Math.sin(V.th), Math.cos(V.th), 0); V.tg.add(right.multiplyScalar(-dx * s)).add(v3(0, 0, dy * s)); return }
      V.th -= dx * .0085; V.ph = Math.max(-89.4 * D2R, Math.min(89.4 * D2R, V.ph + dy * .0085));
    });
    const up = e => { if (!P.has(e.pointerId)) return; P.delete(e.pointerId); if (P.size < 2) pinch = 0; if (moved < 5 && V.st.inspect && down) V.click(loc(e)); down = null };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); V.r = Math.max(V.r0 * .35, Math.min(V.r0 * 3, V.r * Math.exp(e.deltaY * .0012))) }, { passive: false });
    cv.addEventListener('click', e => e.stopPropagation());
    this.el.addEventListener('click', e => e.stopPropagation());
  };
  const RC = new T.Raycaster();
  Viewer.prototype.ray = function (l) { RC.setFromCamera(new T.Vector2(l[0] * 2 - 1, -(l[1] * 2 - 1)), this.cam); const h = RC.intersectObjects(this.faceMeshes, false); return h.length ? h[0].object : null };
  Viewer.prototype.click = function (l) { const m = this.ray(l); this.pick(m && m !== this.sel ? m : null) };
  Viewer.prototype.hover = function (l) { this.cv.style.cursor = this.ray(l) ? 'pointer' : 'grab' };
  Viewer.prototype.frame = function (now) {
    const el = this.el, w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    if (this.cv.width !== Math.round(w * PR) || this.cv.height !== Math.round(h * PR)) { this.cv.width = Math.round(w * PR); this.cv.height = Math.round(h * PR) }
    if (this.tw) { const t = Math.min(1, (now - this.tw.t0) / 750), k = ease(t), a = this.tw.a, b = this.tw.b; this.th = a[0] + (b[0] - a[0]) * k; this.ph = a[1] + (b[1] - a[1]) * k; this.r = a[2] + (b[2] - a[2]) * k; this.tg.copy(a[3]).lerp(b[3], k); if (t >= 1) this.tw = null }
    else if (this.st.auto) this.th += (this.o.spin || .0035);
    if (this.onFrame) this.onFrame(now);
    const c = this.cam; c.aspect = w / h; c.updateProjectionMatrix();
    c.position.set(this.tg.x + this.r * Math.cos(this.ph) * Math.cos(this.th), this.tg.y + this.r * Math.cos(this.ph) * Math.sin(this.th), this.tg.z + this.r * Math.sin(this.ph)); c.lookAt(this.tg);
    ensureR(w, h); R.setScissorTest(false); R.setViewport(0, 0, w, h); R.clear(); R.render(this.scene, c);
    this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); this.ctx.drawImage(R.domElement, 0, (RH - h) * PR, w * PR, h * PR, 0, 0, this.cv.width, this.cv.height);
    const p = v3(), M = this.root.matrixWorld;
    this.labels.forEach(L => { if (L.hide || (L.vis === false)) { L.el.style.display = 'none'; return } p.copy(L.pos).applyMatrix4(M).project(c); if (p.z > 1) { L.el.style.display = 'none'; return } L.el.style.display = ''; L.el.style.transform = `translate(${((p.x + 1) / 2 * w).toFixed(1)}px,${((1 - p.y) / 2 * h).toFixed(1)}px) translate(-50%,-50%)` });
  };
  let running = false;
  function start() { if (running) return; running = true; requestAnimationFrame(loop) }
  const ALL = /[?&]all/.test(location.search);
  function loop(now) {
    VIEWS.forEach(v => { const sc = v.el.closest('.scene'); if (sc && !sc.classList.contains('active')) return; if (v.el.offsetParent === null) return; try { v.frame(now) } catch (e) { console.error(e) } });
    requestAnimationFrame(loop);
  }

  /* ---------- crystal library (idealised forms; schematic proportions noted) ---------- */
  const HEX = (ca) => basis(1, 1, ca, 90, 90, 120);
  const L = {};
  L.cubic = () => basis(1, 1, 1, 90, 90, 90);
  const lbl = (Bs, four) => n => millerOf(n, Bs, four);
  function planes(list, Bs, four) { const out = []; list.forEach(f => family(f.hkl, f.d, Bs, f.ops, { form: f.form }).forEach(p => { p.label = millerOf(p.n, Bs, four); out.push(p) })); return out }
  const CUB = { };
  function cubicForm(sets) { // sets: [[h,k,l,d,formName]]
    const out = []; sets.forEach(s => cubicSet(s[0], s[1], s[2]).forEach(q => { const n = v3(q[0], q[1], q[2]).normalize(); out.push({ n, d: s[3], form: s[4], label: millerOf(n, L.cubic(), false) }) })); return out;
  }
  const FORMS = {
    cube: () => cubicForm([[1, 0, 0, 1, 'Cube {100}']]),
    octahedron: () => cubicForm([[1, 1, 1, 1, 'Octahedron {111}']]),
    dodecahedron: () => cubicForm([[1, 1, 0, 1, 'Dodecahedron {110}']]),
    trapezohedron: () => cubicForm([[2, 1, 1, 1, 'Trapezohedron {211}']]),
    cubocta: () => cubicForm([[1, 0, 0, 1, 'Cube {100}'], [1, 1, 1, 1.32, 'Octahedron {111}']]),
    garnetCombo: () => cubicForm([[1, 1, 0, 1, 'Dodecahedron {110}'], [2, 1, 1, 1.04, 'Trapezohedron {211}']]),
    // tetragonal (zircon c/a = 0.905)
    zircon: () => { const Bs = basis(1, 1, .905, 90, 90, 90); return planes([{ hkl: [1, 0, 0], d: .55, ops: { rot: 4 }, form: 'Prism {100}' }, { hkl: [1, 0, 1], d: .9, ops: { rot: 4, mz: true }, form: 'Bipyramid {101}' }], Bs) },
    tetraPrism: () => { const Bs = basis(1, 1, 1.6, 90, 90, 90); return planes([{ hkl: [1, 0, 0], d: .55, ops: { rot: 4 }, form: 'Prism {100}' }, { hkl: [0, 0, 1], d: 1, ops: { mz: true }, form: 'Pinacoid {001}' }], Bs) },
    tetraBipyr: () => { const Bs = basis(1, 1, 1.4, 90, 90, 90); return planes([{ hkl: [1, 0, 1], d: .8, ops: { rot: 4, mz: true }, form: 'Bipyramid {101}' }], Bs) },
    // orthorhombic topaz (a:b:c = 0.528:1:0.954)
    topaz: () => { const Bs = basis(.528, 1, .954, 90, 90, 90); return planes([{ hkl: [1, 1, 0], d: .42, ops: { mx: true, my: true }, form: 'Prism {110}' }, { hkl: [1, 2, 0], d: .46, ops: { mx: true, my: true }, form: 'Prism {120}' }, { hkl: [0, 2, 1], d: .95, ops: { my: true, mz: true }, form: 'Dome {021}' }, { hkl: [1, 1, 1], d: .92, ops: { mx: true, my: true, mz: true }, form: 'Bipyramid {111}' }, { hkl: [0, 0, 1], d: 1.18, ops: { mz: true }, form: 'Pinacoid {001}' }], Bs) },
    orthoBox: () => { const Bs = basis(.7, 1, 1.4, 90, 90, 90); return planes([{ hkl: [1, 0, 0], d: .5, ops: { mx: true }, form: 'Pinacoid {100}' }, { hkl: [0, 1, 0], d: .72, ops: { my: true }, form: 'Pinacoid {010}' }, { hkl: [0, 0, 1], d: 1, ops: { mz: true }, form: 'Pinacoid {001}' }], Bs) },
    orthoBipyr: () => { const Bs = basis(.7, 1, 1.4, 90, 90, 90); return planes([{ hkl: [1, 1, 1], d: .6, ops: { mx: true, my: true, mz: true }, form: 'Rhombic bipyramid {111}' }], Bs) },
    // hexagonal beryl (c/a 0.997)
    beryl: () => { const Bs = HEX(.997); return planes([{ hkl: [1, 0, -1, 0], d: .55, ops: { rot: 6 }, form: 'Hexagonal prism {10̄10}' }, { hkl: [0, 0, 0, 1], d: 1.35, ops: { mz: true }, form: 'Pinacoid {0001}' }], Bs, true) },
    berylTerm: () => { const Bs = HEX(.997); return planes([{ hkl: [1, 0, -1, 0], d: .55, ops: { rot: 6 }, form: 'Hexagonal prism {10̄10}' }, { hkl: [0, 0, 0, 1], d: 1.25, ops: { mz: true }, form: 'Pinacoid {0001}' }, { hkl: [1, 0, -1, 1], d: 1.05, ops: { rot: 6, mz: true }, form: 'Hexagonal bipyramid {10̄11}' }], Bs, true) },
    berylTab: () => { const Bs = HEX(.997); return planes([{ hkl: [1, 0, -1, 0], d: .9, ops: { rot: 6 }, form: 'Hexagonal prism {10̄10}' }, { hkl: [0, 0, 0, 1], d: .32, ops: { mz: true }, form: 'Pinacoid {0001}' }], Bs, true) },
    hexBipyr: () => { const Bs = HEX(1.6); return planes([{ hkl: [1, 0, -1, 1], d: .8, ops: { rot: 6, mz: true }, form: 'Hexagonal bipyramid {10̄11}' }], Bs, true) },
    // trigonal: corundum c/a 2.73, quartz 1.10
    rhomb: () => { const Bs = HEX(2.73); return planes([{ hkl: [1, 0, -1, 1], d: .8, ops: { rot: 3, inv: true }, form: 'Rhombohedron {10̄11}' }], Bs, true) },
    sapphire: () => { const Bs = HEX(2.73); return planes([{ hkl: [2, 2, -4, 3], d: .8, ops: { rot: 6, mz: true }, form: 'Hexagonal dipyramid {22̄43}' }, { hkl: [0, 0, 0, 1], d: 1.25, ops: { mz: true }, form: 'Pinacoid {0001}' }], Bs, true) },
    ruby: () => { const Bs = HEX(2.73); return planes([{ hkl: [1, 1, -2, 0], d: .9, ops: { rot: 6 }, form: 'Hexagonal prism {11̄20}' }, { hkl: [0, 0, 0, 1], d: .55, ops: { mz: true }, form: 'Pinacoid {0001}' }, { hkl: [1, 0, -1, 1], d: 1.0, ops: { rot: 3, inv: true }, form: 'Rhombohedron {10̄11}' }], Bs, true) },
    quartz: () => { const Bs = HEX(1.1); return planes([{ hkl: [1, 0, -1, 0], d: .5, ops: { rot: 6 }, form: 'Prism m {10̄10}' }, { hkl: [1, 0, -1, 1], d: 1.25, ops: { rot: 3, inv: true }, form: 'Positive rhombohedron r {10̄11}' }, { hkl: [0, 1, -1, 1], d: 1.25, ops: { rot: 3, inv: true }, form: 'Negative rhombohedron z {01̄11}' }], Bs, true) },
    quartzBig: () => { const Bs = HEX(1.1); return planes([{ hkl: [1, 0, -1, 0], d: .5, ops: { rot: 6 }, form: 'Prism m {10̄10}' }, { hkl: [1, 0, -1, 1], d: 1.18, ops: { rot: 3, inv: true }, form: 'Positive rhombohedron r {10̄11}' }, { hkl: [0, 1, -1, 1], d: 1.32, ops: { rot: 3, inv: true }, form: 'Negative rhombohedron z {01̄11}' }], Bs, true) },
    quartzBipyr: () => { const Bs = HEX(1.1); return planes([{ hkl: [1, 0, -1, 1], d: .8, ops: { rot: 3, inv: true }, form: 'Positive rhombohedron r {10̄11}' }, { hkl: [0, 1, -1, 1], d: .8, ops: { rot: 3, inv: true }, form: 'Negative rhombohedron z {01̄11}' }], Bs, true) },
    tourmaline: () => { const Bs = HEX(.45); return planes([{ hkl: [1, 0, -1, 0], d: .42, ops: { rot: 3 }, form: 'Trigonal prism {10̄10}' }, { hkl: [1, 1, -2, 0], d: .6, ops: { rot: 6 }, form: 'Hexagonal prism {11̄20}' }, { hkl: [1, 0, -1, 1], d: .66, ops: { rot: 3 }, form: 'Trigonal pyramid {10̄11}' }, { hkl: [0, 0, 0, -1], d: .9, ops: {}, form: 'Pedion {000̄1}' }, { hkl: [-1, 0, 1, -2], d: .9, ops: { rot: 3 }, form: 'Trigonal pyramid {̄1012̄}' }], Bs, true) },
    // monoclinic (pyroxene-like, beta = 106 deg, schematic)
    mono: () => { const Bs = basis(.95, .88, .52, 90, 106, 90); return planes([{ hkl: [1, 1, 0], d: .5, ops: { c2y: true, my: true, inv: true }, form: 'Prism {110}' }, { hkl: [1, 0, 0], d: .5, ops: { inv: true }, form: 'Pinacoid {100}' }, { hkl: [0, 1, 0], d: .5, ops: { inv: true }, form: 'Pinacoid {010}' }, { hkl: [0, 0, 1], d: 1.2, ops: { inv: true }, form: 'Pinacoid {001}' }, { hkl: [-1, 1, 1], d: 1.18, ops: { my: true, inv: true }, form: 'Prism {̄111}' }], Bs) },
    monoBox: () => { const Bs = basis(.95, .88, .52, 90, 106, 90); return planes([{ hkl: [1, 0, 0], d: .5, ops: { inv: true }, form: 'Pinacoid {100}' }, { hkl: [0, 1, 0], d: .62, ops: { inv: true }, form: 'Pinacoid {010}' }, { hkl: [0, 0, 1], d: .85, ops: { inv: true }, form: 'Pinacoid {001}' }], Bs) },
    triBox: () => { const Bs = basis(.7, .78, .56, 83, 101, 106); return planes([{ hkl: [1, 0, 0], d: .45, ops: { inv: true }, form: 'Pinacoid {100}' }, { hkl: [0, 1, 0], d: .55, ops: { inv: true }, form: 'Pinacoid {010}' }, { hkl: [0, 0, 1], d: .8, ops: { inv: true }, form: 'Pinacoid {001}' }], Bs) },
    // triclinic (schematic kyanite-like blade)
    tri: () => { const Bs = basis(.7, .78, .56, 83, 101, 106); return planes([{ hkl: [1, 0, 0], d: .25, ops: { inv: true }, form: 'Pinacoid {100}' }, { hkl: [0, 1, 0], d: .45, ops: { inv: true }, form: 'Pinacoid {010}' }, { hkl: [1, 1, 0], d: .42, ops: { inv: true }, form: 'Pinacoid {110}' }, { hkl: [0, 0, 1], d: 1.2, ops: { inv: true }, form: 'Pinacoid {001}' }, { hkl: [1, -1, 0], d: .38, ops: { inv: true }, form: 'Pinacoid {1̄10}' }], Bs) }
  };
  const BASES = { cubic: () => basis(1, 1, 1, 90, 90, 90), zircon: () => basis(1, 1, .905, 90, 90, 90), tetraPrism: () => basis(1, 1, 1.6, 90, 90, 90), tetraBipyr: () => basis(1, 1, 1.4, 90, 90, 90), topaz: () => basis(.528, 1, .954, 90, 90, 90), orthoBox: () => basis(.7, 1, 1.4, 90, 90, 90), orthoBipyr: () => basis(.7, 1, 1.4, 90, 90, 90), beryl: () => HEX(.997), berylTerm: () => HEX(.997), berylTab: () => HEX(.997), hexBipyr: () => HEX(1.6), rhomb: () => HEX(2.73), sapphire: () => HEX(2.73), ruby: () => HEX(2.73), quartz: () => HEX(1.1), quartzBig: () => HEX(1.1), quartzBipyr: () => HEX(1.1), tourmaline: () => HEX(.45), mono: () => basis(.95, .88, .52, 90, 106, 90), monoBox: () => basis(.95, .88, .52, 90, 106, 90), triBox: () => basis(.7, .78, .56, 83, 101, 106), tri: () => basis(.7, .78, .56, 83, 101, 106) };
  ['cube', 'octahedron', 'dodecahedron', 'trapezohedron', 'cubocta', 'garnetCombo'].forEach(k => BASES[k] = BASES.cubic);
  function crystalAxes(key, ext, four) {
    const Bs = BASES[key](); const len = Bs.map(b => b.length()), mx = Math.max(...len), s = ext * 1.18;
    if (four) { const a1 = Bs[0].clone().normalize(), a2 = Bs[1].clone().normalize(), a3 = a1.clone().add(a2).negate().normalize(); return [{ v: a1.multiplyScalar(ext * .95), label: 'a₁', color: 0xff8f7a }, { v: a2.multiplyScalar(ext * .95), label: 'a₂', color: 0xff8f7a }, { v: a3.multiplyScalar(ext * .95), label: 'a₃', color: 0xff8f7a }, { v: v3(0, 0, 1).multiplyScalar(s), label: 'c', color: 0x8fc7ff }] }
    return Bs.map((b, i) => ({ v: b.clone().normalize().multiplyScalar(s * Math.max(.6, len[i] / mx)), label: 'abc'[i], color: [0xff8f7a, 0x8fe39a, 0x8fc7ff][i] }));
  }
  return { T, Viewer, basis, recip, normal, gen, hull, family, cubicSet, millerOf, FORMS, BASES, crystalAxes, HEX, v3, D2R, RM, VIEWS };
})();

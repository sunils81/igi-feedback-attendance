"""Blender renders for the IGI Team Training (Diamonds 101) decks. 2026-11-18, per Sunil.

    pip install bpy            # Blender as a Python module (5.x); or run inside Blender:
    python3 render_models.py OUTDIR [name ...]          # all renders, or just the named ones
    blender -b -P render_models.py -- OUTDIR [name ...]

Everything is built procedurally (no .blend files): a round brilliant with real proportions,
look-alikes (cubic zirconia, moissanite), D-to-J colour tints, three cut depths for the light
demo, rough crystals (natural octahedron, HPHT cubo-octahedron, CVD tablet), and ball-and-stick
models of diamond and graphite. Output: transparent PNGs, copied into each deck's media-src/.
"""
import math, os, sys
import bpy, bmesh
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
OUT = os.path.abspath(argv[0] if argv else 'renders')
ONLY = set(argv[1:])
os.makedirs(OUT, exist_ok=True)


# ---------------------------------------------------------------- scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 96
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 24
    sc.cycles.transmission_bounces = 24
    sc.cycles.glossy_bounces = 16
    sc.cycles.transparent_max_bounces = 16
    sc.cycles.caustics_reflective = True
    sc.cycles.caustics_refractive = True
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = float(os.environ.get('TT_EXP', '-0.4'))
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.015, 0.018, 0.03, 1); bg.inputs[1].default_value = 1
    return sc


def emissive(name, strength, color=(1, 1, 1, 1)):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = color; e.inputs[1].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs[0])
    return m


def black(name='black'):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value = (0.005, 0.005, 0.008, 1); p.inputs['Roughness'].default_value = 0.6
    return m


def studio(center=Vector((0, 0, 0)), radius=7.0, panels=16, cam_dir=Vector((0, 0, 1))):
    """A ring of alternating light / dark panels around the stone (like a jeweller's light box),
    plus a big soft light above. Gives the bright-and-dark pattern you see in a real diamond."""
    white, blk = emissive('panel', float(os.environ.get('TT_PANEL', '3.0'))), black()
    for i in range(panels):
        a = 2 * math.pi * i / panels
        for ring, (elev, h) in enumerate(((math.radians(55), 2.2), (math.radians(20), 2.6))):
            d = Vector((math.cos(a) * math.cos(elev), math.sin(a) * math.cos(elev), math.sin(elev)))
            bpy.ops.mesh.primitive_plane_add(size=1, location=center + d * radius)
            p = bpy.context.object; p.scale = (2 * math.pi * radius * math.cos(elev) / panels * .92, h, 1)
            p.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
            p.data.materials.append(white if (ring == 0 or i % 2 == 0) else blk)
            p.visible_camera = False
    # a black floor (what light sees when it leaks out of the pavilion) and a dark disc where the viewer's head is
    bpy.ops.mesh.primitive_plane_add(size=40, location=center + Vector((0, 0, -3))); f = bpy.context.object; f.data.materials.append(blk); f.visible_camera = False
    bpy.ops.mesh.primitive_circle_add(radius=0.7, fill_type='NGON', location=center + Vector((0, 0, 6.5))); hd = bpy.context.object; hd.data.materials.append(blk); hd.visible_camera = False
    bpy.ops.object.light_add(type='AREA', location=center + Vector((0, 0, 9)))
    l = bpy.context.object; l.data.size = 5; l.data.energy = float(os.environ.get('TT_TOP', '150'))
    bpy.ops.object.light_add(type='AREA', location=center + Vector((-5, -6, 4)))
    l = bpy.context.object; l.data.size = 3; l.data.energy = float(os.environ.get('TT_SIDE', '60')); l.rotation_euler = (math.radians(60), 0, math.radians(-40))


def camera(loc, target=Vector((0, 0, 0)), lens=85, ortho=None):
    bpy.ops.object.camera_add(location=loc)
    c = bpy.context.object; c.data.lens = lens
    if ortho:
        c.data.type = 'ORTHO'; c.data.ortho_scale = ortho
    c.rotation_euler = (target - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = c
    return c


def render(name, w=900, h=900, samples=None):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    if samples: sc.cycles.samples = int(os.environ.get('TT_SAMPLES', samples))
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    print('rendered', name, flush=True)


# ---------------------------------------------------------------- materials
def gem(name, ior=2.417, tint=(1, 1, 1), absorb=0.0, dispersion=0.35, rough=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*tint, 1)
    p.inputs['Transmission Weight'].default_value = 1.0
    p.inputs['IOR'].default_value = ior
    p.inputs['Roughness'].default_value = rough
    if 'Dispersion' in p.inputs: p.inputs['Dispersion'].default_value = dispersion
    if absorb > 0:  # body colour that deepens with path length (like nitrogen yellow)
        va = nt.nodes.new('ShaderNodeVolumeAbsorption'); va.inputs['Color'].default_value = (*tint, 1); va.inputs['Density'].default_value = absorb
        nt.links.new(va.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    return m


def frosted(name, tint, rough=0.35, absorb=0.4):
    return gem(name, tint=tint, absorb=absorb, dispersion=0.0, rough=rough)


# ---------------------------------------------------------------- geometry
def brilliant(name, pav=0.43, crown=0.155, table=0.56, girdle=0.03):
    """Round brilliant, diameter 2 (all proportions as % of diameter, as on a report)."""
    D = 2.0
    hc, hp, hg, rt = crown * D, pav * D, girdle * D, table * D / 2
    V, F = [], []
    def add(p): V.append(p); return len(V) - 1
    T = [add((rt * math.cos(math.radians(45 * i + 22.5)), rt * math.sin(math.radians(45 * i + 22.5)), hg / 2 + hc)) for i in range(8)]
    Gt = [add((math.cos(math.radians(22.5 * j)), math.sin(math.radians(22.5 * j)), hg / 2)) for j in range(16)]
    # 32-point girdle for a rounder outline
    Gt2 = [add((math.cos(math.radians(11.25 * j)), math.sin(math.radians(11.25 * j)), hg / 2)) for j in range(32)]
    Gb2 = [add((math.cos(math.radians(11.25 * j)), math.sin(math.radians(11.25 * j)), -hg / 2)) for j in range(32)]
    rl = 0.22
    L = [add((rl * math.cos(math.radians(45 * i)), rl * math.sin(math.radians(45 * i)), -hg / 2 - hp * 0.80)) for i in range(8)]
    C = add((0, 0, -hg / 2 - hp))
    F.append(list(reversed(T)))  # table (normal up after reversal handled by recalc)
    # crown: table octagon -> 32-gon girdle via star / bezel / upper-girdle style fans
    for i in range(8):
        t0, t1 = T[i], T[(i + 1) % 8]
        g = [Gt2[(4 * i + 2 + k) % 32] for k in range(5)]  # 5 girdle points under this table edge
        F.append([t0, g[0], g[1]]); F.append([t0, g[1], g[2]]); F.append([t0, g[2], t1])
        F.append([t1, g[2], g[3]]); F.append([t1, g[3], g[4]])
    # girdle band
    for j in range(32):
        F.append([Gt2[j], Gt2[(j + 1) % 32], Gb2[(j + 1) % 32], Gb2[j]])
    # pavilion: girdle -> 8 lower points -> culet
    for i in range(8):
        l0, l1 = L[i], L[(i + 1) % 8]
        g = [Gb2[(4 * i + k) % 32] for k in range(5)]
        F.append([l0, g[1], g[0]]); F.append([l0, g[2], g[1]]); F.append([l0, l1, g[2]])
        F.append([l1, g[3], g[2]]); F.append([l1, g[4], g[3]])
        F.append([l0, C, l1])
    me = bpy.data.meshes.new(name); me.from_pydata(V, [], F)
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    return ob


def octahedron(name, r=1.0, round_=0.0):
    bm = bmesh.new()
    pts = [(r, 0, 0), (-r, 0, 0), (0, r, 0), (0, -r, 0), (0, 0, r), (0, 0, -r)]
    vs = [bm.verts.new(p) for p in pts]
    for a in (0, 1):
        for b in (2, 3):
            for c in (4, 5):
                bm.faces.new((vs[a], vs[b], vs[c]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    if round_:
        mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = round_; mod.segments = 3
    return ob


def cubo_octahedron(name, r=0.72):
    """Truncated cube faces + octahedral corners: the classic HPHT growth habit."""
    bpy.ops.mesh.primitive_cube_add(size=2 * r)
    ob = bpy.context.object; ob.name = name
    mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = 0.42 * r; mod.segments = 1; mod.affect = 'VERTICES'
    return ob


def tablet(name, w=1.8, t=0.42):
    bpy.ops.mesh.primitive_cube_add(size=1)
    ob = bpy.context.object; ob.name = name; ob.scale = (w, w, t)
    bpy.ops.object.transform_apply(scale=True)
    mod = ob.modifiers.new('bev', 'BEVEL'); mod.width = 0.06; mod.segments = 2
    # rough polycrystalline rim
    tex = bpy.data.textures.new('n', 'CLOUDS'); tex.noise_scale = 0.12
    d = ob.modifiers.new('disp', 'DISPLACE'); d.texture = tex; d.strength = 0.03
    s = ob.modifiers.new('sub', 'SUBSURF'); s.levels = 2; s.render_levels = 2
    ob.modifiers.move(2, 1)
    return ob


def ball_stick(name, atoms, bonds, r_atom=0.16, r_bond=0.05):
    ma = bpy.data.materials.new('atom'); ma.use_nodes = True
    pa = ma.node_tree.nodes['Principled BSDF']; pa.inputs['Base Color'].default_value = (0.03, 0.05, 0.12, 1); pa.inputs['Roughness'].default_value = 0.25
    pa.inputs['Coat Weight'].default_value = 1.0
    mb = bpy.data.materials.new('bond'); mb.use_nodes = True
    pb = mb.node_tree.nodes['Principled BSDF']; pb.inputs['Base Color'].default_value = (0.84, 0.66, 0.32, 1); pb.inputs['Metallic'].default_value = 1.0; pb.inputs['Roughness'].default_value = 0.3
    for p in atoms:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=r_atom, location=p, segments=24, ring_count=16)
        o = bpy.context.object; o.data.materials.append(ma); bpy.ops.object.shade_smooth()
    for a, b in bonds:
        a, b = Vector(a), Vector(b); d = b - a
        bpy.ops.mesh.primitive_cylinder_add(radius=r_bond, depth=d.length, location=(a + b) / 2, vertices=16)
        o = bpy.context.object; o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); o.data.materials.append(mb); bpy.ops.object.shade_smooth()


def simple_lights():
    bpy.ops.object.light_add(type='AREA', location=(4, -4, 6)); l = bpy.context.object; l.data.size = 6; l.data.energy = 1500
    l.rotation_euler = (Vector((0, 0, 0)) - l.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.light_add(type='AREA', location=(-5, 3, 3)); l = bpy.context.object; l.data.size = 5; l.data.energy = 600
    l.rotation_euler = (Vector((0, 0, 0)) - l.location).to_track_quat('-Z', 'Y').to_euler()


# ---------------------------------------------------------------- the renders
JOBS = {}
def job(fn): JOBS[fn.__name__] = fn; return fn

TOP = (0, 0.0001, 9.5)          # face-up, from above
TQ = (0, -6.2, 4.4)             # three-quarter view


@job
def diamond_hero():
    reset(); ob = brilliant('d'); ob.data.materials.append(gem('dia'))
    ob.rotation_euler = (math.radians(-8), 0, math.radians(10))
    studio(); camera(TQ, Vector((0, 0, -0.1)), lens=70); render('tt-diamond-hero', 1100, 900, 128)


def _cut(tag, pav):
    reset(); ob = brilliant('d', pav=pav); ob.data.materials.append(gem('dia'))
    studio(); camera(TOP, Vector((0, 0, 0)), lens=100); render('tt-cut-' + tag, 800, 800, 128)

@job
def cut_shallow(): _cut('shallow', 0.36)
@job
def cut_ideal(): _cut('ideal', 0.43)
@job
def cut_deep(): _cut('deep', 0.57)


def _three_q(name, matfn):
    reset(); ob = brilliant('d'); ob.data.materials.append(matfn())
    ob.rotation_euler = (math.radians(-8), 0, math.radians(10))
    studio(); camera(TQ, Vector((0, 0, -0.1)), lens=70); render(name, 700, 600, 96)

@job
def lookalike_diamond(): _three_q('tt-look-diamond', lambda: gem('dia'))
@job
def lookalike_cz(): _three_q('tt-look-cz', lambda: gem('cz', ior=2.16, dispersion=0.6))
@job
def lookalike_moissanite(): _three_q('tt-look-moissanite', lambda: gem('mo', ior=2.65, dispersion=1.0, tint=(0.94, 0.97, 0.93), absorb=0.05))


# colour grades: nitrogen yellow, exaggerated slightly so one grade reads on a projector
TINTS = {'E': 0.02, 'G': 0.10, 'H': 0.15, 'I': 0.21, 'J': 0.28, 'K': 0.38}
def _col(letter):
    k = TINTS[letter]
    _three_q('tt-col-' + letter, lambda: gem('c' + letter, tint=(1.0, 1.0 - k * 0.25, 1.0 - k), absorb=0.6 * k))
for _l in TINTS:
    JOBS['col_' + _l] = (lambda l=_l: _col(l))


def _crystal(name, ob, mat, view=TQ):
    ob.data.materials.append(mat); simple_lights()
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -1.3)); g = bpy.context.object
    g.is_shadow_catcher = True
    camera(view, Vector((0, 0, -0.1)), lens=70); render(name, 800, 700, 96)

@job
def crystal_natural():
    reset(); ob = octahedron('o', 1.15, round_=0.08); ob.rotation_euler = (math.radians(20), math.radians(10), math.radians(30))
    _crystal('tt-crystal-natural', ob, frosted('nat', (0.97, 0.96, 0.92), rough=0.28, absorb=0.15))
@job
def crystal_hpht():
    reset(); ob = cubo_octahedron('h', 0.72); ob.rotation_euler = (math.radians(25), math.radians(15), math.radians(35))
    _crystal('tt-crystal-hpht', ob, gem('hp', tint=(1.0, 0.86, 0.45), absorb=0.5, dispersion=0.2, rough=0.04))
@job
def crystal_cvd():
    reset(); ob = tablet('c'); ob.rotation_euler = (math.radians(18), 0, math.radians(25))
    _crystal('tt-crystal-cvd', ob, frosted('cv', (0.72, 0.62, 0.52), rough=0.18, absorb=0.6))


@job
def lattice_diamond():
    reset()
    a = 2.0  # diamond cubic: fcc + offset basis, show a 2x2x1-ish block
    base = [(0, 0, 0), (0, .5, .5), (.5, 0, .5), (.5, .5, 0)]
    pts = set()
    for i in range(2):
        for j in range(2):
            for k in range(2):
                for b in base:
                    for off in ((0, 0, 0), (.25, .25, .25)):
                        p = tuple(round((i + b[0] + off[0]) * a, 4) for _ in range(1)) if False else (round((i + b[0] + off[0]) * a, 4), round((j + b[1] + off[1]) * a, 4), round((k + b[2] + off[2]) * a, 4))
                        if all(0 <= c <= 2 * a + 1e-6 for c in p): pts.add(p)
    pts = sorted(pts); bl = a * math.sqrt(3) / 4
    bonds = [(p, q) for i, p in enumerate(pts) for q in pts[i + 1:] if abs((Vector(p) - Vector(q)).length - bl) < 1e-3]
    keep = {p for b in bonds for p in b}
    c = Vector((a, a, a))
    pts = [tuple(Vector(p) - c) for p in keep]; bonds = [(tuple(Vector(p) - c), tuple(Vector(q) - c)) for p, q in bonds]
    ball_stick('dl', pts, bonds, 0.13, 0.045); simple_lights()
    camera((5.2, -6.6, 4.6), Vector((0, 0, 0)), lens=55); render('tt-lattice-diamond', 900, 800, 64)


@job
def lattice_graphite():
    reset()
    pts, bonds, s = [], [], 0.62
    for layer, z in enumerate((-1.1, 0.0, 1.1)):
        shift = (s * math.sqrt(3) / 2 if layer % 2 else 0, 0)
        hexpts = {}
        for i in range(-3, 4):
            for j in range(-3, 4):
                cx = (i + 0.5 * j) * s * math.sqrt(3) + shift[0]; cy = j * s * 1.5
                if math.hypot(cx, cy) > 2.3: continue
                for k in range(6):
                    ang = math.radians(60 * k + 30)
                    p = (round(cx + s * math.cos(ang), 3), round(cy + s * math.sin(ang), 3), z)
                    hexpts[p] = 1
        P = list(hexpts)
        for i, p in enumerate(P):
            for q in P[i + 1:]:
                if abs(math.hypot(p[0] - q[0], p[1] - q[1]) - s) < 0.01: bonds.append((p, q))
        pts += P
    ball_stick('gl', pts, bonds, 0.11, 0.04); simple_lights()
    camera((4.6, -6.4, 3.2), Vector((0, 0, 0)), lens=50); render('tt-lattice-graphite', 900, 800, 64)


# ---------------------------------------------------------------- landscapes (opaque, with sky)
def land_reset():
    sc = reset(); sc.render.film_transparent = False
    w = sc.world.node_tree; bg = w.nodes['Background']
    sky = w.nodes.new('ShaderNodeTexSky')
    try:
        sky.sky_type = 'NISHITA'
    except Exception:
        pass
    w.links.new(sky.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = 0.35
    sc.view_settings.exposure = float(os.environ.get('TT_LEXP', '-2.4'))
    sc.view_settings.look = 'AgX - Punchy'
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), math.radians(10), math.radians(40)))
    bpy.context.object.data.energy = 4.0
    return sc


def earth_mat(name, cols, scale=6.0, by_height=False, zmin=-3, zmax=0.3):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']; p.inputs['Roughness'].default_value = 0.95
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, cols[0]
    el[1].position, el[1].color = 1.0, cols[-1]
    for i, c in enumerate(cols[1:-1], 1):
        e = el.new(i / (len(cols) - 1)); e.color = c
    if by_height:
        geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs['From Min'].default_value = zmin; mr.inputs['From Max'].default_value = zmax
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
        mix = nt.nodes.new('ShaderNodeMath'); mix.operation = 'ADD'
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 0.08
        nt.links.new(geo.outputs['Position'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
        nt.links.new(nz.outputs['Fac'], mul.inputs[0]); nt.links.new(mr.outputs[0], mix.inputs[0]); nt.links.new(mul.outputs[0], mix.inputs[1])
        nt.links.new(mix.outputs[0], ramp.inputs['Fac'])
    else:
        nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs[0], p.inputs['Base Color'])
    return m


def grid_terrain(name, size, n, hfun):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=n, y_segments=n, size=size / 2)
    for v in bm.verts: v.co.z = hfun(v.co.x, v.co.y)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = True
    return ob


@job
def mine_openpit():
    """A kimberlite open-pit mine: terraced benches spiralling down into the pipe."""
    land_reset()
    R, steps, depth = 6.0, 9, 3.6
    def h(x, y):
        r = math.hypot(x, y)
        if r >= R: return 0.03 * math.sin(x * 1.3) * math.cos(y * 1.1)
        k = int((R - r) / (R / steps))
        frac = ((R - r) % (R / steps)) / (R / steps)
        return -k * depth / steps - (depth / steps) * min(1, frac * 4)
    t = grid_terrain('pit', 20, 400, h)
    t.data.materials.append(earth_mat('pitm', [(0.06, 0.10, 0.16, 1), (0.20, 0.20, 0.22, 1), (0.50, 0.24, 0.10, 1), (0.70, 0.42, 0.18, 1), (0.34, 0.36, 0.16, 1)], by_height=True, zmin=-3.6, zmax=0.1))
    # a few haul trucks on the benches
    my = bpy.data.materials.new('truck'); my.use_nodes = True; my.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.9, 0.62, 0.05, 1)
    for i, (rr, a) in enumerate(((5.2, 20), (3.9, 140), (2.6, 260), (4.6, 300))):
        k = int((R - rr) / (R / steps))
        bpy.ops.mesh.primitive_cube_add(size=0.18, location=(rr * math.cos(math.radians(a)), rr * math.sin(math.radians(a)), -k * depth / steps - depth / steps + 0.09))
        bpy.context.object.scale = (1.6, 0.9, 0.8); bpy.context.object.data.materials.append(my)
    camera((0, -13.5, 9.5), Vector((0, 0, -1.6)), lens=40); render('tt-mine-openpit', 1400, 900, 64)


@job
def mine_alluvial():
    """River (alluvial) diamonds: a winding river through gravel banks, a diamond glinting among the pebbles."""
    land_reset()
    def h(x, y):
        c = 1.4 * math.sin(y * 0.45)
        d = abs(x - c)
        return -0.5 * math.exp(-(d / 1.3) ** 2) + 0.05 * math.sin(x * 2.1) * math.cos(y * 1.7) + 0.08 * max(0, d - 3)
    t = grid_terrain('bank', 22, 300, h)
    t.data.materials.append(earth_mat('bankm', [(0.30, 0.22, 0.12, 1), (0.55, 0.42, 0.24, 1), (0.22, 0.34, 0.12, 1)], scale=3))
    bpy.ops.mesh.primitive_plane_add(size=22, location=(0, 0, -0.28)); wtr = bpy.context.object
    wm = bpy.data.materials.new('water'); wm.use_nodes = True; pw = wm.node_tree.nodes['Principled BSDF']
    pw.inputs['Base Color'].default_value = (0.10, 0.32, 0.40, 1); pw.inputs['Roughness'].default_value = 0.05; pw.inputs['Transmission Weight'].default_value = 0.85; pw.inputs['IOR'].default_value = 1.33
    wtr.data.materials.append(wm)
    import random; random.seed(4)
    pm = bpy.data.materials.new('pebble'); pm.use_nodes = True; pp = pm.node_tree.nodes['Principled BSDF']; pp.inputs['Roughness'].default_value = 0.6
    vc = pm.node_tree.nodes.new('ShaderNodeObjectInfo'); rp = pm.node_tree.nodes.new('ShaderNodeValToRGB')
    rp.color_ramp.elements[0].color = (0.45, 0.42, 0.38, 1); rp.color_ramp.elements[1].color = (0.75, 0.68, 0.58, 1)
    pm.node_tree.links.new(vc.outputs['Random'], rp.inputs[0]); pm.node_tree.links.new(rp.outputs[0], pp.inputs['Base Color'])
    for i in range(260):
        y = random.uniform(-6, 4); c = 1.4 * math.sin(y * 0.45); x = c + random.choice((-1, 1)) * random.uniform(1.1, 2.6)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.05, 0.16), location=(x, y, h(x, y) + 0.03))
        o = bpy.context.object; o.scale = (1, random.uniform(.6, 1), random.uniform(.4, .7)); o.data.materials.append(pm)
    d = octahedron('dia', 0.11); d.location = (1.4 * math.sin(-2 * 0.45) + 1.5, -2, h(1.4 * math.sin(-0.9) + 1.5, -2) + 0.1)
    d.data.materials.append(gem('dg'))
    camera((6.0, -9.5, 7.5), Vector((0.5, -0.5, -0.6)), lens=38); render('tt-mine-alluvial', 1400, 900, 64)


# ---------------------------------------------------------------- famous diamonds (stylised, not replicas)
def _famous(name, ob, mat, glow=False, view=TQ, lens=70):
    ob.data.materials.append(mat); studio()
    if glow:  # Hope's red-orange phosphorescence: dark room, the stone itself glows
        for o in list(bpy.data.objects):
            if o.type == 'LIGHT' or (o.type == 'MESH' and o is not ob): bpy.data.objects.remove(o)
    camera(view, Vector((0, 0, -0.1)), lens=lens); render(name, 800, 700, 96)

@job
def famous_kohinoor():
    reset(); ob = brilliant('k', pav=0.42, crown=0.13); ob.scale = (1.0, 1.32, 1.0); ob.rotation_euler = (math.radians(-8), 0, math.radians(70))
    _famous('tt-famous-kohinoor', ob, gem('kn'))

@job
def famous_hope():
    reset(); ob = brilliant('h', pav=0.47, crown=0.17, table=0.5); ob.scale = (1.0, 1.18, 1.0); ob.rotation_euler = (math.radians(-8), 0, math.radians(20))
    _famous('tt-famous-hope', ob, gem('hp', tint=(0.10, 0.22, 0.85), absorb=2.4, dispersion=0.3))

@job
def famous_hope_glow():
    reset(); ob = brilliant('h', pav=0.47, crown=0.17, table=0.5); ob.scale = (1.0, 1.18, 1.0); ob.rotation_euler = (math.radians(-8), 0, math.radians(20))
    m = bpy.data.materials.new('glow'); m.use_nodes = True; p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (0.05, 0.08, 0.3, 1); p.inputs['Emission Color'].default_value = (1.0, 0.25, 0.04, 1); p.inputs['Emission Strength'].default_value = 3.0
    p.inputs['Transmission Weight'].default_value = 0.6; p.inputs['IOR'].default_value = 2.417
    _famous('tt-famous-hope-glow', ob, m, glow=True)

@job
def famous_cullinan():
    reset()
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.1); ob = bpy.context.object; ob.name = 'cul'
    ob.scale = (1.25, 0.8, 0.75)
    tex = bpy.data.textures.new('v', 'VORONOI'); tex.noise_scale = 0.9
    d = ob.modifiers.new('d', 'DISPLACE'); d.texture = tex; d.strength = 0.35
    dec = ob.modifiers.new('dec', 'DECIMATE'); dec.ratio = 0.08
    ob.rotation_euler = (math.radians(15), math.radians(-10), math.radians(25))
    _famous('tt-famous-cullinan', ob, frosted('cr', (0.96, 0.96, 0.93), rough=0.22, absorb=0.08))


if __name__ == '__main__':
    names = [n for n in JOBS if not ONLY or n in ONLY]
    for n in names:
        JOBS[n]()

# Crystallography decks (csg-crystallography-1, -2)
The two decks embed Three.js r149 (build/three.min.js, MIT) plus `crystal.js`, a small engine that draws every
3D viewer through one shared WebGL renderer and builds crystals from real axial ratios and Miller indices.
`assemble.py` concatenates three.min.js + crystal.js + common.html + the generated slides (gen1.py -> p1.html,
gen2.py -> p2.html) into `decks/<slug>/scenes.html`; build.py then inlines images as usual.
Paths in assemble.py point at the working folder used when they were written; adjust before re-running.

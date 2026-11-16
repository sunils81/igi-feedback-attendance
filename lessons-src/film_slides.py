#!/usr/bin/env python3
"""Add a "Watch the film" scene to the DG/CSG decks that have an IGI film (2026-11-16).

The scene shows a still from the film and a play button. Inside the portal the button asks
the portal (postMessage type 'igi-film') to stream the film over the deck; the film itself
never lives in the deck file. Run from lessons-src/:  python3 film_slides.py
Idempotent: a deck that already has the scene is left alone.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = '/Users/sunilsharma/Desktop/IGI_Final_Videos'
FILMS = {
  'cvd-earth-vs-lab': ('CVD Diamond · Earth vs Lab', 'CVD-Diamond-Earth-vs-Lab-v2', 'How a natural diamond forms over billions of years and how a CVD lab-grown diamond is grown in weeks.'),
  'film01-earths-depths': ("From Earth's Depths to the Surface", 'IGI-Diamond-Film01_From-Earths-Depths-to-the-Surface', 'The journey of a diamond from the mantle to the surface.'),
  'film02-rough-to-radiant': ('From Rough to Radiant', 'IGI-Diamond-Film02_From-Rough-to-Radiant', 'Mapping and planning the rough, dividing it, brillianteering, and the final quality check.'),
  'ch01-diamond-disassembled': ('Diamond Disassembled', 'IGI-Diamond-Series_Ch01_Diamond-Disassembled', 'The anatomy of a round brilliant: table, crown, girdle, pavilion, the facets and the proportions that decide how it performs.'),
  'ch02-inside-the-diamond': ('Inside the Diamond', 'IGI-Diamond-Series_Ch02_Inside-the-Diamond', 'What light does inside a diamond: the critical angle, light return and brilliance.'),
  'filma-journey-inside': ('The Journey Inside a Diamond', 'IGI-Gemology-FilmA_The-Journey-Inside-a-Diamond', 'Blemishes, feathers, needles, clouds and twinning wisps: the clarity features a grader looks for at 10×.'),
  'filmb-diamond-colour': ('The Mystery of Diamond Colour', 'IGI-Gemology-FilmB_The-Mystery-of-Diamond-Color', 'Where a diamond’s colour comes from and how it is graded.'),
  'filmc-ruby-sapphire-emerald': ('The Birth of Ruby, Sapphire & Emerald', 'IGI-Gemology-FilmC_The-Birth-of-Ruby-Sapphire-and-Emerald', 'How the big three coloured stones form in the earth.'),
  'filmd1-crystallography-1': ('Crystallography · Part 1 · The Building Blocks', 'IGI-Gemology-FilmD1_Crystallography-Part-1-The-Building-Blocks', 'Atoms, unit cells and the order inside a crystal.'),
  'filmd2-crystallography-2': ('Crystallography · Part 2 · Planes and Shapes', 'IGI-Gemology-FilmD2_Crystallography-Part-2-Planes-and-Shapes', 'Crystal faces, symmetry and the seven crystal systems.'),
  'filmd3-crystallography-3': ('Crystallography · Part 3 · Crystals and Light', 'IGI-Gemology-FilmD3_Crystallography-Part-3-Crystals-and-Light', 'Single and double refraction, birefringence, optic axes and the polariscope.'),
}
DECKS = {
  'dg-proportions': ['ch01-diamond-disassembled', 'ch02-inside-the-diamond'],
  'dg-origin-of-rough': ['film01-earths-depths'],
  'dg-cut-finish': ['film02-rough-to-radiant'],
  'dg-clarity-inclusions': ['filma-journey-inside'],
  'dg-colour-grading': ['filmb-diamond-colour'],
  'dg-synthetics-imitations': ['cvd-earth-vs-lab'],
  'csg-crystallography-1': ['filmd1-crystallography-1'],
  'csg-crystallography-2': ['filmd2-crystallography-2', 'filmd3-crystallography-3'],
  'csg-polariscope': ['filmd3-crystallography-3'],
  'csg-corundum': ['filmc-ruby-sapphire-emerald'],
  'csg-emerald': ['filmc-ruby-sapphire-emerald'],
}

def poster(fid, deck):
  media = os.path.join(HERE, 'decks', deck, 'media-src')
  os.makedirs(media, exist_ok=True)
  out = os.path.join(media, f'film-{fid}.jpg')
  if not os.path.exists(out):
    src = os.path.join(SRC, FILMS[fid][1] + '_voice-music.mp4')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '24', '-i', src, '-frames:v', '1',
                    '-vf', 'scale=1280:-2', '-q:v', '4', out], check=True)
  return f'media/film-{fid}.jpg'

def scene(fid, deck):
  title, _, blurb = FILMS[fid]
  img = poster(fid, deck)
  t_js = title.replace("'", "\\'")
  return f'''
<section class="scene dark" id="s-film-{fid}" data-chap="🎬 Film" data-wipe="slice">
  <div class="bgimg kb" style="background-image:url({img});background-position:center"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(6,12,28,.95) 0%,rgba(6,12,28,.78) 45%,rgba(6,12,28,.25) 100%)"></div>
  <div class="pad" style="justify-content:center;gap:30px">
    <div class="eyebrow rise">IGI film · watch together</div>
    <h1 class="kt" style="font-size:96px;max-width:1150px;color:#FBF6EA">{title}</h1>
    <p class="lead rise" style="max-width:860px">{blurb}</p>
    <div class="row rise" style="gap:16px;align-items:center">
      <button class="btn" type="button" style="font-size:26px;padding:22px 38px"
        onclick="event.stopPropagation();if(window.parent!==window){{parent.postMessage({{type:'igi-film',id:'{fid}',title:'{t_js}'}},'*')}}else{{this.nextElementSibling.textContent='Open this deck from the portal to play the film.'}}">▶ Watch the film</button>
      <span class="small" style="color:rgba(255,255,255,.6)"></span>
    </div>
  </div>
</section>
'''

def main():
  changed = []
  for deck, fids in DECKS.items():
    p = os.path.join(HERE, 'decks', deck, 'scenes.html')
    s = open(p, encoding='utf-8').read()
    add = ''.join(scene(f, deck) for f in fids if f's-film-{f}"' not in s)
    if not add: continue
    i = s.index('</section>') + len('</section>')   # right after the title scene
    s = s[:i] + '\n' + add + s[i:]
    open(p, 'w', encoding='utf-8').write(s)
    changed.append(deck)
  print('changed:', ' '.join(changed) or 'none')

if __name__ == '__main__':
  main()

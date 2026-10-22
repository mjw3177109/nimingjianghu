#!/usr/bin/env python3
"""Non-destructive art QA. Never auto-approves a sprite or modifies production assets."""
from pathlib import Path
import sys
try:
    from PIL import Image
except ImportError:
    print("Install Pillow first: python -m pip install Pillow", file=sys.stderr)
    raise SystemExit(2)

ROOT=Path(__file__).resolve().parents[1]
SHEET=ROOT/"assets/characters/scene_sprites/player_4dir.png"
im=Image.open(SHEET).convert("RGBA")
assert im.size==(384,512),f"Unexpected sheet size {im.size}"
failed=[]
for row,name in ((1,"left"),(2,"right")):
    centers=[]
    for col in (1,3):
        f=im.crop((col*96,row*128,(col+1)*96,(row+1)*128))
        xs=[x for y in range(120,128) for x in range(96) if f.getpixel((x,y))[3]>120]
        centers.append(sum(xs)/len(xs) if xs else float("nan"))
    delta=abs(centers[1]-centers[0])
    verdict="NEEDS_REPAINT" if delta<8 else "CHECK_VISUALLY"
    print(f"{name}: foot centers {centers[0]:.1f} / {centers[1]:.1f}, delta={delta:.1f}px, {verdict}")
    if delta<8:failed.append(name)
if failed:
    print("ART_GATE_BLOCKED: side-walk feet do not visibly alternate in "+", ".join(failed))
    raise SystemExit(1)
print("NUMERIC_HEURISTIC_PASS: manual visual art review is STILL REQUIRED")

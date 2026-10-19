# -*- coding: utf-8 -*-
"""Deterministic original pixel-art map & sprite generator; SVG maps are committed source images.
    python tools/generate_assets.py
"""
import json, random
from pathlib import Path
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
W,H=640,360
random.seed(20261019)
PALETTE={
 'town': {'bg':'#657557','ground':'#9c9480','edge':'#525b46','roof':'#545d66','roof2':'#695d55','wood':'#89684a','trim':'#c5ad84','leaf':'#497452','light':'#f0db93'},
 'road': {'bg':'#547456','ground':'#9a947b','edge':'#465b3e','roof':'#68624c','roof2':'#6a7661','wood':'#806b55','trim':'#aaad83','leaf':'#2f6247','light':'#d0c893'},
 'cave': {'bg':'#383b42','ground':'#54555a','edge':'#292c32','roof':'#63636a','roof2':'#757078','wood':'#817264','trim':'#8f8c85','leaf':'#445263','light':'#7b9db9'} }

def fill_noise(draw, scene, p):
    draw.rectangle((0,0,W,H),fill=p['bg'])
    for yy in range(0,H,10):
      for xx in range(0,W,10):
       q=random.random()
       if q<.12: draw.rectangle((xx+2,yy+2,xx+5,yy+5),fill=p['edge'])
       elif q>.90: draw.rectangle((xx+5,yy+3,xx+8,yy+5),fill=p['leaf'])

def road(d,p):
    d.polygon([(0,160),(640,145),(640,264),(0,263)],fill=p['ground'])
    for x in range(0,640,20):
      for y in range(165,255,20):
       d.line((x,y,x+16,y),fill='#817d6d',width=1)
       if (x+y)%60==0:d.line((x+11,y+1,x+11,y+15),fill='#aaa08b',width=1)

def roof(d,x,y,w,h,p):
    d.rectangle((x+6,y+22,x+w-6,y+h),fill=p['wood'])
    d.rectangle((x-8,y+15,x+w+8,y+28),fill=p['roof'])
    d.polygon([(x-9,y+17),(x+w//2,y-2),(x+w+9,y+17)],fill=p['roof2'])
    d.line((x-9,y+18,x+w+9,y+18),fill=p['trim'],width=3)
    for xx in range(x+13,x+w-5,28):
       d.rectangle((xx,y+35,xx+13,y+57),fill='#413c35')
       d.rectangle((xx+3,y+39,xx+11,y+54),fill='#9e8a5e')
    d.rectangle((x+w//2-15,y+h-32,x+w//2+16,y+h),fill='#392f2c')
    d.line((x+w//2,y+h-30,x+w//2,y+h),fill='#b18c56',width=2)

def tree(d,x,y,r=22):
    d.rectangle((x-5,y,x+5,y+24),fill='#625340')
    for dx,dy,rr,col in [(-12,-12,r*.75,'#345b3c'),(11,-11,r*.8,'#2e5b42'),(0,-24,r,'#40754c')]:
       d.ellipse((x+dx-rr,y+dy-rr,x+dx+rr,y+dy+rr),fill=col)
       d.rectangle((x+dx-6,y+dy-9,x+dx+5,y+dy-4),fill='#6e9668')

def draw_map(scene):
 p=PALETTE[scene]; im=Image.new('RGB',(W,H)); d=ImageDraw.Draw(im)
 fill_noise(d,scene,p)
 if scene=='town':
    d.rectangle((0,137,640,293),fill='#716d60')
    road(d,p)
    roof(d,22,19,147,117,p);roof(d,214,16,176,121,p);roof(d,458,15,155,119,p)
    roof(d,44,285,136,82,p);roof(d,256,293,138,80,p);roof(d,465,267,160,100,p)
    for x,y in [(16,141),(194,115),(419,128),(634,140),(419,295)]:tree(d,x,y,19)
    # lantern + stall + sign without text
    for x in [236,357]:
      d.line((x,100,x,121),fill='#d8ae5b',width=2);d.ellipse((x-7,119,x+7,135),fill='#c66b4c')
    d.rectangle((211,141,281,149),fill='#c0ab80'); d.rectangle((220,150,271,169),fill='#9a6956')
    d.rectangle((607,171,639,223),fill='#887a61');d.polygon([(617,164),(632,178),(617,192)],fill='#e6ce85')
 elif scene=='road':
    d.polygon([(0,157),(155,143),(360,156),(640,149),(640,258),(270,277),(0,260)],fill=p['ground'])
    for xx in range(0,640,29):
       y=170+(xx//29)%4*9
       d.line((xx,y,xx+18,y+2),fill='#8a826d',width=2)
    d.polygon([(380,40),(480,13),(550,71),(640,12),(640,148),(0,152),(0,52),(88,0),(190,62),(290,0)],fill='#49664e')
    for x,y in [(37,100),(125,122),(240,96),(435,113),(580,113),(334,314),(504,299)]:tree(d,x,y,21)
    d.rectangle((535,151,574,218),fill='#4a3530');d.polygon([(526,152),(552,109),(585,152)],fill='#666363')
    d.line((554,163,554,215),fill='#baa07a',width=3)
    # river crossing
    d.polygon([(310,262),(360,269),(410,360),(320,360)],fill='#476b79')
    for yy in range(282,361,14):d.line((329,yy,385,yy+7),fill='#648c95',width=2)
 elif scene=='cave':
    d.rectangle((0,0,640,360),fill='#292a30')
    d.polygon([(0,87),(34,40),(112,62),(182,20),(267,43),(365,11),(447,51),(549,30),(640,81),(640,320),(558,344),(470,319),(363,355),(240,335),(116,349),(0,305)],fill='#4b4a51')
    d.polygon([(15,108),(97,83),(162,91),(215,72),(330,101),(400,71),(500,86),(625,107),(606,290),(520,303),(415,293),(302,321),(175,284),(71,306),(0,261)],fill='#55545b')
    for x in range(10,640,45):
       d.line((x,80+(x*7)%24,x+8,103+(x*9)%19),fill='#797780',width=3)
       d.line((x,310-(x*4)%19,x+11,325),fill='#34343c',width=4)
    d.polygon([(220,140),(434,137),(468,229),(196,235)],fill='#6a686a')
    d.ellipse((286,160,358,221),fill='#413f45')
    d.ellipse((301,178,342,207),fill='#7b8f9a')
    for xy in [(242,172),(387,159),(422,241),(141,224)]:
       x,y=xy;d.polygon([(x,y),(x+15,y-13),(x+30,y+4),(x+21,y+17)],fill='#7a767a')
    d.rectangle((475,100,546,192),fill='#36363e');d.rectangle((491,117,529,184),fill='#62616a')
    d.line((489,160,531,160),fill='#7d909a',width=2)
    d.ellipse((85,254,156,278),fill='#3a5b62')
    d.line((107,264,147,263),fill='#658d99',width=2)
 return im

def sprite(name):
 im=Image.new('RGBA',(20,30),(0,0,0,0)); d=ImageDraw.Draw(im)
 colors={'player':('#3c5368','#e6c2a1','#242831','#a4bdbe'),
         'innkeeper':('#8b6750','#d9b196','#45403b','#dab472'),
         'healer':('#6c9b75','#e6c5a7','#35383b','#c3dac9'),
         'oldman':('#777377','#d8bda6','#d2d5d5','#9b8d73'),
         'bandit':('#73514b','#d0a081','#4b3031','#a74f3e')}
 c,skin,hair,light=colors[name]
 d.ellipse((5,26,16,29),fill='#171a20')
 d.rectangle((6,18,9,26),fill='#313d47');d.rectangle((12,18,15,26),fill='#313d47')
 d.rectangle((5,11,16,21),fill=c);d.rectangle((9,12,13,16),fill=light)
 d.rectangle((2,12,5,20),fill=skin);d.rectangle((16,12,19,20),fill=skin)
 d.rectangle((6,3,15,12),fill=skin);d.rectangle((5,1,16,5),fill=hair)
 d.point((8,8),fill='#2d2726');d.point((13,8),fill='#2d2726')
 if name=='player':d.rectangle((2,18,5,20),fill='#c4d4d1') # old watch
 if name=='oldman':d.rectangle((18,15,19,29),fill='#a2835f')
 if name=='bandit':d.line((18,13,19,23),fill='#a8b7c0',width=2)
 return im

def svg_map(scene,im):
    # tiny pixel-art SVG, uses embedded native image as data URL; portable for browser use
    import base64,io
    buf=io.BytesIO(); im.save(buf,format='PNG',optimize=True)
    b64=base64.b64encode(buf.getvalue()).decode('ascii')
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><image width="640" height="360" href="data:image/png;base64,{b64}" /></svg>'

def main():
 for kind,name in [('town','S001_town'),('road','S004_road'),('cave','S005_cave')]:
    im=draw_map(kind);(ASSETS/'maps').mkdir(parents=True,exist_ok=True)
    im.save(ASSETS/'maps'/f'{name}.png',optimize=True)
    (ASSETS/'maps'/f'{name}.svg').write_text(svg_map(kind,im),encoding='utf-8')
 for n in ['player','innkeeper','healer','oldman','bandit']:
    (ASSETS/'sprites').mkdir(exist_ok=True,parents=True)
    sprite(n).save(ASSETS/'sprites'/f'{n}.png')
 print('Generated 3 final-style 640x360 PNG+SVG maps and 5 transparent sprite PNGs')

if __name__=='__main__':main()

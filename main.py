# -*- coding: utf-8 -*-
"""逆命江湖 Q版 Pygame Demo · 新游戏→青石镇→山路→山洞→命痕→返回青石镇。"""
import json
import random
import subprocess
import sys
from collections import deque
from pathlib import Path

ROOT=Path(__file__).resolve().parent


def prepare_assets():
    # Modular P3 gameplay intentionally does not regenerate legacy full-scene images.
    for name in ('town','road','cave'):
        atlas=ROOT/'assets/tilesets'/name/(name+'_atlas.svg')
        if not atlas.exists():raise FileNotFoundError(f'缺少 Tile 图集: {atlas}')


def main():
    try:
        import pygame
    except ImportError:
        print('需要安装 pygame: python -m pip install pygame>=2.5')
        return 1
    prepare_assets()
    pygame.init()
    data=json.loads((ROOT/'data/world.json').read_text(encoding='utf-8'))
    SCALE=2; SW,SH=640,360;T=20
    tilemaps={key:json.loads((ROOT/'data/maps'/key/(key+'_tilemap.json')).read_text(encoding='utf-8')) for key in ('town','road','cave')}
    for key,m in tilemaps.items():
        if m['tile_size']!=32 or len(m['collision'])!=m['width']*m['height']:raise ValueError(f'P3 tilemap schema incompatible: {key}')
    T=32
    screen=pygame.display.set_mode((SW*SCALE,SH*SCALE))
    pygame.display.set_caption('逆命江湖 | P3-C 国风Tile细节与四方向逐帧动画')
    canvas=pygame.Surface((SW,SH))
    clock=pygame.time.Clock()
    fontpath=next((p for p in [r'C:\Windows\Fonts\msyh.ttc',r'C:\Windows\Fonts\simhei.ttf','/usr/share/fonts/truetype/wqy/wqy-microhei.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'] if Path(p).exists()),None)
    def font(size):return pygame.font.Font(fontpath,size) if fontpath else pygame.font.Font(None,size)
    f=font(12); fbig=font(17)
    def load_art(folder,stem,size,alpha=False):
        # 与网页版共用正式手绘 Q 版 WebP 场景；人物沿用同一套 PNG
        directory=ROOT/'assets'/folder
        painted=directory/(stem+'.webp')
        png=directory/(stem+'.png')
        q=directory/(stem+'_q.svg')
        if painted.exists():
            from PIL import Image
            im=Image.open(painted).convert('RGBA')
            picture=pygame.image.fromstring(im.tobytes(),im.size,'RGBA')
        elif png.exists():
            picture=pygame.image.load(str(png))
        elif q.exists():
            try:
                picture=pygame.image.load(str(q))
            except (pygame.error,ValueError):
                import io,cairosvg
                picture=pygame.image.load(io.BytesIO(cairosvg.svg2png(url=str(q))),'png')
        else:
            raise FileNotFoundError(f'缺少正式资源: {folder}/{stem}')
        picture=pygame.transform.smoothscale(picture,size)
        return picture.convert_alpha() if alpha else picture.convert()
    atlases={}
    for key,m in tilemaps.items():
        atlas_file=ROOT/m['atlas']
        try:
            atlas=pygame.image.load(str(atlas_file)).convert_alpha()
        except (pygame.error,ValueError):
            try:
                import io,cairosvg
                atlas=pygame.image.load(io.BytesIO(cairosvg.svg2png(url=str(atlas_file))),key+'_atlas.png').convert_alpha()
            except (ImportError,ValueError,OSError,pygame.error) as exc:
                raise RuntimeError(f'无法加载 {key} Tile Atlas：请安装 cairosvg 或检查图块 SVG') from exc
        atlases[key]=[atlas.subsurface(pygame.Rect((i%m['atlas_columns'])*32,(i//m['atlas_columns'])*32,32,32)) for i in range(len(m['tile_ids']))]
    sprites={k:load_art('sprites',k,(42,58),alpha=True) for k in ['player','innkeeper','healer','oldman','bandit']}
    # Four directions × four animation frames; image source stays linked to approved Q-style sprites.
    sprite_manifest=json.loads((ROOT/'assets/characters/scene_sprites/sprite_manifest.json').read_text(encoding='utf-8'))
    sprite_paths={entry['key']:entry['sheet'] for entry in sprite_manifest['entries']}
    animated_sprites={}
    for key in sprites:
        sheet_file=ROOT/sprite_paths.get(key,'')
        if not sheet_file.is_file():continue
        try:
            if sheet_file.suffix.lower()=='.png':
                sheet=pygame.image.load(str(sheet_file)).convert_alpha()
            else:
                import io,cairosvg
                png=cairosvg.svg2png(url=str(sheet_file))
                sheet=pygame.image.load(io.BytesIO(png),key+'_4dir.png').convert_alpha()
            if sheet.get_size()!=(192,256):raise ValueError('Invalid direction atlas dimensions')
            animated_sprites[key]=[[sheet.subsurface(pygame.Rect(col*48,row*64,48,64))
                for col in range(4)] for row in range(4)]
        except (ImportError,ValueError,OSError,pygame.error) as exc:
            print(f'[P3-C] 动画图集无法解码，保留原有角色静态 PNG: {key}: {exc}')
    scene='town';pos=tuple(tilemaps['town']['spawn']);facing='down';motion=None;route=[];pending=None;quest=0;hp=100;mp=50;potions=2;destiny=0;coins=10;manual=False;trace=False;bandit_alive=True;lines=[];dialogue_cb=None;battle=None;note='鼠标点击地面移动，点击人物或出口互动。';journal='这里是我记忆中的江湖吗？'
    def walls(x,y):
        m=tilemaps[scene]
        if x<0 or y<0 or x>=m['width'] or y>=m['height']:return True
        return m['collision'][y*m['width']+x]==1
    def find_path(start,dest):
        if walls(*dest):return None
        Q=deque([start]);prev={start:None}
        while Q:
            a=Q.popleft()
            if a==dest:
                ans=[]
                while prev[a] is not None:ans.append(a);a=prev[a]
                return ans[::-1]
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                n=(a[0]+dx,a[1]+dy)
                if n not in prev and not walls(*n):prev[n]=a;Q.append(n)
        return None
    def move_to(x,y,action=None):
        nonlocal route,pending,note
        candidates=[]
        for dx,dy in (((1,0),(-1,0),(0,1),(0,-1)) if action and action[0] in ('npc','obj') else ((0,0),(1,0),(-1,0),(0,1),(0,-1))):
            t=x+dx,y+dy;p=find_path(pos,t)
            if p is not None:candidates.append((len(p),p,t))
        if candidates:
            _,route,to=min(candidates,key=lambda k:k[0]);pending=(action,to) if action else None
            if not route:run_pending()
        else:note='这里无法到达。'
    def say(rows, callback=None):
        nonlocal lines,dialogue_cb
        lines=[list(x) for x in rows];dialogue_cb=callback
    def advance(n,text):
        nonlocal quest,journal,note
        quest=max(quest,n);journal=note=text
    def change_map(to,spawn):
        nonlocal scene,pos,route,pending,note,motion
        scene=to;pos=(38,12) if to=='town' else tuple(spawn);route=[];pending=None;motion=None;note='进入 '+data['maps'][to]['name']
    def talk(id):
        nonlocal potions,note
        if id=='healer' and potions<2:potions+=1;note='苏晚晴赠送一瓶疗伤药'
        cb=(lambda:advance(1,'韩掌柜委托你击败山贼。')) if id=='innkeeper' and quest==0 else None
        if id=='oldman' and quest>=2: cb=lambda:advance(3,'山洞里或许有命轨的线索。')
        say(data['dialogue'][id],cb)
    def pickup(id):
        nonlocal manual,trace,destiny,coins,note
        if id=='manual':
            if not manual:
                manual=True;coins+=10;note='获得破风一剑秘籍、银两+10';advance(3,'得到山洞秘籍。试着调查命痕石台。')
            else:note='已经拿走秘籍。'
        if id=='trace':
            if not trace:
                trace=True;destiny=25;note='逆命值提升至25';advance(4,'剧情出现了不该存在的命痕。');say([('沈砚','这里不该有这种东西……'),('神秘声音','你终于发现了。')])
            else:note='石台已经沉寂。'
    def act(key):
        nonlocal battle,hp,mp,potions,bandit_alive,coins,note
        if not battle:return
        enemy=battle
        if key=='attack':damage=random.randint(12,20);msg='基础剑法造成%d点伤害。'%damage
        elif key=='skill':
            if mp<8:note='内力不足';return
            mp-=8;damage=random.randint(20,28);msg='破风一剑造成%d点伤害。'%damage
        elif key=='heal':
            if not potions:note='没有疗伤药';return
            potions-=1;hp=min(100,hp+36);damage=0;msg='服药恢复气血。'
        else:damage=0;enemy['guard']=True;msg='凝神防御。'
        enemy['hp']-=damage
        if enemy['hp']<=0:
            battle=None;bandit_alive=False;coins+=22;hp=min(100,hp+10)
            advance(2,'战胜山贼！前往山洞寻找线索。');say([('沈砚','这条路终于通了，继续往前。')]);return
        attacked=random.randint(8,13)
        if enemy.pop('guard',False):attacked=max(1,attacked-7)
        hp=max(0,hp-attacked);note=msg+' 山贼反击%d。'%attacked
        if hp==0:hp=75;battle=None;change_map('road',(1,9));say([('沈砚','差点丢了性命，下次谨慎些。')])
    def run_pending():
        nonlocal pending,scene,pos,battle,quest,journal
        if not pending:return
        action,to=pending;pending=None
        k=action[0]
        if k=='npc':talk(action[1])
        elif k=='enemy' and bandit_alive:battle={'hp':54}
        elif k=='obj':pickup(action[1])
        elif k=='exit':change_map(action[1],action[2])
        if quest>=4 and scene=='town' and quest!=5:
            quest=5;journal='廖的棋盘已经显露，第一章结束。';say(data['dialogue']['ending'])
    def click(x,y):
        nonlocal route,pending
        m=data['maps'][scene]
        for npc in m.get('npcs',[]):
            if abs(x-npc['x'])<=1 and abs(y-npc['y'])<=1:move_to(npc['x'],npc['y'],('npc',npc['id']));return
        for en in m.get('enemies',[]):
            if bandit_alive and abs(x-en['x'])<=1 and abs(y-en['y'])<=1:move_to(en['x'],en['y'],('enemy',en['id']));return
        for obj in m.get('objects',[]):
            if abs(x-obj['x'])<=1 and abs(y-obj['y'])<=1:move_to(obj['x'],obj['y'],('obj',obj['id']));return
        for ex in m['exits']:
            if abs(x-ex['x'])<=1 and abs(y-ex['y'])<=1:move_to(ex['x'],ex['y'],('exit',ex['to'],ex['spawn']));return
        p=find_path(pos,(x,y))
        if p is not None:route=p;pending=None
    def txt(t,x,y,color=(245,227,188),big=False):
        canvas.blit((fbig if big else f).render(str(t),True,color),(x,y))
    def dialogue_next():
        nonlocal dialogue_cb
        if lines:lines.pop(0)
        if not lines and dialogue_cb:
            cb=dialogue_cb;dialogue_cb=None;cb()

    def player_visual():
        if motion is None:return pos
        a,b,elapsed=motion
        t=min(1.0,max(0.0,elapsed/.12))
        return (a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t)
    def town_camera():
        m=tilemaps[scene];vx,vy=player_visual()
        return (max(0,min(int((vx+.5)*32-SW/2),m['width']*32-SW)),
                max(0,min(int((vy+.5)*32-SH/2),m['height']*32-SH)))
    def paint_tile_world():
        m=tilemaps[scene];tw,th=m['width'],m['height'];tiles=atlases[scene]
        ox,oy=town_camera()
        canvas.fill((37,46,52) if scene=='cave' else (82,115,102))
        x0,x1=max(0,ox//32),min(tw-1,(ox+SW)//32+1)
        y0,y1=max(0,oy//32),min(th-1,(oy+SH)//32+1)
        def layer(name):
            grid=m['layers'].get(name)
            if grid is None:return
            for yy in range(y0,y1+1):
                for xx in range(x0,x1+1):
                    index=grid[yy*tw+xx]
                    if index>=0:canvas.blit(tiles[index],(xx*32-ox,yy*32-oy))
        layer('ground');layer('water');layer('terrain');layer('building');layer('deco_low')
        if scene=='town':
            for name,xx,yy in [('客栈',7,8),('药铺',30,8)]:
                sx,sy=xx*32-ox,yy*32-oy
                if -80<sx<690 and -80<sy<420:txt(name,sx,sy)
        actors=[(n['x'],n['y'],n['name'],n['id']) for n in data['maps'][scene].get('npcs',[])]
        if scene=='road' and bandit_alive:
            actors += [(n['x'],n['y'],n['name']+' ⚔','bandit') for n in data['maps']['road'].get('enemies',[])]
        vx,vy=player_visual();actors.append((vx,vy,'','player'))
        for xx,yy,name,aid in sorted(actors,key=lambda a:(a[1],a[0])):
            px=int((xx+.5)*32-ox);py=int((yy+1)*32-oy)
            if not (-50<px<690 and -80<py<430):continue
            pygame.draw.ellipse(canvas,(36,54,49),(px-14,py-6,28,7))
            sp={'innkeeper':'innkeeper','healer':'healer','oldman':'oldman','bandit':'bandit','player':'player'}[aid]
            direction={'down':0,'left':1,'right':2,'up':3}.get(facing if sp=='player' else ('left' if sp in ('healer','bandit') else 'down'),0)
            active=(sp=='player' and (bool(route) or motion is not None))
            tick=(pygame.time.get_ticks()//115)%3
            frame_idx=1+tick if active else 0
            if sp in animated_sprites:canvas.blit(animated_sprites[sp][direction][frame_idx],(px-24,py-63))
            else:canvas.blit(sprites[sp],(px-21,py-58))
            if name:txt(name,px-22,py-73)
        if scene=='cave':
            for ob in data['maps']['cave'].get('objects',[]):
                px,py=ob['x']*32-ox,ob['y']*32-oy
                if ob['id']=='manual' and manual:canvas.blit(tiles[13],(px,py))
                if ob['id']=='trace' and trace:pygame.draw.ellipse(canvas,(111,163,155),(px+7,py+12,18,8))
                if -75<px<670 and -75<py<415:txt(ob['name'],px-12,py-15)
        layer('front')
        for ex in data['maps'][scene]['exits']:
            px,py=int((ex['x']+.5)*32-ox),int((ex['y']+.5)*32-oy)
            if -60<px<670 and -60<py<420:txt(ex['label'],px-22,py-24)
        if route:
            x,y=route[-1]
            pygame.draw.rect(canvas,(240,205,131),(x*32-ox+5,y*32-oy+5,22,22),2)
    running=True;lastmove=0
    say(data['dialogue']['intro'])
    while running:
        dt=clock.tick(60)/1000
        for e in pygame.event.get():
            if e.type==pygame.QUIT:running=False
            elif e.type==pygame.KEYDOWN:
                if e.key==pygame.K_ESCAPE:running=False
                elif lines and e.key in (pygame.K_SPACE,pygame.K_RETURN):dialogue_next()
                elif battle and e.key in (pygame.K_1,pygame.K_2,pygame.K_3,pygame.K_4):act(['attack','skill','heal','defend'][e.key-pygame.K_1])
            elif e.type==pygame.MOUSEBUTTONDOWN and e.button==1:
                x,y=e.pos[0]//SCALE,e.pos[1]//SCALE
                if lines:dialogue_next()
                elif battle:
                    if 115<=y<=310:
                        if 90<=x<=550:
                            i=(0 if y<245 else 2)+(0 if x<330 else 1)
                            act(['attack','skill','heal','defend'][i])
                elif y<315:
                    ox,oy=town_camera();click((x+ox)//32,(y+oy)//32)
        if not lines and not battle:
            if motion is not None:
                a,b,elapsed=motion
                elapsed+=dt
                motion=(a,b,elapsed) if elapsed<.12 else None
            if route:
                lastmove+=dt
                if lastmove>.12:
                    lastmove=0;previous=pos;pos=route.pop(0)
                    facing=('right' if pos[0]>previous[0] else 'left' if pos[0]<previous[0] else 'down' if pos[1]>previous[1] else 'up')
                    motion=(previous,pos,0.0)
                    if not route:run_pending()
        paint_tile_world()
        pygame.draw.rect(canvas,(15,23,26),(0,315,640,45));txt('地点：'+m['name']+' | 气血 %d/100 内力 %d/50  银两 %d 逆命 %d'%(hp,mp,coins,destiny),12,320)
        phases=['和韩掌柜交谈','击败山贼','前往山洞','寻找秘籍并调查石台','返回青石镇','第一章已完成']
        txt('任务：'+phases[min(quest,5)],12,338)
        if lines:
            pygame.draw.rect(canvas,(16,25,27),(26,219,590,89));pygame.draw.rect(canvas,(188,154,100),(26,219,590,89),2)
            who,text=lines[0];txt(who,44,231,(238,199,120),True);txt(text,44,261);txt('鼠标点击 / Enter 继续',444,286,(160,179,161))
        if battle:
            pygame.draw.rect(canvas,(14,21,24),(80,76,480,239));pygame.draw.rect(canvas,(198,164,103),(80,76,480,239),3)
            txt('江湖交锋 · 山贼气血 %d'%max(0,battle['hp']),105,95,(244,201,135),True)
            txt('沈砚气血 %d  内力 %d'%(hp,mp),105,131)
            txt(note,105,167)
            txt('[1] 基础剑法          [2] 破风一剑',105,226)
            txt('[3] 疗伤药(%d)          [4] 防御'%potions,105,270)
        screen.blit(pygame.transform.scale(canvas,(1280,720)),(0,0));pygame.display.flip()
    pygame.quit();return 0

if __name__=='__main__':sys.exit(main())

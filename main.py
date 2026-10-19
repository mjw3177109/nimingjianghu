# -*- coding: utf-8 -*-
"""逆命江湖 Pygame Demo · 新游戏→青石镇→山路→山洞→命痕→返回青石镇。"""
import json
import random
import subprocess
import sys
from collections import deque
from pathlib import Path

ROOT=Path(__file__).resolve().parent


def prepare_assets():
    if not (ROOT/'assets/maps/S001_town.png').exists():
        from tools.generate_assets import main as generate
        generate()


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
    screen=pygame.display.set_mode((SW*SCALE,SH*SCALE))
    pygame.display.set_caption('逆命江湖 | 青石镇篇 Demo')
    canvas=pygame.Surface((SW,SH))
    clock=pygame.time.Clock()
    fontpath=next((p for p in [r'C:\Windows\Fonts\msyh.ttc',r'C:\Windows\Fonts\simhei.ttf','/usr/share/fonts/truetype/wqy/wqy-microhei.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'] if Path(p).exists()),None)
    def font(size):return pygame.font.Font(fontpath,size) if fontpath else pygame.font.Font(None,size)
    f=font(12); fbig=font(17)
    images={k:pygame.image.load(str(ROOT/'assets/maps'/p)).convert() for k,p in [('town','S001_town.png'),('road','S004_road.png'),('cave','S005_cave.png')]}
    sprites={k:pygame.image.load(str(ROOT/'assets/sprites'/f'{k}.png')).convert_alpha() for k in ['player','innkeeper','healer','oldman','bandit']}
    scene='town';pos=(17,10); route=[];pending=None;quest=0;hp=100;mp=50;potions=2;destiny=0;coins=10;manual=False;trace=False;bandit_alive=True;lines=[];dialogue_cb=None;battle=None;note='鼠标点击地面移动，点击人物或出口互动。';journal='这里是我记忆中的江湖吗？'
    def walls(x,y):
        if x<0 or y<0 or x>31 or y>17:return True
        return any(a<=x<=c and b<=y<=d for a,b,c,d in data['maps'][scene]['walls'])
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
        for dx,dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1)):
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
        nonlocal scene,pos,route,pending,note
        scene=to;pos=tuple(spawn);route=[];pending=None;note='进入 '+data['maps'][to]['name']
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
                elif y<315:click(x//20,y//20)
        if not lines and not battle and route:
            lastmove+=dt
            if lastmove>.12:
                lastmove=0;pos=route.pop(0)
                if not route:run_pending()
        canvas.blit(images[scene],(0,0))
        m=data['maps'][scene]
        for ex in m['exits']:
            x,y=ex['x']*T,ex['y']*T;pygame.draw.rect(canvas,(235,207,124),(x+3,y+2,15,18),2)
        for npc in m.get('npcs',[]):
            sp={'innkeeper':'innkeeper','healer':'healer','oldman':'oldman'}[npc['id']]
            canvas.blit(sprites[sp],(npc['x']*T,npc['y']*T-13));txt(npc['name'],npc['x']*T-12,npc['y']*T-28)
        for en in m.get('enemies',[]):
            if bandit_alive:canvas.blit(sprites['bandit'],(en['x']*T,en['y']*T-13));txt(en['name'],en['x']*T-10,en['y']*T-27)
        for obj in m.get('objects',[]):
            x,y=obj['x']*T,obj['y']*T;pygame.draw.rect(canvas,(125,190,197) if obj['id']=='trace' else (214,182,124),(x+3,y+3,14,12));txt(obj['name'],x-15,y-17)
        canvas.blit(sprites['player'],(pos[0]*T,pos[1]*T-13))
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
